# PRD.md - Portfolio Website

Product Requirements Document for the Sha Frasier portfolio website.

---

## Product Overview

**Purpose:** Personal portfolio website for Sha Frasier showcasing creative work (music spreadsheets, curated playlists, published writing) and providing social media links.

**Target Users:**
- Visitors interested in Sha's work
- Potential collaborators
- Recruiters and hiring managers
- Music enthusiasts and fans
- Fellow music journalists and critics

**Core Experience:** Clean, dark, minimalist aesthetic with smooth animations and simple navigation. The site should feel premium and intentional, with every interaction feeling responsive and polished.

**Design Philosophy:** Less is more. Dark backgrounds, subtle animations, and focused content hierarchy guide users to explore without overwhelming them.

---

## Functional Requirements

### FR-1: Home Page Navigation

**User Story:** As a visitor, I want to quickly understand what content is available and navigate to areas of interest.

**Requirements:**
- [x] Display three primary navigation buttons: SHEETS, PLAYLISTS, WRITING
- [x] Each button triggers a slide-up page transition (0.5s duration)
- [x] Buttons have hover state (scale 1.1) and active state (scale 0.95)
- [x] Navigation feels responsive and immediate
- [x] Layout is centered and works on all screen sizes

**Acceptance Criteria:**
- Clicking SHEETS loads sheets.html with slide-up animation
- Clicking PLAYLISTS loads playlists.html with slide-up animation
- Clicking WRITING loads writing.html with slide-up animation
- Animations are smooth at 60fps
- Buttons are touch-friendly on mobile (adequate size and spacing)

**Implementation Notes:**
- Buttons use `data-destination-url` attribute for navigation target
- JavaScript adds `home-page-exit-active` class to trigger animation
- 500ms setTimeout before `window.location.href` redirect

---

### FR-2: Social Media Links

**User Story:** As a visitor, I want to easily access Sha's social media profiles.

**Requirements:**
- [x] Display icons for LinkedIn, Instagram, and Substack
- [x] Icons are visually distinct and recognizable
- [x] Clicking an icon opens the profile in a new tab
- [x] Icons have hover and active states
- [x] Icons are positioned fixed at bottom-left corner
- [x] Icons are sized appropriately (45x45px container, 8px padding)

**Acceptance Criteria:**
- LinkedIn opens https://linkedin.com/in/shafrasier in new tab
- Instagram opens https://instagram.com/shafrasier in new tab
- Substack opens https://shafrasier.substack.com in new tab
- All external links have `target="_blank"` and `rel="noopener noreferrer"`
- Icons respond to hover (scale 1.1, brightness 1.2) and active (scale 0.95, brightness 0.8) states

**Implementation Notes:**
- External link handling is automatic via JavaScript hostname check
- Icons use filter: invert(1) in dark mode to appear white
- Substack icon is white by default (no filter needed in dark mode)

---

### FR-3: Page Transitions

**User Story:** As a user, I want smooth, delightful transitions between pages that make navigation feel premium.

**Requirements:**
- [x] Forward navigation (home → subpage): Page slides up and exits (translateY -100vh)
- [x] Backward navigation (subpage → home): Page slides down and exits (translateY 100vh)
- [x] Transition duration: 0.5s with ease timing
- [x] New page loads after animation completes
- [x] No flash of content or layout shift
- [x] Animation classes removed on page load to prevent artifacts

**Acceptance Criteria:**
- Animations are consistent across all navigation actions
- Transitions maintain 60fps on mobile
- User cannot trigger multiple navigations during transition
- Direction of animation matches user's mental model (forward = up, back = down)

**Implementation Notes:**
- `@keyframes slideUpExit` for forward navigation
- `@keyframes pageExit` for backward navigation
- Classes removed on DOMContentLoaded to clean up state

---

### FR-4: Back Button

**User Story:** As a user, I want a clear way to return to the home page from any subpage.

**Requirements:**
- [x] Back button appears on all subpages (sheets, playlists, writing, pictures)
- [x] Back button positioned fixed at top center (8vh from top on most pages)
- [x] Clicking back button returns user to home page (index.html)
- [x] Triggers slide-down page transition
- [x] If page is scrolled, scrolls to top FIRST before navigating (requires second click)
- [x] Back button is visually consistent across all pages (50x50px, circular, light background)

**Acceptance Criteria:**
- Back button visible and clickable on all subpages
- Returns to index.html with slide-down animation
- Scroll-to-top behavior works smoothly
- Button styling matches design system
- Up arrow icon clearly indicates "go back/up"

