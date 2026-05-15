#!/usr/bin/env python3
"""Scan the SOURCES ↔ IDEAS scholarly architecture.

Emits:

- sources-orphan        — a SOURCES note that no IDEAS note cites
- ideas-no-sources      — an IDEAS note with zero `[[Author - Title...]]` wikilinks
- theory-production-thin — a THEORY or PRODUCTION note citing no SOURCES and with
                          fewer than 4 entity-linked Key records / foundational examples

The "thin" heuristic is conservative — better to skip weak-engagement cases
than drown the Dream pass in marginal findings. The Dream agent can always
probe further with its own judgment.
"""

from __future__ import annotations

import re

import utils

SOURCE_WIKILINK_RE = re.compile(r"\[\[([^\[\]|\n]+? - [^\[\]|\n]+?)(?:\|[^\[\]\n]+?)?\]\]")


def main() -> None:
    sources = [n for n in utils.all_notes() if n.entity_type == "source"]
    ideas = [n for n in utils.all_notes() if n.entity_type == "idea"]
    theory = [n for n in utils.all_notes() if n.entity_type == "technique_theory"]
    production = [n for n in utils.all_notes() if n.entity_type == "technique_production"]

    # Build: source_stem → set of IDEAS/THEORY/PRODUCTION notes that wikilink it
    source_stems = {s.stem for s in sources}
    citing: dict[str, set[str]] = {s: set() for s in source_stems}
    for note in ideas + theory + production:
        text = note.read()
        for m in SOURCE_WIKILINK_RE.finditer(text):
            target = m.group(1).strip()
            if target in source_stems:
                citing[target].add(note.relpath)

    # Orphan SOURCES
    for s in sources:
        if not citing[s.stem]:
            utils.emit(
                "sources-orphan",
                s.relpath, 0,
                f"no IDEAS/THEORY/PRODUCTION note cites `[[{s.stem}]]`"
            )

    # Weak IDEAS — zero SOURCES citations
    for i in ideas:
        text = i.read()
        hits = [m.group(1).strip() for m in SOURCE_WIKILINK_RE.finditer(text)
                if m.group(1).strip() in source_stems]
        if not hits:
            utils.emit(
                "ideas-no-sources",
                i.relpath, 0,
                "IDEAS note wikilinks no SOURCES — scholarly backbone missing"
            )

    # Thin THEORY / PRODUCTION — no SOURCES AND thin example layer
    # "Thin example layer" proxy: fewer than 4 wikilinks to albums/singles/tracks
    RELEASE_WIKI_RE = re.compile(r"\[\[\((\d{4})\) [^\[\]|\n]+?(?:\|[^\[\]\n]+?)?\]\]")
    for note in theory + production:
        text = note.read()
        source_hits = [m for m in SOURCE_WIKILINK_RE.finditer(text)
                       if m.group(1).strip() in source_stems]
        release_hits = list(RELEASE_WIKI_RE.finditer(text))
        if not source_hits and len(release_hits) < 4:
            utils.emit(
                "theory-production-thin",
                note.relpath, 0,
                f"{note.entity_type.replace('_', '/')} note has no SOURCES citation "
                f"and only {len(release_hits)} release wikilinks — expand or cite"
            )


if __name__ == "__main__":
    main()
