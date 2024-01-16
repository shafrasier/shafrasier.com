document.addEventListener('DOMContentLoaded', function() {
  var backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      if (window.scrollY === 0) {
        // Add the slide-up exit animation class
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
        document.body.classList.add('home-page-exit-active'); // Add exit animation

        // Redirect after the animation
        setTimeout(function() {
          window.location.href = destinationURL;
        }, 500); // Ensure this matches the animation duration
      }
    });
  });
});
