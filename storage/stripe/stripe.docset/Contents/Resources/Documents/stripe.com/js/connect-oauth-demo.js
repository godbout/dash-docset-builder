(function() {
  var showEl = function(selector) {
    document
      .querySelector('#connect-oauth-onboarding-demo')
      .querySelector(selector)
      .classList.remove('hidden');
  };

  var hideEl = function(selector) {
    document
      .querySelector('#connect-oauth-onboarding-demo')
      .querySelector(selector)
      .classList.add('hidden');
  };

  document.querySelectorAll('.close-sample-btn').forEach(function(el) {
    el.addEventListener('click', function(evt) {
      var target = evt.target;
      showEl('.sr-root');
      showEl('.sr-header.sample');
      target.parentElement.classList.add('hidden');
    });
  });

  document
    .querySelector('#oauth-github-btn')
    .addEventListener('click', function(evt) {
      showEl('.sr-clone.github');
      hideEl('.sr-header.sample');
      hideEl('.sr-root');
    });

  document
    .querySelector('#oauth-cli-btn')
    .addEventListener('click', function(evt) {
      showEl('.sr-clone.cli');
      hideEl('.sr-header.sample');
      hideEl('.sr-root');
    });
})();
