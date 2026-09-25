# CLAUDE.md — shafrasier.com

Loaded automatically in every session in this repo. It holds **routing** and the
**project-specific** rules only.

General working principles — verification, delegation and model tiering, judgment,
communication — live in `~/.claude/CLAUDE.md`, which loads in every project. Don't
restate them here; a fact written twice drifts.

---

## Where the real documentation lives

The authoritative docs are in the *rhapsode* Obsidian vault at
`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/rhapsode/x. META/x. GEARS/`
(the vault holds `x. META/`, `MUSIC/` and `FILM/` side by side since Sept 25, 2026).
They are actively maintained. **Read the relevant one before working, and don't copy its
contents back into this file.**

| Working on | Read |
| --- | --- |
| Writing/revising notes | `rhapsode conventions.md` — templates, conventions, the close-read checklist; `rhapsode principles.md` — prose style, the reader's pass |
| Site build, components, rendering | `Site build.md` — Quartz architecture, deploy checklist, rendering lessons |
| Visitor-facing words on *rhapsode* | `rhapsode copy standards.md` — register, the de-corny rules. *rhapsode* only |
| Anything for the Continuing Education Project: its docs and its words (bringrecords.com, The Clearing, its Notion) | its own vault, `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/The Continuing Education Project/`. Everything the Project writes lives there; start with `a. Start here.md`, then `The Continuing Education Project.md`, whose voice note governs the Project's copy. The GEARS docs, including *rhapsode* copy standards, are *rhapsode*'s and never apply |
| The iOS app | `App build.md` — Capacitor shell, TestFlight |
| What to work on next | **Notion** (connector: Notion MCP). *rhapsode*: the private **rhapsode tasks** database — `https://app.notion.com/p/abab25a0e8c5423f902e02ccc1afa0ae`, data source `collection://e3a185c8-1193-4c1b-811c-100e1ff429bb`. Query it before claiming any task's state; update it when work lands or Sha adds something (new task = next number in its lane). Every task has a stable ID (`W2`, `L6`, `F1`, `X4`…) and Sha refers to work by ID; done = Status `done` + Done date, never delete. The Gate view is the go-public gate. `x. META/PLANS/rhapsode queue.md` keeps only the long-form specs. Continuing Education's tasks are a separate, shared database (`https://app.notion.com/p/bcee79827a6e421ab0e022da05bf0d37`, IDs `CE-n`). The old board artifact `9adad55b…` is a read-only archive — never write to it |

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
  (`iCloud…/Documents/rhapsode/changelog.md`, a sibling of `MUSIC/`). *Not* `content/changelog.md`,
  which is build output the sync overwrites — editing that one loses the work silently.
  One dated line in the current month's block; never plumbing.
- **Never construct an external URL.** RYM and Wikipedia slugs carry underivable
  disambiguators. Reuse a verified URL from the vault, or leave a search placeholder and
  log it in the audit doc.
- **Mastheads are data-driven** — a note renders only the fields it actually carries.
- **Run `ship_gate.py` before deploying** a note; it must report `clean ✓`.
