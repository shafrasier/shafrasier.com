"""One-shot driver: propagate the Blues second-pass entity audit URLs.

Sha verified the audit table in PLANS/External links audit.md on 2026-05-27
after the Carnegie Hall second-pass entity sweep found ten more unlinked
entities that the initial external-links audit missed.

7 figures (Wikipedia / institution) + 3 labels (RYM) = 10 entities.
Labels are target-restricted to Blues.md to avoid false positives on
common words like "Modern," "Victor," "Specialty" elsewhere in the vault.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from propagate import Entity, propagate


FIGURES = [
    # Italicized concert name — use "album" kind to preserve italics in match
    Entity("From Spirituals to Swing", "album",
           "https://en.wikipedia.org/wiki/From_Spirituals_to_Swing"),
    Entity("Library of Congress", "figure",
           "https://en.wikipedia.org/wiki/Library_of_Congress"),
    Entity("Billboard", "figure",
           "https://en.wikipedia.org/wiki/Billboard_(magazine)"),
    Entity("American Federation of Musicians", "figure",
           "https://en.wikipedia.org/wiki/American_Federation_of_Musicians"),
    Entity("Great Migration", "figure",
           "https://en.wikipedia.org/wiki/Great_Migration_(African_American)"),
    Entity("chitlin' circuit", "figure",
           "https://en.wikipedia.org/wiki/Chitlin%27_Circuit"),
    Entity("Karl Hagstrom Miller", "figure",
           "https://music.virginia.edu/people/karl-hagstrom-miller"),
]

# Labels: restricted to Blues.md to avoid false positives.
# "Modern," "Victor," "Specialty" are common words that appear in other
# notes in non-label contexts.
LABELS = [
    Entity("Victor", "label",
           "https://rateyourmusic.com/label/victor/",
           target_files=["TAXONOMY/GENRES/BLUES/Blues.md"]),
    Entity("Modern", "label",
           "https://rateyourmusic.com/label/modern_records/",
           aliases=["Modern Records"],
           target_files=["TAXONOMY/GENRES/BLUES/Blues.md"]),
    Entity("Specialty", "label",
           "https://rateyourmusic.com/label/specialty/",
           aliases=["Specialty Records"],
           target_files=["TAXONOMY/GENRES/BLUES/Blues.md"]),
]


def main() -> None:
    all_entities = FIGURES + LABELS
    print(f"Propagating {len(all_entities)} entities "
          f"({len(FIGURES)} figures, {len(LABELS)} labels)...\n")
    report = propagate(all_entities)
    print(report)


if __name__ == "__main__":
    main()
