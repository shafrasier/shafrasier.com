# CLAUDE.md — shafrasier.com

Loaded automatically in every session in this repo. It holds **routing** and the
**project-specific** rules only.

General working principles — verification, delegation and model tiering, judgment,
communication — live in `~/.claude/CLAUDE.md`, which loads in every project. Don't
restate them here; a fact written twice drifts.

---

## Where the real documentation lives

The authoritative docs are in the Obsidian vault at
`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MUSIC/x. META/x. GEARS/`.
They are actively maintained. **Read the relevant one before working, and don't copy its
contents back into this file.**

| Working on | Read |
| --- | --- |
| Writing/revising MAP notes | `Using the MAP.md` — templates, conventions, the close-read checklist |
| Site build, components, rendering | `Site build.md` — Quartz architecture, deploy checklist, rendering lessons |
| Any visitor-facing words | `Copy standards.md` — register, the de-corny rules |
| The iOS app | `App build.md` — Capacitor shell, TestFlight |
| What to work on next | `x. META/PLANS/MAPmaking.md` — the task queue |

## Layout

`map/` — built Quartz output. **Never hand-edit**; `quartz build` wipes the directory.
The source is `/Users/sha/MAP`; deploy with its `refresh-map.command`, which also syncs
the iOS app bundle. Sessions run from **this** repo and operate on `/Users/sha/MAP` from
here, which is why that repo carries no `CLAUDE.md` and needs none.

`labs/` prototypes (unlisted, noindex — every new one gets a card on `labs/index.html` in
the same commit) · `atlas/` the NYC map's assets, incl. a 33MB pmtiles archive ·
`26/` · `newsletter/` · `pictures/`, `css/`, `js/`, `fonts/` (the older personal site).

## Project rules

- **Every substantive ship updates the changelog** — the **vault-root** `changelog.md`
  (`iCloud…/Documents/changelog.md`, a sibling of `MUSIC/`). *Not* `content/changelog.md`,
  which is build output the sync overwrites — editing that one loses the work silently.
  One dated line in the current month's block; never plumbing.
- **Never construct an external URL.** RYM and Wikipedia slugs carry underivable
  disambiguators. Reuse a verified URL from the vault, or leave a search placeholder and
  log it in the audit doc.
- **Mastheads are data-driven** — a note renders only the fields it actually carries.
- **Run `ship_gate.py` before deploying** a note; it must report `clean ✓`.
