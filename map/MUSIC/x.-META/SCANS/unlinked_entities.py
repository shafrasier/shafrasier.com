#!/usr/bin/env python3
"""Unlinked plain-text mentions of MAP-note entities.

Categories:

- unlinked-entity-mention    — a note prose-mentions an entity that has a MAP note
                                WITHOUT ever wikilinking or externally-linking it
                                anywhere in the note
- first-mention-bare-later-linked — entity's first prose mention is bare while a
                                    later mention carries the wikilink

These are the highest-signal findings in the MAP audit. Mechanical scanning
lets us enumerate every entity name and grep for bare occurrences in every
other note, catching the failure mode where an entity was added but one or
more references to it didn't get converted.

Conservative exclusions:

- Skip if the mentioning note IS the entity's own note (self-reference)
- Skip mentions inside wikilinks, external links, code fences, and image embeds
- Skip catalog sections when the scan becomes too noisy (we defer these to
  Dream-agent judgment, which reads the surrounding prose)
- Word-boundary anchored matching; quoted titles must match quotes exactly
- For releases, match the `*Title*` form in prose (italicized) — the bare
  non-italic "Pet Sounds" pattern has too many false positives in descriptive
  prose about the place "Pet Sounds occupies"

Display-name synonyms:

- Artists whose stem starts with "The " are also matched as "the Name" and bare "Name"
  when word-boundary safe (e.g., "The Beach Boys" → "Beach Boys" as synonym)
- Releases match only on the italic-delimited form `*Pet Sounds*` or quoted form
  `"Be My Baby"` to avoid descriptive-prose collisions
"""

from __future__ import annotations

import re

import utils


# Entity types we check for plain-text-mention violations
CHECKABLE_TYPES = {
    "artist_top", "producer", "songwriter", "session_musician",
    "label", "studio", "executive",
    "album", "single", "track",
    "idea", "technique_production", "technique_theory",
    "moment", "scene", "era",
    # genres are handled separately — they appear in metadata lines and
    # prose casually, and the grep false-positive rate is high
    "genre",
}


def _artist_synonyms(display_name: str) -> list[str]:
    """Display-name synonyms for artists/labels/etc. that may open with `The `."""
    names = [display_name]
    if display_name.startswith("The "):
        # Also match the bare form and the lowercased-article form
        bare = display_name[4:]
        names.append(bare)
        names.append("the " + bare)
    return names


def _build_search_patterns() -> dict[str, tuple[utils.Note, re.Pattern, bool]]:
    """Return: key → (Note, compiled-regex, is_release).

    The key is a display-form string used just for deduplication. Regexes use
    word boundaries and appropriate delimiters per entity type.
    """
    out: dict[str, tuple[utils.Note, re.Pattern, bool]] = {}
    for n in utils.all_notes():
        if n.entity_type not in CHECKABLE_TYPES:
            continue
        name = n.display_name
        if not name or len(name) < 3:
            continue
        is_release = n.entity_type in utils.RELEASE_TYPES
        if n.entity_type == "album":
            # Match italicized title: `*Pet Sounds*`
            pattern = re.compile(r"\*" + re.escape(name) + r"\*")
            out[f"album:{name}"] = (n, pattern, True)
        elif n.entity_type in ("single", "track"):
            # Match quoted title: `"Be My Baby"` (also Unicode curly quotes)
            pattern = re.compile(r'["\u201C]' + re.escape(name) + r'["\u201D]')
            out[f"song:{name}"] = (n, pattern, True)
        elif n.entity_type == "idea":
            # IDEAS notes: match the name case-insensitively on word boundaries
            # Only if the name has more than 2 words — single-word IDEAS titles
            # are too prone to collision (e.g., "Authenticity").
            if len(name.split()) < 2:
                continue
            pattern = re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE)
            out[f"idea:{name}"] = (n, pattern, False)
        elif n.entity_type in ("technique_production", "technique_theory"):
            if len(name.split()) < 2:
                continue
            pattern = re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE)
            out[f"tech:{name}"] = (n, pattern, False)
        elif n.entity_type == "scene":
            if len(name.split()) < 2:
                # "Mod" alone is too collision-prone; "Merseybeat" is OK
                if len(name) < 6:
                    continue
            pattern = re.compile(r"\b" + re.escape(name) + r"\b")
            out[f"scene:{name}"] = (n, pattern, False)
        elif n.entity_type == "era":
            pattern = re.compile(r"\b" + re.escape(name) + r"\b")
            out[f"era:{name}"] = (n, pattern, False)
        elif n.entity_type == "moment":
            if len(name.split()) < 2:
                continue
            pattern = re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE)
            out[f"moment:{name}"] = (n, pattern, False)
        elif n.entity_type == "genre":
            # Genre-name-in-prose grep is noisy — limit to multi-word or uppercase-only
            if len(name) < 5:
                continue
            pattern = re.compile(r"\b" + re.escape(name) + r"\b", re.IGNORECASE)
            out[f"genre:{name}"] = (n, pattern, False)
        else:
            # Artists, labels, studios, executives, producers, songwriters, session musicians
            synonyms = _artist_synonyms(name)
            for syn in synonyms:
                if len(syn) < 4:
                    continue
                pattern = re.compile(r"\b" + re.escape(syn) + r"\b")
                out[f"{n.entity_type}:{syn}"] = (n, pattern, False)
    return out


