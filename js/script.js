document.addEventListener('DOMContentLoaded', () => {
  // Remove any exit animations when the DOM is fully loaded
  document.body.classList.remove('back-button-exit-active', 'home-page-exit-active');

  // Theme Toggle Functionality
  const themeToggle = document.getElementById('theme-toggle');
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');

  // Check for saved theme preference or default to light mode
  const currentTheme = localStorage.getItem('theme') || 'light';

  // Apply the saved theme on page load
  // Icon shows what mode you'll switch TO, not current mode
  if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    if (moonIcon) moonIcon.style.display = 'block';  // Show moon in light mode (click to go dark)
    if (sunIcon) sunIcon.style.display = 'none';
  } else {
    if (moonIcon) moonIcon.style.display = 'none';
    if (sunIcon) sunIcon.style.display = 'block';  // Show sun in dark mode (click to go light)
  }

  // Toggle theme when button is clicked
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');

      // Toggle icon visibility - show what mode you'll switch TO
      if (document.body.classList.contains('light-mode')) {
        // In light mode, show moon (indicates you can switch to dark)
        if (moonIcon) moonIcon.style.display = 'block';
        if (sunIcon) sunIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
      } else {
        // In dark mode, show sun (indicates you can switch to light)
        if (moonIcon) moonIcon.style.display = 'none';
        if (sunIcon) sunIcon.style.display = 'block';
        localStorage.setItem('theme', 'dark');
      }
    });
  }

  // Handle Back Button (only for non-spatial pages that don't use returnToHome)
  // Section back buttons use onclick="returnToHome()" so we skip .section-back
  // Playlists internal back buttons use .playlists-back so we skip those too
  const backButton = document.querySelector('.back-button:not(.section-back):not(.playlists-back)');
  if (backButton) {
    backButton.addEventListener('click', () => {
      if (window.scrollY === 0) {
        document.body.classList.add('back-button-exit-active');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Handle Navigation Buttons
  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', () => {
      const destinationURL = button.getAttribute('data-destination-url');
      if (destinationURL) {
        document.body.classList.add('home-page-exit-active');
        setTimeout(() => {
          window.location.href = destinationURL;
        }, 500); // Matches the animation duration
      }
    });
  });

  // Make external links open in a new tab
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    if (link.hostname !== window.location.hostname && link.href.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  // Handle Big Dropdowns
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.dropdown-button');
    const content = dropdown.querySelector('.dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = dropdown.classList.contains('open');

      // Close all big dropdowns and reset small dropdowns inside them
      dropdowns.forEach(d => {
        d.classList.remove('open');
        d.querySelector('.dropdown-content').style.maxHeight = '0';

        // Reset any small dropdowns inside this big dropdown
        const childSmallDropdowns = d.querySelectorAll('.small-dropdown');
        childSmallDropdowns.forEach(sd => {
          sd.classList.remove('open');
          const sdContent = sd.querySelector('.small-dropdown-content');
          if (sdContent) sdContent.style.maxHeight = '0';
        });
      });

      // Toggle the current big dropdown
      if (!isOpen) {
        dropdown.classList.add('open');
        content.style.maxHeight = `${content.scrollHeight}px`;
      }
    });
  });

  // Handle Small Dropdowns
  const smallDropdowns = document.querySelectorAll('.small-dropdown');
  smallDropdowns.forEach(smallDropdown => {
    const button = smallDropdown.querySelector('.small-dropdown-button');
    const content = smallDropdown.querySelector('.small-dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = smallDropdown.classList.contains('open');
      const parentDropdownContent = smallDropdown.closest('.dropdown-content');

      // Close other small dropdowns within the same big dropdown
      const siblingSmallDropdowns = parentDropdownContent.querySelectorAll('.small-dropdown');
      siblingSmallDropdowns.forEach(sd => {
        if (sd !== smallDropdown) {
          sd.classList.remove('open');
          const sdContent = sd.querySelector('.small-dropdown-content');
          if (sdContent) sdContent.style.maxHeight = '0';
        }
      });

      // Toggle current small dropdown
      if (!isOpen) {
        smallDropdown.classList.add('open');

        // Fix smooth animation for the first-time open
        content.style.maxHeight = '0'; // Reset height
        setTimeout(() => {
          content.style.maxHeight = `${content.scrollHeight}px`;

          // Adjust parent dropdown's height dynamically
          if (parentDropdownContent) {
            parentDropdownContent.style.maxHeight = `${parentDropdownContent.scrollHeight}px`;
          }
        }, 0); // Trigger recalculation
      } else {
        smallDropdown.classList.remove('open');
        content.style.maxHeight = '0';

        // Adjust parent dropdown's height dynamically
        if (parentDropdownContent) {
          setTimeout(() => {
            parentDropdownContent.style.maxHeight = `${parentDropdownContent.scrollHeight}px`;
          }, 300); // Wait for small dropdown to collapse
        }
      }
    });
  });
});
