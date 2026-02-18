# DESIGN_SYSTEM.md

A comprehensive design token reference for the Sha Frasier portfolio website. All values are documented with semantic naming for consistent usage across the codebase.

---

## Colors

### Background Colors

| Token Name | Value | Usage |
|------------|-------|-------|
| `color-bg-primary` | `#131313` | Main page background (dark mode) |
| `color-bg-secondary` | `rgb(28, 28, 28)` | Buttons, icons, interactive elements |
| `color-bg-tertiary` | `#282828` | Theme toggle background |
| `color-bg-elevated` | `rgb(35, 35, 35)` | Floating button hover state |
| `color-bg-light-primary` | `#f5f5f5` | Main page background (light mode) |
| `color-bg-light-secondary` | `#e8e8e8` | Buttons, icons (light mode) |
| `color-bg-light-elevated` | `#f0f0f0` | Floating button hover (light mode) |
| `color-bg-light-hover` | `#d0d0d0` | Back button hover (light mode) |

### Text Colors

| Token Name | Value | Usage |
|------------|-------|-------|
| `color-text-primary` | `#c8c8c8` | Default text, links, button labels |
| `color-text-hover` | `#ffffff` | Text on hover/active states |
| `color-text-muted` | `#333` | Back button icon |
| `color-text-light-primary` | `#2a2a2a` | Default text (light mode) |
| `color-text-light-secondary` | `#1a1a1a` | Body text (light mode) |
| `color-text-light-hover` | `#000000` | Text on hover (light mode) |

### Shadow Colors

| Token Name | Value | Usage |
|------------|-------|-------|
| `color-shadow-light` | `rgba(0, 0, 0, 0.1)` | Subtle shadows, light mode |
| `color-shadow-medium` | `rgba(0, 0, 0, 0.3)` | Default shadows |
| `color-shadow-heavy` | `rgba(0, 0, 0, 0.4)` | Floating buttons, spatial |
| `color-shadow-intense` | `rgba(0, 0, 0, 0.5)` | Hover states |
| `color-glow-white` | `rgba(255, 255, 255, 0.1)` | Illumination glow effect |

### Gradient Colors (Overlays)

| Token Name | Value | Usage |
|------------|-------|-------|
| `color-gradient-dark-start` | `rgba(19, 19, 19, 0.8)` | Header fade overlay |
| `color-gradient-dark-end` | `rgba(19, 19, 19, 0)` | Header fade overlay end |
| `color-gradient-light-start` | `rgba(245, 245, 245, 0.8)` | Header fade (light mode) |
| `color-gradient-light-end` | `rgba(245, 245, 245, 0)` | Header fade end (light mode) |

### Spotlight Colors (Spatial Page)

| Token Name | Value | Usage |
|------------|-------|-------|
| `color-spotlight-white-bright` | `rgba(255, 255, 255, 0.35)` | Spotlight center |
| `color-spotlight-white-mid` | `rgba(255, 255, 255, 0.22)` | Spotlight mid-range |
| `color-spotlight-white-soft` | `rgba(255, 255, 255, 0.12)` | Spotlight outer |
| `color-spotlight-white-fade` | `rgba(255, 255, 255, 0.05)` | Spotlight edge |
| `color-spotlight-gold-bright` | `rgba(255, 220, 100, 0.5)` | Light mode spotlight |
| `color-spotlight-gold-mid` | `rgba(255, 230, 130, 0.35)` | Light mode mid |
| `color-spotlight-gold-soft` | `rgba(255, 235, 160, 0.2)` | Light mode outer |
| `color-spotlight-gold-fade` | `rgba(255, 240, 190, 0.08)` | Light mode edge |

---

## Typography

### Font Family

| Token Name | Value | Usage |
|------------|-------|-------|
| `font-family-primary` | `Futura, sans-serif` | All text across site |
| `font-family-fallback` | `sans-serif` | System fallback |

### Font Weights

| Token Name | Value | Usage |
|------------|-------|-------|
| `font-weight-light` | `300` | Large display text, headings |
| `font-weight-normal` | `400` | Section headings |
| `font-weight-medium` | `500` | Default body text |

### Font Sizes

