# MAP — June 9 review batch (from Sha's dictation)

Answers: feedback = **hosted form** (I build form + mailto fallback; Sha pastes a Formspree
form ID later). Content data = **edit the Obsidian vault** (review in Obsidian; vault is NOT
git-tracked). Genre picker = **full multi-parent from the start**. Add-ons = **all four**
(hover preview, panel search, first-visit hint, color legend).

Vault: `/Users/sha/Library/Mobile Documents/iCloud~md~obsidian/Documents` — genres live under
`MUSIC/TAXONOMY/GENRES/` in the vault (flattened to `MUSIC/GENRES/` on the site by refresh-map).

## Batch 1 — Homepage polish (no content) — ✅ SHIPPED
- [x] Wordmark → composes the real PageTitle (serif/500, exact match)
- [x] Panel ~30% skinnier
- [x] Node logo bigger
- [x] Node-mark decorative on home — pointer-events:none (no hover/click), still loader target
- [x] Remove the top-right ⤢ expand button
- [x] Sidebar footer: Created by Sha Frasier · Brooklyn, NY · 2026 · Contact (→ portfolio root /)
- [x] About → floating frosted card over the graph (article moved into a sibling card)
- [x] Chrome cohesion (compose PageTitle/Darkmode; quiet serif nav)

## Batch 2 — Graph look + behavior
- [x] Link color: softer (idle alpha 0.7→0.5)  ·  may want lighter colour too — see live
- [x] Node-label halo: thinner (5x→3x) + 600-weight text
- [x] Prune structural nodes (all index.md landings: ARTISTS/IDEAS/INDUSTRY/MOMENTS/RELEASES/
      TECHNIQUES/SOURCES/BLUES + the home) — verified 9 pruned, 121 real notes kept
- [ ] Node hover preview [add-on] — QUEUED
- [ ] First-visit hint [add-on] — QUEUED
- [ ] Node color legend [add-on] — QUEUED

## Batch 3 — Loading glitches — QUEUED (need Sha's on-device eyes; can't repro cold load locally)
- [ ] Lingering white flash on MAP entry
- [ ] "Half-covered cream" moment while the loader comes up
- [ ] Loader logo distorts as it shrinks+zooms to the corner

## Batch 4 — Umbrella landing pages — ✅ PARTLY SHIPPED
- [x] Remove the filter bar from Releases, Techniques, Industry
- [x] Remove the local connections box from ALL folder/list pages (global overlay stays reachable)
- [ ] Scenes → timeline page + per-scene LOCATION callout [vault] — QUEUED (needs location data)

## Batch 5 — About page — QUEUED [vault: index.md]
- [ ] Rewrite the "What's inside" table to the new category order

## Batch 6 — Genres umbrella picker — QUEUED (biggest; needs taxonomy review with Sha) [vault]
- [ ] Add multi-parent `parentGenres` frontmatter to every genre note (Sha chose full multi-parent)
- [ ] Genres-page picker → hierarchical umbrella filter

## Batch 7 — Panel search [add-on] — QUEUED
- [ ] Clean search in the panel, '/' to focus; avoid the duplicate `.search` instance bug

## Batch 8 — Feedback form — ✅ SHIPPED (email fallback)
- [x] Floating "Feedback" button → frosted popover form (message + optional email, auto-tags page URL)
- [x] Email fallback live; `FEEDBACK_ENDPOINT` constant in feedback.inline.ts for Sha's Formspree URL
- [ ] Sha: create a free Formspree form + paste the endpoint to switch to silent in-page submit
