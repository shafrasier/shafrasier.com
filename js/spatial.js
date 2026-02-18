// ===================================
// SPATIAL NAVIGATION - THREE.JS + GSAP
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  // ===================================
  // CUSTOM CURSOR - Just the dot
  // ===================================
  const cursorInner = document.querySelector('.cursor-inner');

  document.addEventListener('mousemove', (e) => {
    cursorInner.style.left = e.clientX + 'px';
    cursorInner.style.top = e.clientY + 'px';
  });

  // ===================================
  // THREE.JS OCEAN WAVE SYSTEM
  // ===================================
  const canvas = document.getElementById('bg-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.set(0, 1, 8);
  camera.lookAt(0, 0, 0);

  // Create ocean waves - stretches to horizon
  // Check saved theme preference or default to light
  const savedTheme = localStorage.getItem('theme') || 'light';
  let currentLightMode = savedTheme === 'light';
  if (currentLightMode) {
    document.body.classList.add('light-mode');
  }

  // Create a single large ocean - no visible looping needed
  const waveGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
  const waveMaterial = new THREE.MeshBasicMaterial({
    color: currentLightMode ? 0xb0b0b0 : 0x2a2a2a,
    wireframe: true,
    transparent: true,
    opacity: currentLightMode ? 0.12 : 0.2
  });

  const ocean = new THREE.Mesh(waveGeometry, waveMaterial);
  ocean.rotation.x = -Math.PI / 2.2; // Tilt to show perspective to horizon
  ocean.position.y = -2;
  ocean.position.z = -50;
  scene.add(ocean);

  // Store original positions for wave animation
  const positions = waveGeometry.attributes.position;
  const originalPositions = new Float32Array(positions.array);

  // Animation loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // Animate waves - single ocean, no scrolling needed
    // The wave animation creates the movement illusion
    for (let i = 0; i < positions.count; i++) {
      const x = originalPositions[i * 3];
      const y = originalPositions[i * 3 + 1];

      // Create rolling wave effect that moves toward viewer
      const wave1 = Math.sin(x * 0.05 + time) * 0.3;
      const wave2 = Math.sin(y * 0.08 + time * 1.2) * 0.2;
      const wave3 = Math.sin((x + y) * 0.04 + time * 0.8) * 0.25;

      positions.array[i * 3 + 2] = wave1 + wave2 + wave3;
    }
    positions.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Adjust ocean for light mode
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(() => {
        currentLightMode = document.body.classList.contains('light-mode');

        // Force material update with new values
        waveMaterial.color.set(currentLightMode ? 0xb0b0b0 : 0x2a2a2a);
        waveMaterial.opacity = currentLightMode ? 0.12 : 0.2;
        waveMaterial.needsUpdate = true;
      }, 50);
    });
  }

  // ===================================
  // FLOATING BUTTON ANIMATIONS (GSAP)
  // ===================================
  const floatingButtons = document.querySelectorAll('.floating-button');

  // Gentle floating motion for main nav buttons (similar to playlist menu buttons)
  floatingButtons.forEach((button, index) => {
    // Subtle, constrained movement - no rotation to keep buttons level
    const floatY = 8 + Math.random() * 6; // Subtle vertical movement
    const floatX = 10 + Math.random() * 8; // Subtle horizontal movement
    const durationY = 3 + Math.random() * 1.5;
    const durationX = 3.5 + Math.random() * 2;
    const delay = index * 0.4;

    // Vertical float - gentle bobbing
    gsap.to(button, {
      y: `+=${floatY}`,
      duration: durationY,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: delay
    });

    // Horizontal drift - subtle
    gsap.to(button, {
      x: `+=${floatX}`,
      duration: durationX,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: delay + 0.3
    });
  });

  // Name fade-in (only if element exists)
  const nameContainer = document.querySelector('.name-container');
  if (nameContainer) {
    gsap.from(nameContainer, {
      opacity: 0,
      scale: 0.95,
      duration: 2,
      ease: 'power2.out',
      delay: 0.5
    });
  }

  // ===================================
  // PARALLAX EFFECT ON MOUSE MOVE
  // ===================================
  document.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

    // Move buttons slightly based on mouse position
    floatingButtons.forEach((button, index) => {
      const depth = (index + 1) * 0.5;
      gsap.to(button, {
        x: mouseX * 20 * depth,
        y: mouseY * 20 * depth,
        duration: 1,
        ease: 'power2.out'
      });
    });

    // Move name (only if element exists)
    if (nameContainer) {
      gsap.to(nameContainer, {
        x: mouseX * 10,
        y: mouseY * 10,
        duration: 1.5,
        ease: 'power2.out'
      });
    }
  });

  // ===================================
  // SINGLE-PAGE NAVIGATION WITH ZOOM
  // ===================================
  let currentSection = 'home';

  floatingButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const section = button.getAttribute('data-section');

      // Get button position to determine zoom direction
      const rect = button.getBoundingClientRect();
      const buttonCenterX = (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth;
      const buttonCenterY = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;

      // Fade out other buttons
      floatingButtons.forEach(otherButton => {
        if (otherButton !== button) {
          gsap.to(otherButton, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.in'
          });
        }
      });

      // Fade out social icons only (keep theme toggle visible)
      gsap.to('.social-icons-container', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in'
      });

      // Zoom camera into the ocean expanse - toward button position
      gsap.to(camera.position, {
        z: 0.3,
        x: buttonCenterX * 4,
        y: 0.2 + buttonCenterY * 2.5,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(buttonCenterX * 3, buttonCenterY - 0.5, -20);
        },
        onComplete: () => {
          // Show the section content
          showSection(section);
        }
      });

      // Zoom and fade the clicked button
      gsap.to(button, {
        scale: 1.5,
        opacity: 0,
        duration: 1.2,
        ease: 'power2.inOut'
      });

      currentSection = section;
    });
  });

  // Function to show section content
  function showSection(section) {
    // Hide home container
    document.querySelector('.floating-container').style.display = 'none';

    // Show section-specific content (we'll add this content to the HTML)
    const sectionContent = document.getElementById(`${section}-content`);
    if (sectionContent) {
      gsap.to(sectionContent, {
        opacity: 1,
        display: 'block',
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          // Auto-scroll sheets timeline to the right (newest decade)
          if (section === 'sheets') {
            const sheetsSection = sectionContent.querySelector('.sheets-section');
            if (sheetsSection) {
              sheetsSection.scrollLeft = sheetsSection.scrollWidth;
            }
          }
        }
      });
    }
  }

  // Back button functionality - seamless zoom out
  window.returnToHome = function() {
    const timeline = gsap.timeline();
    const floatingContainer = document.querySelector('.floating-container');

    // Reset playlists view to landing when returning home
    const playlistsLanding = document.getElementById('playlists-landing');
    const genreView = document.getElementById('genre-view');
    const miscView = document.getElementById('misc-view');
    const momentsView = document.getElementById('moments-view');
    const diaryView = document.getElementById('diary-view');
    const wheelView = document.getElementById('wheel-view');

    // Hide all sub-views
    if (wheelView) wheelView.classList.remove('active');
    if (genreView) genreView.classList.remove('active');
    if (miscView) miscView.classList.remove('active');
    if (momentsView) momentsView.classList.remove('active');
    if (diaryView) diaryView.classList.remove('active');
    // Show landing view
    if (playlistsLanding) playlistsLanding.classList.add('active');

    // Step 1: Fade out section content AND start camera zoom simultaneously
    document.querySelectorAll('.section-content').forEach(section => {
      // Immediately set display none to prevent visual glitches
      timeline.to(section, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          section.style.display = 'none';
        }
      }, 0);
    });

    // Step 2: Start camera zoom at the same time
    timeline.to(camera.position, {
      z: 8,
      x: 0,
      y: 1,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      }
    }, 0);

    // Step 3: Show and fade in home elements after section fades out (0.3s delay)
    timeline.add(() => {
      floatingContainer.style.display = 'block';
    }, 0.3);

    timeline.to(floatingButtons, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'power2.out'
    }, 0.4);

    timeline.to('.social-icons-container', {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    }, 0.4);

    currentSection = 'home';
  };

  // ===================================
  // WRITING SECTION DROPDOWNS
  // ===================================
  const writingHeaders = document.querySelectorAll('.writing-section .publication-header');

  writingHeaders.forEach(header => {
    // Start with all sections COLLAPSED by default
    const contentId = header.dataset.toggle;
    const content = document.getElementById(contentId);
    if (content) {
      content.classList.remove('expanded');
      header.classList.remove('expanded');
    }

    header.addEventListener('click', (e) => {
      // Don't toggle if clicking the link
      if (e.target.closest('.publication-name-link')) return;

      e.preventDefault();
      const contentId = header.dataset.toggle;
      const content = document.getElementById(contentId);

      if (content) {
        content.classList.toggle('expanded');
        header.classList.toggle('expanded');
      }
    });
  });
});
