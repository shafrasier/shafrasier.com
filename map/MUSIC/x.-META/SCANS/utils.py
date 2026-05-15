"""Shared utilities for MUSIC MAP scan scripts.

These scripts live at <vault>/x. META/scans/ and auto-detect the vault root
by walking up from __file__ until they find `x. META/Using the MAP.md`.

Each script prints findings one per line in this format:

    <category> | <vault-relative-path> | <line> | <detail>

The `run_all.py` orchestrator parses this format and groups by category.
Line number `0` means "not line-specific" (e.g., an orphan-SOURCES finding).

Pragma:
- Prefer false negatives over false positives. Noisy scans get ignored.
- Scripts are run weekly and re-run after fixes; they should be idempotent.
- Entity matching is case-sensitive. "the Beatles" and "The Beatles" are
  treated as the same entity — lookup tables normalize via .lower().
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Iterator


# ---------------------------------------------------------------------------
# Vault resolution
# ---------------------------------------------------------------------------

def vault_root() -> Path:
    """Walk up from __file__ until we find the vault's x. META/Using the MAP.md."""
    here = Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        if (parent / "x. META" / "Using the MAP.md").exists():
            return parent
    raise RuntimeError(f"Could not locate vault root from {here}")


VAULT = vault_root()


# ---------------------------------------------------------------------------
# Entity registry
# ---------------------------------------------------------------------------

# Folders keyed by entity type. Each value is (subpath, recursive?).
ENTITY_FOLDERS: dict[str, tuple[str, bool]] = {
    "artist_top": ("ARTISTS", False),
    "producer": ("ARTISTS/PRODUCERS", False),
    "songwriter": ("ARTISTS/SONGWRITERS", False),
    "session_musician": ("ARTISTS/SESSION MUSICIANS", False),
    "album": ("RELEASES/ALBUMS", False),
    "single": ("RELEASES/SINGLES", False),
    "track": ("RELEASES/TRACKS", False),
    "era": ("TAXONOMY/ERAS", False),
    "genre": ("TAXONOMY/GENRES", True),
    "scene": ("TAXONOMY/SCENES", False),
    "label": ("INDUSTRY/LABELS", False),
    "studio": ("INDUSTRY/STUDIOS", False),
    "executive": ("INDUSTRY/EXECUTIVES", False),
    "technique_production": ("TECHNIQUES/PRODUCTION", False),
    "technique_theory": ("TECHNIQUES/THEORY", False),
    "idea": ("IDEAS", False),
    "moment": ("MOMENTS", False),
    "source": ("x. SOURCES", False),
}

# Release-type folders (match filename pattern `(YYYY) ...`)
RELEASE_TYPES = {"album", "single", "track"}


@dataclass
class Note:
    path: Path
    relpath: str          # vault-relative with forward slashes
    entity_type: str
    stem: str             # filename minus .md
    display_name: str     # stem with (YYYY) prefix and quotes stripped for releases
    year: int | None = None

    def read(self) -> str:
        return self.path.read_text(encoding="utf-8")


_YEAR_TITLE_RE = re.compile(r'^\((\d{4})\)\s+(.+)$')


def _parse_release_stem(stem: str) -> tuple[int | None, str]:
    """`(1966) Pet Sounds` → (1966, 'Pet Sounds'); `(1963) "Be My Baby"` → (1963, 'Be My Baby')."""
    m = _YEAR_TITLE_RE.match(stem)
    if not m:
        return None, stem
    year, title = int(m.group(1)), m.group(2)
    # Strip surrounding quotes on singles/tracks
    if len(title) >= 2 and title[0] == '"' and title[-1] == '"':
        title = title[1:-1]
    return year, title


@lru_cache(maxsize=1)
def all_notes() -> list[Note]:
    """Enumerate every entity note in the vault."""
    out: list[Note] = []
    seen: set[str] = set()
    # Process ARTISTS subfolders first so files under PRODUCERS/SONGWRITERS/SESSION MUSICIANS
    # are tagged with their role rather than falling into artist_top.
    ordered = sorted(
        ENTITY_FOLDERS.items(),
        key=lambda kv: (0 if kv[1][0] != "ARTISTS" else 1, kv[0]),
    )
    for etype, (subpath, recursive) in ordered:
        folder = VAULT / subpath
        if not folder.exists():
            continue
        pattern = "**/*.md" if recursive else "*.md"
        for p in folder.glob(pattern):
            if p.is_dir() or not p.is_file():
                continue
            rel = p.relative_to(VAULT).as_posix()
            if rel in seen:
                continue
            seen.add(rel)
            stem = p.stem
            year, display = _parse_release_stem(stem) if etype in RELEASE_TYPES else (None, stem)
            out.append(Note(
                path=p,
                relpath=rel,
                entity_type=etype,
                stem=stem,
                display_name=display,
                year=year,
            ))
    return out


