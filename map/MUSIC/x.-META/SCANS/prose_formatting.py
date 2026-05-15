#!/usr/bin/env python3
"""Prose-formatting violations.

Categories:

- prose-heading-trailing-colon   — `#### **Musical context:**` ending in `:` / `:**`
- prose-heading-blank-after      — blank line between a `####` heading and its body paragraph
- prose-keyartists-bullet-format — Key artists / Key figures / Key engineers bullet not in
                                    `- **Name** — description` form
- prose-genre-rogue-hyphen       — "folk-rock", "blues-rock", etc. (RYM orthography is unhyphenated)

Known hyphenated genre exceptions (DO have hyphens in RYM):
  singer-songwriter, doo-wop, post-punk, post-rock, post-bop, euro-disco,
  italo-disco, electro-disco, alt-country, blue-eyed soul
Common unhyphenated genres we see violations of:
  folk rock, blues rock, jazz rock, country rock, big band, jump blues,
  rhythm & blues, hard rock, art rock, progressive rock, trip hop,
  new wave, dream pop, synthpop, krautrock, electropop
"""

from __future__ import annotations

import re

import utils


# --- Heading trailing colons / blank after ---------------------------------

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)


def check_headings(text: str, rel: str) -> None:
    lines = text.splitlines()
    for idx, line in enumerate(lines):
        m = HEADING_RE.match(line)
        if not m:
            continue
        level = len(m.group(1))
        heading_text = m.group(2).rstrip()
        line_num = idx + 1
        # Trailing colon (after stripping trailing `**`)
        core = heading_text
        if core.endswith("**"):
            core = core[:-2].rstrip()
        if core.endswith(":"):
            utils.emit(
                "prose-heading-trailing-colon",
                rel, line_num,
                f"`{heading_text}` — strip the trailing colon"
            )
        # Blank line between heading and body: only check for body-level headings (#### )
        if level >= 3:
            # Look at next line
            if idx + 1 < len(lines) and not lines[idx + 1].strip():
                # Allow blank if this is the LAST heading / followed by another heading
                # Look ahead: if next non-blank is a heading, skip. Otherwise flag.
                for j in range(idx + 2, len(lines)):
                    nxt = lines[j].strip()
                    if not nxt:
                        continue
                    if nxt.startswith("#"):
                        break
                    utils.emit(
                        "prose-heading-blank-after",
                        rel, line_num,
                        f"`{heading_text}` has blank line before body paragraph"
                    )
                    break


# --- Key artists / Key figures bullets --------------------------------------

KEY_HEADINGS = [
    "key artists?",
    "key figures?",
    "key engineers?",
    "key producers?",
    "key songwriters?",
    "key songwriting teams?",
    "key writing teams?",
    "key session musicians?",
    "key labels?",
    "key studios?",
    "key executives?",
]
KEY_HEADING_RE = re.compile(
    r"^#{3,4}\s+\*?\*?(?:" + "|".join(KEY_HEADINGS) + r")\*?\*?\s*$",
    re.IGNORECASE | re.MULTILINE,
)

# Bullet opens with a "name-ish" token (bolded phrase, wikilink, external link,
# or bolded-wrapping thereof), optionally followed by a parenthetical, then an
# em-dash/en-dash/hyphen separator, then a description.
# Examples of valid:
#   - **Smokey Robinson** — description
#   - **[Richard Rodgers](url)** (with Lorenz Hart) — description
#   - [[Smokey Robinson]] — description (wikilink-only, common in practice)
#   - [Name](url) — description (external-link-only)
#   - **[[Gerry Goffin]] and [[Carole King]]** — description (team)
VALID_KEY_BULLET_RE = re.compile(
    r"^[-*+]\s+"                                      # bullet marker
    r"(?:"
    r"\*\*[^\n]+?\*\*"                                # **...** (bold; any content incl links)
    r"|\[\[[^\[\]\n]+?(?:\|[^\[\]\n]+?)?\]\]"         # wikilink
    r"|\[[^\[\]\n]+?\]\(https?://[^\s)]+\)"           # external link
    r")"
    r"(?:\s*\([^)]*\))?"                              # optional parenthetical
    r"\s+[—–\-]\s+\S"                                 # em-dash / en-dash / hyphen + something
)