**Implementation Notes:**
- Uses Font Awesome `fa-arrow-up` icon
- JavaScript checks `window.scrollY === 0` before navigating
- If not at top, calls `window.scrollTo({ top: 0, behavior: 'smooth' })`
- Exception: pictures.html uses direct href link (no JavaScript)

---

### FR-5: Dropdown System (Big Dropdowns)

**User Story:** As a user, I want to expand/collapse content sections to explore information without cluttering the page.

**Requirements:**
- [x] Clicking dropdown button toggles content visibility
- [x] Expand/collapse animation is smooth (300ms transition on max-height)
- [x] Content height is calculated dynamically using `scrollHeight`
- [x] Opening one dropdown auto-closes ALL other sibling dropdowns (accordion pattern)
- [x] Dropdown button indicates state (open vs closed) via scale and color

**Acceptance Criteria:**
- Dropdown content animates smoothly from 0 to full height
- Only one big dropdown open at a time per page
- Transition feels natural and responsive
- Works on touch and click
- State visually indicated (scale 1.1, white text when open)

**Implementation Notes:**
- Uses `.dropdown` class wrapper
- Content has `max-height: 0` by default, set to `scrollHeight` when open
- Opening a dropdown also resets all nested small dropdowns

---

### FR-6: Dropdown System (Small Dropdowns)

**User Story:** As a user, I want to expand nested content within primary sections for deeper exploration.

**Requirements:**
- [x] Small dropdowns nested within big dropdowns (HIP-HOP, ROCK)
- [x] Follow same expand/collapse behavior as big dropdowns
- [x] Maintain visual hierarchy (smaller size: 20px border-radius, 20px font, 70% width)
- [x] Opening small dropdown resizes parent big dropdown to accommodate
- [x] Closing small dropdown triggers parent resize after 300ms delay
- [x] Separator line appears after last item in small dropdown content

**Acceptance Criteria:**
- Small dropdowns toggle independently within their parent
- Styling differentiates them from big dropdowns (smaller, secondary)
- Smooth 300ms transition
- Parent dropdown resizes smoothly when children expand/collapse
- Touch/click responsive

**Implementation Notes:**
- Uses `.small-dropdown` class wrapper
- Parent `dropdown-content` max-height recalculated on child toggle
- 300ms delay on collapse to allow child animation to complete first

---

### FR-7: Theme Toggle

**User Story:** As a user, I want to switch between dark and light modes based on my preference.

**Requirements:**
- [x] Theme toggle button fixed at bottom-right corner (20px from edges)
- [x] Toggle between dark mode (default) and light mode
- [x] Theme preference persisted in localStorage
- [x] Theme applied on page load before content renders
- [x] Icon indicates what mode you'll switch TO (not current mode)
- [x] Available on all pages

**Acceptance Criteria:**
- Clicking toggle switches theme immediately
- Theme persists across page navigation and browser sessions
- Dark mode: #131313 background, #c8c8c8 text
- Light mode: #f5f5f5 background, #2a2a2a text
- Sun icon shown in dark mode (click to go light)
- Moon icon shown in light mode (click to go dark)

**Implementation Notes:**
- localStorage key: 'theme', values: 'dark' or 'light'
- `body.light-mode` class applied for light theme
- All components have light mode CSS overrides

---

### FR-8: Responsive Layout

**User Story:** As a user on any device, I want the site to look great and function perfectly.

**Requirements:**
- [x] Mobile-first responsive design
- [x] Breakpoints: 768px (mobile), 568px (short screens)
- [x] Touch targets minimum 44x44px on mobile
- [x] Buttons scale appropriately (40% width on home, 50-70% on dropdowns)
- [x] Content remains readable and accessible at all sizes
- [x] No horizontal scrolling

**Acceptance Criteria:**
- Site functions on iPhone SE (375px) and up
- Buttons are 40% width (responsive), max 300px
- All interactive elements are thumb-friendly on mobile
- Layout adapts at breakpoints
- Back button repositions on mobile (4vh from top)
- Font sizes adjust on small screens

**Implementation Notes:**
- CSS media queries for 768px and 568px breakpoints
- Viewport meta tag with `width=device-width, initial-scale=1.0`
- Flexible units (%, vh, vw) used for sizing

---

### FR-9: External Link Handling

**User Story:** As a user, I want external links to open in new tabs so I don't lose my place on the site.