@lru_cache(maxsize=1)
def notes_by_stem() -> dict[str, Note]:
    """stem (filename without .md) → Note. Case-preserving."""
    return {n.stem: n for n in all_notes()}


@lru_cache(maxsize=1)
def notes_by_stem_ci() -> dict[str, list[Note]]:
    """Lowercased-stem → [Notes]. Used to detect case-mismatch wikilinks."""
    out: dict[str, list[Note]] = {}
    for n in all_notes():
        out.setdefault(n.stem.lower(), []).append(n)
    return out


@lru_cache(maxsize=1)
def all_md_stems_ci() -> dict[str, list[Path]]:
    """Lowercased stem → [paths] for EVERY .md in the vault (including x. META/
    documentation like About the MAP, MAPmaking, External links audit).

    Wikilinks can point to any of these even though they aren't MAP entities.
    Used by broken_wikilinks.py to confirm a target resolves somewhere.
    """
    out: dict[str, list[Path]] = {}
    for p in VAULT.rglob("*.md"):
        if not p.is_file():
            continue
        try:
            p.relative_to(VAULT / "x. META" / "scans")
            continue  # skip scans/ itself
        except ValueError:
            pass
        out.setdefault(p.stem.lower(), []).append(p)
    return out


# Image / asset extensions that appear as wikilink targets (Obsidian embeds)
ASSET_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".mp3", ".mp4", ".svg"}


@lru_cache(maxsize=1)
def notes_by_display() -> dict[str, list[Note]]:
    """Lowercased display name (stem for non-releases, title for releases) → [Notes]."""
    out: dict[str, list[Note]] = {}
    for n in all_notes():
        out.setdefault(n.display_name.lower(), []).append(n)
    return out


def iter_vault_md() -> Iterator[Path]:
    """Every .md file in the vault, excluding the scans/ folder itself."""
    scans_dir = VAULT / "x. META" / "scans"
    for p in VAULT.rglob("*.md"):
        try:
            p.relative_to(scans_dir)
            continue  # skip anything inside scans/
        except ValueError:
            pass
        yield p


def rel(path: Path) -> str:
    return path.relative_to(VAULT).as_posix()


# ---------------------------------------------------------------------------
# Link parsing
# ---------------------------------------------------------------------------

# [[Target]] or [[Target|alias]]. Target must not contain [ ] | newline.
# Negative lookbehind for `!` excludes image/file embeds (`![[file.png]]`).
WIKILINK_RE = re.compile(r"(?<!!)\[\[([^\[\]|\n]+?)(?:\|([^\[\]\n]+?))?\]\]")
# [display](url) -- url starts with http(s) and has no whitespace or closing paren
EXT_LINK_RE = re.compile(r"\[([^\[\]\n]+?)\]\((https?://[^\s)]+)\)")
# A wikilink OR external link combined — used for "is this position already linked?"
ANY_LINK_RE = re.compile(
    r"\[\[[^\[\]\n]+?\]\]|"
    r"\[[^\[\]\n]+?\]\(https?://[^\s)]+\)"
)


@dataclass
class Wikilink:
    target: str
    alias: str | None
    start: int
    end: int
    line: int


@dataclass
class ExtLink:
    display: str
    url: str
    start: int
    end: int
    line: int


def _line_at(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def _code_spans(text: str) -> list[tuple[int, int]]:
    """Character spans of fenced code blocks and inline code. Used to ignore
    wikilinks/external-links that appear as documentation examples (e.g. the
    literal `[[Target]]` in a scans README, or `[[Hitsville U.S.A.]]` quoted
    inside backticks in MAPmaking)."""
    spans: list[tuple[int, int]] = []
    for m in re.finditer(r"```.*?```", text, re.DOTALL):
        spans.append((m.start(), m.end()))
    for m in re.finditer(r"`[^`\n]+?`", text):
        spans.append((m.start(), m.end()))
    spans.sort()
    merged: list[tuple[int, int]] = []
    for s, e in spans:
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))
    return merged


def _in_code_span(pos: int, spans: list[tuple[int, int]]) -> bool:
    for s, e in spans:
        if s <= pos < e:
            return True
        if pos < s:
            return False
    return False


def extract_wikilinks(text: str) -> list[Wikilink]:
    spans = _code_spans(text)
    return [
        Wikilink(
            target=m.group(1).strip(),
            alias=m.group(2).strip() if m.group(2) else None,
            start=m.start(),
            end=m.end(),
            line=_line_at(text, m.start()),
        )
        for m in WIKILINK_RE.finditer(text)
        if not _in_code_span(m.start(), spans)
    ]


def extract_external_links(text: str) -> list[ExtLink]:
    spans = _code_spans(text)
    return [
        ExtLink(
            display=m.group(1),
            url=m.group(2),
            start=m.start(),
            end=m.end(),
            line=_line_at(text, m.start()),
        )
        for m in EXT_LINK_RE.finditer(text)
        if not _in_code_span(m.start(), spans)
    ]


