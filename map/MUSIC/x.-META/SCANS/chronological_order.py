#!/usr/bin/env python3
"""Chronological-order violations in reference/catalog sections.

Categories:

- order-records-not-chrono   — Foundational records / Key records / Key songs section
                               has release wikilinks out of chronological order

Scope: sections whose BULLET ENTRIES are primarily release wikilinks of the
form `[[(YYYY) Title]]`. We extract years from the wikilinks and flag if the
year sequence is not monotonically non-decreasing.

Out of scope (too judgment-heavy): See also section chronology. The rule there
is "roughly chronological" — impossible to mechanize without false positives.
Dream agent handles that.
"""

from __future__ import annotations

import re

import utils


# Section headings whose bullet entries should be strictly chronological
CHRONO_HEADING_PATTERNS = [
    r"foundational records?",
    r"foundational songs?",
    r"key records?",
    r"key songs?",
    r"key singles?",
    r"key albums?",
    r"key tracks?",
    r"foundational examples?",
]
CHRONO_HEADING_RE = re.compile(
    r"^#{3,4}\s+\*?\*?(?:" + "|".join(CHRONO_HEADING_PATTERNS) + r")\*?\*?\s*$",
    re.IGNORECASE | re.MULTILINE,
)


RELEASE_YEAR_RE = re.compile(r"\[\[(?:[^\[\]|\n]*?/)?\((\d{4})\)\s+[^\[\]|\n]+?(?:\|[^\[\]\n]+?)?\]\]")


def check_file(text: str, rel: str) -> None:
    # Enumerate all chronological-section headings
    heading_matches = list(CHRONO_HEADING_RE.finditer(text))
    if not heading_matches:
        return
    for i, m in enumerate(heading_matches):
        section_start = text.find("\n", m.end()) + 1
        # Section ends at next ####/### heading or EOF
        next_h = re.search(r"^#{3,4}\s+", text[section_start:], re.MULTILINE)
        section_end = section_start + next_h.start() if next_h else len(text)
        section_body = text[section_start:section_end]
        # Walk bullet lines — track (line_number_in_file, year, raw_text)
        pre_lines = text[:section_start].count("\n")
        entries: list[tuple[int, int, str]] = []
        for idx, ln in enumerate(section_body.splitlines()):
            stripped = ln.lstrip()
            if not stripped.startswith(("- ", "* ", "+ ")):
                continue
            # Find the FIRST release wikilink in this bullet
            year_match = RELEASE_YEAR_RE.search(ln)
            if not year_match:
                continue
            year = int(year_match.group(1))
            line_num = pre_lines + idx + 1
            entries.append((line_num, year, ln.strip()[:70]))
        # Check monotonic non-decreasing
        for j in range(1, len(entries)):
            prev_line, prev_year, _prev_txt = entries[j - 1]
            line_num, year, txt = entries[j]
            if year < prev_year:
                heading_line = text[:m.start()].count("\n") + 1
                utils.emit(
                    "order-records-not-chrono",
                    rel, line_num,
                    f"`{txt}` ({year}) follows {prev_year} in section starting L{heading_line}"
                )


def main() -> None:
    SKIP = {"x. META/Using the MAP.md", "x. META/About the MAP.md",
            "x. META/MAPmaking.md", "x. META/PLANS/External links audit.md"}
    for md_path in utils.iter_vault_md():
        rel = utils.rel(md_path)
        if rel in SKIP:
            continue
        text = md_path.read_text(encoding="utf-8", errors="replace")
        check_file(text, rel)


if __name__ == "__main__":
    main()