def _non_link_spans(text: str) -> list[tuple[int, int]]:
    """Spans of text NOT inside wikilinks, external links, image embeds, or code."""
    occupied: list[tuple[int, int]] = []
    # Wikilinks (including embeds `![[...]]`)
    for m in re.finditer(r"!?\[\[[^\[\]\n]+?\]\]", text):
        occupied.append((m.start(), m.end()))
    # External links
    for m in re.finditer(r"\[[^\[\]\n]+?\]\([^\s)]+\)", text):
        occupied.append((m.start(), m.end()))
    # Fenced code
    for m in re.finditer(r"```.*?```", text, re.DOTALL):
        occupied.append((m.start(), m.end()))
    # Inline code
    for m in re.finditer(r"`[^`\n]+?`", text):
        occupied.append((m.start(), m.end()))
    occupied.sort()
    # Merge
    merged: list[tuple[int, int]] = []
    for s, e in occupied:
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return merged


def _inside_any(pos: int, spans: list[tuple[int, int]]) -> bool:
    for s, e in spans:
        if s <= pos < e:
            return True
        if pos < s:
            return False
    return False


def _first_link_position(text: str, target: utils.Note) -> int | None:
    """Offset of the first wikilink or external link that resolves to `target`."""
    target_stem = target.stem
    best: int | None = None
    # Wikilinks
    for m in utils.WIKILINK_RE.finditer(text):
        raw = m.group(1).strip()
        last = raw.rsplit("/", 1)[-1].split("#", 1)[0].strip()
        if last == target_stem:
            if best is None or m.start() < best:
                best = m.start()
    # External links (match on display-text inclusion)
    for m in utils.EXT_LINK_RE.finditer(text):
        display = m.group(1)
        if target.display_name in display:
            if best is None or m.start() < best:
                best = m.start()
    return best


def _note_links_to(note_text: str, target_note: utils.Note) -> bool:
    """Does `note_text` contain any wikilink or external-link reference to target_note?"""
    # Wikilink: [[stem]] or [[stem|alias]] or [[FOLDER/.../stem]] or [[stem#anchor]]
    target_stem = target_note.stem
    # Check wikilink targets
    for m in utils.WIKILINK_RE.finditer(note_text):
        raw = m.group(1).strip()
        last = raw.rsplit("/", 1)[-1].split("#", 1)[0].strip()
        if last == target_stem:
            return True
    # External-link URL match (heuristic per entity type)
    # For artists/producers/songwriters/etc., match RYM artist slug of display_name
    # For albums, match RYM album slug; songs Apple Music; studios/executives Wikipedia
    # For simplicity: just check whether the display_name appears inside *any* external link
    # on this note — if it does, we consider the note to have a reference.
    for m in utils.EXT_LINK_RE.finditer(note_text):
        display = m.group(1)
        if target_note.display_name in display:
            return True
    return False


def main() -> None:
    SKIP = {"x. META/Using the MAP.md", "x. META/About the MAP.md",
            "x. META/MAPmaking.md", "x. META/PLANS/External links audit.md",
            "x. META/Dream log.md"}
    patterns = _build_search_patterns()
    # Build self-path lookup
    self_rel: dict[str, str] = {}  # key → the entity's own relpath
    for key, (note, _pat, _is_release) in patterns.items():
        self_rel[key] = note.relpath

    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP:
            continue
        # Scans folder itself excluded by iter_vault_md
        text = md_path.read_text(encoding="utf-8", errors="replace")
        non_link_gap = _non_link_spans(text)
        md_end = utils.metadata_end_offset(text)

        # For each entity pattern, find bare mentions in this note (outside links)
        for key, (target, pat, is_release) in patterns.items():
            if target.relpath == rel:
                continue  # self-reference — skip
            # Does the note already link to this target?
            note_links = _note_links_to(text, target)
            matches = list(pat.finditer(text))
            if not matches:
                continue
            # Filter: only bare mentions (not inside links/code)
            bare_positions = [m for m in matches if not _inside_any(m.start(), non_link_gap)]
            # Skip positions inside the metadata block — first-mention rule
            # operates on prose body. But for unlinked-in-full-note check, we
            # still count the bare mention if note doesn't link.
            if not bare_positions:
                continue
            if not note_links:
                # Report FIRST bare prose-body occurrence (skip metadata block)
                first_prose = next((m for m in bare_positions if m.start() >= md_end), None)
                if not first_prose:
                    continue
                line = utils._line_at(text, first_prose.start())
                utils.emit(
                    "unlinked-entity-mention",
                    rel, line,
                    f"`{key.split(':', 1)[1]}` — MAP note exists (`{target.stem}`) but no link anywhere in note"
                )
            else:
                # Note DOES link to the entity — but does the FIRST prose mention
                # carry the link? Find the position of the first linked reference
                # and the first bare mention; if the bare precedes the linked,
                # the first mention is bare.
                first_bare_prose = next((m for m in bare_positions if m.start() >= md_end), None)
                if not first_bare_prose:
                    continue
                # First linked reference to this target
                first_link_pos = _first_link_position(text, target)
                if first_link_pos is None:
                    continue
                if first_bare_prose.start() < first_link_pos:
                    line = utils._line_at(text, first_bare_prose.start())
                    utils.emit(
                        "first-mention-bare-later-linked",
                        rel, line,
                        f"`{key.split(':', 1)[1]}` bare on L{line}; first link appears later at L{utils._line_at(text, first_link_pos)}"
                    )


if __name__ == "__main__":
    main()
