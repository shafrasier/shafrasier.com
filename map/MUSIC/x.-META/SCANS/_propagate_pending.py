"""One-shot driver: propagate the three (done) tables from the audit doc.

Artists (37), Wikipedia figures (22), Books (28).
Uses the bulletproof `propagate` library.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from propagate import Entity, propagate


ARTISTS = [
    Entity("Bill Colyer", "artist", "https://www.allmusic.com/artist/bill-colyer-mn0001035858"),
    Entity("Tyrannosaurus Rex", "artist", "https://rateyourmusic.com/artist/t-rex-2"),
    Entity("Tony Jackson", "artist", "https://rateyourmusic.com/artist/tony-jackson-1"),
    Entity("John McNally", "artist", "https://rateyourmusic.com/artist/john_mcnally/credits/"),
    Entity("Joe Liggins", "artist", "https://rateyourmusic.com/artist/joe_liggins"),
    Entity("Luther Perkins", "artist", "https://rateyourmusic.com/artist/luther_perkins/credits/"),
    Entity("Cliff Gallup", "artist", "https://rateyourmusic.com/artist/cliff_gallup/credits/"),
    Entity("The Meteors", "artist", "https://rateyourmusic.com/artist/the-meteors-4"),
    Entity("Lux Interior", "artist", "https://rateyourmusic.com/artist/lux_interior/credits/"),
    Entity("Brian Setzer", "artist", "https://rateyourmusic.com/artist/brian_setzer/credits/"),
    Entity("The Shadows", "artist", "https://rateyourmusic.com/artist/the-shadows-4"),
    Entity("Nelson Riddle", "artist", "https://rateyourmusic.com/artist/nelson_riddle/credits/"),
    Entity("John Lydon", "artist", "https://rateyourmusic.com/artist/john-lydon-3/credits/"),
    Entity("D.J. Fontana", "artist", "https://rateyourmusic.com/artist/d_j-fontana/credits/"),
    Entity("Otis Blackwell", "artist", "https://rateyourmusic.com/artist/otis_blackwell/credits/"),
    Entity("Abdul \"Duke\" Fakir", "artist", "https://rateyourmusic.com/artist/abdul-duke-fakir/credits/",
           aliases=["Duke Fakir"]),
    Entity("Renaldo \"Obie\" Benson", "artist", "https://rateyourmusic.com/artist/renaldo-obie-benson/credits/",
           aliases=["Obie Benson"]),
    Entity("Lawrence Payton", "artist", "https://rateyourmusic.com/artist/lawrence_payton/credits/"),
    Entity("Hank Cosby", "artist", "https://rateyourmusic.com/artist/henry_cosby/credits/",
           aliases=["Hank Crosby"]),  # vault has the typo "Crosby"
    # Paul Williams (Temptations) — too ambiguous for vault-wide; restrict to The Temptations note
    Entity("Paul Williams", "artist", "https://rateyourmusic.com/artist/paul_williams_f5/credits/",
           target_files=["ARTISTS/The Temptations.md"]),
    Entity("Melvin Franklin", "artist", "https://rateyourmusic.com/artist/melvin_franklin/credits/"),
    # Otis Williams — also ambiguous (also a doo-wop singer); restrict
    Entity("Otis Williams", "artist", "https://rateyourmusic.com/artist/otis_williams_f1/credits/",
           target_files=["ARTISTS/The Temptations.md"]),
    Entity("Julius Wechter", "artist", "https://rateyourmusic.com/artist/julius_wechter/credits/"),
    Entity("The Carpenters", "artist", "https://rateyourmusic.com/artist/carpenters"),
    Entity("John Phillips", "artist", "https://rateyourmusic.com/artist/john-phillips-4/credits/"),
    Entity("Pentangle", "artist", "https://rateyourmusic.com/artist/the-pentangle"),
    Entity("Flying Burrito Brothers", "artist", "https://rateyourmusic.com/artist/the-flying-burrito-bros"),
    Entity("Terry Melcher", "artist", "https://rateyourmusic.com/artist/terry_melcher/credits/"),
    Entity("Ronald Isley", "artist", "https://rateyourmusic.com/artist/ronald_isley/credits/"),
    Entity("Top Notes", "artist", "https://rateyourmusic.com/artist/the_top_notes"),
    Entity("The O'Jays", "artist", "https://rateyourmusic.com/artist/the_ojays"),
    Entity("Carl Wilson", "artist", "https://rateyourmusic.com/artist/carl-wilson-1"),
    Entity("Dennis Wilson", "artist", "https://rateyourmusic.com/artist/dennis-wilson-3"),
    Entity("Al De Lory", "artist", "https://rateyourmusic.com/artist/al-delory/credits/"),
    Entity("Mack David", "artist", "https://rateyourmusic.com/artist/mack_david/credits"),
    Entity("Alan Civil", "artist", "https://rateyourmusic.com/artist/alan-civil/credits/"),
    Entity("The Weavers", "artist", "https://rateyourmusic.com/artist/the_weavers"),
]

FIGURES = [
    Entity("Cecil Gee", "figure", "https://www.theguardian.com/fashion/2023/oct/08/forgotten-and-overlooked-how-jewish-designers-dressed-the-beatles-and-changed-global-fashion"),
    Entity("John Stephen", "figure", "https://en.wikipedia.org/wiki/John_Stephen"),
    Entity("Flamingo Club", "figure", "https://en.wikipedia.org/wiki/Flamingo_Club_(London)"),
    Entity("Tiles Club", "figure", "https://sladestory.blogspot.com/1971/01/tiles-club-london.html"),
    Entity("Roaring Twenties", "figure", "https://en.wikipedia.org/wiki/Count_Suckle"),
    Entity("Litherland Town Hall", "figure", "https://www.beatlesbible.com/1960/12/27/live-litherland-town-hall-liverpool/"),
    Entity("The Blue Angel", "figure", "https://en.wikipedia.org/wiki/Blue_Angel_(nightclub)"),
    Entity("Sam Leach", "figure", "https://www.theguardian.com/music/2016/dec/23/sam-leach-obituary"),
    Entity("Nadine Cohodas", "figure", "https://www.jazztimes.com/features/interviews/nadine-cohodas-crafting-the-narrative/?v=0b3b97fa6688"),
    Entity("Eli Toscano", "figure", "https://en.wikipedia.org/wiki/Cobra_Records"),
    Entity("Roberta Schwartz", "figure", "https://music.ku.edu/people/roberta-schwartz"),
    Entity("Martin Hawkins", "figure", "https://www.rocksbackpages.com/Library/Writer/martin-hawkins"),
    Entity("Irish Jack Lyons", "figure", "https://modsofyourgeneration.com/interview-with-irish-jack-lyons-40th-anniversary-of-quadrophenia/"),
    Entity("Mike Dewe", "figure", "https://planetmagazine.org.uk/books/skifflecraze"),
    # Anthony Gribin & Matthew Schiff — handled by linking both halves separately, but
    # the prose probably reads as "Gribin and Schiff" or similar. Skip auto; manual if needed.
    Entity("Eliot Tiegel", "figure", "https://www.billboard.com/music/music-news/eliot-tiegel-former-billboard-managing-editor-dies-at-84-9354665/"),
    Entity("Lawrence Horn", "figure", "https://en.wikipedia.org/wiki/Lawrence_Horn"),
    Entity("Robert Dennis", "figure", "https://recording.institute/author/bob-dennis/"),
    Entity("Chuck Britz", "figure", "https://en.wikipedia.org/wiki/Chuck_Britz"),
    Entity("Jay Migliori", "figure", "https://en.wikipedia.org/wiki/Jay_Migliori"),
    Entity("Jack Nimitz", "figure", "https://en.wikipedia.org/wiki/Jack_Nimitz"),
    Entity("Dan Drasin", "figure", "https://letterboxd.com/director/daniel-drasin/"),
    # The Sound of Motown (TV) — italicized title, treat as album for *Italic* form
    Entity("The Sound of Motown", "album", "https://www.imdb.com/title/tt0193681/"),
]

BOOKS = [
    Entity("A Natural Woman", "book", "https://www.goodreads.com/book/show/12953257-a-natural-woman"),
    Entity("Beat Merchants", "book", "https://www.goodreads.com/book/show/1630211.Beat_Merchants",
           aliases=["Beat Merchants: The Origins, History, Impact and Rock Legacy of the 1960s British Pop Groups"]),
    Entity("Blues in Britain", "book", "https://www.goodreads.com/book/show/236627.Blues",
           aliases=["Blues: The British Connection"]),
    Entity("Deep Blues", "book", "https://www.goodreads.com/book/show/269359.Deep_Blues"),
    Entity("Doo-Wop: The Forgotten Third of Rock 'n' Roll", "book",
           "https://www.goodreads.com/book/show/2210140.Doo_Wop"),
    Entity("Good Rockin' Tonight: Sun Records and the Birth of Rock 'n' Roll", "book",
           "https://www.goodreads.com/book/show/848792.Good_Rockin_Tonight",
           aliases=["Good Rockin' Tonight"]),
    Entity("Hotel California", "book", "https://www.goodreads.com/book/show/231024.Hotel_California",
           aliases=["Hotel California: The True-Life Adventures of Crosby, Stills, Nash, Young, Mitchell, Taylor, Browne, Ronstadt, Geffen, the Eagles, and Their Many Friends"]),
    Entity("How Britain Got the Blues", "book",
           "https://www.goodreads.com/book/show/6533989-how-britain-got-the-blues",
           aliases=["How Britain Got the Blues: The Transmission and Reception of American Blues Style in the United Kingdom"]),
    Entity("Last Train to Memphis", "book",
           "https://www.goodreads.com/book/show/712665.Last_Train_to_Memphis",
           aliases=["Last Train to Memphis: The Rise of Elvis Presley"]),
    Entity("Mod: A Very British Style", "book", "https://www.goodreads.com/book/show/13573451-mod"),
    Entity("No Direction Home", "book",
           "https://www.goodreads.com/book/show/132040.No_Direction_Home",
           aliases=["No Direction Home: The Life and Music of Bob Dylan"]),
    Entity("Roots, Radicals and Rockers", "book",
           "https://www.goodreads.com/book/show/32202629-roots-radicals-and-rockers",
           aliases=["Roots, Radicals and Rockers: How Skiffle Changed the World"]),
    Entity("Sam Phillips: The Man Who Invented Rock 'n' Roll", "book",
           "https://www.goodreads.com/book/show/25066500-sam-phillips"),
    Entity("Skiffle: The Definitive Inside Story", "book",
           "https://www.goodreads.com/book/show/21251326-skiffle"),
    Entity("Spinning Blues Into Gold", "book",
           "https://www.goodreads.com/book/show/1161633.Spinning_Blues_into_Gold",
           aliases=["Spinning Blues Into Gold: The Chess Records Story"]),
    Entity("Sweet Soul Music", "book",
           "https://www.goodreads.com/book/show/890216.Sweet_Soul_Music",
           aliases=["Sweet Soul Music: Rhythm and Blues and the Southern Dream of Freedom"]),
    Entity("The Birth of the Beatles", "book",
           "https://www.goodreads.com/book/show/2468745.The_Birth_of_the_Beatles"),
    Entity("The Cambridge Companion to Pop and Rock", "book",
           "https://www.goodreads.com/book/show/443603.The_Cambridge_Companion_to_Pop_and_Rock"),
    Entity("The Cavern Club: Rise of the Beatles and Merseybeat", "book",
           "https://www.goodreads.com/book/show/23129860-the-cavern-club",
           aliases=["The Cavern Club"]),
    Entity("The Man Who Gave the Beatles Away", "book",
           "https://www.goodreads.com/book/show/2010675"),
    Entity("The Mayor of MacDougal Street", "book",
           "https://www.goodreads.com/book/show/896855.The_Mayor_of_MacDougal_Street"),
    Entity("The Psychedelic Experience", "book",
           "https://www.goodreads.com/book/show/123698.The_Psychedelic_Experience"),
    Entity("The Sharper Word", "book",
           "https://www.goodreads.com/book/show/1328600.The_Sharper_Word",
           aliases=["The Sharper Word: A Mod Reader", "The Sharper Word: A Mod Anthology"]),
    Entity("The Skiffle Craze", "book",
           "https://www.goodreads.com/book/show/4078881-the-skiffle-craze"),
    Entity("The Soul Stylists", "book",
           "https://www.goodreads.com/book/show/115087.The_Soul_Stylists",
           aliases=["The Soul Stylists: Sixty Years of Modernism",
                    "The Soul Stylists: Six Decades of Modernism",
                    "The Soul Stylists: Six Decades of Modernism — from Mods to Casuals"]),
    Entity("The Sound of the City", "book",
           "https://www.goodreads.com/book/show/1088969.The_Sound_of_the_City",
           aliases=["The Sound of the City: The Rise of Rock and Roll"]),
    Entity("Twist and Shout!", "book",
           "https://www.goodreads.com/book/show/29858238-twist-and-shout",
           aliases=["Twist and Shout! Merseybeat, the Cavern, the Star-Club and the Beatles"]),
    Entity("Who I Am", "book", "https://www.goodreads.com/book/show/13609867-who-i-am"),
]


def main() -> None:
    all_entities = ARTISTS + FIGURES + BOOKS
    print(f"Propagating {len(all_entities)} entities "
          f"({len(ARTISTS)} artists, {len(FIGURES)} figures, {len(BOOKS)} books)...\n")
    report = propagate(all_entities)
    print(report)


if __name__ == "__main__":
    main()
