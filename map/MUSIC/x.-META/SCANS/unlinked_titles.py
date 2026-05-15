#!/usr/bin/env python3
"""Italic-album-title and quoted-song-title patterns in prose that aren't
wrapped in a markdown link, when no link to the same title exists elsewhere
in the note.

Categories:

- title-album-unlinked  — `*Album*` (italic) in prose with no `[*Album*](url)`
                          or `[[Album]]` form anywhere else in the file
- title-song-unlinked   — `"Song"` (quoted) in prose with no `["Song"](url)`
                          or `[[(YEAR) "Song"]]` form anywhere else

This catches the failure mode where a note names an album or song in prose
but the named work doesn't have a MAP note AND wasn't externally linked —
the case Sha found in the Smile Sessions note (Lauryn Hill's *Miseducation*,
Prince's *Black Album*) and in the (1953) "Gee" note (*Brian Wilson Presents
Smile*).

Conservative exclusions (skip these patterns):
- Inside metadata block (top of file)
- Inside wikilinks `[[...]]` (and `![[...]]` embeds)
- Inside markdown link display text `[*Album*](url)` or `["Song"](url)`
- Inside code fences ``` ... ```
- Inside genre-tree lines (`_Pop → ..._`)
- Bold-italic-wikilink wrappers `***[[(YEAR) Album|Album]]***` count as linked
- The note's own subject (e.g., (1958) "Johnny B. Goode" referenced inside the
  Johnny B. Goode note's own prose — that's self-reference and per convention
  release notes don't externally link their own subject in body prose)
- If the same `*Title*` or `"Title"` appears linked elsewhere in the same file,
  treat the unlinked instance as a subsequent mention (correctly plain)
- Quoted content that contains markdown / wikilink syntax (`[[` or `[`) — those
  are misparsed wrappers around already-linked content
- Quoted content that looks like dialogue (ends with sentence punctuation,
  contains a sentence-style comma followed by lowercase, or runs longer than
  ~50 chars and contains a verb-like middle structure)
- Quoted content that's clearly an abbreviation (single-letter-period like
  "Mark I.")

The scan is conservative: false negatives are preferred over false positives.
"""

from __future__ import annotations

import re
from pathlib import Path

import utils


ITALIC_TITLE = re.compile(
    r"(?<!\*)\*(?!\*)([^*\n]{2,80}?)(?<!\*)\*(?!\*)"
)

QUOTED_TITLE = re.compile(r'(?<![\w/])"([^"\n]{2,80}?)"(?![\w])')

MD_LINK = re.compile(r"\[([^\[\]\n]*?)\]\([^()\n]*?\)")

WIKILINK = re.compile(r"!?\[\[([^\[\]\n]+?)\]\]")

GENRE_TREE_LINE = re.compile(r"^_[^_\n]*→[^_\n]*_\s*$")

# Filename stems that indicate a release note (the note's own subject is
# the title in the filename).
RELEASE_FILENAME = re.compile(r"^\((\d{4})\)\s+(.+)$")


def metadata_end_offset(text: str) -> int:
    lines = text.split("\n")
    pos = 0
    asset_ext = (".png]]", ".jpg]]", ".jpeg]]", ".gif]]", ".webp]]")
    for line in lines:
        s = line.strip()
        is_md = False
        if not s:
            is_md = True
        elif s.startswith("![[") and any(s.endswith(e) for e in asset_ext):
            is_md = True
        elif s.startswith("**") and ":**" in s:
            is_md = True
        elif s.startswith("- **") and ":**" in s:
            is_md = True
        elif s.startswith("_") and "→" in s and s.endswith("_"):
            is_md = True
        elif ("[RYM]" in s or "[Apple Music]" in s or "[Wikipedia]" in s) and (
            "rateyourmusic" in s or "music.apple.com" in s or "wikipedia.org" in s
        ):
            is_md = True
        elif s.startswith("**Playlist:") or (s.startswith("**[") and "Playlist" in s):
            is_md = True

        if is_md:
            pos += len(line) + 1
        else:
            break
    return pos


def find_code_fence_ranges(text: str) -> list[tuple[int, int]]:
    ranges = []
    in_fence = False
    start = 0
    pos = 0
    for line in text.split("\n"):
        if line.strip().startswith("```"):
            if not in_fence:
                start = pos
                in_fence = True
            else:
                ranges.append((start, pos + len(line) + 1))
                in_fence = False
        pos += len(line) + 1
    return ranges


def find_link_display_ranges(text: str) -> list[tuple[int, int]]:
    ranges = []
    for m in MD_LINK.finditer(text):
        ranges.append((m.start(), m.end()))
    for m in WIKILINK.finditer(text):
        ranges.append((m.start(), m.end()))
    return ranges


def in_range(offset: int, ranges: list[tuple[int, int]]) -> bool:
    return any(start <= offset < end for start, end in ranges)


def find_linked_titles_in_text(text: str) -> set[str]:
    linked: set[str] = set()
    for m in MD_LINK.finditer(text):
        display = m.group(1)
        for tm in re.finditer(r"\*([^*]+?)\*", display):
            linked.add(tm.group(1).strip().lower())
        for tm in re.finditer(r'"([^"]+?)"', display):
            linked.add(tm.group(1).strip().lower())
    for m in WIKILINK.finditer(text):
        inner = m.group(1)
        if "|" in inner:
            target, alias = inner.split("|", 1)
        else:
            target = inner
            alias = inner
        alias_clean = alias.rsplit("/", 1)[-1].strip()
        target_clean = target.rsplit("/", 1)[-1].strip()
        for s in (alias_clean, target_clean):
            release_match = re.match(r"^\((\d{4})\)\s+(.+)$", s)
            if release_match:
                title = release_match.group(2)
                title = title.strip('"')
                linked.add(title.lower())
            else:
                s_strip = s.strip('"').strip("*").strip()
                if s_strip:
                    linked.add(s_strip.lower())
    return linked


