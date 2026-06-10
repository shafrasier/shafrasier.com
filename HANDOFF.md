# MAP / shafrasier.com — Session Handoff

## Overnight lab (June 10) — REVIEW FIRST
- **Unlisted prototypes at `/labs/`** (site root, NOT under `map/` — quartz build wipes `map/`):
  `labs/index.html` (landing) → `labs/nyc/` (Atlas + Time Machine, Leaflet+CARTO, curated 38-site
  dataset in `data.js`) · `labs/library/` (sources-as-arguments + idea conversation rail) ·
  `labs/proposals.html` (the full thinking + 5 open questions for Sha). Nothing on the live site
  links to these; all carry `noindex`. Key architectural proposal: **places become MAP notes**
  (frontmatter `location`/`active`) and the atlas is a generated *view*, like the graph.
- **Shipped to the real site the same night**: graph pre-settle + label-resolution cap (load lag),
  lighter idle lines (alpha .35), hover lines take the hovered node's colour, tap-drag no longer
  navigates (<500ms AND <12px), centred Connections-chip glyph, drawer = drag-to-any-height grip
  (two bars; tap toggles; resize-safe), home page scroll locked, Feedback pill hides while drawer
  up, **StreamToggle** (Apple Music ↔ Spotify-search rewrite of prose song links; skips literal
  service-name links; localStorage; pill next to dark-mode on desktop + home drawer; Formspree-style
  endpoint NOT needed — works as-is).

_Last updated: 2026-06-08. A continuity note for the next Claude Code session (and for Sha).
This file is a local, untracked note — not part of the site. To pick up where we left off,
tell Claude: **"read HANDOFF.md"**._

## Where things live (2 working folders + the vault)
- `/Users/sha/WEBSITE/shafrasier.com` — the website repo (portfolio + built MAP under `map/`).
  **Edit, build, and push from here.** Remote: github.com/shafrasier/shafrasier.com → GitHub Pages → shafrasier.com.
- `/Users/sha/MAP` — the Quartz v4.5.2 source that *generates* the MAP. Branch `v4`,
  backed up to **github.com/shafrasier/map** (private). Push source commits there too: `git -C /Users/sha/MAP push`.
- `…/iCloud~md~obsidian/Documents` — the Obsidian vault (source of all MAP content). Not edited directly.

> The old iCloud copy of the website (`…/com~apple~CloudDocs/WEBSITE/shafrasier.com`) is being
> retired — it was a redundant, corruption-prone clone. Don't use or recreate it.

## Deploying the MAP
- Easiest: double-click `~/Desktop/Refresh MAP.command` (syncs vault → builds → commits → pushes, ~20s).
- Manual: `cd /Users/sha/MAP && npx quartz build -o /Users/sha/WEBSITE/shafrasier.com/map`,
  then in the website repo: `git add -A map/ && git commit && git push`.
- GitHub Pages serves `map/` via Fastly. CSS is edge-cached (`s-maxage` 1yr) and purged on deploy —
  if you see stale styles after a deploy, give it a minute or hard-refresh.

