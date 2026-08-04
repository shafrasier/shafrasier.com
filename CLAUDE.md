# CLAUDE.md

This file is loaded into context automatically at the start of every session in this
repo. That is its only real advantage over every other document here — so it holds
**behavior** and **routing**, and deliberately holds no facts that live somewhere else.
Facts written twice drift apart: the previous version described a portfolio site of
`sheets.html` / `playlists.html` / `writing.html` that had not existed for months, while
never once mentioning `map/`, `labs/`, `atlas/`, or `26/` (rewritten August 4, 2026).

---

## Where the real documentation lives

The authoritative docs are in the Obsidian vault, at
`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MUSIC/x. META/x. GEARS/`.
They are actively maintained. **Read the relevant one before working; do not work from
memory, and do not copy their contents back into this file.**

| Working on | Read |
| --- | --- |
| Writing/revising MAP notes | `Using the MAP.md` — templates, conventions, the close-read checklist |
| Site build, components, rendering | `Site build.md` — Quartz architecture, deploy checklist, hard-won rendering lessons |
| Any visitor-facing words | `Copy standards.md` — register, the de-corny rules |
| The iOS app | `App build.md` — Capacitor shell, TestFlight |
| What to work on next | `x. META/PLANS/MAPmaking.md` — the task queue |

Deploy with `refresh-map.command` in `/Users/sha/MAP`. The Quartz **source** lives at
`/Users/sha/MAP`; its built output is committed here under `map/`. Sessions run from
**this** repo — `/Users/sha/MAP` is operated on from here, which is why the MAP repo
carries no CLAUDE.md of its own and needs none.

## What lives in this repo

`map/` (built Quartz output — never hand-edit; `quartz build` wipes it) · `labs/`
(prototypes, unlisted + noindex) · `atlas/` (the NYC map's assets, incl. a 33MB pmtiles
archive) · `26/` · `newsletter/` · `pictures/`, `css/`, `js/`, `fonts/` (the older
personal site).

---

## Non-negotiables

Each of these was established by a correction. Breaking one is a real error, not a style
slip.

- **Commit and push after every change**, without being asked. (The previous version of
  this file said "ask before pushing" — directly contradicting the standing rule.)
- **Every substantive ship updates the changelog** — the VAULT-ROOT `changelog.md`
  (`iCloud…/Documents/changelog.md`, a sibling of `MUSIC/`, *not* `content/changelog.md`,
  which is build output the sync overwrites). One dated line, current month's block.
- **Never construct a URL.** Reuse a verified one from the vault, or leave a search
  placeholder and log it. Constructed RYM/Wikipedia slugs are wrong more often than right.
- **Never invent a fact, a field, or a metadata value.** Mastheads are data-driven; a note
  shows only what it carries.
- **Verify before claiming done.** Measure rendered pixels, open the built artifact, load
  the real page. "Should work" is not a report.

## How to work

- **Surface assumptions before building** anything non-trivial, and state them plainly.
- **Stop when confused.** Name the specific confusion and ask. Exception: a clear bug with
  clear repro — just fix it.
- **Push back when the approach has a real problem.** Say the concrete downside, propose
  the alternative, then accept the decision. Sycophancy is a failure mode.
- **Prefer the boring solution.** If 1,000 lines do what 100 would, that is a failure. Ask
  "would a senior engineer say *why didn't you just…*?"
- **Touch only what was asked for.** Don't refactor adjacent code, remove comments you
  don't understand, or delete things that merely look unused.
- **Find the root cause.** Several long-running bugs here were misdiagnosed more than once
  before someone read the actual cascade — an inherited `img` margin, a runtime-injected
  stylesheet winning on source order, a `resize()` that no-ops before the style loads.
- **Fix forward when a correction lands.** Record durable lessons in the GEARS docs (the
  shared record), not only in session memory.

## Communication

Be direct about problems and quantify where possible. Say what was verified and how, what
was skipped, and what remains open. If something is uncertain, say so rather than dressing
it up — a confident wrong answer costs more than an honest gap.