| Token Name | Value | Usage |
|------------|-------|-------|
| `font-size-xs` | `16px` | Mobile links |
| `font-size-sm` | `18px` | Home buttons, links |
| `font-size-md` | `20px` | Playlist items, small dropdown buttons |
| `font-size-lg` | `24px` | Dropdown buttons, floating buttons, back button icon |
| `font-size-xl` | `28px` | Mobile small height sheets link |
| `font-size-2xl` | `35px` | Sheets links |
| `font-size-3xl` | `3rem` (48px) | Section headings, name display |
| `font-size-mobile-heading` | `2rem` (32px) | Mobile name display |
| `font-size-mobile-heading-sm` | `20px` | Mobile section headings |

### Letter Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| `letter-spacing-tight` | `0.05em` | Section inner headings |
| `letter-spacing-normal` | `1.2px` | Section headings |
| `letter-spacing-wide` | `0.2em` | Name display |

### Text Transform

| Token Name | Value | Usage |
|------------|-------|-------|
| `text-transform-uppercase` | `uppercase` | Headings, buttons |

---

## Spacing

### Base Spacing Scale

| Token Name | Value | Usage |
|------------|-------|-------|
| `spacing-2xs` | `4px` | Photo grid gap |
| `spacing-xs` | `5px` | Small dropdown margin |
| `spacing-sm` | `8px` | Social icon padding |
| `spacing-md` | `10px` | Button margin, dropdown margin, playlist padding |
| `spacing-lg` | `15px` | Social icons gap, button padding vertical |
| `spacing-xl` | `20px` | Fixed position offset, content padding, margin-bottom |
| `spacing-2xl` | `25px` | Small dropdown padding horizontal |
| `spacing-3xl` | `30px` | Button padding horizontal, section margin/position |
| `spacing-4xl` | `40px` | Floating button padding horizontal, section padding |
| `spacing-5xl` | `50px` | Back button container margin-top |
| `spacing-6xl` | `60px` | Photo grid padding-top, list container offset |
| `spacing-7xl` | `70px` | Content container margin-top offset |
| `spacing-8xl` | `80px` | Section content padding-top |

### Viewport-Based Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| `spacing-vh-xs` | `3vh` | Mobile link margin-bottom |
| `spacing-vh-sm` | `4vh` | Mobile back button top |
| `spacing-vh-md` | `6vh` | Mobile padding-bottom |
| `spacing-vh-lg` | `8vh` | Back button container top |
| `spacing-vh-xl` | `15vh` | Mobile content padding-top |

---

## Sizing

### Button Dimensions

| Token Name | Value | Usage |
|------------|-------|-------|
| `size-button-width` | `40%` | Home button width |
| `size-button-width-dropdown` | `50%` | Dropdown button width |
| `size-button-width-small-dropdown` | `70%` | Small dropdown button width |
| `size-button-max-width` | `300px` | Max button width |
| `size-button-max-width-small` | `250px` | Small dropdown max width |
| `size-button-mobile-width` | `70%` | Mobile dropdown width |
| `size-button-mobile-small-width` | `50%` | Mobile small dropdown width |

### Icon Dimensions

| Token Name | Value | Usage |
|------------|-------|-------|
| `size-icon-social` | `45px` | Social icon container |
| `size-icon-theme-toggle` | `50px` | Theme toggle button |
| `size-icon-back-button` | `50px` | Back button |
| `size-icon-svg` | `24px` | Theme toggle SVG |
| `size-cursor-inner` | `6px` | Custom cursor dot |

### Logo Size Adjustments

| Token Name | Value | Usage |
|------------|-------|-------|
| `size-logo-linkedin` | `60%` / `70%` | LinkedIn logo within container |
| `size-logo-instagram` | `110%` | Instagram logo within container |
| `size-logo-substack` | `110%` | Substack logo within container |

### Container Widths

| Token Name | Value | Usage |
|------------|-------|-------|
| `size-container-content` | `90%` | Content container width |
| `size-container-max-width` | `800px` | List/content container max |
| `size-container-max-width-lg` | `1200px` | Section inner max width |
| `size-photo-grid-max-width` | `300px` | Photo grid max width |

### Separator Dimensions