## Working agreement
- **Reviewer gate** (CLAUDE.md rule #7): before committing non-trivial *logic* changes
  (JS/TS, Quartz components/transformers, layout & build config), run an independent review
  (`/code-review` or a reviewer subagent), fix the real findings, then commit + push.
  Skip it for pure CSS/visual tweaks — Sha reviews those on-device.
- Always commit and push after changes.

## Recent work (most recent first)
- **Liquid-glass polish release** — shipped (website `main` @ dcd033d, MAP source `v4` @ 353a47f):
  - Home site: transparent glass nav buttons; **Futura on all-caps** (`--font-display`),
    **Source Serif 4** for body (`--font-family`, all-caps override block lives at the END of
    `sections.css` so it wins by source order); removed the chromatic-edge fringe; fixed the section
    enter/return animation (root cause: CSS `transition: transform` fighting GSAP — the transition is
    now disabled during the zoom and the idle float/parallax are killed mid-transition); fixed the
    double-× on the genre back step (`showGenreView` hides `#backToGenres`); standardized
    `.playlist-nav-btn` + `.genre-folder` onto the `.floating-button` glass recipe; genre grid dropped
    to the horizon (`24vh`); glass blur raised to **14px** to kill the backdrop shimmer.
    Files: `css/{global,spatial,sections}.css`, `js/{spatial,click-wheel,liquid-glass}.js`, `index.html`.
  - MAP: graph idle-line colour now **adapts to the backdrop by geometry** (`.release-hero img`
    overlaps the graph → cream-tan `--lightgray`; else warm taupe `--tertiary`; dark theme →
    `--tertiary`); frosted **popover + search** chrome to match the graph overlay. Plus the earlier
    graph pass (visible `--gray` border, full-screen overlay, readable labels, frosted expand-icon chip).
  - Removed the vestigial `deploy.yml` from the `shafrasier/map` backup repo (it 404-failed on every
    push because Pages isn't enabled there; the live site deploys from the website repo, not this one).

## Homepage + loading animations (Sha's dictated vision) — staged A → B → C
- **✅ A. Home → MAP transition** — SHIPPED. Clicking MAP pops (liquid-glass), then the MAP's cream
  (`#f0efe4`, or `#100e0b` dark) bubbles out from the button (clip-path circle, ~0.9s) and navigates.
  `playMapTransition()` in `js/spatial.js`.
- **✅ B. MAP first-load loading screen** — SHIPPED. `LoadingScreen` component (index-only,
  once/session via `sessionStorage`, `beforeDOMLoaded` gate adds `.map-loading` before paint). Node-mark
  draws (centre dot → spokes → outer dots), spins ~2 record-speed revs + settles upright, then on reveal
  **shrinks and flies up into the top-left toolbar graph icon** (`.graph-logo`) while the cream field
  dissolves and the page washes in (mono → colour). Files: `quartz/components/LoadingScreen.tsx`,
  `scripts/loadingScreen*.inline.ts`, `styles/loadingscreen.scss`; wired in `quartz.layout.ts` afterBody.
  - **Critical fix (was invisible):** the loader hid the page with `#quartz-root{opacity:0}`, but Quartz
    renders the overlay INSIDE `#quartz-root`, so that zeroed the overlay + logo too. Now the opaque cream
    overlay covers the page by itself; the reveal **detaches the overlay to `<body>`** before applying the
    grayscale `filter` to `#quartz-root` (a non-none filter would make it the overlay's containing block
    and resize it mid-flight). Verify loader changes via cache-busted URL + forced class — the preview tool
    shares cache/sessionStorage and shows stale renders.
  - **White-flash fix (home → MAP gap):** cross-document `@view-transition{navigation:auto}` on BOTH the
    home index (`index.html`) and the MAP (`loadingscreen.scss`) cross-fades the cream hand-off; the home
    root is painted cream during the transition (its `<html>` is transparent for the Safari toolbar) and
    cleared on `pageshow` so a bfcache Back doesn't tint it; MAP-side FOUC guard `<style>` in `Head.tsx`.
    The inter-page gap is partly browser-controlled — confirm on-device (incognito) that white is gone.
- **✅ C. New MAP homepage** — FIRST PASS SHIPPED. `MapHome` component (index-only, `afterBody`, fixed
  full-viewport): a floating frosted nav **panel** (left ~1/3 — MAP wordmark + node-mark, welcome blurb,
  "About the MAP" + the ten category buttons, dark-mode) over the **always-on full graph** (right ~2/3).
  Files: `quartz/components/MapHome.tsx`, `scripts/mapHome.inline.ts`, `styles/maphome.scss`; registered in
  `components/index.ts`; wired `afterBody` (index only) in `quartz.layout.ts`.
  - **Graph** = a `.graph-container` with `data-cfg` depth -1; graph.inline.ts auto-discovers + renders it.
    Expand-to-fullscreen reuses the existing `.global-graph-icon` → `.global-graph-outer` overlay.
  - **graph.inline.ts gained resize handling** (a `ResizeObserver` per `.graph-container`, re-render only on
    real width change) — it previously read size ONCE and never resized, so a fixed/absolute landing graph
    could paint 0-wide. Also added an "already active" guard to `renderGlobalGraph` (was leaking Pixi apps
    on repeat opens). NOTE: ResizeObserver does not fire in the Claude Preview headless browser, so the
    resize/zero-width heal can only be confirmed on-device.
  - **About** button reveals the index's own article as a centered reading card (`map-about-open` on body,
    × / Esc to close); panel + graph hidden, the sidebar-less grid collapsed so the column centers.
  - Default chrome hidden on the index via `body[data-slug=index] #quartz-body .sidebar.left{display:none}`
    etc. (the `#quartz-body` ID is needed to beat the base rules' specificity). The loader now flies into the
    panel's `.graph-logo` (it picks the first VISIBLE one; the toolbar copy is hidden on the home).
  - **Iteration backlog**: graph initial center sits under the panel edge (offset it into the visible 2/3);
    panel "liquid glass" is subtle (little graph behind it on the far left); the welcome blurb is placeholder
    copy; mobile is a rough top-sheet; consider Search in the panel (deferred — two `.search` instances risk).