def iter_linked_spans(text: str) -> list[tuple[int, int]]:
    """(start, end) of every wikilink and external link in the text."""
    return [(m.start(), m.end()) for m in ANY_LINK_RE.finditer(text)]


def position_is_inside_link(text: str, pos: int, spans: list[tuple[int, int]] | None = None) -> bool:
    spans = spans if spans is not None else iter_linked_spans(text)
    return any(s <= pos < e for s, e in spans)


# ---------------------------------------------------------------------------
# Frontmatter and section helpers
# ---------------------------------------------------------------------------

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)


def split_frontmatter(text: str) -> tuple[str, str]:
    """Return (frontmatter_block_or_empty, body_starting_after_frontmatter)."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return "", text
    return m.group(0), text[m.end():]


HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)


def iter_headings(text: str) -> list[tuple[int, int, str]]:
    """(line_number, level, heading_text) for every ATX heading."""
    return [
        (_line_at(text, m.start()), len(m.group(1)), m.group(2))
        for m in HEADING_RE.finditer(text)
    ]


METADATA_KEY_RE = re.compile(r"^\*\*[^*\n]+?:\*\*")
# Genre/scene/era breadcrumb opener: a single italic line like
# `_Pop | [[Soul]] → [[Pop soul]] → **Motown sound**_` or `_Rock → **Mod**_`.
# It's the metadata-equivalent first line on taxonomy notes.
BREADCRUMB_RE = re.compile(r"^_[^_\n]+_\s*$")


def metadata_end_offset(text: str) -> int:
    """Byte offset where the metadata header ends.

    Release, artist, label, studio, executive etc. notes start with a block of
    `**Key:** value` lines and sometimes a header-link line (`[RYM](...) |
    [Apple Music](...)`). Taxonomy notes (genres, scenes, eras) open with an
    italic breadcrumb line like `_Pop → **Mod**_` instead of key-value pairs.
    This block is terminated by the first empty line following a non-blank
    line (unless the next non-blank line is another header continuation) or
    the first `####` heading — whichever comes first.

    Returns 0 if the file has no metadata header (the first non-blank line is
    already prose or a heading).
    """
    lines = text.splitlines(keepends=True)
    if not lines:
        return 0
    # If the file doesn't open with metadata, no metadata block
    first_nonblank = next((ln for ln in lines if ln.strip()), "")
    if not (METADATA_KEY_RE.match(first_nonblank)
            or first_nonblank.startswith("![[")
            or BREADCRUMB_RE.match(first_nonblank.strip())):
        return 0
    # Walk forward, ending at the first blank line following a non-blank line
    offset = 0
    seen_content = False
    for i, ln in enumerate(lines):
        stripped = ln.strip()
        if stripped.startswith("####"):
            return offset
        if not stripped and seen_content:
            # Peek: the blank line may just be inside the header block (between
            # key-value lines and the header-link line). If the next nonblank
            # is ALSO metadata (key-value or a link-only line), treat as still inside.
            # Use the enumerated index so repeated blank lines don't all resolve
            # to the first blank's position via lines.index().
            next_content = _next_nonblank(lines, i + 1)
            if next_content and _is_header_continuation(next_content):
                offset += len(ln)
                continue
            return offset
        if stripped:
            seen_content = True
        offset += len(ln)
    return offset


def _next_nonblank(lines: list[str], start: int) -> str:
    for ln in lines[start:]:
        if ln.strip():
            return ln
    return ""


def _is_header_continuation(line: str) -> bool:
    """Is this line still part of the metadata header block?"""
    stripped = line.strip()
    if METADATA_KEY_RE.match(stripped):
        return True
    # Header-link line: starts with a markdown link and has separator tokens (·, |).
    # The Apple Music convenience link sometimes wraps `[text]([url](url))` which
    # breaks a strict regex, so we fall back to a looser heuristic.
    if stripped.startswith("[") and any(sep in stripped for sep in (" · ", " | ", "·", "|")):
        # And the line shouldn't start with a list bullet
        if not stripped.startswith(("- ", "* ", "+ ")):
            return True
    return False


def is_in_metadata(text: str, pos: int, _cache: dict | None = None) -> bool:
    return pos < metadata_end_offset(text)


# ---------------------------------------------------------------------------
# Finding emission
# ---------------------------------------------------------------------------

def emit(category: str, relpath: str, line: int, detail: str) -> None:
    """Print a finding. Delimiter `|` keeps parsing simple. Detail must not contain newlines."""
    detail = detail.replace("\n", " ").replace("|", "/")
    print(f"{category} | {relpath} | {line} | {detail}")


# ---------------------------------------------------------------------------
# Text slicing helpers
# ---------------------------------------------------------------------------

def line_text(text: str, line_number: int) -> str:
    lines = text.splitlines()
    return lines[line_number - 1] if 1 <= line_number <= len(lines) else ""