| Token Name | Value | Usage |
|------------|-------|-------|
| `size-separator-width` | `20%` | Playlist item separator |
| `size-separator-height` | `2px` | Separator line height |

---

## Border Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| `radius-sm` | `5px` | Separator border radius |
| `radius-md` | `10px` | Small dropdown content |
| `radius-lg` | `20px` | Small dropdown buttons |
| `radius-xl` | `25px` | Primary buttons, dropdown buttons |
| `radius-full` | `50%` | Circular elements (icons, back button, theme toggle) |

---

## Animations

### Duration

| Token Name | Value | Usage |
|------------|-------|-------|
| `duration-fast` | `0.2s` | Back button transitions |
| `duration-normal` | `0.3s` | Element transitions, hover states |
| `duration-medium` | `0.4s` | Floating button transforms |
| `duration-slow` | `0.5s` | Page transitions, background transitions |
| `duration-slower` | `0.7s` | Spotlight effect |

### Easing Functions

| Token Name | Value | Usage |
|------------|-------|-------|
| `ease-default` | `ease` | Standard transitions |
| `ease-in-out` | `ease-in-out` | Back button transitions |
| `ease-smooth` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Floating button transforms |
| `ease-power2-out` | GSAP `power2.out` | JS animations |
| `ease-power2-in` | GSAP `power2.in` | JS fade out animations |
| `ease-power2-inout` | GSAP `power2.inOut` | JS camera zoom |
| `ease-sine-inout` | GSAP `sine.inOut` | JS floating animations |

### Transform Values

| Token Name | Value | Usage |
|------------|-------|-------|
| `scale-hover` | `1.1` | Button hover scale |
| `scale-hover-subtle` | `1.05` | Floating button hover |
| `scale-active` | `0.95` | Button active/press scale |
| `scale-active-subtle` | `1.02` | Floating button active |
| `translate-hover-y` | `-8px` | Floating button lift |
| `translate-active-y` | `-4px` | Floating button active lift |

### Keyframe Animations

| Token Name | Duration | Usage |
|------------|----------|-------|
| `animation-page-exit` | `0.5s ease forwards` | Page slide down (back) |
| `animation-slide-up-exit` | `0.5s ease forwards` | Page slide up (home to section) |

---

## Shadows

### Box Shadows

| Token Name | Value | Usage |
|------------|-------|-------|
| `shadow-sm` | `0 3px 6px rgba(0, 0, 0, 0.1)` | Small dropdown button |
| `shadow-md` | `0 4px 8px rgba(0, 0, 0, 0.1)` | Buttons, back button |
| `shadow-md-dark` | `0 4px 8px rgba(0, 0, 0, 0.3)` | Social icons, theme toggle |
| `shadow-lg` | `0 6px 16px rgba(0, 0, 0, 0.4)` | Floating button active |
| `shadow-xl` | `0 8px 24px rgba(0, 0, 0, 0.4)` | Floating buttons |
| `shadow-xl-light` | `0 8px 24px rgba(0, 0, 0, 0.1)` | Floating buttons (light mode) |
| `shadow-2xl` | `0 12px 32px rgba(0, 0, 0, 0.5)` | Floating button hover |
| `shadow-2xl-light` | `0 12px 32px rgba(0, 0, 0, 0.15)` | Floating button hover (light mode) |
| `shadow-glow` | `0 0 40px rgba(255, 255, 255, 0.1)` | Illumination glow |
| `shadow-glow-light` | `0 0 50px rgba(255, 255, 255, 0.3)` | Light mode glow |

---

## Z-Index Scale

| Token Name | Value | Usage |
|------------|-------|-------|
| `z-index-canvas` | `0` | Three.js background canvas |
| `z-index-name` | `5` | Name container |
| `z-index-floating` | `10` | Floating container |
| `z-index-section` | `50` | Section content overlays |
| `z-index-spotlight` | `100` | Spotlight pseudo-elements |
| `z-index-fixed` | `1000` | Fixed UI (back button, social icons, theme toggle) |
| `z-index-cursor` | `9999` | Custom cursor |

---

## Components

### Buttons (Primary Navigation)

