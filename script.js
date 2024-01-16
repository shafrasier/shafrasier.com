document.getElementById('backButton').addEventListener('click', function() {
  // Determine if this is the home page by checking the URL
  var isHomePage = window.location.pathname === '/index.html' || window.location.pathname === '/';

  if (isHomePage) {
    // If on the home page, add the class for the home page exit animation
    document.body.classList.add('home-page-exit-active');
  } else {
    // Otherwise, add the class for the default page exit animation
    document.body.classList.add('page-exit-active');
  }

  // Redirect after the animation
  setTimeout(function() {
    // Determine the destination URL based on the current page
    var destinationURL = isHomePage ? 'another-page.html' : 'index.html';
    window.location.href = destinationURL;
  }, 500); // Ensure this matches the animation duration
});
