#!/usr/bin/env python3
"""Linking form violations — italic/quote/suffix conventions.

Categories:

- form-album-missing-italics     — `[[(YEAR) Title|alias]]` in prose not wrapped in `*...*`
- form-song-missing-quotes       — single/track wikilink without quotes in display text
- form-extsong-missing-quotes    — `[text](apple-music-url)` without quotes around song title
- form-extalbum-missing-italics  — `[text](rym-album-url)` without `*...*` around album title
- form-ext-possessive-outside    — `[Name](url)'s` instead of `[Name's](url)`
- form-ext-year-inside           — `[Title (1966)](url)` instead of `[Title](url) (1966)`
- form-genre-tree-asterisks      — genre tree line uses `***` delimiters instead of `_..._`

RYM `/credits/` suffix checking is NOT done here — the context-sniff is too
unreliable to mechanize without significant false-positive noise. The Dream
agent handles that judgment call.

Metadata-header link labels (`Apple Music`, `RYM`, `recording`, `cover`,
`Wikipedia`, etc.) are generic and skipped by the song/album formatting
checks. Only display text that reads as a title reference is audited.
"""

from __future__ import annotations

import re

import utils


# Generic header-label display texts that are NOT content references — skip them
# for song-quotes / album-italics checks. These appear in metadata blocks at the
# top of release notes as convenience links to Apple Music / RYM / Wikipedia.
GENERIC_LINK_LABELS = {
    "apple music", "rym", "rateyourmusic", "wikipedia", "wiki",
    "bandcamp", "spotify", "youtube", "soundcloud", "discogs",
    "recording", "the recording", "a recording", "recordings",
    "cover", "the cover", "covers", "version", "the version",
    "studio", "album", "single", "track", "performance",
    "source", "article", "interview", "obituary", "essay", "review",
    "here", "link", "this page", "reissue", "release",
}


# Indicator words that appear in descriptive link-text but not in song/album titles
DESCRIPTIVE_INDICATORS = {
    "recorded", "covered", "sanitized", "version", "versions", "cover", "covers",
    "electrified", "reissue", "reissued", "single", "single release", "released",
    "released version", "original", "original version", "demo", "acoustic", "live",
    "live version", "studio version", "early version", "self-titled", "debut",
    "self-titled debut", "eponymous", "recording", "recordings", "footage", "clip",
    "solo debut", "solo album",
}


def _is_descriptive_display(display: str) -> bool:
    """True if display text reads as prose/description, not a title reference."""
    s = display.strip().strip("*").strip()
    if not s:
        return True
    s_lower = s.lower()
    # Starts with lowercase letter → probably descriptive prose
    if s[0].islower():
        return True
    # Contains an obvious descriptive verb/noun
    for word in DESCRIPTIVE_INDICATORS:
        if re.search(rf"\b{re.escape(word)}\b", s_lower):
            return True
    # Long phrases (>7 words) are almost never bare titles
    if len(s.split()) > 7:
        return True
    return False


def _find_album_title_from_wikilink(target: str) -> str | None:
    """`(1966) Pet Sounds` → `Pet Sounds`; `MUSIC/RELEASES/ALBUMS/(1964) A Hard Day's Night` → `A Hard Day's Night`."""
    target = target.rsplit("/", 1)[-1]
    m = re.match(r"^\(\d{4}\)\s+(.+)$", target)
    if not m:
        return None
    return m.group(1)


