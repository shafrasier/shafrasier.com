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
  const dropdownButtons = document.querySelectorAll('.dropdown-button');

  dropdownButtons.forEach(button => {
    button.addEventListener('click', () => {
      const dropdownContent = button.nextElementSibling;
      dropdownContent.style.display =
        dropdownContent.style.display === 'block' ? 'none' : 'block';
    });
  });
});
