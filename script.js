document.addEventListener('DOMContentLoaded', () => {
  // Remove any exit animations when the DOM is fully loaded
  document.body.classList.remove('back-button-exit-active', 'home-page-exit-active');

  // Handle Back Button
  const backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      if (window.scrollY === 0) {
        document.body.classList.add('back-button-exit-active');
        setTimeout(() => {
          window.location.href = 'index.html'; // Replace with the home page URL
        }, 500); // Matches the duration of the animation
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

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = smallDropdown.classList.contains('open');

      // Close other small dropdowns within the same big dropdown
      const parentDropdown = smallDropdown.closest('.dropdown-content');
      const siblingSmallDropdowns = parentDropdown.querySelectorAll('.small-dropdown');
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
        }, 0); // Trigger recalculation
      } else {
        smallDropdown.classList.remove('open');
        content.style.maxHeight = '0';
      }
    });
  });
});
