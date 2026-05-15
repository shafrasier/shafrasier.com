#!/usr/bin/env python3
"""Structural placement violations — where links should appear and how catalog
sections should be shaped.

Categories:

- struct-genre-line-unwikilinked   — genre on a release's `**Genres:**` line has a MAP note but isn't wikilinked
- struct-see-also-bare             — See also entry with no `— description` gloss (when section has >2 entries)
- struct-see-also-dup-in-prose     — See also entry already wikilinked in body prose
- struct-songwriting-team-partial  — hyphenated partnership bullet with only one partner linked

The "opening paragraph deferring first-mention links" rule is handled by the
first-mention scan in linking_target. "Reference/catalog under-linking" is
subsumed by the unlinked-entities sweep (unlinked_entities.py). We stay out
of judgment-call territory here (e.g., whether a See also annotation is
"good enough") — that's the Dream agent's job.
"""

from __future__ import annotations

import re

import utils


# --- Genre-line unwikilinked genres -------------------------------------------

GENRES_LINE_RE = re.compile(r"^\*\*Genres?:\*\*\s*(.*)$", re.MULTILINE)
# Also catch the sublabeled form:
#   **Genres:**
#   - **Primary**: [[Girl group]], [[Brill Building]]
#   - **Secondary**: [[Pop soul]], soul jazz, ...
GENRE_SUBLINE_RE = re.compile(r"^\s*[-*+]\s+\*\*(?:Primary|Secondary|Tertiary)\*\*:?\s*(.*)$",
                              re.MULTILINE)


def _strip_link_spans(segment: str) -> str:
    """Remove the CONTENTS of wikilinks and external links — leaves behind a bare
    comma-separated list of raw genre names for the still-bare positions."""
    # Replace `[[X]]` with sentinel
    out = re.sub(r"\[\[[^\[\]\n]+?\]\]", "__LINKED__", segment)
    out = re.sub(r"\[[^\[\]\n]+?\]\(https?://[^\s)]+\)", "__LINKED__", out)
    return out


def check_genre_line(text: str, rel: str) -> None:
    """Every genre on a release note's genre line that has a MAP note must be wikilinked."""
    genre_stems = {n.stem.lower(): n for n in utils.all_notes() if n.entity_type == "genre"}
    # Find the genre block: either a single `**Genres:** ...` line or a multi-line version
    lines = text.splitlines()
    for i, line in enumerate(lines, 1):
        # Single-line form: `**Genres:** Girl group, Brill Building, pop soul`
        m = GENRES_LINE_RE.match(line)
        if m:
            content = m.group(1)
            _flag_unlinked_genres(content, i, rel, genre_stems)
        # Sublabeled form (Primary/Secondary bullets)
        m2 = GENRE_SUBLINE_RE.match(line)
        if m2:
            content = m2.group(1)
            _flag_unlinked_genres(content, i, rel, genre_stems)


def _flag_unlinked_genres(segment: str, line: int, rel: str,
                          genre_stems: dict[str, utils.Note]) -> None:
    stripped = _strip_link_spans(segment)
    # Split on commas (after stripping link spans) → candidate bare-genre tokens
    for token in stripped.split(","):
        raw = token.strip().strip(".").strip()
        if not raw or raw == "__LINKED__" or raw.startswith("__LINKED__"):
            continue
        # Normalize: this is a "plain text" genre token
        candidate_key = raw.lower().strip("*").strip()
        if candidate_key in genre_stems:
            utils.emit(
                "struct-genre-line-unwikilinked",
                rel, line,
                f"`{raw}` on genre line — MAP note exists: `[[{genre_stems[candidate_key].stem}]]`"
            )


# --- See also formatting ------------------------------------------------------

SEE_ALSO_HEADING_RE = re.compile(r"^#{3,4}\s+\*?\*?See\s+also\*?\*?\s*$",
                                 re.IGNORECASE | re.MULTILINE)


def _see_also_slice(text: str) -> tuple[int, int] | None:
    """Return (start_offset, end_offset) of the See also section body, if present."""
    m = SEE_ALSO_HEADING_RE.search(text)
    if not m:
        return None
    # Body starts after the heading line
    body_start = text.find("\n", m.end()) + 1
    # Body ends at the next `####` heading or EOF
    next_h = re.search(r"^#{3,4}\s+", text[body_start:], re.MULTILINE)
    body_end = body_start + next_h.start() if next_h else len(text)
    return body_start, body_end


def check_see_also_format(text: str, rel: str) -> None:
    slc = _see_also_slice(text)
    if not slc:
        return
    body_start, body_end = slc
    body = text[body_start:body_end]
    lines_in_body = []  # (line_number_in_file, content)
    pre_lines = text[:body_start].count("\n")
    for idx, ln in enumerate(body.splitlines()):
        if ln.strip().startswith(("- ", "* ", "+ ")):
            lines_in_body.append((pre_lines + idx + 1, ln))
    entries = lines_in_body
    if len(entries) <= 2:
        return  # small sections don't need annotations
    for line_num, ln in entries:
        # Strip the bullet marker
        body_text = ln.lstrip()
        body_text = re.sub(r"^[-*+]\s+", "", body_text)
        # Must contain an em-dash or `—` followed by some prose
        if "—" not in body_text and " - " not in body_text:
            utils.emit(
                "struct-see-also-bare",
                rel, line_num,
                f"See also entry lacks `— description`: `{body_text[:60]}`"
            )


