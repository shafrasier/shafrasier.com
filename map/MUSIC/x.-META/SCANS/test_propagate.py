"""Regression tests for propagate.py.

Every cautionary precedent from the propagation history gets a test here.
When a new failure surfaces, add the test BEFORE fixing the library — that
guarantees the bug stays fixed.

Run:
    python3 test_propagate.py

The tests use tiny in-memory text fixtures rather than real vault files,
so they're fast and don't depend on vault state.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from propagate import (
    Entity,
    _apply_edits,
    _collect_edits,
    _is_catalog_heading,
    _is_protected,
    _protected_spans,
    _replacement_for,
    PATTERN_FOR,
)


# ---------------------------------------------------------------------------
# Helper: run a single-entity, single-text propagation
# ---------------------------------------------------------------------------

def apply(text: str, entity: Entity) -> str:
    edits, _ = _collect_edits(text, entity)
    return _apply_edits(text, edits)


def assert_eq(actual, expected, label):
    if actual != expected:
        print(f"  ✗ FAIL: {label}")
        print(f"    expected: {expected!r}")
        print(f"    actual:   {actual!r}")
        return False
    print(f"  ✓ {label}")
    return True


# ---------------------------------------------------------------------------
# Tests organized by failure-mode category
# ---------------------------------------------------------------------------

def test_punctuation_inside_quotes():
    """Failure mode #1: `"Song,"` and `"Song."` must match.
    Cautionary precedent: May 2026 Skiffle propagation missed
    "John Henry," and "Midnight Special," because the pattern was
    `"Song"` without trailing-punct handling."""
    print("\n== Punctuation inside closing quote ==")
    song = Entity("John Henry", "song", "https://example.com/jh")
    ok = True
    ok &= assert_eq(
        apply('We discuss "John Henry," among others.', song),
        'We discuss ["John Henry,"](https://example.com/jh) among others.',
        "trailing comma absorbed inside link",
    )
    ok &= assert_eq(
        apply('"John Henry." closes the set.', song),
        '["John Henry."](https://example.com/jh) closes the set.',
        "trailing period absorbed inside link",
    )
    ok &= assert_eq(
        apply('We discuss "John Henry" among others.', song),
        'We discuss ["John Henry"](https://example.com/jh) among others.',
        "no trailing punctuation works too",
    )
    return ok


def test_apostrophe_variants():
    """Failure mode #2: straight `'` and curly `’` in both directions."""
    print("\n== Apostrophe variants ==")
    song = Entity("Don't Be Cruel", "song", "https://example.com/dbc")
    ok = True
    ok &= assert_eq(
        apply('Elvis cut "Don\'t Be Cruel" in 1956.', song),
        'Elvis cut ["Don\'t Be Cruel"](https://example.com/dbc) in 1956.',
        "straight apostrophe in prose",
    )
    ok &= assert_eq(
        apply('Elvis cut "Don’t Be Cruel" in 1956.', song),
        'Elvis cut ["Don’t Be Cruel"](https://example.com/dbc) in 1956.',
        "curly apostrophe in prose, straight in entity",
    )
    return ok


def test_possessive_absorption():
    """Failure mode #3: possessive markers stay inside link text.
    Cautionary precedent: April 2026 — Vandellas', Shirelles',
    Ramones' all missed because regex only matched 's not s'."""
    print("\n== Possessive absorption ==")
    ok = True
    artist = Entity("Chuck Berry", "artist", "https://example.com/cb")
    ok &= assert_eq(
        apply("Chuck Berry's guitar vocabulary", artist),
        "[Chuck Berry's](https://example.com/cb) guitar vocabulary",
        "trailing 's absorbed inside link",
    )
    artist_s = Entity("the Vandellas", "artist", "https://example.com/v")
    ok &= assert_eq(
        apply("the Vandellas' early singles", artist_s),
        "[the Vandellas'](https://example.com/v) early singles",
        "bare ' after s-ending name absorbed inside link",
    )
    return ok


def test_leading_article_case():
    """Failure mode #4: `[Tt]he X` matches both cases."""
    print("\n== Leading article case-insensitivity ==")
    ok = True
    artist = Entity("the Beatles", "artist", "https://example.com/b")
    ok &= assert_eq(
        apply("the Beatles played Hamburg.", artist),
        "[the Beatles](https://example.com/b) played Hamburg.",
        "lowercase 'the' matches",
    )
    ok &= assert_eq(
        apply("The Beatles played Hamburg.", artist),
        "[The Beatles](https://example.com/b) played Hamburg.",
        "uppercase 'The' matches",
    )
    return ok


