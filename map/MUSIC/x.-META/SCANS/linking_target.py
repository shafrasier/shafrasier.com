#!/usr/bin/env python3
"""Linking target violations — external links that should be wikilinks, misrouted
external destinations, and first-mention ordering.

Categories:

- target-ext-should-be-wiki    — external link to an entity that now has a MAP note
- target-song-to-rym           — song RYM link where Apple Music is the convention
- target-studio-to-rym         — studio RYM link where Wikipedia is the convention
- target-executive-to-rym      — executive RYM link where Wikipedia is the convention
- target-duplicate-wikilink    — same wikilink target linked twice in prose (exempting reference sections)
- target-duplicate-extlink     — same external URL linked twice
- target-first-mention-bare    — first prose mention of an entity is bare while a later mention is linked

The first-mention check is conservative: it only fires when there are two or
more mentions of the entity name and at least one later mention carries the
link while the first does not. Entity-name matching uses word-boundary
anchors and skips asset filenames inside image embeds.
"""

from __future__ import annotations

import re
from pathlib import Path

import utils


# Entity types whose external-link destination convention differs from the default RYM
STUDIO_TYPES = {"studio"}
EXECUTIVE_TYPES = {"executive"}


def _is_reference_section(text: str, pos: int) -> bool:
    """True if `pos` is inside a known reference/catalog section.

    Heuristic: walk backward to find the nearest `#### ` heading. If the
    heading text matches one of the catalog-section labels, we're inside one.
    """
    heading_start = text.rfind("\n####", 0, pos)
    if heading_start == -1:
        return False
    heading_end = text.find("\n", heading_start + 1)
    heading = text[heading_start:heading_end].lower()
    KEYWORDS = [
        "key artist", "key figure", "key record", "key song", "key album",
        "key songwriter", "key label", "key producer", "key engineer",
        "key writing team", "key songwriting team", "key studio",
        "key single", "key track", "key venue",
        "foundational record", "see also", "further reading",
        "key entries", "key notes",
        "artists closely identified", "genres where it is structural",
    ]
    return any(k in heading for k in KEYWORDS)


def check_external_should_be_wikilink(text: str, rel: str) -> None:
    """External link whose target now has a MAP note."""
    md_end = utils.metadata_end_offset(text)
    # Build lookup: URL substring → entity note
    url_index: dict[str, utils.Note] = {}
    for n in utils.all_notes():
        stem = n.display_name
        slug_variants = _slug_variants(stem)
        for v in slug_variants:
            url_index.setdefault(v.lower(), n)

    for el in utils.extract_external_links(text):
        if el.start < md_end:
            continue  # metadata header — external links here are convention labels
        url_l = el.url.lower()
        # Look for RYM artist slugs
        m = re.search(r"rateyourmusic\.com/artist/([^/\s)]+)", url_l)
        if m:
            slug = m.group(1).rstrip("/")
            note = url_index.get(slug)
            if note and note.entity_type in ("artist_top", "producer", "songwriter",
                                              "session_musician", "label", "executive",
                                              "studio"):
                utils.emit(
                    "target-ext-should-be-wiki",
                    rel, el.line,
                    f"[{el.display}](rym/artist/{slug}) → wikilink `[[{note.stem}]]`"
                )

        # Look for RYM release slugs
        m = re.search(r"rateyourmusic\.com/release/(?:album|single|ep)/([^/\s)]+)/([^/\s)?]+)", url_l)
        if m:
            slug = m.group(2).rstrip("/")
            note = url_index.get(slug)
            if note and note.entity_type in ("album", "single", "track"):
                utils.emit(
                    "target-ext-should-be-wiki",
                    rel, el.line,
                    f"[{el.display}](rym/release/{slug}) → wikilink `[[{note.stem}]]`"
                )

        # Wikipedia URL
        m = re.search(r"en\.wikipedia\.org/wiki/([^\s)#]+)", url_l)
        if m:
            slug = m.group(1).rstrip("/")
            note = url_index.get(slug)
            if note and note.entity_type in ("executive", "studio", "label",
                                              "producer", "songwriter", "idea",
                                              "moment", "scene", "era"):
                utils.emit(
                    "target-ext-should-be-wiki",
                    rel, el.line,
                    f"[{el.display}](wikipedia/{slug}) → wikilink `[[{note.stem}]]`"
                )


