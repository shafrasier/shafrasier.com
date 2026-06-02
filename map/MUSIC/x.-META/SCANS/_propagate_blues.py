"""One-shot driver: propagate the Blues umbrella note's verified URLs.

Sha verified the audit table in PLANS/External links audit.md
on 2026-05-27. This driver applies the verified URLs across the vault
using the bulletproof `propagate` library.

13 artists + 2 books + 2 figures = 17 entities.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from propagate import Entity, propagate


ARTISTS = [
    Entity("Albert Ammons", "artist", "https://rateyourmusic.com/artist/albert-ammons"),
    Entity("Charley Patton", "artist", "https://rateyourmusic.com/artist/charley-patton"),
    Entity("R. L. Burnside", "artist", "https://rateyourmusic.com/artist/r_l-burnside"),
    Entity("Junior Kimbrough", "artist", "https://rateyourmusic.com/artist/junior_kimbrough"),
    Entity("Skip James", "artist", "https://rateyourmusic.com/artist/skip-james"),
    Entity("Jack Owens", "artist", "https://rateyourmusic.com/artist/jack_owens"),
    Entity("Meade \"Lux\" Lewis", "artist", "https://rateyourmusic.com/artist/meade-lux-lewis",
           aliases=["Meade Lux Lewis"]),
    Entity("Memphis Slim", "artist", "https://rateyourmusic.com/artist/memphis-slim"),
    Entity("Champion Jack Dupree", "artist", "https://rateyourmusic.com/artist/champion-jack-dupree"),
    Entity("Ma Rainey", "artist", "https://rateyourmusic.com/artist/ma-rainey"),
    Entity("Blind Lemon Jefferson", "artist", "https://rateyourmusic.com/artist/blind_lemon_jefferson"),
    Entity("Bobby \"Blue\" Bland", "artist", "https://rateyourmusic.com/artist/bobby-bland",
           aliases=["Bobby Bland", "Bobby Blue Bland"]),
    Entity("Z. Z. Hill", "artist", "https://rateyourmusic.com/artist/z_z__hill",
           aliases=["Z.Z. Hill", "ZZ Hill"]),
]

FIGURES = [
    Entity("Amiri Baraka", "figure", "https://en.wikipedia.org/wiki/Amiri_Baraka"),
    Entity("Paul Oliver", "figure", "https://en.wikipedia.org/wiki/Paul_Oliver"),
]

BOOKS = [
    Entity("Blues People", "book", "https://www.goodreads.com/book/show/17595.Blues_People",
           aliases=["Blues People: Negro Music in White America"]),
    Entity("The Story of the Blues", "book", "https://www.goodreads.com/book/show/236630.The_Story_of_the_Blues"),
]


def main() -> None:
    all_entities = ARTISTS + FIGURES + BOOKS
    print(f"Propagating {len(all_entities)} entities "
          f"({len(ARTISTS)} artists, {len(FIGURES)} figures, {len(BOOKS)} books)...\n")
    report = propagate(all_entities)
    print(report)


if __name__ == "__main__":
    main()