**Requirements:**
- [x] All external links (different hostname) open in new tab
- [x] Security attributes applied (noopener, noreferrer)
- [x] Works for all link types (social icons, playlist links, article links)
- [x] Automatic detection via JavaScript (no manual markup needed)

**Acceptance Criteria:**
- External links have `target="_blank"`
- External links have `rel="noopener noreferrer"`
- Internal links (same hostname) open in same tab
- Detection works on dynamic content

**Implementation Notes:**
- JavaScript runs on DOMContentLoaded
- Compares `link.hostname !== window.location.hostname`
- Only applies to links starting with 'http'

---

## Non-Functional Requirements

### NFR-1: Performance

**Requirements:**
- [x] Page load time < 2 seconds on 3G
- [x] All animations maintain 60fps
- [x] No layout thrashing or reflows during animations
- [x] Minimal external dependencies

**Metrics:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Animation frame budget: 16.67ms

**Implementation Notes:**
- Use transform and opacity for animations (GPU accelerated)
- Avoid animating width, height, top, left
- Batch DOM reads before writes

---

### NFR-2: Accessibility

**Requirements:**
- [x] Keyboard navigation supported (tab order logical)
- [x] Focus states visible on all interactive elements
- [x] ARIA labels on theme toggle button
- [x] Color contrast meets WCAG AA standards
- [ ] Full screen reader compatibility (partial)

**Implementation Notes:**
- Theme toggle has `aria-label="Toggle light/dark mode"`
- Links and buttons are natively focusable
- Color contrast: #c8c8c8 on #131313 = 10.4:1 (passes AAA)

---

### NFR-3: Browser Support

**Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Chrome Mobile

**Not Supported:**
- Internet Explorer (any version)
- Opera Mini
- Legacy browsers

**Implementation Notes:**
- Uses ES6+ JavaScript (arrow functions, template literals)
- CSS Flexbox for layouts
- No polyfills included

---

### NFR-4: Code Quality

**Requirements:**
- [x] Vanilla HTML/CSS/JavaScript only
- [x] No external CSS/JS frameworks on main pages
- [x] Clean, maintainable code
- [x] Consistent file structure and naming
- [x] Semantic HTML elements

**External Dependencies (acceptable):**
- Font Awesome (icons via CDN)
- Three.js (spatial page only)
- GSAP (spatial page only)

---

## Page Content Requirements

### Sheets Page (sheets.html)

**Purpose:** Provide access to music spreadsheet data organized by decade.

**Content Structure:**
- Back button (top center)
- Vertically stacked links to Google Spreadsheets
- Theme toggle (bottom right)

**Content Items:**
| Label | Destination | Description |
|-------|-------------|-------------|
| 2020--25 | Google Sheets | Current decade music data |
| 2010--19 | Google Sheets | 2010s music data |
| 2000--09 | Google Sheets | 2000s music data |
| 1990--99 | Google Sheets | 1990s music data |
| 1980--89 | Google Sheets | 1980s music data |
| 1970--79 | Google Sheets | 1970s music data |
| 1960--69 | Google Sheets | 1960s music data |
| 1950--59 | Google Sheets | 1950s music data |

**Visual Specifications:**
- Links: 35px font size, #c8c8c8 color, white on hover
- Spacing: 20px margin-bottom between links
- Layout: Centered, vertically stacked

---

### Playlists Page (playlists.html)

**Purpose:** Provide access to curated Apple Music playlists organized by genre.

**Content Structure:**
- Back button with gradient overlay (top center)
- Scrollable list of genre dropdowns
- Each dropdown expands to show playlist links
- Some genres have nested sub-dropdowns
- Theme toggle (bottom right)

**Genre Categories (19 total):**

| Genre | Playlists | Sub-categories |
|-------|-----------|----------------|
| CAR | AIR, SUE, PRINCESS, RANGE | - |
| AMBIENT | GARDEN | - |
| BLUES | BLUE | - |
| CHILLOUT | ROOM, TRIP | - |
| CLASSICAL | POND, SNOW | - |
| COUNTRY | ASH, BARN, PORCH | - |
| DISCO | ENERGY, NUDE, RAPTURE, RINK | - |
| EDM | 17 playlists | - |
| ELECTRONIC | FOG, GLITCH, PC | - |
| FOLK | DUST, IVY, PLAINS, SMOKE, STICKS, WOODS | - |
| HIP-HOP | 9 main + 6 trap | trap (nested) |
| JAZZ | PEAKS, STARS | - |
| POP | 12 playlists | - |
| PSYCHEDELIA | CARNIVAL, CIRCUS, COSMOS, FIELD, GLASS | - |
| PUNK | LAIR, SKATE | - |
| R&B | 7 playlists | - |
| ROCK | 12 main + 10 alternative | alternative (nested) |
| WORLD | JAMROCK, PERREO, PORT, SHIBUYA | - |
| MISC | BOOM, CLOUD, HOME, HYPERROCK, MOTHER, SANDS | - |

