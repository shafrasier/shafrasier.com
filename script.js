document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded and parsed");

  // Event listener for the back button
  var backButton = document.querySelector('.back-button');
  if (backButton) {
    console.log("Back button found");
    backButton.addEventListener('click', function() {
      console.log("Back button clicked");
      if (window.scrollY === 0) {
        console.log("At top of the page, adding exit animation class");
        document.body.classList.add('back-button-exit-active');

        // Wait for the animation to finish before redirecting
        setTimeout(function() {
          console.log("Redirecting to home page");
          window.location.href = 'index.html'; // Replace with the home page URL
        }, 500); // This should match the duration of the animation
      } else {
        console.log("Not at top of the page, scrolling to top");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  } else {
    console.log("Back button not found");
  }

  // Event listeners for other buttons
  document.querySelectorAll('.button').forEach(button => {
    console.log("Setting up click event listener for button");
    button.addEventListener('click', function() {
      var destinationURL = this.getAttribute('data-destination-url');
      console.log("Button clicked, destination URL: " + destinationURL);
      if (destinationURL) {
        document.body.classList.add('home-page-exit-active'); // Add exit animation
        console.log("Exit animation class added, waiting to redirect");

        // Redirect after the animation
        setTimeout(function() {
          console.log("Redirecting to: " + destinationURL);
          window.location.href = destinationURL;
        }, 500); // Ensure this matches the animation duration
      }
    });
  });
});