def own_subject_titles(md_path: Path) -> set[str]:
    """For release notes named `(YEAR) Title.md`, return the lowercased title
    (and a quote-stripped variant) so we can skip self-references in body prose.
    """
    stem = md_path.stem
    titles: set[str] = set()
    m = RELEASE_FILENAME.match(stem)
    if m:
        title = m.group(2).strip()
        titles.add(title.lower())
        titles.add(title.strip('"').lower())
        # For multi-title singles like `(1967) "Strawberry Fields Forever", "Penny Lane"`,
        # also break out each quoted segment as its own subject title.
        for q in re.findall(r'"([^"]+)"', title):
            titles.add(q.lower())
    else:
        # Non-release note — use the stem as a single subject title
        titles.add(stem.lower())
    return titles


def looks_like_dialogue(inner: str) -> bool:
    """Heuristic: quoted content that's clearly a sentence/dialogue, not a title."""
    s = inner.strip()
    if not s:
        return True
    # Ends with sentence-final punctuation
    if s[-1] in ".!?":
        # Allow single-period abbreviations like "I.", "Mr.", "Vol. 2"
        # by checking if there are multiple sentence-ending periods or if
        # the content has spaces before the period (real sentence)
        if s.count(".") + s.count("!") + s.count("?") >= 2:
            return True
        # If the final period follows a lowercase letter and there's a space before
        # the last "word", treat as sentence
        if len(s) > 4 and s[-2].islower() and " " in s[:-1]:
            return True
    # Trailing comma (often dialogue continuation: `"they said," he replied`)
    if s.endswith(","):
        return True
    # Sentence-style comma followed by lowercase word: `"X, but Y"`
    if re.search(r",\s+[a-z]", s):
        return True
    # Multi-word AND starts lowercase (lowercased first word strongly suggests
    # mid-sentence dialogue continuation)
    if " " in s and s[0].islower():
        return True
    # Very long quotes (50+ chars with no internal structure) — likely dialogue
    if len(s) > 50 and not any(c.isupper() for c in s[5:]):
        # All-lowercase after the first few chars → dialogue
        return True
    return False


def looks_like_album_emphasis(inner: str) -> bool:
    """Heuristic: italic content that's clearly emphasis, not an album title."""
    s = inner.strip()
    if not s:
        return True
    # Single common emphasis words
    if " " not in s and s.lower() in {
        "the", "a", "and", "or", "but", "not", "is", "was", "be", "in",
        "on", "of", "to", "for", "with", "by", "as", "at", "this", "that",
    }:
        return True
    # Italicized phrase that looks like a foreign phrase or sic-style emphasis
    # (e.g., starts and ends with same-letter delimiters, like *sic*).
    return False


def has_bracket_syntax(inner: str) -> bool:
    """True if the quoted/italic content contains markdown/wikilink syntax,
    indicating the scan caught a wrapper around an already-linked entity."""
    return "[[" in inner or "[" in inner or "]]" in inner or "](" in inner


def main() -> None:
    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        text = md_path.read_text(encoding="utf-8", errors="replace")

        md_end = metadata_end_offset(text)
        code_ranges = find_code_fence_ranges(text)
        link_ranges = find_link_display_ranges(text)
        linked_titles = find_linked_titles_in_text(text)
        own_titles = own_subject_titles(md_path)

        seen_album: set[str] = set()
        seen_song: set[str] = set()

        # Italic albums
        for m in ITALIC_TITLE.finditer(text):
            if m.start() < md_end:
                continue
            if in_range(m.start(), code_ranges) or in_range(m.start(), link_ranges):
                continue
            inner = m.group(1).strip()
            if not inner or len(inner) < 2:
                continue
            if has_bracket_syntax(inner):
                continue
            if looks_like_album_emphasis(inner):
                continue
            line_start = text.rfind("\n", 0, m.start()) + 1
            line_end = text.find("\n", m.start())
            if line_end < 0:
                line_end = len(text)
            line = text[line_start:line_end]
            if GENRE_TREE_LINE.match(line):
                continue
            if inner.lower() in own_titles:
                continue
            # Skip if the candidate is a substring of any own-subject title
            # (e.g., "Reach Out" within "Reach Out, I'll Be There" note)
            if any(inner.lower() in ot for ot in own_titles):
                continue
            if inner.lower() in linked_titles:
                continue
            if inner.lower() in seen_album:
                continue
            seen_album.add(inner.lower())
            line_num = text[: m.start()].count("\n") + 1
            utils.emit(
                "title-album-unlinked",
                rel, line_num,
                f"*{inner}* (italic, no link, not linked elsewhere in note)",
            )

        # Quoted songs
        for m in QUOTED_TITLE.finditer(text):
            if m.start() < md_end:
                continue
            if in_range(m.start(), code_ranges) or in_range(m.start(), link_ranges):
                continue
            inner = m.group(1).strip()
            if not inner or len(inner) < 2:
                continue
            if has_bracket_syntax(inner):
                continue
            if looks_like_dialogue(inner):
                continue
            if inner[0].islower():
                continue
            if inner.lower() in own_titles:
                continue
            if inner.lower() in linked_titles:
                continue
            if inner.lower() in seen_song:
                continue
            seen_song.add(inner.lower())
            line_num = text[: m.start()].count("\n") + 1
            utils.emit(
                "title-song-unlinked",
                rel, line_num,
                f'"{inner}" (quoted, no link, not linked elsewhere in note)',
            )


if __name__ == "__main__":
    main()