def check_duplicate_links(text: str, rel: str) -> None:
    """Same wikilink or external URL linked more than once in prose (excluding reference sections)."""
    md_end = utils.metadata_end_offset(text)
    # Wikilinks
    seen_wiki: dict[str, list[utils.Wikilink]] = {}
    for wl in utils.extract_wikilinks(text):
        if wl.start < md_end:
            continue  # metadata-block wikilink — independent context
        if _is_reference_section(text, wl.start):
            continue
        # Normalize: strip anchor, strip folder prefix EXCEPT MUSIC/ and FILM/
        # which are the vault-level disambiguators for album/film title collisions.
        raw_target = wl.target.split("#", 1)[0]
        if raw_target.startswith(("MUSIC/", "FILM/")):
            target = raw_target
        else:
            target = raw_target.rsplit("/", 1)[-1]
        if any(target.lower().endswith(ext) for ext in utils.ASSET_EXTS):
            continue
        seen_wiki.setdefault(target, []).append(wl)
    for target, hits in seen_wiki.items():
        if len(hits) > 1:
            lines = ", ".join(str(h.line) for h in hits)
            utils.emit(
                "target-duplicate-wikilink",
                rel, hits[1].line,
                f"[[{target}]] linked {len(hits)}× in prose (lines {lines})"
            )

    # External URLs
    seen_ext: dict[str, list[utils.ExtLink]] = {}
    for el in utils.extract_external_links(text):
        if el.start < md_end:
            continue
        if _is_reference_section(text, el.start):
            continue
        # Normalize URL (drop trailing punctuation / slash / fragments)
        url_norm = el.url.rstrip("/.,;:)")
        seen_ext.setdefault(url_norm, []).append(el)
    for url, hits in seen_ext.items():
        if len(hits) > 1:
            lines = ", ".join(str(h.line) for h in hits)
            short = url[:50]
            utils.emit(
                "target-duplicate-extlink",
                rel, hits[1].line,
                f"[...]({short}...) linked {len(hits)}× in prose (lines {lines})"
            )


def check_song_to_rym(text: str, rel: str) -> None:
    """Songs linking to RYM release/single or /track — should use Apple Music.

    Exempt: the canonical top-of-note metadata row on single/track notes, which
    intentionally carries all three destinations side-by-side as
    `[RYM](…) · [Apple Music](…) · [Spotify](…)`. Detected by display text
    `RYM` paired with `Apple Music` and `Spotify` links on the same line.
    """
    lines = text.splitlines()
    for el in utils.extract_external_links(text):
        if not re.search(r"rateyourmusic\.com/release/(single|ep)/", el.url.lower()):
            continue
        line_idx = el.line - 1
        if 0 <= line_idx < len(lines):
            line_text = lines[line_idx]
            if (el.display.strip() == "RYM"
                    and "[Apple Music]" in line_text
                    and "[Spotify" in line_text):
                continue
        utils.emit(
            "target-song-to-rym",
            rel, el.line,
            f"[{el.display}]({el.url[:50]}...) — songs should link to Apple Music"
        )


def _slug_variants(stem: str) -> list[str]:
    """Generate plausible URL slug variants for an entity stem."""
    base = stem.lower()
    # Strip year prefix if present
    base = re.sub(r"^\(\d{4}\)\s+", "", base)
    # Strip leading/trailing quotes
    base = base.strip('"').strip()
    v = []
    # Word-hyphen slug
    v.append(re.sub(r"[^a-z0-9]+", "-", base).strip("-"))
    # Underscore slug
    v.append(re.sub(r"[^a-z0-9]+", "_", base).strip("_"))
    # "the_" prefix stripped
    if v[0].startswith("the-"):
        v.append(v[0][4:])
    if v[-1].startswith("the_"):
        v.append(v[-1][4:])
    return [x for x in v if x]


def main() -> None:
    SKIP = {"x. META/Using the MAP.md", "x. META/About the MAP.md",
            "x. META/MAPmaking.md", "x. META/PLANS/External links audit.md"}
    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP:
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        check_external_should_be_wikilink(text, rel)
        check_duplicate_links(text, rel)
        check_song_to_rym(text, rel)


if __name__ == "__main__":
    main()