**Default State:**
```css
background: rgb(28, 28, 28);          /* color-bg-secondary */
border: none;
border-radius: 25px;                   /* radius-xl */
padding: 15px 30px;                    /* spacing-lg spacing-3xl */
font-size: 18px;                       /* font-size-sm */
color: #c8c8c8;                        /* color-text-primary */
box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* shadow-md */
transition: transform 0.3s ease, color 0.3s ease;
width: 40%;
max-width: 300px;
```

**Hover State:**
```css
transform: scale(1.1);                 /* scale-hover */
color: #ffffff;                        /* color-text-hover */
```

**Active State:**
```css
transform: scale(0.95);                /* scale-active */
color: #ffffff;                        /* color-text-hover */
```

### Floating Buttons (Spatial Page)

**Default State:**
```css
background: rgb(28, 28, 28);           /* color-bg-secondary */
border-radius: 25px;                   /* radius-xl */
padding: 20px 40px;                    /* spacing-xl spacing-4xl */
font-size: 24px;                       /* font-size-lg */
color: #c8c8c8;                        /* color-text-primary */
box-shadow: 0 8px 24px rgba(0,0,0,0.4); /* shadow-xl */
transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
```

**Hover State:**
```css
transform: translateY(-8px) scale(1.05); /* translate-hover-y scale-hover-subtle */
background: rgb(35, 35, 35);             /* color-bg-elevated */
color: #ffffff;                          /* color-text-hover */
box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.1);
```

**Active State:**
```css
transform: translateY(-4px) scale(1.02); /* translate-active-y scale-active-subtle */
box-shadow: 0 6px 16px rgba(0,0,0,0.4);  /* shadow-lg */
```

### Social Icons

**Container:**
```css
width: 45px;                           /* size-icon-social */
height: 45px;                          /* size-icon-social */
padding: 8px;                          /* spacing-sm */
border-radius: 50%;                    /* radius-full */
background-color: rgb(28, 28, 28);     /* color-bg-secondary */
box-shadow: 0 4px 8px rgba(0,0,0,0.3); /* shadow-md-dark */
transition: transform 0.3s ease;
```

**Icon States:**
```css
/* Default (dark mode - LinkedIn/Instagram) */
filter: invert(1) brightness(1);

/* Hover */
transform: scale(1.1);                 /* scale-hover */
filter: invert(1) brightness(1.2);

/* Active */
transform: scale(0.95);                /* scale-active */
filter: invert(1) brightness(0.8);
```

**Container Position:**
```css
position: fixed;
bottom: 20px;                          /* spacing-xl */
left: 20px;                            /* spacing-xl */
gap: 15px;                             /* spacing-lg */
z-index: 1000;                         /* z-index-fixed */
```

### Dropdowns (Big)

**Button:**
```css
background: rgb(28, 28, 28);           /* color-bg-secondary */
border-radius: 25px;                   /* radius-xl */
padding: 15px 30px;                    /* spacing-lg spacing-3xl */
font-size: 24px;                       /* font-size-lg */
color: #c8c8c8;                        /* color-text-primary */
width: 50%;
max-width: 300px;
transition: transform 0.3s ease, color 0.3s ease;
```

**Content:**
```css
overflow: hidden;
max-height: 0;                         /* Collapsed */
background: #131313;                   /* color-bg-primary */
transition: max-height 0.3s ease;      /* duration-normal */
margin: 10px auto;                     /* spacing-md */
```

**Expanded State:**
```css
/* Button */
transform: scale(1.1);                 /* scale-hover */
color: #ffffff;                        /* color-text-hover */

/* Content */
max-height: none;                      /* Expanded */
```

### Dropdowns (Small)

**Button:**
```css
background: rgb(28, 28, 28);           /* color-bg-secondary */
border-radius: 20px;                   /* radius-lg */
padding: 10px 25px;                    /* spacing-md spacing-2xl */
font-size: 20px;                       /* font-size-md */
color: #c8c8c8;                        /* color-text-primary */
width: 70%;
max-width: 250px;
margin: 5px auto;                      /* spacing-xs */
```

**Content:**
```css
overflow: hidden;
max-height: 0;                         /* Collapsed */
background: #131313;                   /* color-bg-primary */
transition: max-height 0.3s ease;      /* duration-normal */
border-radius: 10px;                   /* radius-md */
margin: 5px auto;                      /* spacing-xs */
```

