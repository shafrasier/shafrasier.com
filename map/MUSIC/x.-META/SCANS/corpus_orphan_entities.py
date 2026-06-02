#!/usr/bin/env python3
"""Corpus-level orphan entity scan.

Catches entities that are named in the vault but never linked ANYWHERE — the
class of miss that note-by-note auditing structurally misses. The
`unlinked_entities.py` scan checks for entities that *have a MAP note* but
aren't linked in some particular prose context. This scan catches the inverse:
entities that have no MAP note AND no external link in any note. They slip
past entity-by-entity reading because there's nothing to compare against.

Cautionary precedent (May 21, 2026): "Aristocrat Records" was mentioned in
four notes (Chicago blues, Electric blues, Chess Records, MAPmaking) and never
externally-linked or audit-flagged. Sha caught it manually. Same with All
Platinum Records, Argo Records, Cadence Records, Factory Records, Flip
Records, Philadelphia International Records, RCA Records.

Categories emitted:

- orphan-label    — "X Records" phrase, never linked, not in audit doc
- orphan-studio   — "X Studios" / "X Studio" / "X Recording Studios" phrase
- orphan-band     — "X Brothers" / "X Sisters" / "the X Group" etc., never linked

The scan trades false-positive noise for completeness: it surfaces every
candidate that matches the pattern and isn't already accounted for, and the
human reading the output filters. Patterns are tuned to minimize obvious
junk (chart-term collisions like "Race Records", "Recording Studio" as
generic phrase, etc.).
"""

from __future__ import annotations

import re

import utils


# Path to the audit doc — phrases already in it are skipped.
AUDIT_DOC = utils.VAULT / "x. META" / "PLANS" / "External links audit.md"

# Skip these documentation files; they're full of examples and meta-references.
SKIP_FILES = {
    "x. META/Using the MAP.md",
    "x. META/About the MAP.md",
    "x. META/MAPmaking.md",
    "x. META/PLANS/External links audit.md",
    "x. META/Dream log.md",
}

# Phrases that should be skipped — they match the pattern but are sentence
# fragments, chart terms, or otherwise not entity names.
LABEL_PHRASE_SKIPS = {
    # Generic chart/category terms
    "race records", "the chess records",
    # Possessive prefix artifacts ("Greenberg's Scepter Records" already has Scepter)
    # Handled by stripping leading possessive in the matcher itself
}

STUDIO_PHRASE_SKIPS = {
    "recording studio", "recording studios", "sound studio", "sound studios",
    "studio one", "studio two", "studio three", "studio a", "studio b",
    "studio c", "studio d",
}

BAND_PHRASE_SKIPS = {
    # Generic descriptors
    "his band", "the band's", "her band",
    "blues band", "jazz band", "rock band", "rhythm band", "house band",
    "show band", "dance band", "big band",
    "the band",  # Note: "The Band" the actual band must be flagged separately —
                 # for now skip; if Sha wants it flagged she can remove this
    "the group", "the quartet", "the quintet", "the trio",
    # Numbered combos that are generic (X's "Tympany Five" is a sub-mention of Louis Jordan)
    "tympany five", "his tympany five",
}


def _load_all_linked_display_text() -> set[str]:
    """Lowercased set of every display-text that's been used inside a link
    anywhere in the corpus (wikilinks and external links)."""
    linked: set[str] = set()
    for md_path in utils.iter_vault_md():
        text = md_path.read_text(encoding="utf-8", errors="replace")
        for w in utils.extract_wikilinks(text):
            target = w.target.strip().strip("*")
            alias = (w.alias or "").strip().strip("*")
            linked.add(target.lower())
            if alias:
                linked.add(alias.lower())
        for e in utils.extract_external_links(text):
            display = e.display.strip().strip("*").strip()
            # Strip surrounding quotes / italics / bold delimiters
            display = re.sub(r"^[*\"']+|[*\"']+$", "", display)
            linked.add(display.lower())
    return linked


def _load_audit_text() -> str:
    if AUDIT_DOC.exists():
        return AUDIT_DOC.read_text(encoding="utf-8", errors="replace").lower()
    return ""