def test_already_linked_skip():
    """Failure mode #7-9: never double-link or break existing links."""
    print("\n== Skip already-linked ==")
    ok = True
    song = Entity("Hound Dog", "song", "https://example.com/hd-elvis")
    ok &= assert_eq(
        apply('Elvis covered "Hound Dog" in 1956.', song),
        'Elvis covered ["Hound Dog"](https://example.com/hd-elvis) in 1956.',
        "unlinked → linked",
    )
    # Already linked with a different URL: same-URL detection skips
    already = 'Elvis covered ["Hound Dog"](https://example.com/hd-elvis) in 1956.'
    ok &= assert_eq(
        apply(already, song),
        already,
        "same-URL already-linked is a no-op",
    )
    # Already linked with a wikilink: must not re-link
    wikilinked = 'Elvis covered [["Hound Dog"|"Hound Dog"]] in 1956.'
    ok &= assert_eq(
        apply(wikilinked, song),
        wikilinked,
        "wikilinked form is a no-op",
    )
    return ok


def test_image_embeds_skip():
    """Failure mode #10: image embeds `![[...]]` must never be touched.
    Cautionary precedent: April 2026 bolding sweep broke 22 cover embeds."""
    print("\n== Image embeds untouched ==")
    ok = True
    album = Entity("Pet Sounds", "album", "https://example.com/ps", year=1966)
    # The album name appears inside an image embed AND in prose
    text = "![[(1966) Pet Sounds.png]]\n\nThe album *Pet Sounds* is iconic."
    expected = (
        "![[(1966) Pet Sounds.png]]\n\n"
        "The album [*Pet Sounds*](https://example.com/ps) is iconic."
    )
    ok &= assert_eq(
        apply(text, album),
        expected,
        "embed `![[Pet Sounds.png]]` not touched; prose `*Pet Sounds*` linked",
    )
    return ok


def test_code_blocks_skip():
    """Failure mode #11: fenced and inline code spans never get touched."""
    print("\n== Code blocks untouched ==")
    ok = True
    artist = Entity("Chuck Berry", "artist", "https://example.com/cb")
    text = (
        "```\nChuck Berry recorded for Chess.\n```\n\n"
        "Chuck Berry was a rock & roll pioneer."
    )
    result = apply(text, artist)
    ok &= assert_eq(
        "```\nChuck Berry recorded for Chess.\n```" in result,
        True,
        "fenced code block contents untouched",
    )
    ok &= assert_eq(
        "[Chuck Berry](https://example.com/cb) was a rock" in result,
        True,
        "prose outside code block gets linked",
    )
    return ok


def test_frontmatter_skip():
    """Failure mode #12: YAML frontmatter never gets touched."""
    print("\n== Frontmatter untouched ==")
    ok = True
    artist = Entity("Chuck Berry", "artist", "https://example.com/cb")
    text = (
        "---\ntitle: Chuck Berry\n---\n\n"
        "Chuck Berry was a pioneer."
    )
    result = apply(text, artist)
    ok &= assert_eq(
        "---\ntitle: Chuck Berry\n---" in result,
        True,
        "frontmatter title field untouched",
    )
    ok &= assert_eq(
        "[Chuck Berry](https://example.com/cb) was a pioneer" in result,
        True,
        "post-frontmatter prose gets linked",
    )
    return ok


def test_catalog_section_independent():
    """Failure mode #13-15: body prose + each catalog section get
    independent first-mention links.
    Cautionary precedent: May 2026 — 58 catalog-section first-mention
    links missed because propagation skipped any file where the URL
    appeared anywhere."""
    print("\n== Catalog sections link independently from body ==")
    ok = True
    song = Entity("That's All Right", "song", "https://example.com/tar")
    text = (
        "Elvis recorded \"That's All Right\" at Sun in 1954.\n\n"
        "#### **Key artists**\n"
        "- Elvis Presley — \"That's All Right\" was his first single.\n"
    )
    expected = (
        "Elvis recorded [\"That's All Right\"](https://example.com/tar) at Sun in 1954.\n\n"
        "#### **Key artists**\n"
        "- Elvis Presley — [\"That's All Right\"](https://example.com/tar) was his first single.\n"
    )
    ok &= assert_eq(
        apply(text, song),
        expected,
        "body + catalog section each get their own link",
    )
    return ok