def check_key_bullets(text: str, rel: str) -> None:
    for m in KEY_HEADING_RE.finditer(text):
        section_start = text.find("\n", m.end()) + 1
        next_h = re.search(r"^#{3,4}\s+", text[section_start:], re.MULTILINE)
        section_end = section_start + next_h.start() if next_h else len(text)
        body = text[section_start:section_end]
        pre_lines = text[:section_start].count("\n")
        for idx, ln in enumerate(body.splitlines()):
            stripped = ln.rstrip()
            if not stripped.lstrip().startswith(("- ", "* ", "+ ")):
                continue
            # Skip continuation bullets (indented beyond the first level)
            if ln.startswith(("  -", "    -", "\t-", "  *", "    *", "\t*")):
                continue
            if VALID_KEY_BULLET_RE.match(stripped):
                continue
            line_num = pre_lines + idx + 1
            utils.emit(
                "prose-keyartists-bullet-format",
                rel, line_num,
                f"bullet lacks `- **Name** — description` form: `{stripped[:60]}`"
            )


# --- Genre rogue hyphens -----------------------------------------------------

# (hyphenated_form, preferred_form)
UNHYPHENATED_GENRES = [
    ("folk-rock", "folk rock"),
    ("blues-rock", "blues rock"),
    ("jazz-rock", "jazz rock"),
    ("country-rock", "country rock"),
    ("big-band", "big band"),
    ("jump-blues", "jump blues"),
    ("hard-rock", "hard rock"),
    ("art-rock", "art rock"),
    ("progressive-rock", "progressive rock"),
    ("trip-hop", "trip hop"),
    ("new-wave", "new wave"),
    ("dream-pop", "dream pop"),
    ("synth-pop", "synthpop"),
    ("kraut-rock", "krautrock"),
    ("electro-pop", "electropop"),
    ("baroque-pop", "baroque pop"),
    ("psychedelic-rock", "psychedelic rock"),
    ("garage-rock", "garage rock"),
    ("surf-rock", "surf rock"),
]


def check_genre_hyphens(text: str, rel: str) -> None:
    # Skip inside code blocks
    code_spans = [(m.start(), m.end()) for m in re.finditer(r"```.*?```", text, re.DOTALL)]
    in_code = lambda pos: any(s <= pos < e for s, e in code_spans)
    # Also skip inside URLs (some bands have hyphenated names that include these as subst)
    link_spans = utils.iter_linked_spans(text)
    url_spans = []
    for m in re.finditer(r"\[[^\[\]\n]+?\]\((https?://[^\s)]+)\)", text):
        url_spans.append((m.start(1), m.start(1) + len(m.group(1))))

    for bad, good in UNHYPHENATED_GENRES:
        pattern = re.compile(r"\b" + re.escape(bad) + r"\b", re.IGNORECASE)
        for mh in pattern.finditer(text):
            pos = mh.start()
            if in_code(pos):
                continue
            # Skip if inside a URL
            if any(s <= pos < e for s, e in url_spans):
                continue
            # Skip if inside a RYM slug-style path (already inside a link target)
            # Heuristic: is the preceding char `/` or `_` or `-` continuing a slug?
            if pos > 0 and text[pos - 1] in "/_-":
                continue
            line = utils._line_at(text, pos)
            utils.emit(
                "prose-genre-rogue-hyphen",
                rel, line,
                f"`{bad}` should be `{good}`"
            )


# --- Main --------------------------------------------------------------------

def main() -> None:
    SKIP = {"x. META/Using the MAP.md", "x. META/About the MAP.md",
            "x. META/MAPmaking.md", "x. META/PLANS/External links audit.md"}
    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP:
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        check_headings(text, rel)
        check_key_bullets(text, rel)
        check_genre_hyphens(text, rel)


if __name__ == "__main__":
    main()
