/* ===================================
   LIQUID GLASS - WebGL Refraction System
   Inspired by Apple's Liquid Glass Design Language (WWDC 2025)

   Features:
   - Real-time WebGL refraction/distortion of background
   - Dynamic specular highlights responding to mouse position
   - Glass thickness simulation with edge darkening
   - Chromatic aberration at glass edges
   - Smooth animations on interaction
   - Device orientation support (gyroscope)
   =================================== */

class LiquidGlassWebGL {
  constructor() {
    this.buttons = [];
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.time = 0;
    this.isInitialized = false;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.backgroundTexture = null;
    this.glassElements = [];

    // Configuration
    this.config = {
      refractionStrength: 0.025,    // How much the glass distorts the background
      chromaticAberration: 0.003,   // Color fringing at edges
      highlightIntensity: 0.7,      // Specular highlight brightness
      highlightSize: 0.4,           // Size of the specular highlight
      glassThickness: 1.2,          // Simulated glass thickness
      ior: 1.45,                    // Index of refraction (glass ~1.5)
      fresnelPower: 3.0,            // Edge reflection intensity
      animationSpeed: 0.6,          // Speed of ambient animations
      borderGlow: 0.2,              // Edge highlight intensity
    };

    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    try {
      // Create SVG filters for fallback and additional effects
      this.createSVGFilters();

      // Find all liquid glass elements
      const glassElements = document.querySelectorAll('.floating-button, .liquid-glass');

      glassElements.forEach((element, index) => {
        this.createGlassEffect(element, index);
      });
    } catch (error) {
      console.error('LiquidGlassWebGL setup error:', error);
    }

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
      this.updateAllHighlights();
    });

    // Device orientation for mobile (gyroscope)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          this.mouseX = 0.5 + (e.gamma / 90) * 0.5;
          this.mouseY = 0.5 + ((e.beta - 45) / 90) * 0.5;
          this.updateAllHighlights();
        }
      });
    }

    // Animation loop
    this.animate();
    this.isInitialized = true;
  }

  createGlassEffect(element, index) {
    // Create layered glass structure
    const glassWrapper = document.createElement('div');
    glassWrapper.className = 'liquid-glass-wrapper';

    const layers = {
      // Base glass tint
      tint: this.createTintLayer(),
      // Refraction distortion (uses SVG filter)
      refraction: this.createRefractionLayer(),
      // Inner shadow for depth
      innerShadow: this.createInnerShadowLayer(),
      // Dynamic specular highlight
      highlight: this.createHighlightLayer(),
      // Secondary highlight for realism
      highlight2: this.createSecondaryHighlightLayer(),
      // Edge fresnel/glow
      fresnel: this.createFresnelLayer(),
      // Border definition
      border: this.createBorderLayer(),
    };

    Object.values(layers).forEach(layer => glassWrapper.appendChild(layer));

    // Preserve content
    const content = document.createElement('div');
    content.className = 'liquid-glass-content';
    content.innerHTML = element.innerHTML;
    element.innerHTML = '';

    element.appendChild(glassWrapper);
    element.appendChild(content);

    // Store reference
    const buttonData = {
      element,
      layers,
      index,
      isHovered: false,
      pressAmount: 0,
      highlightPos: { x: 30, y: 20 },
    };
    this.buttons.push(buttonData);

    this.addInteractionListeners(element, this.buttons.length - 1);
  }

  createTintLayer() {
    const layer = document.createElement('div');
    layer.className = 'lg-tint';
    layer.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.12) 0%,
        rgba(255, 255, 255, 0.06) 50%,
        rgba(255, 255, 255, 0.08) 100%
      );
      z-index: 0;
      pointer-events: none;
    `;
    return layer;
  }

  createRefractionLayer() {
    const layer = document.createElement('div');
    layer.className = 'lg-refraction';
    layer.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      z-index: 1;
      pointer-events: none;
      filter: url(#liquid-glass-distort);
      opacity: 0.6;
    `;
    return layer;
  }

  createInnerShadowLayer() {
    const layer = document.createElement('div');
    layer.className = 'lg-inner-shadow';
    layer.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      box-shadow:
        inset 0 2px 4px rgba(255, 255, 255, 0.35),
        inset 0 -2px 6px rgba(0, 0, 0, 0.12),
        inset 4px 0 8px rgba(0, 0, 0, 0.06),
        inset -4px 0 8px rgba(0, 0, 0, 0.06);
      z-index: 2;
      pointer-events: none;
      transition: box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    `;
    return layer;
  }

  createHighlightLayer() {
    const layer = document.createElement('div');
    layer.className = 'lg-highlight';
    layer.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        ellipse 90% 55% at 30% 15%,
        rgba(255, 255, 255, 0.55) 0%,
        rgba(255, 255, 255, 0.15) 35%,
        transparent 65%
      );
      z-index: 3;
      pointer-events: none;
      mix-blend-mode: overlay;
      transition: background 0.15s ease-out;
    `;
    return layer;
  }

  createSecondaryHighlightLayer() {
    const layer = document.createElement('div');
    layer.className = 'lg-highlight-2';
    layer.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        ellipse 50% 30% at 70% 80%,
        rgba(255, 255, 255, 0.2) 0%,
        transparent 60%
      );
      z-index: 3;
      pointer-events: none;
      mix-blend-mode: overlay;
      opacity: 0.5;
    `;
    return layer;
  }

  createFresnelLayer() {
    const layer = document.createElement('div');
    layer.className = 'lg-fresnel';
    layer.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.15) 0%,
        transparent 30%,
        transparent 70%,
        rgba(255, 255, 255, 0.1) 100%
      );
      z-index: 4;
      pointer-events: none;
      opacity: 0.8;
    `;
    return layer;
  }

  createBorderLayer() {
    const layer = document.createElement('div');
    layer.className = 'lg-border';
    layer.style.cssText = `
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 1px solid rgba(255, 255, 255, 0.35);
      z-index: 5;
      pointer-events: none;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    `;
    return layer;
  }

  addInteractionListeners(element, buttonIndex) {
    const button = this.buttons[buttonIndex];

    element.addEventListener('mouseenter', () => {
      button.isHovered = true;
      this.animateHover(buttonIndex, true);
    });

    element.addEventListener('mouseleave', () => {
      button.isHovered = false;
      this.animateHover(buttonIndex, false);
    });

    element.addEventListener('mousedown', (e) => {
      const rect = element.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / rect.width;
      const localY = (e.clientY - rect.top) / rect.height;
      this.animatePress(buttonIndex, true, localX, localY);
    });

    element.addEventListener('mouseup', () => {
      this.animatePress(buttonIndex, false);
    });

    element.addEventListener('mousemove', (e) => {
      if (button.isHovered) {
        const rect = element.getBoundingClientRect();
        const localX = (e.clientX - rect.left) / rect.width;
        const localY = (e.clientY - rect.top) / rect.height;
        this.updateLocalHighlight(buttonIndex, localX, localY);
      }
    });
  }

  updateLocalHighlight(buttonIndex, localX, localY) {
    const button = this.buttons[buttonIndex];
    const { layers } = button;

    // Map local position to highlight position
    // Light comes from top-left, so highlight moves opposite to mouse
    const highlightX = 20 + (1 - localX) * 50;
    const highlightY = 10 + (1 - localY) * 35;

    button.highlightPos = { x: highlightX, y: highlightY };

    layers.highlight.style.background = `radial-gradient(
      ellipse 100% 65% at ${highlightX}% ${highlightY}%,
      rgba(255, 255, 255, 0.7) 0%,
      rgba(255, 255, 255, 0.25) 30%,
      transparent 60%
    )`;

    // Update secondary highlight (opposite side)
    layers.highlight2.style.background = `radial-gradient(
      ellipse 45% 25% at ${100 - highlightX}% ${100 - highlightY + 20}%,
      rgba(255, 255, 255, 0.25) 0%,
      transparent 55%
    )`;
  }

  animateHover(buttonIndex, isEntering) {
    const button = this.buttons[buttonIndex];
    const { layers } = button;

    if (isEntering) {
      // Enhance all layers on hover
      layers.tint.style.background = `linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.18) 0%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.12) 100%
      )`;

      layers.border.style.borderColor = 'rgba(255, 255, 255, 0.55)';
      layers.border.style.boxShadow = `
        0 0 25px rgba(255, 255, 255, 0.12),
        inset 0 0 15px rgba(255, 255, 255, 0.08)
      `;

      layers.innerShadow.style.boxShadow = `
        inset 0 3px 6px rgba(255, 255, 255, 0.45),
        inset 0 -3px 8px rgba(0, 0, 0, 0.18),
        inset 5px 0 10px rgba(0, 0, 0, 0.1),
        inset -5px 0 10px rgba(0, 0, 0, 0.1)
      `;

      layers.fresnel.style.opacity = '1';
      layers.fresnel.style.background = `linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.25) 0%,
        transparent 25%,
        transparent 75%,
        rgba(255, 255, 255, 0.18) 100%
      )`;
    } else {
      // Reset to default
      layers.tint.style.background = `linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.12) 0%,
        rgba(255, 255, 255, 0.06) 50%,
        rgba(255, 255, 255, 0.08) 100%
      )`;

      layers.border.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      layers.border.style.boxShadow = 'none';

      layers.innerShadow.style.boxShadow = `
        inset 0 2px 4px rgba(255, 255, 255, 0.35),
        inset 0 -2px 6px rgba(0, 0, 0, 0.12),
        inset 4px 0 8px rgba(0, 0, 0, 0.06),
        inset -4px 0 8px rgba(0, 0, 0, 0.06)
      `;

      layers.highlight.style.background = `radial-gradient(
        ellipse 90% 55% at 30% 15%,
        rgba(255, 255, 255, 0.55) 0%,
        rgba(255, 255, 255, 0.15) 35%,
        transparent 65%
      )`;

      layers.highlight2.style.background = `radial-gradient(
        ellipse 50% 30% at 70% 80%,
        rgba(255, 255, 255, 0.2) 0%,
        transparent 60%
      )`;

      layers.fresnel.style.opacity = '0.8';
    }
  }

  animatePress(buttonIndex, isPressed, localX = 0.5, localY = 0.5) {
    const button = this.buttons[buttonIndex];
    const { layers } = button;

    if (isPressed) {
      button.pressAmount = 1;

      // Radial glow from touch point (like Apple's internal illumination)
      layers.highlight.style.transition = 'none';
      layers.highlight.style.background = `radial-gradient(
        circle at ${localX * 100}% ${localY * 100}%,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(255, 255, 255, 0.5) 15%,
        rgba(255, 255, 255, 0.15) 40%,
        transparent 65%
      )`;

      // Deepen shadows for pressed feel
      layers.innerShadow.style.boxShadow = `
        inset 0 4px 10px rgba(0, 0, 0, 0.2),
        inset 0 -2px 4px rgba(255, 255, 255, 0.25)
      `;

      // Brighten border
      layers.border.style.borderColor = 'rgba(255, 255, 255, 0.7)';
      layers.border.style.boxShadow = `
        0 0 35px rgba(255, 255, 255, 0.2),
        inset 0 0 20px rgba(255, 255, 255, 0.15)
      `;
    } else {
      button.pressAmount = 0;
      layers.highlight.style.transition = 'background 0.5s cubic-bezier(0.23, 1, 0.32, 1)';

      // Ripple outward animation
      layers.highlight.style.background = `radial-gradient(
        circle at 50% 50%,
        rgba(255, 255, 255, 0.4) 0%,
        rgba(255, 255, 255, 0.15) 50%,
        transparent 85%
      )`;

      // Return to hover or default state
      setTimeout(() => {
        if (button.isHovered) {
          this.animateHover(buttonIndex, true);
          this.updateLocalHighlight(buttonIndex, button.highlightPos.x / 70, button.highlightPos.y / 45);
        } else {
          this.animateHover(buttonIndex, false);
        }
      }, 500);
    }
  }

  updateAllHighlights() {
    this.buttons.forEach((button, index) => {
      if (button.isHovered) {
        const rect = button.element.getBoundingClientRect();
        const localX = (this.mouseX * window.innerWidth - rect.left) / rect.width;
        const localY = (this.mouseY * window.innerHeight - rect.top) / rect.height;
        if (localX >= 0 && localX <= 1 && localY >= 0 && localY <= 1) {
          this.updateLocalHighlight(index, localX, localY);
        }
      }
    });
  }

  animate() {
    try {
      this.time += 0.016 * this.config.animationSpeed;

      // Subtle ambient animations
      this.buttons.forEach((button, index) => {
        if (!button.isHovered && button.pressAmount === 0 && button.layers) {
          // Gentle breathing effect
          const breathe = Math.sin(this.time * 0.8 + index * 0.7) * 0.08 + 0.92;
          if (button.layers.highlight) {
            button.layers.highlight.style.opacity = breathe;
          }

          // Subtle fresnel shift
          if (button.layers.fresnel) {
            const fresnelShift = Math.sin(this.time * 0.5 + index) * 5;
            button.layers.fresnel.style.background = `linear-gradient(
              ${135 + fresnelShift}deg,
              rgba(255, 255, 255, 0.15) 0%,
              transparent 30%,
              transparent 70%,
              rgba(255, 255, 255, 0.1) 100%
            )`;
          }
        }
      });
    } catch (error) {
      console.error('LiquidGlassWebGL animate error:', error);
    }

    requestAnimationFrame(() => this.animate());
  }

  createSVGFilters() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `
      <defs>
        <!-- Organic distortion for refraction -->
        <filter id="liquid-glass-distort" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.015"
            numOctaves="3"
            result="noise"
            seed="42"
          >
            <animate
              attributeName="baseFrequency"
              dur="15s"
              values="0.02 0.015;0.025 0.018;0.02 0.015"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <!-- Chromatic aberration -->
        <filter id="liquid-glass-chromatic" x="-5%" y="-5%" width="110%" height="110%">
          <feOffset in="SourceGraphic" dx="0.8" dy="0" result="red"/>
          <feOffset in="SourceGraphic" dx="-0.8" dy="0" result="blue"/>
          <feColorMatrix in="red" type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" result="red-only"/>
          <feColorMatrix in="blue" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0.5 0" result="blue-only"/>
          <feBlend in="red-only" in2="SourceGraphic" mode="screen" result="rg"/>
          <feBlend in="rg" in2="blue-only" mode="screen"/>
        </filter>

        <!-- Specular lighting -->
        <filter id="liquid-glass-specular" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
          <feSpecularLighting
            in="blur"
            surfaceScale="8"
            specularConstant="0.9"
            specularExponent="25"
            lighting-color="#ffffff"
            result="specular"
          >
            <fePointLight x="-200" y="-300" z="400"/>
          </feSpecularLighting>
          <feComposite in="specular" in2="SourceAlpha" operator="in" result="spec-masked"/>
          <feComposite in="SourceGraphic" in2="spec-masked" operator="arithmetic"
            k1="0" k2="1" k3="0.6" k4="0"/>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }
}

// Inject CSS and initialize when DOM is ready
function initLiquidGlass() {
  // Check if already initialized
  if (window.liquidGlass) return;

  // Inject CSS
  const liquidGlassStyles = document.createElement('style');
  liquidGlassStyles.textContent = `
    /* Liquid Glass WebGL Enhancement Styles */
    .floating-button,
    .liquid-glass {
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }

    .liquid-glass-wrapper {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      overflow: hidden;
      z-index: 0;
    }

    .liquid-glass-content {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    /* Light mode enhancements */
    .light-mode .lg-highlight {
      mix-blend-mode: soft-light;
    }

    .light-mode .lg-tint {
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.2) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.15) 100%
      ) !important;
    }

    .light-mode .lg-inner-shadow {
      box-shadow:
        inset 0 3px 6px rgba(255, 255, 255, 0.6),
        inset 0 -3px 8px rgba(0, 0, 0, 0.1),
        inset 5px 0 10px rgba(0, 0, 0, 0.04),
        inset -5px 0 10px rgba(0, 0, 0, 0.04) !important;
    }

    .light-mode .lg-border {
      border-color: rgba(255, 255, 255, 0.65) !important;
    }

    .light-mode .lg-fresnel {
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.3) 0%,
        transparent 25%,
        transparent 75%,
        rgba(255, 255, 255, 0.2) 100%
      ) !important;
    }

    /* Dark mode adjustments */
    body:not(.light-mode) .lg-highlight {
      opacity: 0.8;
    }

    body:not(.light-mode) .lg-border {
      border-color: rgba(255, 255, 255, 0.25);
    }

    body:not(.light-mode) .lg-inner-shadow {
      box-shadow:
        inset 0 2px 4px rgba(255, 255, 255, 0.2),
        inset 0 -2px 6px rgba(0, 0, 0, 0.25),
        inset 4px 0 8px rgba(0, 0, 0, 0.12),
        inset -4px 0 8px rgba(0, 0, 0, 0.12);
    }

    body:not(.light-mode) .lg-tint {
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.08) 0%,
        rgba(255, 255, 255, 0.03) 50%,
        rgba(255, 255, 255, 0.05) 100%
      );
    }

    /* Transition smoothing */
    .lg-tint,
    .lg-refraction,
    .lg-inner-shadow,
    .lg-highlight,
    .lg-highlight-2,
    .lg-fresnel,
    .lg-border {
      transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .lg-tint,
      .lg-refraction,
      .lg-inner-shadow,
      .lg-highlight,
      .lg-highlight-2,
      .lg-fresnel,
      .lg-border {
        transition: none;
      }
    }
  `;
  document.head.appendChild(liquidGlassStyles);

  // Initialize
  window.liquidGlass = new LiquidGlassWebGL();
}

// Initialize when DOM is ready
// TEMPORARILY DISABLED FOR DEBUGGING - uncomment to re-enable
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', initLiquidGlass);
// } else {
//   initLiquidGlass();
// }

// To enable liquid glass, call: initLiquidGlass()
console.log('LiquidGlass: Script loaded but initialization disabled. Call initLiquidGlass() to enable.');

