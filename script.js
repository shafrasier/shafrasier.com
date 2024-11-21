document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll('.dropdown');
  const smallDropdowns = document.querySelectorAll('.small-dropdown');

  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.dropdown-button');
    const content = dropdown.querySelector('.dropdown-content');

    button.addEventListener('click', () => {
      const isOpen = dropdown.classList.contains('open');

      dropdowns.forEach(d => {
        d.classList.remove('open');
        d.querySelector('.dropdown-content').style.maxHeight = '0';

        const childSmallDropdowns = d.querySelectorAll('.small-dropdown');
        childSmallDropdowns.forEach(sd => {
          sd.classList.remove('open');
          sd.querySelector('.small-dropdown-content').style.maxHeight = '0';
        });
      });

      if (!isOpen) {
        dropdown.classList.add('open');
        content.style.maxHeight = `${content.scrollHeight}px`;
      }
    });
  });

  smallDropdowns.forEach(smallDropdown => {
    const button = smallDropdown.querySelector('.small-dropdown-button');
    const content = smallDropdown.querySelector('.small-dropdown-content');

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = smallDropdown.classList.contains('open');

      const siblingSmallDropdowns = smallDropdown
        .closest('.dropdown-content')
        .querySelectorAll('.small-dropdown');
      siblingSmallDropdowns.forEach(sd => {
        if (sd !== smallDropdown) {
          sd.classList.remove('open');
          sd.querySelector('.small-dropdown-content').style.maxHeight = '0';
        }
      });

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