def test_one_link_per_section():
    """Failure mode #13: within a single section, only the FIRST mention
    gets linked. Subsequent mentions stay plain."""
    print("\n== One link per section ==")
    ok = True
    song = Entity("Hound Dog", "song", "https://example.com/hd")
    text = (
        '#### **Body**\n'
        'Elvis cut "Hound Dog" first. Then "Hound Dog" again.\n'
    )
    expected = (
        '#### **Body**\n'
        'Elvis cut ["Hound Dog"](https://example.com/hd) first. Then "Hound Dog" again.\n'
    )
    ok &= assert_eq(
        apply(text, song),
        expected,
        "first mention linked, second stays plain",
    )
    return ok


def test_cover_version_filter():
    """Failure mode #16: per-line contextual filters.
    Cautionary precedent: April 2026 — "Hound Dog" Elvis URL propagated
    into Big Mama Thornton context, "Rock and Roll Music" Chuck Berry
    URL propagated into Beatles cover context."""
    print("\n== Contextual filters for cover versions ==")
    ok = True
    elvis_hd = Entity(
        "Hound Dog", "song", "https://example.com/elvis-hd",
        filters=["Elvis", "Presley"]
    )
    text = (
        'Big Mama Thornton recorded "Hound Dog" in 1952.\n'
        'Elvis Presley covered "Hound Dog" in 1956.\n'
    )
    expected = (
        'Big Mama Thornton recorded "Hound Dog" in 1952.\n'
        'Elvis Presley covered ["Hound Dog"](https://example.com/elvis-hd) in 1956.\n'
    )
    ok &= assert_eq(
        apply(text, elvis_hd),
        expected,
        "filter skips non-Elvis line, applies on Elvis line",
    )
    return ok


def test_position_drift_safety():
    """Failure mode #17: multiple edits in same file applied in reverse
    order so positions don't drift.
    Cautionary precedent: May 2026 — Holland-Dozier-Holland L10 and
    Elvis Presley L32+L37 had catastrophic mid-word insertions."""
    print("\n== Position-drift safety ==")
    ok = True
    # Two entities, both matching in same file, with the second's match
    # at a higher offset than the first.
    text = "Maybellene came first. Then School Days."
    e1 = Entity("Maybellene", "song", "https://example.com/m")
    e2 = Entity("School Days", "song", "https://example.com/sd")
    # Note: these are "songs" but for the test we'll use unquoted to
    # avoid extra noise — actually we need to use the song format. Let's
    # use the album-style escape for cleanliness in this test.
    text = '"Maybellene" came first. Then "School Days".'
    expected = (
        '["Maybellene"](https://example.com/m) came first. '
        'Then ["School Days"](https://example.com/sd).'
    )
    edits1, _ = _collect_edits(text, e1)
    edits2, _ = _collect_edits(text, e2)
    all_edits = edits1 + edits2
    result = _apply_edits(text, all_edits)
    ok &= assert_eq(
        result,
        expected,
        "two edits in same line, both land cleanly",
    )
    return ok


def test_album_year_outside():
    """Failure mode #25: album/book year stays OUTSIDE the link."""
    print("\n== Album: year outside the link ==")
    ok = True
    album = Entity("Pet Sounds", "album", "https://example.com/ps", year=1966)
    ok &= assert_eq(
        apply("The album *Pet Sounds* changed pop.", album),
        "The album [*Pet Sounds*](https://example.com/ps) changed pop.",
        "italic *Pet Sounds* becomes [*Pet Sounds*](url)",
    )
    return ok


def test_book_format():
    """Failure mode #26: books format like albums."""
    print("\n== Book formatting ==")
    ok = True
    book = Entity("Deep Blues", "book", "https://example.com/db")
    ok &= assert_eq(
        apply("Palmer's *Deep Blues* (1981) traces the form.", book),
        "Palmer's [*Deep Blues*](https://example.com/db) (1981) traces the form.",
        "italic *Deep Blues* becomes [*Deep Blues*](url), year stays outside",
    )
    return ok


def test_song_punctuation_preserved():
    """Failure mode #24: song link preserves punctuation inside quotes."""
    print("\n== Song link preserves punctuation ==")
    ok = True
    song = Entity("Are You Lonesome Tonight?", "song", "https://example.com/aylt")
    ok &= assert_eq(
        apply('Elvis sang "Are You Lonesome Tonight?" with feeling.', song),
        'Elvis sang ["Are You Lonesome Tonight?"](https://example.com/aylt) with feeling.',
        "question mark inside title preserved",
    )
    return ok


