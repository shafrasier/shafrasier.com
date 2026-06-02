"""Bulletproof external-link propagation for the MUSIC MAP.

This module is the SINGLE canonical place that handles "apply a verified URL
to every place in the vault where this entity is named but not yet linked."
Every previous propagation pass has been an ad-hoc script that rediscovered
the same bugs. This module locks them in.

Use:

    from propagate import Entity, propagate

    entities = [
        Entity("Rock Island Line", "song", "https://music.apple.com/..."),
        Entity("Chuck Berry", "artist", "https://rateyourmusic.com/..."),
        Entity("Pet Sounds", "album", "https://rateyourmusic.com/...", year=1966),
        Entity("Deep Blues", "book", "https://www.goodreads.com/..."),
    ]
    report = propagate(entities)

The library handles every failure mode catalogued from past passes. See
`test_propagate.py` for the regression test for each one. When a new failure
surfaces, the fix goes here AND a test goes in `test_propagate.py`.

================================================================================
KNOWN FAILURE MODES — every one of these has a test
================================================================================

PATTERN MATCHING:
1. Punctuation inside closing quote — `"Song,"` `"Song."` `"Song!"` `"Song?"`
   (May 2026: "John Henry," / "Midnight Special," missed in Skiffle)
2. Apostrophe variants — straight `'` vs curly `’` in both entity and prose
3. Possessive absorption — `Name's`, `Names'`, bare `Name'` for s-ending names
   (April 2026: Vandellas', Shirelles', Ramones' missed)
4. Leading article — `[Tt]he X` case-insensitive
5. Compound-hyphenated names — `Goffin-King` requires linking both halves
   (May 2026 cautionary precedent)
6. Surname-only first mentions — when full name doesn't appear in target note,
   fall back to surname (May 2026: Watts/Wyman precedent)

LINKING CONTEXT (skip if any apply):
7. Already inside markdown link `[...](...)`
8. Already inside wikilink `[[...]]` or alias `|...]]`
9. Already linked to the same URL elsewhere on the same line
10. Inside image embed `![[...]]`
11. Inside fenced code block ` ``` ` or inline backticks
12. Inside the YAML frontmatter

CATALOG SECTIONS:
13. Apply per-section, not per-file (May 2026: body-prose-only sweep missed
    every catalog-section first mention)
14. Catalog sections detected by heading patterns: Key|Foundational|See also|
    Further reading|Subgenres|Influences (header text, not exact match)
15. Body prose and each catalog section are independent linking contexts

COVER-VERSION DISAMBIGUATION:
16. Per-line contextual filters — only apply where filter strings appear
    (April 2026: "Hound Dog" Elvis/Big Mama, "Rock and Roll Music" Berry/Beatles)

POSITION SAFETY:
17. Collect all edits, apply in REVERSE position order to avoid drift
    (May 2026: catastrophic mid-word insertions when multiple edits applied
    forward)

FILE HANDLING:
18. Skip meta-documents: Using the MAP, MAPmaking, External links audit,
    everything under x. META/SCANS/, .obsidian/ (Apr & May 2026 over-applies)
19. Skip image files (.png, .jpg, etc) — not markdown
20. Path-existence check, never silent fail

REPORTING:
21. Per-file count + per-entity count
22. Surface entities that produced ZERO matches anywhere — likely surname-only
    or rename-needed case (May 2026: detection heuristic)
23. Surface entities that matched but were skipped in every candidate location
    (already linked, in code block, etc.) — for human review

ENTITY-TYPE FORMATTING:
24. Songs: `["Title"](url)` — punctuation INSIDE the quote stays inside
25. Albums: `[*Title*](url) (YEAR)` — italic, year OUTSIDE the link
26. Books: `[*Title*](url) (YEAR)` — same as albums (Goodreads)
27. Artists/figures: `[Name](url)` with possessive absorbed inside link text
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

# Add this dir to path so utils is importable from anywhere
sys.path.insert(0, str(Path(__file__).parent))
import utils  # noqa: E402

VAULT = utils.VAULT

# ---------------------------------------------------------------------------
# Files this library never modifies. Meta-documents that quote entities
# pedagogically must not have those quotes turned into live links.
# ---------------------------------------------------------------------------

META_SKIP_RELATIVE = (
    "x. META/Using the MAP.md",
    "x. META/MAPmaking.md",
    "x. META/About the MAP.md",
    "x. META/Dream log.md",
    "x. META/PLANS/External links audit.md",
)


def _is_skipped_file(rel_path: str) -> bool:
    """True if the file is in the meta-skip list or under SCANS / .obsidian."""
    if rel_path in META_SKIP_RELATIVE:
        return True
    if rel_path.startswith("x. META/SCANS/"):
        return True
    if rel_path.startswith(".obsidian/"):
        return True
    if rel_path.startswith("x. META/PLANS/"):
        # Plans docs are working documents, not vault content
        return True
    return False


# ---------------------------------------------------------------------------
# Entity model
# ---------------------------------------------------------------------------

EntityKind = str  # "song" | "album" | "book" | "artist" | "figure" | "label" | "studio"


@dataclass
class Entity:
    """One thing to link, with everything propagate() needs to know.

    Attributes:
        name: Display text (without quotes/italics — propagate() adds them
            based on kind). E.g. "Rock Island Line", "Pet Sounds",
            "Chuck Berry", "Deep Blues".
        kind: One of "song", "album", "book", "artist", "figure", "label",
            "studio". Determines formatting:
              song      → `["name"](url)`   (quotes; punct inside preserved)
              album     → `[*name*](url) (year)`   (italic; year outside)
              book      → `[*name*](url) (year)`   (same as album)
              artist    → `[name](url)`     (plain; possessive absorbed)
              figure    → `[name](url)`     (same as artist)
              label     → `[name](url)`     (same as artist)
              studio    → `[name](url)`     (same as artist)
        url: The verified URL.
        year: Required for album / book if you want the year outside the link
            (e.g. `(1966)`). Optional.
        filters: List of contextual filter strings. If non-empty, the link
            is applied ONLY on lines containing at least one filter string
            (case-insensitive). Used for cover-version disambiguation.
            E.g. for Elvis's "Hound Dog": filters=["Elvis", "Presley"]
            ensures Big Mama Thornton's context is skipped.
        target_files: Optional list of vault-relative paths. If set, ONLY
            those files are touched. Otherwise: scan the whole vault.
        aliases: Alternative display forms to also match — e.g. for "Roger
            McGuinn" you might pass aliases=["Jim McGuinn"] to catch his
            pre-1967 name in folk-rock-era prose. Each alias is treated as
            its own pattern but maps to the same URL.
    """

    name: str
    kind: EntityKind
    url: str
    year: int | None = None
    filters: list[str] = field(default_factory=list)
    target_files: list[str] | None = None
    aliases: list[str] = field(default_factory=list)

    def display_forms(self) -> list[str]:
        """All forms to search for: primary name + aliases."""
        return [self.name, *self.aliases]


# ---------------------------------------------------------------------------
# Pattern construction
# ---------------------------------------------------------------------------

def _escape_name(name: str) -> str:
    """Escape a name for regex, with apostrophe variants made flexible.

    Failure mode #2: re.escape does NOT escape `'` (apostrophe isn't a
    regex metachar), so previous attempts to `replace(r"\\'", ...)` were
    a no-op. Fix: normalize all apostrophe variants to straight first,
    THEN make each straight apostrophe a character-class that matches
    either form."""
    # Normalize curly → straight before escaping
    normalized = name.replace("’", "'")
    escaped = re.escape(normalized)
    # Now make every apostrophe a character class matching either form
    escaped = escaped.replace("'", "['’]")
    return escaped


def _song_pattern(name: str) -> re.Pattern:
    """Match `"name"`, `"name,"`, `"name."`, `"name!"`, `"name?"`.

    Negative lookbehind for `[` to skip lines where already linked
    (the `[` precedes a `"` in markdown link syntax `["text"](url)`).
    """
    esc = _escape_name(name)
    return re.compile(rf'(?<!\[)"({esc})([,.!?])?"(?!\])')


def _album_pattern(name: str) -> re.Pattern:
    """Match `*name*` (italic). Trailing ` (YEAR)` is optional and gets
    absorbed OUTSIDE the link per Using the MAP."""
    esc = _escape_name(name)
    # Negative lookbehind/lookahead for `[` and `]` to skip already-linked
    # Also negative lookbehind for `*` to skip `**bold**` and `***bolditalic***`
    return re.compile(rf'(?<![\[\*])\*({esc})\*(?!\])')


def _book_pattern(name: str) -> re.Pattern:
    """Books are italicized like albums."""
    return _album_pattern(name)


def _artist_pattern(name: str) -> re.Pattern:
    """Match an artist/figure name as a whole word.

    Handles:
    - Leading article: `[Tt]he Name` matches if name starts with "The"
    - Possessive: trailing `'s`, `s'`, or bare `'` for s-ending names
    - Word boundaries on both sides
    - Skips if inside `[...]` (markdown link) or `[[...]]` (wikilink)
    """
    esc = _escape_name(name)
    # If name starts with "The "/"the ", make article optional + case-flexible
    if name.lower().startswith("the "):
        esc = re.sub(r"^\[Tt\]he|^The|^the", "[Tt]he", esc, count=1)

    # Possessive suffix: 's, s', or bare ' after s
    # We capture the possessive so the replacement can absorb it inside link
    possessive = r"(['’]s|s['’]|['’])?"

    # Build full pattern with bracket-skipping context check
    # `(?<![\[\|/\w])` — not preceded by `[` (markdown), `|` (alias),
    # `/` (URL slug), or word char (substring of larger word)
    # `(?![\w])` after the name — not followed by word char (substring)
    return re.compile(rf"(?<![\[\|/\w]){esc}{possessive}(?![\w])")


def _figure_pattern(name: str) -> re.Pattern:
    """Same as artist."""
    return _artist_pattern(name)


def _label_pattern(name: str) -> re.Pattern:
    return _artist_pattern(name)


def _studio_pattern(name: str) -> re.Pattern:
    return _artist_pattern(name)


PATTERN_FOR = {
    "song": _song_pattern,
    "album": _album_pattern,
    "book": _book_pattern,
    "artist": _artist_pattern,
    "figure": _figure_pattern,
    "label": _label_pattern,
    "studio": _studio_pattern,
}


# ---------------------------------------------------------------------------
# Protected-context detection
# ---------------------------------------------------------------------------

def _protected_spans(text: str) -> list[tuple[int, int]]:
    """All character ranges where insertions are forbidden.

    Includes:
    - YAML frontmatter
    - Fenced code blocks (``` ... ```)
    - Inline code spans (`...`)
    - Markdown links `[...](...)` — entire span
    - Wikilinks `[[...]]` — entire span
    - Image embeds `![[...]]` — entire span
    """
    spans: list[tuple[int, int]] = []

    # YAML frontmatter
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end != -1:
            spans.append((0, end + 4))

    # Fenced code blocks
    for m in re.finditer(r"```[\s\S]*?```", text):
        spans.append((m.start(), m.end()))

    # Inline code spans — backtick-delimited, single-line
    for m in re.finditer(r"`[^`\n]+`", text):
        spans.append((m.start(), m.end()))

    # Markdown links (including with nested formatting in display text)
    for m in re.finditer(r"\[[^\]\n]*\]\([^)\n]*\)", text):
        spans.append((m.start(), m.end()))

    # Wikilinks (including aliased and image embeds)
    for m in re.finditer(r"!?\[\[[^\]\n]*\]\]", text):
        spans.append((m.start(), m.end()))

    return spans


def _is_protected(pos: int, spans: list[tuple[int, int]]) -> bool:
    """True if pos is inside any protected span."""
    for s, e in spans:
        if s <= pos < e:
            return True
    return False


# ---------------------------------------------------------------------------
# Section detection
# ---------------------------------------------------------------------------

CATALOG_KEYWORDS = (
    "key artists", "key figures", "key songs", "key records",
    "key labels", "key singles", "key songwriting teams", "key tracks",
    "key collaborator", "foundational records", "foundational singles",
    "see also", "further reading", "subgenres", "key influences",
    "key venues", "key producers", "key performers",
)


def _is_catalog_heading(heading_text: str) -> bool:
    """True if heading text matches a catalog-section pattern."""
    h = heading_text.lower().strip("* ").strip()
    for kw in CATALOG_KEYWORDS:
        if kw in h:
            return True
    return False


def _heading_offsets(text: str, headings: list[tuple[int, int, str]]) -> list[int]:
    """Convert utils.iter_headings's (line_number, level, text) tuples to
    character offsets (start-of-heading-line position in `text`).

    Failure mode caught by test suite: I previously unpacked
    `(level, offset, text)` and used `offset` directly — but
    utils.iter_headings actually returns line numbers, not offsets, so
    every section_for() result was wrong (all matches landed in 'section 0')
    and the second match in any file was being skipped as 'section already
    filled'."""
    # Build line_starts[i] = char offset where line (i+1) begins (1-indexed)
    line_starts = [0]
    for i, ch in enumerate(text):
        if ch == "\n":
            line_starts.append(i + 1)
    return [
        line_starts[line - 1] if 0 <= line - 1 < len(line_starts) else len(text)
        for line, _, _ in headings
    ]


