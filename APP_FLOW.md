# APP_FLOW.md

Complete documentation of user journeys through the Sha Frasier portfolio website.

---

## Overview

Static portfolio site with 5 pages and animated navigation. Each page follows a consistent pattern: navigation from home → content page → back to home.

**Pages:**
- `index.html` - Home (main navigation hub)
- `sheets.html` - Music spreadsheets by decade
- `playlists.html` - Curated Apple Music playlists by genre
- `writing.html` - Published articles and reviews
- `pictures.html` - Photo gallery (hidden/unlisted)

**Global Features (all pages):**
- Theme toggle (dark/light mode, persisted in localStorage)
- Dark background (#131313) as default
- Light mode available (#f5f5f5)

---

## Home Page (index.html)

### User Arrives at Site

**Initial View:**
- Centered layout with vertical button stack
- Three main section buttons: SHEETS, PLAYLISTS, WRITING
- Social media icons fixed at bottom-left: LinkedIn, Instagram, Substack
- Theme toggle button fixed at bottom-right
- Dark background (#131313)

**Visual Layout:**
```
        [SHEETS]
       [PLAYLISTS]
        [WRITING]

[social icons]          [theme toggle]
```

### Available Actions

| Action | Trigger | Animation | Result |
|--------|---------|-----------|--------|
| Navigate to Sheets | Click SHEETS button | `slideUpExit` - page slides up (translateY(-100vh)), 0.5s | `sheets.html` loads |
| Navigate to Playlists | Click PLAYLISTS button | `slideUpExit` - page slides up, 0.5s | `playlists.html` loads |
| Navigate to Writing | Click WRITING button | `slideUpExit` - page slides up, 0.5s | `writing.html` loads |
| Open LinkedIn | Click LinkedIn icon | No animation | Opens `linkedin.com/in/shafrasier` in new tab |
| Open Instagram | Click Instagram icon | No animation | Opens `instagram.com/shafrasier` in new tab |
| Open Substack | Click Substack icon | No animation | Opens `shafrasier.substack.com` in new tab |
| Toggle theme | Click moon/sun icon | Icon swap | Toggles between dark/light mode, saves to localStorage |

### Button States

**Default:**
- Background: `rgb(28, 28, 28)`
- Text: `#c8c8c8`
- Border radius: 25px

**Hover:**
- Scale: 1.1
- Text: `#ffffff`

**Active:**
- Scale: 0.95
- Text: `#ffffff`

---

## Sheets Page (sheets.html)

### Entry Point

- User clicked SHEETS from home page
- Page loads after 0.5s slide-up transition
- Direct URL access also works (no transition animation)

### Content Structure

**Back Button:** Fixed at top center (8vh from top)
- Up arrow icon (Font Awesome)
- Returns to home page

**Content:** Vertically stacked links to Google Spreadsheets organized by decade
- 2020--25 (current decade)
- 2010--19
- 2000--09
- 1990--99
- 1980--89
- 1970--79
- 1960--69
- 1950--59

Each link opens a Google Sheets document containing music data for that decade.

### Available Actions

| Action | Trigger | Animation | Result |
|--------|---------|-----------|--------|
| Return to home | Click back button (at scroll top) | `pageExit` - page slides down (translateY(100vh)), 0.5s | `index.html` loads |
| Scroll to top first | Click back button (scrolled down) | Smooth scroll to top | Page scrolls to top, must click again to navigate |
| View decade sheet | Click any decade link | No animation | Opens Google Sheets in new tab |
| Toggle theme | Click moon/sun icon | Icon swap | Toggles dark/light mode |

### Back Button Behavior (Special)

```
if (window.scrollY === 0) {
  // Animate and navigate to home
} else {
  // Scroll to top first, require second click
}
```

---

## Playlists Page (playlists.html)

### Entry Point

- User clicked PLAYLISTS from home page
- Page loads after 0.5s slide-up transition
- Page is scrollable (content exceeds viewport)

### Content Structure

**Back Button:** Fixed at top center with gradient fade overlay
- Gradient prevents content from showing behind button while scrolling

**Content:** Dropdown-based navigation organized by music genre

**Genre Categories (Big Dropdowns):**
1. CAR (4 playlists)
2. AMBIENT (1 playlist)
3. BLUES (1 playlist)
4. CHILLOUT (2 playlists)
5. CLASSICAL (2 playlists)
6. COUNTRY (3 playlists)
7. DISCO (4 playlists)
8. EDM (17 playlists)
9. ELECTRONIC (3 playlists)
10. FOLK (6 playlists)
11. HIP-HOP (nested dropdown + 9 playlists)
12. JAZZ (2 playlists)
13. POP (12 playlists)
14. PSYCHEDELIA (5 playlists)
15. PUNK (2 playlists)
16. R&B (7 playlists)
17. ROCK (nested dropdown + 12 playlists)
18. WORLD (4 playlists)
19. MISC (6 playlists)

**Nested Dropdowns (Small Dropdowns):**
- HIP-HOP contains "trap" sub-dropdown (6 playlists)
- ROCK contains "alternative" sub-dropdown (10 playlists)

### Available Actions

| Action | Trigger | Animation | Result |
|--------|---------|-----------|--------|
| Return to home | Click back button | `pageExit` (if at top) or scroll to top | Navigate or scroll |
| Open genre dropdown | Click dropdown button | `max-height` transition, 0.3s | Content expands, siblings collapse |
| Close genre dropdown | Click open dropdown button | `max-height` transition, 0.3s | Content collapses |
| Open sub-dropdown | Click small dropdown button | `max-height` transition, parent resizes | Sub-content expands |
| Play playlist | Click playlist name | No animation | Opens Apple Music in new tab |
| Toggle theme | Click moon/sun icon | Icon swap | Toggles dark/light mode |

### Dropdown Behavior

**Big Dropdown Click:**
1. Close ALL other big dropdowns
2. Reset ALL small dropdowns inside closed big dropdowns
3. Toggle clicked dropdown (open if closed, close if open)
4. Animate `max-height` from 0 to `scrollHeight`

**Small Dropdown Click:**
1. Close sibling small dropdowns within same parent
2. Toggle clicked small dropdown
3. Recalculate parent dropdown height to accommodate expanded content

**Auto-Collapse Rules:**
- Opening any big dropdown closes all others
- Opening a small dropdown closes sibling small dropdowns
- Closing a big dropdown resets all its children

---

## Writing Page (writing.html)

### Entry Point

- User clicked WRITING from home page
- Page loads after 0.5s slide-up transition
- Page is scrollable

### Content Structure

**Back Button:** Fixed at top center

**Content:** Published articles organized by publication

**Section 1: Paste Magazine**
- "The Return of Electroclash" (pastemagazine.com)

**Section 2: Firebird Magazine**
- Publication link: firebirdmagazine.com
- 10 article links:
  - Patterson Hood folk concert review
  - Jon Garrett interview on music criticism
  - Governors Ball 2023 preview
  - Top 20 Albums of 2022
  - Almost Monday at Gov Ball 2022
  - Governors Ball 2022 preview
  - New Music Highlights Jan-June 2022
  - Big Thief album review (Dragon New Warm Mountain)
  - Best Albums of 2021
  - New Music Highlights Jan-May 2021

### Available Actions

| Action | Trigger | Animation | Result |
|--------|---------|-----------|--------|
| Return to home | Click back button | `pageExit` or scroll to top | Navigate or scroll |
| Read Paste article | Click article link | No animation | Opens Paste Magazine in new tab |
| Visit Firebird | Click "Firebird" heading link | No animation | Opens firebirdmagazine.com in new tab |
| Read Firebird article | Click article link | No animation | Opens article in new tab |
| Toggle theme | Click moon/sun icon | Icon swap | Toggles dark/light mode |

---

## Pictures Page (pictures.html)

### Entry Point

- **Hidden/unlisted page** - No navigation link from home
- User must know direct URL or access via browser history
- Back button links directly to `index.html` (no JavaScript animation)

### Content Structure

**Back Button:** Positioned with margin-top (not fixed)
- Direct `href="index.html"` link (not JavaScript-driven)

**Content:** Photo grid layout (single column)
- trees.png
- bridge.png
- basketball.png
- (More images indicated by comment)

### Available Actions

| Action | Trigger | Animation | Result |
|--------|---------|-----------|--------|
| Return to home | Click back button | No slide animation (direct link) | `index.html` loads immediately |
| View photos | Scroll page | Standard scroll | See additional photos |
| Toggle theme | Click moon/sun icon | Icon swap | Toggles dark/light mode |

### Notes

- This page uses a different back button implementation (direct href vs. JavaScript)
- No smooth scroll-to-top behavior before navigation
- Grid layout is 1 column, max-width 300px

---

## Navigation Patterns

### Page Transitions

**Forward Navigation (Home → Subpage):**
```css
@keyframes slideUpExit {
  0% { transform: translateY(0); }
  100% { transform: translateY(-100vh); }
}
```
- Duration: 0.5s
- Easing: ease
- Page appears to slide up and out of view
- New page loads after animation completes

**Backward Navigation (Subpage → Home):**
```css
@keyframes pageExit {
  0% { transform: translateY(0); }
  100% { transform: translateY(100vh); }
}
```
- Duration: 0.5s
- Easing: ease
- Page appears to slide down and out of view
- Home page loads after animation completes

### Back Button Behavior

**Standard (sheets, playlists, writing):**
```javascript
if (window.scrollY === 0) {
  // Add exit animation class
  // Wait 500ms
  // Navigate to index.html
} else {
  // Smooth scroll to top
  // User must click again to navigate
}
```

**Pictures page exception:**
- Direct `<a href="index.html">` link
- No JavaScript interception
- No scroll-to-top behavior
- Instant navigation

### External Links

All external links are automatically:
1. Detected by comparing `link.hostname !== window.location.hostname`
2. Given `target="_blank"` attribute
3. Given `rel="noopener noreferrer"` for security

**External Link Destinations:**
- LinkedIn: linkedin.com/in/shafrasier
- Instagram: instagram.com/shafrasier
- Substack: shafrasier.substack.com
- Google Sheets: docs.google.com/spreadsheets/...
- Apple Music: music.apple.com/us/playlist/...
- Paste Magazine: pastemagazine.com
- Firebird Magazine: firebirdmagazine.com

### Dropdown Behavior

**Big Dropdowns:**
- Click to toggle open/closed
- Only one can be open at a time (accordion pattern)
- Animation: `max-height` transition, 0.3s ease
- Visual states: scale(1.1) and white text when open

**Small Dropdowns (nested):**
- Only exist within HIP-HOP and ROCK dropdowns
- Same accordion behavior within their parent
- Parent dropdown resizes to accommodate expanded children
- Separator line appears after last item in small dropdown

---

## Edge Cases

### Direct URL Access

| Scenario | Behavior |
|----------|----------|
| Navigate directly to `sheets.html` | Page loads without transition, back button works normally |
| Navigate directly to `playlists.html` | Page loads, all dropdowns start collapsed |
| Navigate directly to `pictures.html` | Page loads, back button uses direct link |
| Refresh any page | Exit animation classes removed on DOMContentLoaded |

### Theme Persistence

| Scenario | Behavior |
|----------|----------|
| First visit | Dark mode (default) |
| Toggle to light mode | Saved to localStorage, persists across pages |
| Return visit | Theme restored from localStorage |
| Clear localStorage | Reverts to dark mode |

### Empty/Missing Content

| Scenario | Behavior |
|----------|----------|
| Empty dropdown | Would show empty expanded area (none currently exist) |
| Broken image in pictures | Standard browser broken image behavior |
| External link 404 | Standard browser 404 in new tab |

### No JavaScript

| Feature | Graceful Degradation |
|---------|---------------------|
| Page transitions | No animation, links work normally via href |
| Dropdowns | Would not expand (content hidden with max-height: 0) |
| Back button | Would not work (href is javascript:void(0)) |
| Theme toggle | Would not work |
| External link targets | Would open in same tab |

### Mobile vs Desktop

| Aspect | Behavior |
|--------|----------|
| Navigation flow | Identical on all viewports |
| Touch targets | Buttons sized at 40% width, adequate for touch |
| Dropdowns | Same tap behavior as click |
| Page transitions | Same animations |
| Scroll behavior | Native momentum scrolling |

---

## User Goals by Page

### Home Page
**Primary Goal:** Discover what the site offers and navigate to areas of interest

**User Questions Answered:**
- What content does Sha Frasier share? (Sheets, Playlists, Writing)
- How can I connect? (Social links)
- What's the visual style? (Dark, minimal, animated)

### Sheets Page
**Primary Goal:** Access decade-specific music spreadsheets

**User Questions Answered:**
- How does Sha organize music data? (By decade)
- Where can I see what music was notable in the 90s? (Click 1990--99)
- How far back does the data go? (1950s)

### Playlists Page
**Primary Goal:** Discover and play curated playlists by genre/mood

**User Questions Answered:**
- What genres does Sha curate? (19 categories)
- What's good for a road trip? (CAR dropdown)
- What trap playlists exist? (HIP-HOP → trap sub-dropdown)
- How do I play these? (Links open Apple Music)

### Writing Page
**Primary Goal:** Read Sha's published music journalism

**User Questions Answered:**
- Where has Sha been published? (Paste, Firebird)
- What topics does Sha write about? (Concerts, interviews, lists, reviews)
- How recent is the writing? (2021-2023)

### Pictures Page
**Primary Goal:** View photo gallery (hidden feature)

**User Questions Answered:**
- Does Sha do photography? (Yes, hidden page)
- What subjects? (Nature, urban, sports based on current images)

---

## Flow Diagrams

### Main Navigation Flow

```
                    ┌─────────────┐
                    │   HOME      │
                    │ index.html  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │  SHEETS   │    │ PLAYLISTS │    │  WRITING  │
    │sheets.html│    │playlists. │    │writing.   │
    └─────┬─────┘    │   html    │    │   html    │
          │          └─────┬─────┘    └─────┬─────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
                    (Back Button)
                           │
                           ▼
                    ┌─────────────┐
                    │   HOME      │
                    └─────────────┘
```

### Dropdown Interaction Flow

```
User clicks dropdown
        │
        ▼
┌───────────────────┐
│ Close all other   │
│ big dropdowns     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Was this dropdown │
│ already open?     │
└────────┬──────────┘
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
 Close     Open with
  it       animation
```

### Back Button Flow

```
User clicks back button
         │
         ▼
┌─────────────────────┐
│ Is scrollY === 0?   │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
    YES          NO
     │           │
     ▼           ▼
┌──────────┐  ┌──────────────┐
│ Add exit │  │ Smooth scroll│
│ animation│  │ to top       │
└────┬─────┘  └──────────────┘
     │
     ▼
┌──────────┐
│ Wait     │
│ 500ms    │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Navigate │
│ to home  │
└──────────┘
```