def _is_annotated_see_also_entry(ln: str) -> bool:
    """True if this See also bullet has a substantive annotation beyond the link.

    A bare bullet — `- [[Target]]` or `- [display](url)` with nothing else —
    is a true duplicate when the target is already in prose. An annotated
    bullet — `- [[Target]] — description` or `- The [[Target]] system, where X`
    — is intentional cross-referencing and shouldn't be flagged as duplicate.

    Heuristic: strip the bullet marker and every wikilink/external link from
    the line, then strip trivial punctuation/whitespace. If any meaningful
    text remains, the entry is annotated.
    """
    content = ln.strip().lstrip("-*+ ").strip()
    cleaned = utils.WIKILINK_RE.sub("", content)
    cleaned = utils.EXT_LINK_RE.sub("", cleaned)
    # Strip trivial residue: whitespace, punctuation, possessive 's, and joiners like "and"
    cleaned = re.sub(r"[\s\.,;:'\"`\-]+", " ", cleaned).strip()
    # A few empty-equivalent tokens after link stripping
    TRIVIAL = {"", "s", "and", "or", "the"}
    if cleaned.lower() in TRIVIAL:
        return False
    # Any non-trivial leftover text marks it as annotated
    return len(cleaned) > 2


def check_see_also_dup_in_prose(text: str, rel: str) -> None:
    """See also entry that's already wikilinked in the body prose above.

    Skips entries with a substantive annotation — the MAP convention allows
    a See also cross-reference even when the entity is linked in prose, so
    long as the bullet carries argumentative work in its annotation.
    """
    slc = _see_also_slice(text)
    if not slc:
        return
    body_start, body_end = slc
    prose_text = text[:body_start]  # everything before See also
    # Wikilink targets in the prose
    prose_targets: set[str] = set()
    for wl in utils.extract_wikilinks(prose_text):
        target = wl.target.rsplit("/", 1)[-1].split("#", 1)[0]
        if any(target.lower().endswith(ext) for ext in utils.ASSET_EXTS):
            continue
        prose_targets.add(target)

    # External URLs in the prose
    prose_urls: set[str] = set()
    for el in utils.extract_external_links(prose_text):
        prose_urls.add(el.url.rstrip("/.,;:)"))

    # Walk See also entries
    body = text[body_start:body_end]
    pre_lines = text[:body_start].count("\n")
    for idx, ln in enumerate(body.splitlines()):
        if not ln.strip().startswith(("- ", "* ", "+ ")):
            continue
        # Skip annotated entries — their value is the annotation, not the link
        if _is_annotated_see_also_entry(ln):
            continue
        line_num = pre_lines + idx + 1
        # Extract wikilinks / external links in this entry
        for wl_m in utils.WIKILINK_RE.finditer(ln):
            target = wl_m.group(1).rsplit("/", 1)[-1].split("#", 1)[0].strip()
            if target in prose_targets:
                utils.emit(
                    "struct-see-also-dup-in-prose",
                    rel, line_num,
                    f"See also `[[{target}]]` already wikilinked in body prose"
                )
        for el_m in utils.EXT_LINK_RE.finditer(ln):
            url = el_m.group(2).rstrip("/.,;:)")
            if url in prose_urls:
                utils.emit(
                    "struct-see-also-dup-in-prose",
                    rel, line_num,
                    f"See also external link {url[:50]} already in body prose"
                )


# --- Songwriting team partnership bullets -------------------------------------

# Common two- and three-member team patterns
TEAM_PATTERNS = [
    # Two-member: `- [Person-A](url) and Person-B —` or `- [[A]] and B —`
    # The hyphenated team-name itself often appears as a label.
    (re.compile(r"[-*+]\s+(?:\[\[([^\[\]|\n]+?)(?:\|[^\[\]\n]+?)?\]\]|"
                r"\[([^\[\]\n]+?)\]\(https?://[^\s)]+\))"
                r"\s+and\s+([A-Z][A-Za-z.'\- ]+?)(?=\s+—|\s+-\s|,|$)"),
     "team-leading-linked"),
]


def check_songwriting_team_bullets(text: str, rel: str) -> None:
    """Simple partnership pattern: `- [Linked] and PlainName —` implies the second partner
    is likely also a MAP-linkable songwriter."""
    # Build a set of likely partner names from SONGWRITERS, PRODUCERS, SESSION MUSICIANS
    songwriter_names = {n.display_name for n in utils.all_notes()
                        if n.entity_type in ("songwriter", "producer", "session_musician",
                                              "artist_top")}
    # Walk lines
    for i, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        if not stripped.startswith(("- ", "* ", "+ ")):
            continue
        # Does the line have "and" connecting a linked first and a bare second?
        m = re.search(
            r"(?:\[\[([^\[\]|\n]+?)(?:\|([^\[\]\n]+?))?\]\]|"
            r"\[([^\[\]\n]+?)\]\(https?://[^\s)]+\))"
            r"\s+(?:and|&)\s+"
            r"([A-Z][A-Za-z.\-'\u2019 ]{2,40}?)"
            r"(?=\s+—|\s+-\s|,|$)",
            stripped,
        )
        if not m:
            continue
        second = m.group(4).strip()
        # If the second name isn't likely a linkable entity, skip
        if second in songwriter_names:
            utils.emit(
                "struct-songwriting-team-partial",
                rel, i,
                f"partnership bullet: `{second}` is bare (MAP note exists)"
            )


# --- Main ---------------------------------------------------------------------

def main() -> None:
    SKIP = {"x. META/Using the MAP.md", "x. META/About the MAP.md",
            "x. META/MAPmaking.md", "x. META/PLANS/External links audit.md"}
    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP:
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        # Only run genre-line check on release notes
        if rel.startswith("RELEASES/"):
            check_genre_line(text, rel)
        check_see_also_format(text, rel)
        check_see_also_dup_in_prose(text, rel)
        check_songwriting_team_bullets(text, rel)


if __name__ == "__main__":
    main()