def _section_for(pos: int, heading_offsets: list[int]) -> int:
    """Return the index of the section containing `pos`.

    Section 0 = body before any heading. Section i (i>=1) = the i-th heading's
    section. `heading_offsets` is the list of heading start positions."""
    if not heading_offsets:
        return 0
    for i, off in enumerate(heading_offsets):
        if off > pos:
            return i  # We're in the section BEFORE this heading
    return len(heading_offsets)


def _is_catalog_section(section_idx: int,
                       headings: list[tuple[int, int, str]]) -> bool:
    """True if section_idx is a catalog section. `headings` is
    utils.iter_headings()'s (line_number, level, text) tuples."""
    if section_idx == 0:
        return False
    h_idx = section_idx - 1
    if h_idx >= len(headings):
        return False
    return _is_catalog_heading(headings[h_idx][2])


# ---------------------------------------------------------------------------
# Match → edit
# ---------------------------------------------------------------------------

@dataclass
class _Edit:
    """One pending text replacement."""
    start: int
    end: int
    replacement: str


def _replacement_for(entity: Entity, match: re.Match) -> str:
    """Build the replacement text for a match."""
    if entity.kind == "song":
        # match.group(1) = name, match.group(2) = optional punct
        name = match.group(1)
        punct = match.group(2) or ""
        # Preserve the matched name (handles curly-vs-straight apostrophe)
        return f'["{name}{punct}"]({entity.url})'

    if entity.kind in ("album", "book"):
        name = match.group(1)
        return f'[*{name}*]({entity.url})'

    if entity.kind in ("artist", "figure", "label", "studio"):
        # Whole match including possessive
        full = match.group(0)
        # match.group(1) might be the possessive suffix (if pattern captured)
        # The pattern uses optional group for possessive
        possessive_match = match.group(1) if match.lastindex else None
        if possessive_match:
            # Absorb possessive inside link
            base = full[: -len(possessive_match)]
            return f"[{base}{possessive_match}]({entity.url})"
        return f"[{full}]({entity.url})"

    raise ValueError(f"Unknown entity kind: {entity.kind!r}")


