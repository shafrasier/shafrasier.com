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

  // Handle Big and Small Dropdowns
  const dropdowns = document.querySelectorAll('.dropdown');
  const smallDropdowns = document.querySelectorAll('.small-dropdown');

  // Handle Big Dropdowns
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.dropdown-button');
    const content = dropdown.querySelector('.dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = dropdown.classList.contains('open');

      // Close all big dropdowns
      dropdowns.forEach(d => {
        d.classList.remove('open');
        d.querySelector('.dropdown-content').style.maxHeight = '0';
        d.querySelector('.dropdown-button').style.transform = 'scale(1)';
        d.querySelector('.dropdown-button').style.color = '#c8c8c8';
      });

      // Toggle the clicked dropdown
      if (!isOpen) {
        dropdown.classList.add('open');
        content.style.maxHeight = `${content.scrollHeight}px`;
        button.style.transform = 'scale(1.1)';
        button.style.color = '#ffffff';
      }
    });
  });

  // Handle Small Dropdowns
  smallDropdowns.forEach(smallDropdown => {
    const button = smallDropdown.querySelector('.small-dropdown-button');
    const content = smallDropdown.querySelector('.small-dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = smallDropdown.classList.contains('open');

      // Close other small dropdowns in the same big dropdown
      const parentDropdown = smallDropdown.closest('.dropdown-content');
      parentDropdown.querySelectorAll('.small-dropdown').forEach(sd => {
        if (sd !== smallDropdown) {
          sd.classList.remove('open');
          sd.querySelector('.small-dropdown-content').style.maxHeight = '0';
          sd.querySelector('.small-dropdown-button').style.transform = 'scale(1)';
          sd.querySelector('.small-dropdown-button').style.color = '#c8c8c8';
        }
      });

      // Toggle the current small dropdown
      if (!isOpen) {
        smallDropdown.classList.add('open');
        content.style.maxHeight = `${content.scrollHeight}px`;
        button.style.transform = 'scale(1.1)';
        button.style.color = '#ffffff';
      } else {
        smallDropdown.classList.remove('open');
        content.style.maxHeight = '0';
        button.style.transform = 'scale(1)';
        button.style.color = '#c8c8c8';
      }
    });
  });
});