def _strip_links_from_text(text: str) -> str:
    """Remove wikilink and external-link spans so pattern-matching only sees
    unlinked prose. Keeps offsets approximately valid for line lookups by
    replacing the link span with spaces of the same length."""
    out = list(text)
    for s, e in utils.iter_linked_spans(text):
        for i in range(s, e):
            out[i] = " "
    return "".join(out)


def _is_phrase_noisy(phrase: str) -> bool:
    """Reject phrases that almost certainly aren't entity names.

    - Contains "'s " → possessive form ("Greenberg's Scepter Records")
    - Contains a period → sentence boundary collision ("Motown. The Funk Brothers")
    - Contains multiple consecutive spaces → broken-line artifact
    """
    if "'s " in phrase:
        return True
    if "." in phrase:
        return True
    if "  " in phrase:
        return True
    return False


# Tight word: one capitalized word, no embedded punctuation.
# Allow internal & for things like "M&M", and apostrophe within the word.
_WORD = r"[A-Z][A-Za-z'&]+"


def _scan_label_phrases(text: str) -> list[tuple[str, int]]:
    """Return [(phrase, char_offset)] for every "X Records" mention in unlinked prose."""
    pat = re.compile(rf"\b({_WORD}(?:\s+{_WORD}){{0,2}}\s+Records)\b")
    out: list[tuple[str, int]] = []
    for m in pat.finditer(text):
        phrase = m.group(1).strip()
        if _is_phrase_noisy(phrase):
            continue
        if phrase.lower() in LABEL_PHRASE_SKIPS:
            continue
        out.append((phrase, m.start(1)))
    return out


def _scan_studio_phrases(text: str) -> list[tuple[str, int]]:
    pat = re.compile(
        rf"\b({_WORD}(?:\s+{_WORD}){{0,2}}\s+"
        r"(?:Studios?|Recording Studios?|Sound Studios?))\b"
    )
    out: list[tuple[str, int]] = []
    for m in pat.finditer(text):
        phrase = m.group(1).strip()
        if _is_phrase_noisy(phrase):
            continue
        if phrase.lower() in STUDIO_PHRASE_SKIPS:
            continue
        out.append((phrase, m.start(1)))
    return out


def _scan_band_phrases(text: str) -> list[tuple[str, int]]:
    pat = re.compile(
        rf"\b((?:the\s+)?{_WORD}(?:\s+{_WORD}){{0,2}}\s+"
        r"(?:Brothers|Sisters|Group|Band|Five|Quartet|Quintet|Trio))\b"
    )
    out: list[tuple[str, int]] = []
    for m in pat.finditer(text):
        phrase = m.group(1).strip()
        if _is_phrase_noisy(phrase):
            continue
        if phrase.lower() in BAND_PHRASE_SKIPS:
            continue
        out.append((phrase, m.start(1)))
    return out


def _scan_release_phrases(text: str) -> list[tuple[str, int]]:
    """Italicized release titles `*Title*` (multi-word) that aren't inside links.

    Catches the Best-of-Little-Walter class of miss (May 21, 2026): an album
    title that sits adjacent to a linked artist, never gets its own link, and
    slips past entity-by-entity reading because the eye absorbs the linked
    artist and moves on. Pattern: single-asterisk italic markers around a
    multi-word title starting with a capital letter. Excludes single-word
    italics (too noisy: "the" italicized for emphasis, etc.) and any title
    containing markdown link syntax."""
    # Match `*Capital ...*` where `*` is not preceded or followed by another `*`
    # (excludes ** bold) and the content has at least one space.
    pat = re.compile(r"(?<!\*)\*([A-Z][^\n*]+?)\*(?!\*)")
    out: list[tuple[str, int]] = []
    for m in pat.finditer(text):
        title = m.group(1).strip()
        if " " not in title:
            continue
        if len(title) < 4:
            continue
        if _is_phrase_noisy(title):
            continue
        # Skip if the title contains link syntax (already inside a link
        # display, even though the outer `*…*` makes it look italicized)
        if "[" in title or "]" in title or "(" in title:
            continue
        out.append((title, m.start(1)))
    return out