**Visual Specifications:**
- Big dropdown buttons: 24px font, 50% width, max 300px
- Small dropdown buttons: 20px font, 70% width, max 250px
- Playlist links: 20px font, 10px padding
- Separator after last item in small dropdowns

---

### Writing Page (writing.html)

**Purpose:** Showcase published music journalism and criticism.

**Content Structure:**
- Back button (top center)
- Sections organized by publication
- Article links within each section
- Theme toggle (bottom right)

**Publications:**

**Paste Magazine:**
| Article | URL |
|---------|-----|
| The Return of Electroclash | pastemagazine.com/music/scene-report/... |

**Firebird Magazine (10 articles):**
| Article | Type |
|---------|------|
| Patterson Hood folk concert | Concert Review |
| Jon Garrett interview | Interview |
| Governors Ball 2023 preview | Festival Guide |
| Top 20 Albums of 2022 | Year-End List |
| Almost Monday at Gov Ball 2022 | Festival Coverage |
| Governors Ball 2022 preview | Festival Guide |
| New Music Highlights Jan-June 2022 | New Music |
| Dragon New Warm Mountain review | Album Review |
| Best Albums of 2021 | Year-End List |
| New Music Highlights Jan-May 2021 | New Music |

**Visual Specifications:**
- Section headings: 24px font, uppercase, letter-spacing 1.2px
- Article links: 18px font (16px on mobile)
- Spacing: 10px margin between links

---

### Pictures Page (pictures.html)

**Purpose:** Display photo gallery (hidden/unlisted page).

**Content Structure:**
- Back button (top, with margin instead of fixed)
- Single-column photo grid
- Theme toggle (bottom right)

**Current Images:**
| Image | Alt Text |
|-------|----------|
| trees.png | Description of photo 1 |
| bridge.png | Description of photo 2 |
| basketball.png | Description of photo 3 |

**Visual Specifications:**
- Grid: Single column, 4px gap
- Max width: 300px
- Photo padding-bottom: 40px
- Back button: margin-top 50px (not fixed)

**Note:** This page is NOT linked from the home page. Users must access via direct URL.

---

## Future Considerations (Not in Current Scope)

### Potential Enhancements

| Feature | Priority | Complexity |
|---------|----------|------------|
| Pictures page link on home | Low | Simple |
| Search/filter for playlists | Medium | Medium |
| Content management system | Low | Complex |
| Analytics integration | Medium | Simple |
| Contact form | Low | Medium |
| RSS feed for writing | Low | Medium |
| Playlist preview/embed | Medium | Medium |

### Technical Debt

| Item | Priority |
|------|----------|
| Add alt text to social icons | High |
| Complete ARIA labeling | Medium |
| Add favicon meta tag to HTML | Low |
| Consolidate duplicate CSS (home.css vs spatial.css social icons) | Low |

### Design System Expansion

| Item | Notes |
|------|-------|
| Convert to CSS custom properties | Would enable easier theming |
| Add animation state tokens | Standardize hover/active behaviors |
| Create component library | Extract reusable patterns |

---

## Appendix: User Flows

### Primary User Flow
```
1. User lands on home page
2. User scans available sections (SHEETS, PLAYLISTS, WRITING)
3. User clicks area of interest
4. Page transitions with slide-up animation
5. User explores content (clicks links, expands dropdowns)
6. User clicks back button
7. Page transitions with slide-down animation
8. User returns to home page
9. User may repeat for other sections
10. User may click social link to connect externally
```

### Secondary User Flow (Theme Toggle)
```
1. User arrives in dark mode (default)
2. User clicks theme toggle
3. Site switches to light mode
4. Theme is saved to localStorage
5. User navigates to other pages
6. Theme persists across pages
7. User returns days later
8. Theme is restored from localStorage
```

### Edge Case Flow (Direct URL)
```
1. User navigates directly to playlists.html
2. Page loads without transition animation
3. All dropdowns start collapsed
4. Back button is functional
5. User clicks back button
6. Page transitions to home with animation
```