def test_already_inside_wikilink_alias():
    """Failure mode #8: don't re-link `[[...|Name]]` alias targets."""
    print("\n== Wikilink alias not re-linked ==")
    ok = True
    artist = Entity("Chuck Berry", "artist", "https://example.com/cb")
    text = "**[[Chuck Berry]]**'s vocabulary defined rock."
    ok &= assert_eq(
        apply(text, artist),
        text,
        "wikilink not touched",
    )
    return ok


def test_meta_files_helper():
    """Failure mode #18: meta-document allow-list logic."""
    print("\n== Meta-file skip helper ==")
    from propagate import _is_skipped_file
    ok = True
    ok &= assert_eq(
        _is_skipped_file("x. META/Using the MAP.md"),
        True,
        "Using the MAP is skipped",
    )
    ok &= assert_eq(
        _is_skipped_file("x. META/MAPmaking.md"),
        True,
        "MAPmaking is skipped",
    )
    ok &= assert_eq(
        _is_skipped_file("x. META/PLANS/External links audit.md"),
        True,
        "External links audit is skipped",
    )
    ok &= assert_eq(
        _is_skipped_file("x. META/SCANS/propagate.py"),
        True,
        "SCANS dir is skipped",
    )
    ok &= assert_eq(
        _is_skipped_file("ARTISTS/Chuck Berry.md"),
        False,
        "real vault content is not skipped",
    )
    return ok


def test_catalog_heading_detection():
    """Failure mode #14: catalog-section heading detection."""
    print("\n== Catalog heading detection ==")
    ok = True
    ok &= assert_eq(_is_catalog_heading("**Key artists**"), True, "Key artists")
    ok &= assert_eq(_is_catalog_heading("**Foundational records**"), True, "Foundational records")
    ok &= assert_eq(_is_catalog_heading("**See also**"), True, "See also")
    ok &= assert_eq(_is_catalog_heading("**Further reading**"), True, "Further reading")
    ok &= assert_eq(_is_catalog_heading("**Origins**"), False, "Origins is not catalog")
    ok &= assert_eq(_is_catalog_heading("**Key characteristics**"), False, "Key characteristics is not catalog (prose)")
    return ok


def test_compound_hyphenated_basic():
    """Failure mode #5: compound-hyphenated detection.

    Note: full bidirectional handling of "Goffin-King" → linking both halves
    is complex enough that it's currently handled by passing BOTH halves as
    separate Entity objects, not via auto-detection in the library. This test
    asserts that linking each half independently works."""
    print("\n== Compound-hyphenated names (linked separately) ==")
    ok = True
    goffin = Entity("Gerry Goffin", "artist", "https://example.com/gg")
    king = Entity("Carole King", "artist", "https://example.com/ck")
    text = "Gerry Goffin and Carole King wrote together."
    edits = []
    edits.extend(_collect_edits(text, goffin)[0])
    edits.extend(_collect_edits(text, king)[0])
    result = _apply_edits(text, edits)
    expected = (
        "[Gerry Goffin](https://example.com/gg) and "
        "[Carole King](https://example.com/ck) wrote together."
    )
    ok &= assert_eq(result, expected, "both halves linked when passed as separate entities")
    return ok


def test_surname_only_via_aliases():
    """Failure mode #6: surname-only mentions via Entity.aliases.

    The library doesn't auto-detect surname-only mentions because that's
    ambiguous. Instead: pass `aliases=["McGuinn"]` if the note has the
    surname-only form. This test validates that aliases work."""
    print("\n== Surname-only mentions via aliases ==")
    ok = True
    mcguinn = Entity(
        "Roger McGuinn", "artist", "https://example.com/rm",
        aliases=["McGuinn"]
    )
    # First mention by surname only (note: Jim McGuinn was his pre-1967 name)
    text = "McGuinn's Rickenbacker defined the sound."
    ok &= assert_eq(
        apply(text, mcguinn),
        "[McGuinn's](https://example.com/rm) Rickenbacker defined the sound.",
        "alias 'McGuinn' matches; possessive 's absorbed INSIDE link per convention",
    )
    return ok


