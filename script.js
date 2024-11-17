  document.addEventListener('DOMContentLoaded', function() {
  // Remove any exit animations when the DOM is fully loaded
  document.body.classList.remove('back-button-exit-active', 'home-page-exit-active');

  // Event listener for the back button
  var backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      if (window.scrollY === 0) {
        document.body.classList.add('back-button-exit-active');
        // Wait for the animation to finish before redirecting
        setTimeout(function() {
          window.location.href = 'index.html'; // Replace with the home page URL
        }, 500); // This should match the duration of the animation
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Event listeners for other buttons
  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', function() {
      var destinationURL = this.getAttribute('data-destination-url');
      if (destinationURL) {
        document.body.classList.add('home-page-exit-active');
        // Redirect after the animation
        setTimeout(function() {
          window.location.href = destinationURL;
        }, 500); // Ensure this matches the animation duration
      }
    });
  });

  // Make external links open in a new tab
  var links = document.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++) {
    if (links[i].hostname !== window.location.hostname && links[i].href.startsWith('http')) {
      links[i].target = '_blank';
      links[i].rel = 'noopener noreferrer';
    }
  }
});

// Handle the pageshow event for BFCache pages
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    document.body.classList.remove('back-button-exit-active', 'home-page-exit-active');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.dropdown-button');
    const content = dropdown.querySelector('.dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = dropdown.classList.contains('open');

      if (isOpen) {
        // Close this dropdown and reset its styles
        dropdown.classList.remove('open');
        content.style.maxHeight = '0';
        button.style.transform = 'scale(1)'; // Reset size
        button.style.color = '#c8c8c8'; // Reset color
      } else {
        // Close all other dropdowns
        document.querySelectorAll('.dropdown').forEach(d => {
          if (d !== dropdown) {
            d.classList.remove('open');
            d.querySelector('.dropdown-content').style.maxHeight = '0';
            d.querySelector('.dropdown-button').style.transform = 'scale(1)';
            d.querySelector('.dropdown-button').style.color = '#c8c8c8';
          }
        });

        // Open this dropdown
        dropdown.classList.add('open');
        content.style.maxHeight = `${content.scrollHeight}px`;
        button.style.transform = 'scale(1.1)'; // Keep it big
        button.style.color = '#ffffff'; // Keep it highlighted
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll('.dropdown');
  const smallDropdowns = document.querySelectorAll('.small-dropdown');

  // Handle Big Dropdowns
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.dropdown-button');
    const content = dropdown.querySelector('.dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = dropdown.classList.contains('open');

      // Close all big dropdowns
      document.querySelectorAll('.dropdown').forEach(d => {
        d.classList.remove('open');
        d.querySelector('.dropdown-content').style.maxHeight = '0';
      });

      // Toggle current dropdown
      if (!isOpen) {
        dropdown.classList.add('open');
        content.style.maxHeight = `${content.scrollHeight}px`;
      } else {
        dropdown.classList.remove('open');
        content.style.maxHeight = '0';
      }
    });
  });

  // Handle Small Dropdowns
  smallDropdowns.forEach(smallDropdown => {
    const button = smallDropdown.querySelector('.small-dropdown-button');
    const content = smallDropdown.querySelector('.small-dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = smallDropdown.classList.contains('open');

      // Close other small dropdowns within the same big dropdown
      const parentDropdown = smallDropdown.closest('.dropdown-content');
      parentDropdown.querySelectorAll('.small-dropdown').forEach(sd => {
        if (sd !== smallDropdown) {
          sd.classList.remove('open');
          sd.querySelector('.small-dropdown-content').style.maxHeight = '0';
        }
      });

      // Toggle current small dropdown
      if (!isOpen) {
        smallDropdown.classList.add('open');
        content.style.maxHeight = `${content.scrollHeight}px`;
      } else {
        smallDropdown.classList.remove('open');
        content.style.maxHeight = '0';
      }
    });
  });
});
