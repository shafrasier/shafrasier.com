/* ===================================
   CLICK WHEEL - iPod-style Playlist Browser
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const genreView = document.getElementById('genre-view');
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

  // State
  let currentGenre = null;
  let currentPlaylists = [];
  let currentIndex = 0;
  let currentSubgenre = null;
  let isAnimating = false;

  // ===================================
  // VIEW SWITCHING
  // ===================================

  function showGenreView() {
    wheelView.classList.remove('active');
    genreView.classList.add('active');
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

    // Switch views
    genreView.classList.remove('active');
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

      // Load artwork
      loadArtwork(playlist.url);
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

      // Load new artwork
      loadArtwork(newPlaylist.url);

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

  function loadArtwork(playlistUrl) {
    // For now, use a gradient placeholder
    // TODO: Implement Apple Music API integration
    playlistArtwork.classList.remove('loaded');

    // Extract playlist ID for potential caching
    const playlistId = extractPlaylistId(playlistUrl);

    // Check cache
    const cachedArtwork = localStorage.getItem(`artwork_${playlistId}`);
    if (cachedArtwork) {
      playlistArtwork.src = cachedArtwork;
      playlistArtwork.classList.add('loaded');
    }
    // Artwork will stay as placeholder gradient until API is implemented
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
