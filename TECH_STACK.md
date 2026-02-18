# TECH_STACK.md

Technical constraints and capabilities for the Sha Frasier portfolio website.

---

## Core Technologies

- **HTML5** - Semantic markup, accessibility attributes
- **CSS3** - Flexbox, animations, transitions, custom properties
- **Vanilla JavaScript** - No frameworks, ES6+ features
- **Custom Font** - Futura (500 weight) with sans-serif fallback

### External Dependencies (Spatial Page Only)

- **Three.js** (r128) - WebGL ocean wave background
- **GSAP** (3.12.2) - Advanced JavaScript animations
- **Font Awesome** - Icon library for UI elements

---

## Browser Capabilities

### What's Possible

**CSS Features:**
- CSS transitions and animations
- Keyframe animations (`@keyframes`)
- Transform properties (translate, scale, rotate)
- Flexbox layouts
- Custom properties (CSS variables)
- Media queries for responsive design
- Pseudo-elements (`::before`, `::after`)
- Filter effects (blur, brightness, invert)
- Mix-blend-mode for visual effects
- Box shadows and gradients
- Viewport units (vh, vw)

**JavaScript Capabilities:**
- DOM manipulation via `querySelector`/`querySelectorAll`
- Event listeners (click, mousemove, scroll, DOMContentLoaded)
- ClassList manipulation for state changes
- Dynamic style calculations
- `setTimeout`/`setInterval` for timing
- `requestAnimationFrame` for smooth animations
- `localStorage` for user preferences (theme persistence)
- Scroll position detection and manipulation
- Dynamic height calculations for dropdowns
- Page navigation with `window.location`

**Animation Techniques:**
- Smooth page transitions (slide up/down with translateY)
- Dropdown expand/collapse with dynamic height
- Hover, active, focus state transitions
- Scroll-triggered animations
- Parallax effects via mouse position
- Scale transforms for interactive feedback

### What's Not Possible (Without Major Architectural Changes)

**Frameworks & Libraries:**
- React, Vue, Svelte, or Angular components
- CSS-in-JS solutions (styled-components, emotion)
- Framer Motion or similar animation libraries
- Complex state management (Redux, MobX, Zustand)

**Build Tools & Preprocessing:**
- Webpack, Vite, Parcel, or other bundlers
- Package managers (npm, yarn, pnpm)
- TypeScript compilation
- CSS preprocessing (Sass, Less, Stylus)
- PostCSS transformations
- Module bundling or code splitting

**Server-Side Features:**
- Server-side rendering (SSR)
- API routes or backend logic
- Database connections
- Authentication systems
- Dynamic content generation

---

## Performance Constraints

| Metric | Target | Rationale |
|--------|--------|-----------|
| Animation FPS | 60fps | Smooth visual experience |
| Page transition | <500ms | Feels instant |
| First paint | <1s | Quick initial render |
| Total page weight | <500KB | Fast loading on mobile |

### Performance Best Practices

1. **Prefer GPU-accelerated properties**
   - Use `transform` and `opacity` for animations
   - Avoid animating `width`, `height`, `top`, `left`

2. **Avoid layout thrashing**
   - Batch DOM reads before writes
   - Use `requestAnimationFrame` for DOM updates

3. **Minimize repaints**
   - Use `will-change` sparingly for known animations
   - Isolate animated elements with `position: fixed/absolute`

4. **Optimize images**
   - Use SVG for icons when possible
   - Compress raster images (PNG, JPG)

5. **Limit external requests**
   - Self-host fonts when possible
   - Minimize third-party scripts

---

## File Structure

```
/
├── index.html              # Home page
├── index-spatial.html      # Spatial/experimental home page
├── sheets.html             # Sheets section
├── playlists.html          # Playlists section
├── writing.html            # Writing section
├── pictures.html           # Pictures section
│
├── css/
│   ├── global.css          # Shared styles, animations, theme toggle
│   ├── home.css            # Home page specific styles
│   ├── spatial.css         # Spatial page styles
│   ├── sheets.css          # Sheets page styles
│   ├── playlists.css       # Playlists page styles
│   ├── writing.css         # Writing page styles
│   └── pictures.css        # Pictures page styles
│
├── js/
│   ├── script.js           # Shared JS (navigation, dropdowns, theme)
│   └── spatial.js          # Three.js + GSAP spatial animations
│
├── fonts/                  # Jost font family files
│
├── pictures/               # Icons, logos, images
│
├── CLAUDE.md               # Development guidelines
├── DESIGN_SYSTEM.md        # Design tokens reference
└── TECH_STACK.md           # This file
```

### File Naming Conventions

- HTML: lowercase, hyphenated (`index-spatial.html`)
- CSS: lowercase, matches HTML file name (`spatial.css`)
- JS: lowercase, camelCase for multi-word (`script.js`)
- Images: lowercase, hyphenated (`linkedin-big-logo.svg`)