def _is_already_known(phrase: str, linked: set[str], audit_lc: str) -> bool:
    """Skip if phrase is linked somewhere in vault OR named in audit doc."""
    lc = phrase.lower()
    # Direct match against linked display text
    if lc in linked:
        return True
    # Match against linked text with leading "the " stripped/added
    if lc.startswith("the "):
        if lc[4:] in linked:
            return True
    else:
        if ("the " + lc) in linked:
            return True
    # Audit doc — substring check, case-insensitive (audit_lc is lowercased)
    if lc in audit_lc:
        return True
    # Audit doc with "the" variants
    if lc.startswith("the "):
        if lc[4:] in audit_lc:
            return True
    # Long-titles-with-subtitle check: many entries in the audit doc are stored
    # with the short title only ("Twist and Shout!" rather than the full
    # "Twist and Shout! Merseybeat, the Cavern…"). Trim at the first colon or
    # em-dash and recheck.
    for sep in (":", " — ", " – "):
        if sep in phrase:
            short = phrase.split(sep, 1)[0].strip().lower()
            if short and short in audit_lc:
                return True
    return False


def _is_sources_self_reference(rel: str, phrase: str) -> bool:
    """A SOURCES note (x. SOURCES/Author - Title.md) self-mentions its own title
    in its metadata. That's a self-reference, not an orphan. Skip if the phrase
    matches the trailing 'Title' portion of the filename stem."""
    if not rel.startswith("x. SOURCES/"):
        return False
    # stem like "Adorno - On Popular Music.md" → trailing title "On Popular Music"
    stem = rel.rsplit("/", 1)[-1].rsplit(".md", 1)[0]
    if " - " not in stem:
        return False
    trailing = stem.split(" - ", 1)[1].strip()
    # Compare on the leading portion of the phrase (before colon) to handle
    # full-subtitle expansions in the source file metadata.
    short_phrase = phrase.split(":", 1)[0].strip()
    return short_phrase.lower() == trailing.lower()


def main() -> None:
    linked_text = _load_all_linked_display_text()
    audit_lc = _load_audit_text()

    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP_FILES:
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        # Only scan unlinked prose: blank out everything inside [link](url) and [[wikilink]]
        stripped = _strip_links_from_text(text)

        seen_in_file: set[str] = set()

        for phrase, off in _scan_label_phrases(stripped):
            if phrase in seen_in_file:
                continue
            if _is_already_known(phrase, linked_text, audit_lc):
                continue
            seen_in_file.add(phrase)
            line = utils._line_at(text, off)
            utils.emit(
                "orphan-label", rel, line,
                f"`{phrase}` — phrase appears but never linked vault-wide; not in audit doc"
            )

        for phrase, off in _scan_studio_phrases(stripped):
            if phrase in seen_in_file:
                continue
            if _is_already_known(phrase, linked_text, audit_lc):
                continue
            seen_in_file.add(phrase)
            line = utils._line_at(text, off)
            utils.emit(
                "orphan-studio", rel, line,
                f"`{phrase}` — phrase appears but never linked vault-wide; not in audit doc"
            )

        for phrase, off in _scan_band_phrases(stripped):
            if phrase in seen_in_file:
                continue
            if _is_already_known(phrase, linked_text, audit_lc):
                continue
            seen_in_file.add(phrase)
            line = utils._line_at(text, off)
            utils.emit(
                "orphan-band", rel, line,
                f"`{phrase}` — phrase appears but never linked vault-wide; not in audit doc"
            )

        for phrase, off in _scan_release_phrases(stripped):
            if phrase in seen_in_file:
                continue
            if _is_already_known(phrase, linked_text, audit_lc):
                continue
            if _is_sources_self_reference(rel, phrase):
                continue
            seen_in_file.add(phrase)
            line = utils._line_at(text, off)
            utils.emit(
                "orphan-release", rel, line,
                f"`*{phrase}*` — italicized title appears but never linked vault-wide; not in audit doc"
            )


if __name__ == "__main__":
    main()
