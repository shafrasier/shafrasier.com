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
        }, 500);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

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

        // Reset small dropdowns inside
        const childSmallDropdowns = d.querySelectorAll('.small-dropdown');
        childSmallDropdowns.forEach(sd => {
          sd.classList.remove('open');
          const sdContent = sd.querySelector('.small-dropdown-content');
          if (sdContent) sdContent.style.maxHeight = '0';
        });
      });

      // Toggle current dropdown
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

      // Close sibling small dropdowns within the same big dropdown
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

        // Fix smooth animation for first open
        content.style.maxHeight = '0'; // Reset height
        setTimeout(() => {
          content.style.maxHeight = `${content.scrollHeight}px`;

          // Adjust parent dropdown's height
          if (parentDropdownContent) {
            parentDropdownContent.style.maxHeight = `${parentDropdownContent.scrollHeight}px`;
          }
        }, 0);
      } else {
        smallDropdown.classList.remove('open');
        content.style.maxHeight = '0';

        // Adjust parent dropdown's height after collapse
        if (parentDropdownContent) {
          setTimeout(() => {
            parentDropdownContent.style.maxHeight = `${parentDropdownContent.scrollHeight}px`;
          }, 300);
        }
      }
    });
  });
});