def test_protected_span_detection():
    """Failure mode #7-12: _is_protected covers every kind of protected span."""
    print("\n== Protected span detection ==")
    ok = True
    text = (
        "---\ntitle: x\n---\n"
        "[link](url) `code` ```fenced\nx\n``` "
        "[[wiki]] ![[img.png]] plain text"
    )
    spans = _protected_spans(text)
    # frontmatter
    ok &= assert_eq(_is_protected(5, spans), True, "frontmatter protected")
    # markdown link inside
    link_pos = text.index("link")
    ok &= assert_eq(_is_protected(link_pos, spans), True, "markdown link protected")
    # inline code inside
    code_pos = text.index("code")
    ok &= assert_eq(_is_protected(code_pos, spans), True, "inline code protected")
    # fenced code inside
    fenced_x_pos = text.index("fenced")
    ok &= assert_eq(_is_protected(fenced_x_pos, spans), True, "fenced code protected")
    # wikilink inside
    wiki_pos = text.index("wiki")
    ok &= assert_eq(_is_protected(wiki_pos, spans), True, "wikilink protected")
    # image embed inside
    img_pos = text.index("img.png")
    ok &= assert_eq(_is_protected(img_pos, spans), True, "image embed protected")
    # plain prose outside
    plain_pos = text.index("plain")
    ok &= assert_eq(_is_protected(plain_pos, spans), False, "plain prose not protected")
    return ok


def test_shared_url_two_entities():
    """Failure mode discovered May 26 2026: when two different entities share
    a URL (because the second has no dedicated page), the old code's
    `if entity.url in line_str: skip` check produced a false positive and
    refused to link the second entity. Concrete case: Roaring Twenties the
    venue pointed at the Count Suckle Wikipedia page (Sha's note: no Roaring
    Twenties article exists); on a line where Count Suckle was already
    linked, the URL substring matched and Roaring Twenties stayed plain."""
    print("\n== Shared URL across two entities still links the second ==")
    ok = True
    venue = Entity("Roaring Twenties", "figure", "https://example.com/cs")
    text = "Stevens at the Scene, [Count Suckle](https://example.com/cs) at the Roaring Twenties, and others."
    expected = "Stevens at the Scene, [Count Suckle](https://example.com/cs) at the [Roaring Twenties](https://example.com/cs), and others."
    ok &= assert_eq(
        apply(text, venue),
        expected,
        "Roaring Twenties linked even though Count Suckle uses same URL on the line",
    )
    return ok


def test_filter_runs_per_line_not_per_file():
    """Verify the cover-version filter is per-LINE, not per-file. If filter
    matches ANY line in the file but not the line of the match, that match
    is still skipped."""
    print("\n== Filter is per-line ==")
    ok = True
    elvis_hd = Entity(
        "Hound Dog", "song", "https://example.com/elvis-hd",
        filters=["Elvis"]
    )
    text = (
        'Elvis Presley was a rock pioneer.\n'  # has "Elvis", no song
        'Big Mama Thornton cut "Hound Dog" first.\n'  # no "Elvis", has song
        'Then Elvis cut "Hound Dog" in 1956.\n'  # has "Elvis", has song
    )
    expected = (
        'Elvis Presley was a rock pioneer.\n'
        'Big Mama Thornton cut "Hound Dog" first.\n'
        'Then Elvis cut ["Hound Dog"](https://example.com/elvis-hd) in 1956.\n'
    )
    ok &= assert_eq(
        apply(text, elvis_hd),
        expected,
        "Big Mama line skipped; Elvis line linked",
    )
    return ok


# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------

ALL_TESTS = [
    test_punctuation_inside_quotes,
    test_apostrophe_variants,
    test_possessive_absorption,
    test_leading_article_case,
    test_already_linked_skip,
    test_image_embeds_skip,
    test_code_blocks_skip,
    test_frontmatter_skip,
    test_catalog_section_independent,
    test_one_link_per_section,
    test_cover_version_filter,
    test_position_drift_safety,
    test_album_year_outside,
    test_book_format,
    test_song_punctuation_preserved,
    test_already_inside_wikilink_alias,
    test_meta_files_helper,
    test_catalog_heading_detection,
    test_compound_hyphenated_basic,
    test_surname_only_via_aliases,
    test_protected_span_detection,
    test_shared_url_two_entities,
    test_filter_runs_per_line_not_per_file,
]


def main() -> int:
    print(f"Running {len(ALL_TESTS)} test functions...\n")
    failures = []
    for test in ALL_TESTS:
        result = test()
        if not result:
            failures.append(test.__name__)
    print()
    print("=" * 60)
    if failures:
        print(f"FAILED: {len(failures)}/{len(ALL_TESTS)} test functions")
        for f in failures:
            print(f"  ✗ {f}")
        return 1
    print(f"PASSED: all {len(ALL_TESTS)} test functions")
    return 0


if __name__ == "__main__":
    sys.exit(main())
