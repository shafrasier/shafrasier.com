#!/usr/bin/env python3
"""Run every scan in this directory and group findings by category.

Usage:

    python3 "x. META/scans/run_all.py"
    python3 "x. META/scans/run_all.py" --json   # machine-readable output

Output (human mode) is grouped under the Dream-log heading categories so the
agent can copy-paste sections directly. Each line is:

    <category> | <vault-relative-path> | <line> | <detail>

Scripts are invoked as submodules, so their `main()` functions run in the
same process and share `utils.all_notes()` caching.

To add a new scan: drop `myscan.py` in this folder, import it here, and add
its `main()` to the sequence below.
"""

from __future__ import annotations

import argparse
import io
import sys
from contextlib import redirect_stdout
from pathlib import Path

# Make this folder importable
sys.path.insert(0, str(Path(__file__).parent))

import broken_wikilinks
import sources_ideas_coverage
import linking_form
import linking_target
import structural_placement
import chronological_order
import prose_formatting
import audit_doc_sync
import unlinked_entities
import corpus_orphan_entities
# import unlinked_titles  # DRAFT: enabled when noise tuning is complete


# Mapping: script module → (Dream-log section header, order index)
# Section ordering follows the Dream task instructions (sections 4–12).
SECTIONS: list[tuple[str, object]] = [
    ("Broken wikilinks",              broken_wikilinks),
    ("SOURCES ↔ IDEAS engagement",    sources_ideas_coverage),
    ("Linking — form",                linking_form),
    ("Linking — target",              linking_target),
    ("Unlinked entities & first-mention", unlinked_entities),
    ("Orphan entities (no MAP note, no link anywhere)", corpus_orphan_entities),
    # ("Unlinked italic / quoted titles", unlinked_titles),  # DRAFT — disabled pending noise tuning
    ("Structural placement",          structural_placement),
    ("Ordering",                      chronological_order),
    ("Prose formatting",              prose_formatting),
    ("Audit-doc sync",                audit_doc_sync),
]


def run_section(module) -> list[str]:
    buf = io.StringIO()
    with redirect_stdout(buf):
        module.main()
    return [ln for ln in buf.getvalue().splitlines() if ln.strip()]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true", help="JSON output for machine consumption")
    args = ap.parse_args()

    all_sections: list[tuple[str, list[str]]] = []
    for header, module in SECTIONS:
        findings = run_section(module)
        all_sections.append((header, findings))

    if args.json:
        import json
        out = {hdr: findings for hdr, findings in all_sections}
        out["_totals"] = {hdr: len(findings) for hdr, findings in all_sections}
        out["_totals"]["grand"] = sum(len(f) for _, f in all_sections)
        print(json.dumps(out, indent=2))
        return

    # Human mode: print a summary header, then each section
    total = sum(len(f) for _, f in all_sections)
    print(f"# Dream scan — {total} mechanical finding(s)\n")
    for header, findings in all_sections:
        print(f"## {header} ({len(findings)})")
        if not findings:
            print("(no findings)\n")
            continue
        for ln in findings:
            print(ln)
        print()


if __name__ == "__main__":
    main()
