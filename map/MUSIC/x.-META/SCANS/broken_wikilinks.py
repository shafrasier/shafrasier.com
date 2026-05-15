#!/usr/bin/env python3
"""Detect `[[Target]]` or `[[Target|alias]]` that don't resolve to a note.

Emits the following categories:

- broken-wikilink-target     — target doesn't exist in any form
- broken-wikilink-case       — target exists with a different case (`[[girl group]]` vs `Girl group.md`)
- broken-wikilink-year       — a release reference missing its `(YYYY) ` prefix
- broken-wikilink-path       — a release title that collides with a film needs its `MUSIC/RELEASES/ALBUMS/` prefix

Section-anchor wikilinks like `[[Note#Section]]` resolve by checking the stem
before `#`. Embed/image wikilinks (`![[...]]`) are ignored.
"""

from __future__ import annotations

import re

import utils

# Film/album collisions that require a full-path wikilink.
# A Hard Day's Night collision resolved 2026-05-11 by renaming the film note to
# `(1964) A Hard Day's Night (film).md`; the bare album wikilink now resolves
# unambiguously. The remaining stems still collide between MUSIC/RELEASES/ALBUMS
# and FILM/FILMS for identically-named films, so the prefix is still required.
COLLISION_STEMS = {
    "(1965) Help!",
    "(1967) Magical Mystery Tour",
    "(1970) Let It Be",
}


def main() -> None:
    all_stems_ci = utils.all_md_stems_ci()  # every .md in the vault
    by_stem = utils.notes_by_stem()           # entity notes only
    # Entities that could be referenced WITHOUT a year prefix — for YEAR-missing detection
    release_titles_ci: dict[str, list[utils.Note]] = {}
    for n in utils.all_notes():
        if n.entity_type in utils.RELEASE_TYPES:
            release_titles_ci.setdefault(n.display_name.lower(), []).append(n)

    # Using the MAP is documentation and contains literal wikilink examples in code
    # blocks and inline pseudo-syntax (e.g., [[(YEAR) Album]]). Skip it.
    SKIP_PATHS = {"x. META/Using the MAP.md", "x. META/About the MAP.md"}

    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP_PATHS:
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        for wl in utils.extract_wikilinks(text):
            target = wl.target
            # Cross-vault references to the FILM MAP live in a sibling `FILM/`
            # folder at the Obsidian vault root, outside the MUSIC vault tree the
            # scanner walks. Any `[[FILM/…]]` wikilink is assumed to resolve in
            # the parallel vault.
            if target.startswith("FILM/"):
                continue
            if "#" in target:
                target = target.split("#", 1)[0]
            target_stem = target.rsplit("/", 1)[-1]

            if not target_stem:
                continue
            # Skip asset embeds (images, PDFs, audio, video)
            if any(target_stem.lower().endswith(ext) for ext in utils.ASSET_EXTS):
                continue

            # Any .md in the vault is a valid resolution target (entity notes +
            # x. META/ documentation + PLANS/ + anything else)
            if target_stem.lower() in all_stems_ci:
                # Even if it resolves, film/album collisions must use the path prefix
                # ONLY check when the wikilink has no path prefix of its own.
                if target_stem in COLLISION_STEMS and "/" not in wl.target:
                    utils.emit(
                        "broken-wikilink-path",
                        rel, wl.line,
                        f"[[{wl.target}]] needs `MUSIC/RELEASES/ALBUMS/` path prefix"
                    )
                # Surface case-mismatch even when there's a CI hit: the actual file
                # stem may differ in case from the wikilink target.
                hits = all_stems_ci[target_stem.lower()]
                exact = any(p.stem == target_stem for p in hits)
                if not exact:
                    hit = hits[0]
                    utils.emit(
                        "broken-wikilink-case",
                        rel, wl.line,
                        f"[[{wl.target}]] — file is `{hit.stem}` (case mismatch)"
                    )
                continue

            # Missing `(YEAR)` prefix? `[[Pet Sounds]]` when `(1966) Pet Sounds.md` exists
            release_hits = release_titles_ci.get(target_stem.lower(), [])
            if release_hits:
                options = ", ".join(n.stem for n in release_hits)
                utils.emit(
                    "broken-wikilink-year",
                    rel, wl.line,
                    f"[[{wl.target}]] — missing `(YEAR)` prefix (candidate: {options})"
                )
                continue

            utils.emit(
                "broken-wikilink-target",
                rel, wl.line,
                f"[[{wl.target}]] — no matching file"
            )


if __name__ == "__main__":
    main()
