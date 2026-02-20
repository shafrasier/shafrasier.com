/* ===================================
   CLICK WHEEL - iPod-style Playlist Browser
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const playlistsLanding = document.getElementById('playlists-landing');
  const genreView = document.getElementById('genre-view');
  const miscView = document.getElementById('misc-view');
  const momentsView = document.getElementById('moments-view');
  const diaryView = document.getElementById('diary-view');
  const wheelView = document.getElementById('wheel-view');
  const genreFolders = document.querySelectorAll('.genre-folder:not(.sequences-folder)');
  const backToHome = document.getElementById('backToHome');
  const backToGenres = document.getElementById('backToGenres');
  const currentGenreLabel = document.getElementById('currentGenreLabel');
  const artworkContainer = document.getElementById('artworkContainer');
  const playlistArtwork = document.getElementById('playlistArtwork');
  const playlistName = document.getElementById('playlistName');
  const subgenrePills = document.getElementById('subgenrePills');
  const wheelPrev = document.getElementById('wheelPrev');
  const wheelNext = document.getElementById('wheelNext');
  const wheelCenter = document.getElementById('wheelCenter');
  const wheelIndicator = document.getElementById('wheelIndicator');
  const searchBar = document.getElementById('playlistSearch');
  const diaryPasswordInput = document.getElementById('diaryPassword');
  const playlistNavBtns = document.querySelectorAll('.playlist-nav-btn');
  const playlistsBackBtns = document.querySelectorAll('.playlists-back');

  // State
  let currentGenre = null;
  let currentPlaylists = [];
  let currentIndex = 0;
  let currentSubgenre = null;
  let isAnimating = false;
  let currentPlaylistView = 'playlists-landing';
  let previousGenreView = 'genre-view'; // Track which view to return to from wheel

  // ===================================
  // PLAYLISTS NAVIGATION WITH CAMERA SWIVEL
  // ===================================

  // Camera reference from spatial.js
  let camera = null;

  // Try to get camera reference
  function getCamera() {
    // The camera is set up in spatial.js - we need to access it
    // For now, we'll use CSS transforms for the swivel effect
    return null;
  }

  function showPlaylistsView(viewId, direction = 'center') {
    const views = [playlistsLanding, genreView, miscView, momentsView, diaryView, wheelView];
    const targetView = document.getElementById(viewId);

    if (!targetView) return;

    // Calculate animation values based on direction
    let exitX = 0, exitY = 0, enterX = 0, enterY = 0;
    let exitRotateY = 0, enterRotateY = 0;
    const hasAnimation = direction !== 'center';

    if (direction === 'right') {
      exitX = -30; enterX = 30;
      exitRotateY = 5; enterRotateY = -5;
    } else if (direction === 'left') {
      exitX = 30; enterX = -30;
      exitRotateY = -5; enterRotateY = 5;
    } else if (direction === 'up') {
      exitY = 30; enterY = -30;
    } else if (direction === 'down') {
      exitY = -30; enterY = 30;
    }

    // Fade out current view with slide
    views.forEach(view => {
      if (view && view.classList.contains('active')) {
        if (typeof gsap !== 'undefined' && hasAnimation) {
          gsap.to(view, {
            opacity: 0,
            x: exitX,
            y: exitY,
            rotateY: exitRotateY,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
              view.classList.remove('active');
              view.style.transform = '';
              view.style.opacity = '';
            }
          });
        } else {
          view.classList.remove('active');
        }
      }
    });

    // Fade in target view with slide from opposite direction
    setTimeout(() => {
      if (typeof gsap !== 'undefined' && hasAnimation) {
        gsap.set(targetView, {
          opacity: 0,
          x: enterX,
          y: enterY,
          rotateY: enterRotateY
        });
        targetView.classList.add('active');
        gsap.to(targetView, {
          opacity: 1,
          x: 0,
          y: 0,
          rotateY: 0,
          duration: 0.4,
          ease: 'power2.out'
        });
      } else {
        targetView.classList.add('active');
      }
    }, hasAnimation ? 250 : 0);

    currentPlaylistView = viewId;
  }

  // ===================================
  // FLOATING ANIMATION FOR PLAYLIST NAV BUTTONS
  // ===================================

  // Apply floating animation to playlist nav buttons (constrained, no rotation)
  if (typeof gsap !== 'undefined') {
    playlistNavBtns.forEach((btn, index) => {
      // Gentle, constrained movement - no rotation to keep buttons level
      const floatY = 8 + Math.random() * 6; // Subtle vertical movement
      const floatX = 10 + Math.random() * 8; // Subtle horizontal movement
      const durationY = 3 + Math.random() * 1.5;
      const durationX = 3.5 + Math.random() * 2;
      const delay = index * 0.4;

      // Vertical float - gentle bobbing
      gsap.to(btn, {
        y: `+=${floatY}`,
        duration: durationY,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: delay
      });

      // Horizontal drift - subtle
      gsap.to(btn, {
        x: `+=${floatX}`,
        duration: durationX,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: delay + 0.3
      });
    });
  }

  // Playlist nav button clicks
  playlistNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.playlistView;
      let direction = 'right'; // Default slide direction

      // Determine swivel direction based on layout position
      // GENRE is on left, MOMENTS in center, DIARY on right, MORE below
      if (targetView === 'genre-view') direction = 'left';
      else if (targetView === 'moments-view') direction = 'up';
      else if (targetView === 'diary-view') direction = 'right';
      else if (targetView === 'misc-view') direction = 'down';

      showPlaylistsView(targetView, direction);
    });
  });

  // Back buttons within playlists views
  playlistsBackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const backTo = btn.dataset.backTo;
      let direction = 'left'; // Default reverse direction

      // Reverse direction when going back
      if (currentPlaylistView === 'genre-view') direction = 'right';
      else if (currentPlaylistView === 'moments-view') direction = 'down';
      else if (currentPlaylistView === 'diary-view') direction = 'left';
      else if (currentPlaylistView === 'misc-view') direction = 'up';

      showPlaylistsView(backTo, direction);
    });
  });

  // ===================================
  // DIARY PASSWORD PROTECTION
  // ===================================

  // Simple hash function for password obfuscation
  function hashPassword(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Hashed passwords - original values not stored in code
  // Maps hashed input -> { key: data-password to match, message: custom message }
  const DIARY_PASSWORD_HASHES = {
    '-aa463p': { key: null, message: 'hi tommy <3' },
    '1psb0g': { key: '1psb0g', message: 'unlocked' },
    '-icrpc7': { key: 'all', message: 'all unlocked' }
  };

  const diaryPasswordMessage = document.getElementById('diaryPasswordMessage');

  if (diaryPasswordInput) {
    // Add glow when typing
    diaryPasswordInput.addEventListener('input', (e) => {
      const input = e.target.value;

      // Toggle typing class for glow effect
      if (input.length > 0) {
        diaryPasswordInput.classList.add('typing');
      } else {
        diaryPasswordInput.classList.remove('typing');
      }

      const hashedInput = hashPassword(input);
      if (DIARY_PASSWORD_HASHES.hasOwnProperty(hashedInput)) {
        const { key, message } = DIARY_PASSWORD_HASHES[hashedInput];
        revealHiddenPlaylists(key);
        diaryPasswordInput.value = '';
        diaryPasswordInput.classList.remove('typing');

        // Flash effect
        diaryPasswordInput.classList.add('accepted');
        setTimeout(() => {
          diaryPasswordInput.classList.remove('accepted');
        }, 600);

        // Show message below field
        if (diaryPasswordMessage) {
          diaryPasswordMessage.textContent = message;
          diaryPasswordMessage.classList.add('visible');
          setTimeout(() => {
            diaryPasswordMessage.classList.remove('visible');
          }, 10000);
        }
      }
    });

    // Remove glow on blur
    diaryPasswordInput.addEventListener('blur', () => {
      diaryPasswordInput.classList.remove('typing');
    });
  }

  function revealHiddenPlaylists(hashedKey) {
    // Reveal hidden items matching the hashed password key
    const hiddenItems = document.querySelectorAll('.diary-hidden-item');
    hiddenItems.forEach(item => {
      const itemHash = item.dataset.password || null;
      // 'all' key reveals everything, otherwise match specific key
      if (hashedKey === 'all' || itemHash === hashedKey) {
        item.style.display = 'flex';
        // Add animation
        if (typeof gsap !== 'undefined') {
          gsap.from(item, {
            opacity: 0,
            y: -10,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      }
    });
  }

  // ===================================
  // DIARY PLAYLIST CLICK HANDLING
  // ===================================

  const diaryPlaylistItems = document.querySelectorAll('.diary-playlist-item');
  diaryPlaylistItems.forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.playlistUrl;
      if (url && url !== '#') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  });

  // ===================================
  // DIARY YEAR TOGGLE (COLLAPSE/EXPAND)
  // ===================================
  const diaryYearToggles = document.querySelectorAll('.diary-year-toggle');
  diaryYearToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const yearSection = toggle.closest('.diary-year-section');
      if (yearSection) {
        yearSection.classList.toggle('expanded');
      }
    });
  });

  // ===================================
  // DIARY INFO POPUP
  // ===================================
  const diaryInfoBtn = document.getElementById('diaryInfoBtn');
  const diaryInfoPopup = document.getElementById('diaryInfoPopup');

  if (diaryInfoBtn && diaryInfoPopup) {
    diaryInfoBtn.addEventListener('click', () => {
      diaryInfoPopup.classList.toggle('visible');
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
      if (!diaryInfoBtn.contains(e.target) && !diaryInfoPopup.contains(e.target)) {
        diaryInfoPopup.classList.remove('visible');
      }
    });
  }

  // ===================================
  // SHEETS INFO POPUP
  // ===================================
  const sheetsInfoBtn = document.getElementById('sheetsInfoBtn');
  const sheetsInfoPopup = document.getElementById('sheetsInfoPopup');

  if (sheetsInfoBtn && sheetsInfoPopup) {
    sheetsInfoBtn.addEventListener('click', () => {
      sheetsInfoPopup.classList.toggle('visible');
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
      if (!sheetsInfoBtn.contains(e.target) && !sheetsInfoPopup.contains(e.target)) {
        sheetsInfoPopup.classList.remove('visible');
      }
    });
  }

  // ===================================
  // PUBLICATION INFO POPUPS (Writing section)
  // ===================================
  document.querySelectorAll('.publication-info-btn').forEach(btn => {
    const popupId = btn.getAttribute('data-popup');
    const popup = document.getElementById(popupId);
    if (!popup) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger the publication-header toggle
      // Close any other open publication popups
      document.querySelectorAll('.publication-info-popup.visible').forEach(p => {
        if (p !== popup) p.classList.remove('visible');
      });
      popup.classList.toggle('visible');
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !popup.contains(e.target)) {
        popup.classList.remove('visible');
      }
    });
  });

  // ===================================
  // VIEW SWITCHING (ORIGINAL)
  // ===================================

  function showGenreView() {
    wheelView.classList.remove('active');
    // Return to whichever genre grid we came from
    const returnView = document.getElementById(previousGenreView);
    if (returnView) {
      returnView.classList.add('active');
    } else {
      genreView.classList.add('active');
    }
    currentGenre = null;
    currentSubgenre = null;
  }

  function showWheelView(genre) {
    currentGenre = genre;
    const genreData = PLAYLIST_DATA[genre];

    if (!genreData) return;

    // Update genre label
    currentGenreLabel.textContent = genreData.name;

    // Set up playlists (main playlists, not subgenres)
    currentPlaylists = genreData.playlists;
    currentIndex = 0;
    currentSubgenre = null;

    // Build subgenre pills if applicable
    buildSubgenrePills(genreData);

    // Hide all playlists views and show wheel
    if (playlistsLanding) playlistsLanding.classList.remove('active');
    if (genreView) genreView.classList.remove('active');
    if (miscView) miscView.classList.remove('active');
    if (diaryView) diaryView.classList.remove('active');
    wheelView.classList.add('active');

    // Display first playlist
    updatePlaylistDisplay(0);
  }

  function buildSubgenrePills(genreData) {
    subgenrePills.innerHTML = '';

    if (!genreData.subgenres) return;

    // Add "All" pill
    const allPill = document.createElement('button');
    allPill.className = 'subgenre-pill active';
    allPill.textContent = 'ALL';
    allPill.addEventListener('click', () => selectSubgenre(null, genreData));
    subgenrePills.appendChild(allPill);

    // Add subgenre pills
    Object.keys(genreData.subgenres).forEach(subgenreName => {
      const pill = document.createElement('button');
      pill.className = 'subgenre-pill';
      pill.textContent = subgenreName.toUpperCase();
      pill.addEventListener('click', () => selectSubgenre(subgenreName, genreData));
      subgenrePills.appendChild(pill);
    });
  }

  function selectSubgenre(subgenreName, genreData) {
    currentSubgenre = subgenreName;
    currentIndex = 0;

    // Update pill active states
    const pills = subgenrePills.querySelectorAll('.subgenre-pill');
    pills.forEach(pill => {
      if (subgenreName === null && pill.textContent === 'ALL') {
        pill.classList.add('active');
      } else if (pill.textContent === subgenreName?.toUpperCase()) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update playlist array
    if (subgenreName === null) {
      currentPlaylists = genreData.playlists;
    } else {
      currentPlaylists = genreData.subgenres[subgenreName];
    }

    // Update display
    updatePlaylistDisplay(0);
  }

  // ===================================
  // PLAYLIST DISPLAY & NAVIGATION
  // ===================================

  function updatePlaylistDisplay(direction = 0) {
    if (currentPlaylists.length === 0) return;

    const playlist = currentPlaylists[currentIndex];

    // Update indicator
    const currentIndexEl = wheelIndicator.querySelector('.current-index');
    const totalCountEl = wheelIndicator.querySelector('.total-count');
    currentIndexEl.textContent = currentIndex + 1;
    totalCountEl.textContent = currentPlaylists.length;

    // Animate artwork transition
    if (direction !== 0 && !isAnimating) {
      animateArtworkTransition(direction, playlist);
    } else {
      // Direct update (no animation)
      playlistName.textContent = playlist.name;
      playlistName.classList.add('name-fade-in');
      setTimeout(() => playlistName.classList.remove('name-fade-in'), 300);

      // Update genre description
      updateGenreDescription(playlist);

      // Load artwork (pass imageUrl if available)
      loadArtwork(playlist.url, playlist.imageUrl);
    }
  }

  function animateArtworkTransition(direction, newPlaylist) {
    isAnimating = true;

    // Use CSS transitions with GPU acceleration for buttery smooth animations
    // Direction: 1 = next (slide left), -1 = prev (slide right)

    const playlistDisplay = document.querySelector('.playlist-display');

    // Enable hardware acceleration
    playlistDisplay.style.willChange = 'transform, opacity';
    playlistDisplay.style.backfaceVisibility = 'hidden';
    playlistDisplay.style.perspective = '1000px';

    // Smooth exit animation - shorter duration, gentler easing
    playlistDisplay.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.2s ease-out';
    playlistDisplay.style.transform = direction === 1
      ? 'translate3d(-40px, 0, 0)'
      : 'translate3d(40px, 0, 0)';
    playlistDisplay.style.opacity = '0';

    // After fade out, update content and fade in from opposite side
    setTimeout(() => {
      // Update content
      playlistName.textContent = newPlaylist.name;

      // Update genre description if exists
      updateGenreDescription(newPlaylist);

      // Load new artwork (pass imageUrl if available)
      loadArtwork(newPlaylist.url, newPlaylist.imageUrl);

      // Position for enter animation (instant repositioning)
      playlistDisplay.style.transition = 'none';
      playlistDisplay.style.transform = direction === 1
        ? 'translate3d(40px, 0, 0)'
        : 'translate3d(-40px, 0, 0)';

      // Force GPU layer creation and reflow
      playlistDisplay.offsetHeight;

      // Smooth enter animation - slightly longer for polish
      playlistDisplay.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.25s ease-in';
      playlistDisplay.style.transform = 'translate3d(0, 0, 0)';
      playlistDisplay.style.opacity = '1';

      setTimeout(() => {
        isAnimating = false;
        // Clean up GPU hints
        playlistDisplay.style.transition = '';
        playlistDisplay.style.willChange = '';
        playlistDisplay.style.backfaceVisibility = '';
        playlistDisplay.style.perspective = '';
      }, 300);
    }, 200);
  }

  function updateGenreDescription(playlist) {
    const descriptionEl = document.getElementById('genreDescription');
    const descriptionLink = document.getElementById('genreDescriptionLink');
    const descriptionText = document.getElementById('genreDescriptionText');

    if (!descriptionEl || !playlist.genreTag) {
      if (descriptionEl) descriptionEl.style.display = 'none';
      return;
    }

    descriptionEl.style.display = 'block';
    descriptionLink.textContent = playlist.genreTag;
    descriptionLink.href = playlist.rymUrl || '#';
    descriptionText.textContent = playlist.genreDesc || '';
  }

  function loadArtwork(playlistUrl, imageUrl = null) {
    playlistArtwork.classList.remove('loaded');
    playlistArtwork.onerror = null;
    playlistArtwork.onload = null;

    // Error handler — hide broken image, show placeholder gradient
    const handleError = () => {
      playlistArtwork.classList.remove('loaded');
      playlistArtwork.removeAttribute('src');
      playlistArtwork.onerror = null;
    };

    // First check if we have a direct image URL from PLAYLIST_DATA
    if (imageUrl) {
      playlistArtwork.onerror = handleError;
      playlistArtwork.onload = () => {
        playlistArtwork.classList.add('loaded');
      };
      playlistArtwork.src = imageUrl;
      return;
    }

    // Fall back to localStorage cache
    const playlistId = extractPlaylistId(playlistUrl);
    const cachedArtwork = localStorage.getItem(`artwork_${playlistId}`);
    if (cachedArtwork) {
      playlistArtwork.onerror = handleError;
      playlistArtwork.onload = () => {
        playlistArtwork.classList.add('loaded');
      };
      playlistArtwork.src = cachedArtwork;
    }
    // Artwork will stay as placeholder gradient if no cached/direct image
  }

  function extractPlaylistId(url) {
    // Extract playlist ID from Apple Music URL
    // Format: https://music.apple.com/us/playlist/name/pl.xxx
    const match = url.match(/pl\.[a-zA-Z0-9-]+/);
    return match ? match[0] : null;
  }

  function navigate(direction) {
    if (isAnimating || currentPlaylists.length <= 1) return;

    currentIndex += direction;

    // Wrap around
    if (currentIndex < 0) {
      currentIndex = currentPlaylists.length - 1;
    } else if (currentIndex >= currentPlaylists.length) {
      currentIndex = 0;
    }

    updatePlaylistDisplay(direction);
  }

  function openCurrentPlaylist() {
    if (currentPlaylists.length === 0) return;

    const playlist = currentPlaylists[currentIndex];
    window.open(playlist.url, '_blank', 'noopener,noreferrer');
  }

  // ===================================
  // SEARCH FUNCTIONALITY
  // ===================================

  function getAllPlaylists() {
    const all = [];
    Object.keys(PLAYLIST_DATA).forEach(genreKey => {
      const genre = PLAYLIST_DATA[genreKey];

      // Add main playlists
      genre.playlists.forEach(playlist => {
        all.push({
          ...playlist,
          genre: genre.name,
          genreKey: genreKey
        });
      });

      // Add subgenre playlists
      if (genre.subgenres) {
        Object.keys(genre.subgenres).forEach(subKey => {
          genre.subgenres[subKey].forEach(playlist => {
            all.push({
              ...playlist,
              genre: genre.name,
              genreKey: genreKey,
              subgenre: subKey
            });
          });
        });
      }
    });
    return all;
  }

  function handleSearch(query) {
    if (!query.trim()) {
      // Show all genre folders
      genreFolders.forEach(folder => {
        folder.style.display = '';
        folder.style.opacity = '';
      });
      return;
    }

    const allPlaylists = getAllPlaylists();
    const matches = allPlaylists.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    // Get unique genres that have matches
    const matchingGenres = new Set(matches.map(m => m.genreKey));

    // Dim non-matching genres
    genreFolders.forEach(folder => {
      const genreKey = folder.dataset.genre;
      if (matchingGenres.has(genreKey)) {
        folder.style.opacity = '1';
      } else {
        folder.style.opacity = '0.3';
      }
    });
  }

  // ===================================
  // EVENT LISTENERS
  // ===================================

  // Genre folder clicks
  genreFolders.forEach(folder => {
    folder.addEventListener('click', () => {
      const genre = folder.dataset.genre;
      if (genre) {
        // Track which view we came from (genre-view or misc-view)
        if (miscView && miscView.classList.contains('active')) {
          previousGenreView = 'misc-view';
        } else {
          previousGenreView = 'genre-view';
        }
        showWheelView(genre);
      }
    });
  });

  // Back button from genres to home - now handled by returnToHome() in spatial.js
  // The back button in genre-view calls returnToHome() via onclick

  // Back button from wheel to genres
  if (backToGenres) {
    backToGenres.addEventListener('click', showGenreView);
  }

  // Wheel navigation
  if (wheelPrev) {
    wheelPrev.addEventListener('click', () => navigate(-1));
  }

  if (wheelNext) {
    wheelNext.addEventListener('click', () => navigate(1));
  }

  // Wheel center (play/open)
  if (wheelCenter) {
    wheelCenter.addEventListener('click', openCurrentPlaylist);
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!wheelView.classList.contains('active')) return;
    if (document.activeElement === searchBar) return;

    switch (e.key) {
      case 'ArrowLeft':
        navigate(-1);
        break;
      case 'ArrowRight':
        navigate(1);
        break;
      case 'Enter':
        openCurrentPlaylist();
        break;
      case 'Escape':
        showGenreView();
        break;
    }
  });

  // Touch/swipe support for wheel
  let touchStartX = 0;
  let touchEndX = 0;

  const wheelElement = document.getElementById('clickWheel');
  if (wheelElement) {
    wheelElement.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    wheelElement.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        navigate(-1); // Swipe right = previous
      } else {
        navigate(1); // Swipe left = next
      }
    }
  }

  // Search input
  if (searchBar) {
    searchBar.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }
});