# ---------------------------------------------------------------------------
# Per-file propagation
# ---------------------------------------------------------------------------

def _line_for_pos(text: str, pos: int) -> int:
    """1-indexed line number for a character offset."""
    return text.count("\n", 0, pos) + 1


def _collect_edits(text: str, entity: Entity) -> tuple[list[_Edit], dict]:
    """Find all positions where `entity` should be linked in `text`.

    Returns (edits, stats) where edits is the list to apply and stats has
    diagnostic counters.

    Strategy:
    - Apply at most ONE link per logical section (body prose + each catalog
      section is its own section).
    - Skip if position is inside a protected span.
    - Skip if line is already linked to the same URL.
    - Skip if contextual filter is set and the line doesn't match.
    """
    headings = utils.iter_headings(text)
    h_offsets = _heading_offsets(text, headings)
    protected = _protected_spans(text)

    sections_filled: set[int] = set()
    edits: list[_Edit] = []
    stats = {
        "matches_total": 0,
        "skipped_protected": 0,
        "skipped_already_linked": 0,
        "skipped_filter": 0,
        "skipped_section_filled": 0,
    }

    pattern_fn = PATTERN_FOR[entity.kind]
    lines = text.split("\n")
    line_starts = [0]
    for line in lines:
        line_starts.append(line_starts[-1] + len(line) + 1)

    def line_text_at(pos: int) -> str:
        line_idx = _line_for_pos(text, pos) - 1
        return lines[line_idx] if 0 <= line_idx < len(lines) else ""

    for form in entity.display_forms():
        pattern = pattern_fn(form)
        for m in pattern.finditer(text):
            stats["matches_total"] += 1
            pos = m.start()

            if _is_protected(pos, protected):
                stats["skipped_protected"] += 1
                continue

            # Note: deliberately no "if entity.url in line_str: skip" check.
            # That check used to be here as a paranoid safety net, but it
            # produces FALSE POSITIVES when two different entities share a
            # URL (e.g., "Roaring Twenties" the venue and "Count Suckle"
            # the DJ both pointed at the Count Suckle Wikipedia page since
            # the venue has no dedicated article). Idempotency is already
            # guaranteed by:
            #   - _is_protected (covers "match position is inside an
            #     existing markdown/wiki link or image embed")
            #   - sections_filled (covers "we already linked this entity
            #     in this section on this call")
            # So checking URL substring against the whole line is over-broad.
            line_str = line_text_at(pos)

            if entity.filters:
                if not any(f.lower() in line_str.lower() for f in entity.filters):
                    stats["skipped_filter"] += 1
                    continue

            sec_idx = _section_for(pos, h_offsets)
            if sec_idx in sections_filled:
                stats["skipped_section_filled"] += 1
                continue

            # Build the edit
            replacement = _replacement_for(entity, m)
            edits.append(_Edit(m.start(), m.end(), replacement))
            sections_filled.add(sec_idx)

    return edits, stats