def check_wikilink_form(text: str, relpath: str) -> None:
    """Album-italics and song-quotes checks on wikilinks in prose."""
    # Fenced-code awareness: skip wikilinks inside ```...```
    code_spans = []
    for m in re.finditer(r"```.*?```", text, re.DOTALL):
        code_spans.append((m.start(), m.end()))
    in_code = lambda pos: any(s <= pos < e for s, e in code_spans)

    albums = {n.stem for n in utils.all_notes() if n.entity_type == "album"}
    singles_tracks = {n.stem for n in utils.all_notes()
                      if n.entity_type in ("single", "track")}

    for wl in utils.extract_wikilinks(text):
        if in_code(wl.start):
            continue
        # If the wikilink has an explicit non-album path prefix, the target
        # isn't the album — it's a cross-folder note that happens to share
        # a year-prefixed title. Skip.
        if "/" in wl.target:
            head = wl.target.rsplit("/", 1)[0]
            if not (head.endswith("RELEASES/ALBUMS") or head.endswith("RELEASES/SINGLES")
                    or head.endswith("RELEASES/TRACKS") or head.startswith("MUSIC/RELEASES/")):
                continue
        target = wl.target.rsplit("/", 1)[-1]
        if "#" in target:
            target = target.split("#", 1)[0]
        # ALBUM — check for surrounding italics
        if target in albums:
            # Is it already wrapped in single asterisks? Look at immediate context.
            before = text[max(0, wl.start - 1):wl.start]
            after = text[wl.end:wl.end + 1]
            if before == "*" and after == "*":
                continue  # wrapped ok
            # False positives: inside a list bullet `- [[...]]` is fine as long as
            # the catalog context allows bare `[[(YEAR) Title]]`. But convention
            # says album wikilinks in PROSE need italics. To stay conservative,
            # only flag when the wikilink has an alias (implying prose use):
            # `[[(1966) Pet Sounds|Pet Sounds]]` in catalog lists DOES get flagged
            # if it's in a prose sentence. A blunt heuristic: flag only if
            # the wikilink has an alias AND is not preceded by `- ` or `**` on the
            # same line (to skip bullet entries).
            line_start = text.rfind("\n", 0, wl.start) + 1
            preceding = text[line_start:wl.start]
            is_bullet = preceding.lstrip().startswith(("- ", "* ", "+ "))
            if wl.alias and not is_bullet:
                utils.emit(
                    "form-album-missing-italics",
                    relpath, wl.line,
                    f"[[{wl.target}|{wl.alias}]] needs `*...*` italic wrapping"
                )

        # SINGLE / TRACK — check for quotes inside display text
        if target in singles_tracks:
            # In catalog/bullet contexts, the bare `[[(YEAR) "Title"]]` form is
            # correct (analogous to the bare album-link convention). Skip bullets.
            line_start = text.rfind("\n", 0, wl.start) + 1
            preceding = text[line_start:wl.start]
            is_bullet = preceding.lstrip().startswith(("- ", "* ", "+ "))
            if is_bullet and not wl.alias:
                continue  # bare song link in catalog bullet is fine
            # Otherwise: if there's an alias, it must contain quotes around the title
            # (the bare target already has quotes since the filename does).
            if wl.alias:
                if not re.match(r'^["\u201C].*["\u201D]$', wl.alias):
                    utils.emit(
                        "form-song-missing-quotes",
                        relpath, wl.line,
                        f"[[{wl.target}|{wl.alias}]] — alias needs quotes around song title"
                    )


def check_external_link_form(text: str, relpath: str) -> None:
    """Check external-link display-text conventions."""
    code_spans = [(m.start(), m.end()) for m in re.finditer(r"```.*?```", text, re.DOTALL)]
    in_code = lambda pos: any(s <= pos < e for s, e in code_spans)

    for el in utils.extract_external_links(text):
        if in_code(el.start):
            continue
        url = el.url
        display = el.display
        # Context window: 3 chars after the closing paren
        after = text[el.end:el.end + 3]

        # Possessive outside: `[Name](url)'s` or `[Name](url)s'`
        if after.startswith("'s") or after.startswith("\u2019s"):
            utils.emit(
                "form-ext-possessive-outside",
                relpath, el.line,
                f"[{display}]({url[:40]}...) — possessive `'s` should be inside the link"
            )
        # Year INSIDE the link (should be outside)
        if re.search(r"\s\(\d{4}\)\s*$", display):
            utils.emit(
                "form-ext-year-inside",
                relpath, el.line,
                f"[{display}]({url[:40]}...) — `(YEAR)` should be outside the link"
            )

        display_lower = display.strip().strip("*").lower()
        is_generic_label = display_lower in GENERIC_LINK_LABELS

        # "Descriptive" link-text: verbs / prepositions / clause fragments that
        # don't warrant title-style formatting. If the display text is
        # clearly not a bare title reference, skip formatting checks.
        is_descriptive = _is_descriptive_display(display)

        # Apple Music song URL — display should have quotes around song title
        if ("music.apple.com" in url and "?i=" in url
                and not is_generic_label and not is_descriptive):
            core = display.strip().strip("*").strip()
            if not re.match(r'^["\u201C].*["\u201D]$', core):
                utils.emit(
                    "form-extsong-missing-quotes",
                    relpath, el.line,
                    f"[{display}]({url[:40]}...) — song display text needs quotes"
                )

        # RYM album URL — display should be italicized
        if ("rateyourmusic.com/release/album/" in url
                and not is_generic_label and not is_descriptive):
            core = display.strip()
            if not (core.startswith("*") and core.endswith("*")):
                utils.emit(
                    "form-extalbum-missing-italics",
                    relpath, el.line,
                    f"[{display}]({url[:40]}...) — album display text needs `*...*`"
                )


def check_genre_tree(text: str, relpath: str) -> None:
    """Genre-tree formatting: underscores for outer italic, not asterisks."""
    # Look for a line that contains `→` and is italicized with triple asterisks
    # at start and end, which is the asterisk-formatted genre tree.
    for i, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        if "→" not in stripped:
            continue
        # Asterisk-wrapped: `***R&B → **Soul**...***` or similar
        # The failure pattern is a line that BEGINS with `***` or contains `***`
        # immediately adjacent to non-whitespace (which causes Obsidian ambiguity).
        if "***" in stripped:
            utils.emit(
                "form-genre-tree-asterisks",
                relpath, i,
                "genre tree uses `***` delimiters — must be `_..._` with bold for current note"
            )


def main() -> None:
    SKIP = {"x. META/Using the MAP.md", "x. META/About the MAP.md",
            "x. META/MAPmaking.md"}
    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP:
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        check_wikilink_form(text, rel)
        check_external_link_form(text, rel)
        check_genre_tree(text, rel)


if __name__ == "__main__":
    main()
