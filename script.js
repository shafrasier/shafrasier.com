document.addEventListener('DOMContentLoaded', function() {
  // Event listener for the back button
  var backButton = document.querySelector('.back-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      if (window.scrollY === 0) {
        // Redirect to the home page if already at the top of the page
        window.location.href = 'index.html'; // Replace 'index.html' with the actual home page URL
      } else {
        // Scroll to the top of the page
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