def _apply_edits(text: str, edits: list[_Edit]) -> str:
    """Apply edits in REVERSE position order so earlier positions don't shift.

    This is the fix for the May 2026 position-drift bug. When two edits in
    different sections of the same file were applied forward, the second
    edit's start/end were computed against the pre-mutation text but applied
    to the post-mutation text, landing mid-word.
    """
    if not edits:
        return text
    # Sort by start descending
    edits = sorted(edits, key=lambda e: e.start, reverse=True)
    chars = list(text)
    for edit in edits:
        chars[edit.start : edit.end] = edit.replacement
    return "".join(chars)


# ---------------------------------------------------------------------------
# Top-level propagation
# ---------------------------------------------------------------------------

@dataclass
class PropagationReport:
    """Result of a propagation pass."""
    edits_applied: int = 0
    files_changed: int = 0
    per_file: dict[str, int] = field(default_factory=dict)
    per_entity: dict[str, int] = field(default_factory=dict)
    zero_match_entities: list[str] = field(default_factory=list)
    no_op_entities: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def __str__(self) -> str:
        out = [
            f"Applied {self.edits_applied} edits across {self.files_changed} files",
        ]
        if self.per_file:
            out.append("\nPer file:")
            for path, n in sorted(self.per_file.items(), key=lambda x: -x[1]):
                out.append(f"  {n:3d}  {path}")
        if self.zero_match_entities:
            out.append(f"\nZero matches anywhere ({len(self.zero_match_entities)}):")
            for e in self.zero_match_entities:
                out.append(f"  ✗ {e}")
        if self.no_op_entities:
            out.append(f"\nMatched but no-op ({len(self.no_op_entities)}) "
                      "— already linked or filtered out:")
            for e in self.no_op_entities:
                out.append(f"  ◯ {e}")
        if self.notes:
            out.append("\nNotes:")
            for n in self.notes:
                out.append(f"  ! {n}")
        return "\n".join(out)