**Separator (Last Item):**
```css
width: 20%;                            /* size-separator-width */
height: 2px;                           /* size-separator-height */
margin: 10px auto;                     /* spacing-md */
background: #c8c8c8;                   /* color-text-primary */
border-radius: 5px;                    /* radius-sm */
```

### Back Button

**Default State:**
```css
width: 50px;                           /* size-icon-back-button */
height: 50px;                          /* size-icon-back-button */
background: #c8c8c8;                   /* color-text-primary */
border-radius: 50%;                    /* radius-full */
box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* shadow-md */
color: #333;                           /* color-text-muted */
font-size: 24px;                       /* font-size-lg */
transition: transform 0.2s ease-in-out, background 0.2s ease-in-out;
```

**Hover/Active State:**
```css
background: #ffffff;                   /* color-text-hover */
color: #131313;                        /* color-bg-primary */
transform: scale(1.1);                 /* scale-hover */
```

**Container Position:**
```css
position: fixed;
top: 8vh;                              /* spacing-vh-lg */
left: 50%;
transform: translateX(-50%);
z-index: 1000;                         /* z-index-fixed */
```

### Theme Toggle

**Default State:**
```css
position: fixed;
bottom: 20px;                          /* spacing-xl */
right: 20px;                           /* spacing-xl */
width: 50px;                           /* size-icon-theme-toggle */
height: 50px;                          /* size-icon-theme-toggle */
border-radius: 50%;                    /* radius-full */
background-color: #282828;             /* color-bg-tertiary */
box-shadow: 0 4px 8px rgba(0,0,0,0.3); /* shadow-md-dark */
transition: transform 0.3s ease;
z-index: 1000;                         /* z-index-fixed */
```

**SVG Icon:**
```css
width: 24px;                           /* size-icon-svg */
height: 24px;                          /* size-icon-svg */
fill: #c8c8c8;                         /* color-text-primary */
stroke: #c8c8c8;                       /* color-text-primary */
stroke-width: 2;
```

**Hover State:**
```css
transform: scale(1.1);                 /* scale-hover */
```

**Active State:**
```css
transform: scale(0.95);                /* scale-active */
```

### Custom Cursor (Spatial Page)

```css
.cursor-inner {
  width: 6px;                          /* size-cursor-inner */
  height: 6px;                         /* size-cursor-inner */
  background: #ffffff;                 /* color-text-hover */
  border-radius: 50%;                  /* radius-full */
  mix-blend-mode: difference;
  z-index: 9999;                       /* z-index-cursor */
}
```

---

## Breakpoints

| Token Name | Value | Usage |
|------------|-------|-------|
| `breakpoint-mobile` | `768px` | Mobile layout adjustments |
| `breakpoint-mobile-height` | `568px` | Short screen adjustments |

---

## Filter Values

| Token Name | Value | Usage |
|------------|-------|-------|
| `filter-invert` | `invert(1)` | Dark mode icon inversion |
| `filter-brightness-default` | `brightness(1)` | Default brightness |
| `filter-brightness-hover` | `brightness(1.2)` | Hover brightness boost |
| `filter-brightness-active` | `brightness(0.8)` | Active brightness dim |
| `filter-blur-spotlight` | `blur(40px)` | Spotlight blur effect |

---

## Usage Guidelines

### When to Use Each Token

1. **Colors**: Always use semantic color tokens. Never hardcode hex values directly.
2. **Spacing**: Use the spacing scale for all margins, paddings, and gaps.
3. **Sizing**: Reference size tokens for consistent component dimensions.
4. **Animations**: Use duration and easing tokens for all transitions.
5. **Shadows**: Apply shadow tokens based on elevation level.

### Light Mode Considerations

All components have light mode variants. When adding new components:
- Define dark mode styles first
- Add `body.light-mode` prefixed selectors for light mode overrides
- Invert icon colors as needed using filter properties

### Mobile Responsiveness

- Use `@media (max-width: 768px)` for mobile layouts
- Use `@media (max-height: 568px)` for short screen adjustments
- Disable custom cursors on mobile
- Center and stack elements vertically on mobile
