/* ───────────────────────────────────────────────────────────────────────────
   Liquid glass — nav buttons
   ---------------------------------------------------------------------------
   The glass surface itself (tint, fresnel sheen, specular glint, edge lighting)
   lives in CSS on `.floating-button` (see css/spatial.css). This script does
   ONE small, non-destructive thing: it lets the specular glint follow the
   cursor by updating the --mx / --my custom properties on hover. On leave it
   falls back to the CSS default (a fixed top-left light source).

   No innerHTML rewriting, no per-frame rAF loop, no external libraries — a
   deliberate replacement for the earlier WebGL-style version, which rebuilt
   each button's DOM (breaking the <a> labels/navigation) and ran a constant
   animation loop. Respects prefers-reduced-motion.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  function track(btn) {
    btn.addEventListener("pointermove", function (e) {
      const rect = btn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      btn.style.setProperty("--mx", x.toFixed(1) + "%");
      btn.style.setProperty("--my", y.toFixed(1) + "%");
    });
    btn.addEventListener("pointerleave", function () {
      // Revert to the CSS default light origin (top-left).
      btn.style.removeProperty("--mx");
      btn.style.removeProperty("--my");
    });
  }

  function init() {
    if (window.__liquidGlassInit) return;
    window.__liquidGlassInit = true;

    // Reduced motion: keep the static glass, skip the cursor-tracked glint.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.querySelectorAll(".floating-button").forEach(track);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
