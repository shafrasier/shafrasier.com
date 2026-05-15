#!/usr/bin/env python3
"""Audit-doc sync violations.

Categories:

- audit-entry-now-has-note      — `PLANS/External links audit.md` entry for an entity
                                   that now has its own MAP note (should be removed)
- mapmaking-tocreate-now-has-note — `MAPmaking.md` "To create" entry for an entity that
                                     now exists as a MAP note (should be marked done)

Detection strategy:

Both audit docs use table rows or bulleted lists that reference entities by
name. Exact entity matching uses case-insensitive stem match. We prefer false
negatives — the scan is conservative; the Dream agent verifies ambiguous hits.
"""

from __future__ import annotations

import re

import utils


AUDIT_DOC = "x. META/PLANS/External links audit.md"
MAPMAKING_DOC = "x. META/MAPmaking.md"


def check_external_links_audit() -> None:
    """Find entries in External links audit that match existing MAP notes."""
    p = utils.VAULT / AUDIT_DOC
    if not p.exists():
        return
    text = p.read_text(encoding="utf-8", errors="replace")
    # Index: note display_name (lowercase) → Note
    # Use display_name for releases (strips (YYYY) and quotes), stem for others.
    notes_by_key: dict[str, utils.Note] = {}
    for n in utils.all_notes():
        key = n.display_name.lower()
        notes_by_key.setdefault(key, n)
        # Also index by stem for non-release lookups
        notes_by_key.setdefault(n.stem.lower(), n)

    # Walk table rows / bullet lines and look for entity names in the first column
    for i, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        # Table rows start with `|`
        if stripped.startswith("|") and "|" in stripped[1:]:
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            if not cells:
                continue
            first = cells[0]
            # Skip separators and headers
            if re.match(r"^[-:\s]+$", first) or first.lower() in ("entity", "name", "artist",
                                                                    "album", "single", "song",
                                                                    "track", "studio", "label"):
                continue
            # Strip bracket/italic wrapping
            candidate = re.sub(r"[\*\[\]_`]", "", first).strip()
            candidate_key = candidate.lower()
            if candidate_key in notes_by_key:
                n = notes_by_key[candidate_key]
                utils.emit(
                    "audit-entry-now-has-note",
                    AUDIT_DOC, i,
                    f"`{candidate}` → MAP note exists: `{n.stem}` ({n.entity_type}) — remove from audit"
                )
        # Bulleted lines
        elif stripped.startswith(("- ", "* ", "+ ")):
            body = stripped[2:].strip()
            # Extract leading entity name (before any em-dash, colon, or url)
            m = re.match(r"^([^—\-:\(]+?)(?:\s+[—:]|$)", body)
            if not m:
                continue
            candidate = re.sub(r"[\*\[\]_`]", "", m.group(1)).strip()
            candidate_key = candidate.lower()
            if candidate_key in notes_by_key and len(candidate_key) > 3:
                n = notes_by_key[candidate_key]
                utils.emit(
                    "audit-entry-now-has-note",
                    AUDIT_DOC, i,
                    f"`{candidate}` → MAP note exists: `{n.stem}` — remove from audit"
                )


def check_mapmaking_tocreate() -> None:
    """Find `#### **To create**` entries that now have MAP notes."""
    p = utils.VAULT / MAPMAKING_DOC
    if not p.exists():
        return
    text = p.read_text(encoding="utf-8", errors="replace")
    # Index entities by display_name and stem
    notes_by_key: dict[str, utils.Note] = {}
    for n in utils.all_notes():
        notes_by_key.setdefault(n.display_name.lower(), n)
        notes_by_key.setdefault(n.stem.lower(), n)

    # Find the "To create" section and walk its bullets
    m = re.search(r"^#{3,4}\s+\*?\*?To create\*?\*?\s*$",
                  text, re.IGNORECASE | re.MULTILINE)
    if not m:
        return
    section_start = text.find("\n", m.end()) + 1
    # Section ends at the next heading of equal or higher level
    next_h = re.search(r"^#{1,4}\s+", text[section_start:], re.MULTILINE)
    section_end = section_start + next_h.start() if next_h else len(text)
    body = text[section_start:section_end]
    pre_lines = text[:section_start].count("\n")
    for idx, ln in enumerate(body.splitlines()):
        stripped = ln.strip()
        if not stripped.startswith(("- ", "* ", "+ ")):
            continue
        # Skip already-completed items
        if "[x]" in stripped or "[~]" in stripped:
            continue
        body_text = stripped[2:].strip()
        # Strip checkbox `[ ]`
        body_text = re.sub(r"^\[\s*\]\s*", "", body_text)
        # Extract leading entity name (before em-dash, colon, or paren)
        m2 = re.match(r"^([^—\-:\(]+?)(?:\s+[—:\(]|$)", body_text)
        if not m2:
            continue
        candidate = re.sub(r"[\*\[\]_`]", "", m2.group(1)).strip()
        candidate_key = candidate.lower()
        if candidate_key in notes_by_key and len(candidate_key) > 3:
            n = notes_by_key[candidate_key]
            line_num = pre_lines + idx + 1
            utils.emit(
                "mapmaking-tocreate-now-has-note",
                MAPMAKING_DOC, line_num,
                f"`{candidate}` → MAP note exists: `{n.stem}` — mark [x] or remove"
            )


def main() -> None:
    check_external_links_audit()
    check_mapmaking_tocreate()


if __name__ == "__main__":
    main()