---

## Browser Support

### Fully Supported

| Browser | Version | Platform |
|---------|---------|----------|
| Chrome | 90+ | Desktop, Mobile |
| Firefox | 88+ | Desktop, Mobile |
| Safari | 14+ | Desktop, iOS |
| Edge | 90+ | Desktop |

### Not Supported

- Internet Explorer (any version)
- Opera Mini
- Legacy mobile browsers

### Feature Detection

The site assumes modern browser features. No polyfills are included for:
- CSS Flexbox
- CSS Custom Properties
- ES6+ JavaScript
- `localStorage`
- `requestAnimationFrame`

---

## Animation Guidelines

### When to Use CSS Transitions

```css
/* Simple state changes */
.button {
  transition: transform 0.3s ease, color 0.3s ease;
}
.button:hover {
  transform: scale(1.1);
  color: #ffffff;
}
```

**Use for:**
- Hover effects
- Focus states
- Simple show/hide
- Color changes
- Single property animations

### When to Use CSS Animations

```css
/* Looping or complex keyframe sequences */
@keyframes slideUpExit {
  0% { transform: translateY(0); }
  100% { transform: translateY(-100vh); }
}
.exit-active {
  animation: slideUpExit 0.5s ease forwards;
}
```

**Use for:**
- Page transitions
- Loading states
- Attention-grabbing effects
- Multi-step animations

### When to Use JavaScript

```javascript
/* Dynamic calculations, user interaction responses */
const height = content.scrollHeight;
content.style.maxHeight = isOpen ? `${height}px` : '0';
```

**Use for:**
- Dropdown height calculations
- Scroll position tracking
- Mouse position parallax
- Complex state management
- Coordinating multiple animations
- User preference persistence

### Animation Performance Checklist

- [ ] Only animate `transform` and `opacity` when possible
- [ ] Use `ease` or `cubic-bezier` for natural motion
- [ ] Keep durations under 500ms for interactions
- [ ] Test on actual mobile devices
- [ ] Check for janky scrolling
- [ ] Verify 60fps in DevTools Performance tab

---

## Design Implications

### What Designs Work Well

- Clean, minimal interfaces
- Subtle hover effects and micro-interactions
- Page transitions using transforms
- Dropdowns and accordions
- Fixed navigation elements
- Theme switching (dark/light)
- Parallax scrolling effects
- Grid-based layouts

### What Designs Are Challenging

- Complex drag-and-drop interfaces
- Real-time collaborative features
- Infinite scroll with virtualization
- Complex form validation
- Multi-step wizards with state
- Canvas-based drawing tools
- Video editing interfaces

### Motion Design Constraints

1. **Keep it simple** - CSS transforms can achieve most effects
2. **Plan for mobile** - Touch interactions differ from mouse
3. **Test performance** - Beautiful but slow is not acceptable
4. **Graceful degradation** - Site should work without JS animations

---

## Development Workflow

### Local Development

```bash
# Start a local server (required for ES modules, fonts)
python3 -m http.server 8080

# Or use any static file server
npx serve .
```

### Testing Checklist

- [ ] Test all page transitions
- [ ] Verify dropdown functionality
- [ ] Check theme toggle persistence
- [ ] Test on mobile viewport sizes
- [ ] Verify external links open in new tab
- [ ] Check animation timing matches design
- [ ] Test with slow network (DevTools throttling)

### Debugging Tools

- Chrome DevTools Performance tab (animation FPS)
- Chrome DevTools Animations panel (timing visualization)
- Lighthouse (performance scoring)
- Mobile device testing (real devices preferred)

---

## Future Considerations

### Potential Additions (Low Complexity)

- CSS scroll-snap for sections
- Intersection Observer for scroll animations
- Web fonts optimization (font-display: swap)
- Lazy loading for images
- Service worker for offline support

### Would Require Architecture Changes

- Component-based structure (needs framework)
- CSS modules or scoping (needs build tool)
- Hot module replacement (needs bundler)
- Automated testing (needs test runner)
- CI/CD pipeline (needs build step)

---

## Quick Reference

### Adding a New Page

1. Create `newpage.html` with proper `<head>` links
2. Create `css/newpage.css` for page-specific styles
3. Include `css/global.css` for shared styles
4. Include `js/script.js` for navigation/theme
5. Add navigation link to `index.html`
6. Test transitions and responsive behavior

### Adding a New Animation

1. Define in CSS if possible (simpler, more performant)
2. Use JavaScript only for dynamic values
3. Match existing timing tokens from DESIGN_SYSTEM.md
4. Test on mobile before committing

### Modifying Theme Colors

1. Update both dark and light mode values
2. Check all pages for consistency
3. Update DESIGN_SYSTEM.md tokens
4. Test theme toggle persistence