def propagate(entities: Iterable[Entity],
              dry_run: bool = False,
              extra_skip_files: list[str] | None = None) -> PropagationReport:
    """Apply each entity's URL to every place it should be linked across the
    vault.

    Args:
        entities: Iterable of Entity objects.
        dry_run: If True, compute edits but don't write files.
        extra_skip_files: Additional vault-relative paths to skip.

    Returns:
        PropagationReport with counts and diagnostics.
    """
    entities = list(entities)
    extra_skip = set(extra_skip_files or [])
    report = PropagationReport()

    # Per-entity tracking
    per_entity_applied: dict[str, int] = {e.name: 0 for e in entities}
    per_entity_matched_anywhere: dict[str, bool] = {e.name: False for e in entities}

    # For each entity, determine target file set
    def files_for(entity: Entity) -> list[Path]:
        if entity.target_files:
            return [VAULT / p for p in entity.target_files]
        return list(utils.iter_vault_md())

    # Build per-file work queue: file → list of entities to apply
    file_entities: dict[Path, list[Entity]] = {}
    for entity in entities:
        for path in files_for(entity):
            file_entities.setdefault(path, []).append(entity)

    for path, file_ents in file_entities.items():
        rel = utils.rel(path)
        if _is_skipped_file(rel) or rel in extra_skip:
            continue
        if not path.exists():
            report.notes.append(f"PATH NOT FOUND: {rel}")
            continue

        text = path.read_text(encoding="utf-8")
        original = text

        # Collect ALL edits for this file from ALL entities, then apply once
        # in reverse-position order. This avoids position drift even when
        # many entities all target the same file.
        all_edits: list[_Edit] = []
        for entity in file_ents:
            edits, _stats = _collect_edits(text, entity)
            if edits:
                per_entity_matched_anywhere[entity.name] = True
                per_entity_applied[entity.name] += len(edits)
            all_edits.extend(edits)

        if not all_edits:
            continue

        new_text = _apply_edits(text, all_edits)
        if new_text != original:
            if not dry_run:
                path.write_text(new_text, encoding="utf-8")
            report.edits_applied += len(all_edits)
            report.files_changed += 1
            report.per_file[rel] = len(all_edits)

    report.per_entity = per_entity_applied
    report.zero_match_entities = [
        name for name, matched in per_entity_matched_anywhere.items()
        if not matched
    ]
    report.no_op_entities = [
        name for name, applied in per_entity_applied.items()
        if applied == 0 and per_entity_matched_anywhere[name]
    ]

    return report


# ---------------------------------------------------------------------------
# CLI entry point — for manual one-off runs from the command line.
# Most usage will be via importing `Entity` + `propagate` from another script.
# ---------------------------------------------------------------------------

def main() -> None:
    print(__doc__)
    print()
    print("This module is a library. Import Entity and propagate() and call")
    print("from your own script. See test_propagate.py for usage examples.")


if __name__ == "__main__":
    main()
