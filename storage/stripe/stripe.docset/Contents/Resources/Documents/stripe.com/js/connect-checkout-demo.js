function _initCheckout(successUrl, cancelUrl, sampleName) {
  const stripe = window.Stripe('pk_test_hyjpUhJneDCt1FZLtmN7HnkN00iZ1QDNpR');

  // Limit scope in case a page has multiple instances of this sample
  function querySample(selector) {
    return document
      .querySelector('#connect-checkout-demo' + '.' + sampleName)
      .querySelector(selector);
  }

  const preview = querySample('#preview-button');
  preview.addEventListener('click', function(e) {
    stripe
      .redirectToCheckout({
        items: [{sku: 'sku_GiH3nMUcrP7SMD', quantity: 1}],
        successUrl,
        cancelUrl,
      })
      .then(function(result) {
        if (result.error) {
          alert(result.error.message);
        }
      })
      .catch(function(error) {
        alert(error.message);
      });
  });

  preview.classList.add('loaded');

  const message = querySample('#preview-message');
  if (location.href.includes(successUrl)) {
    message.textContent =
      'Welcome back! You successfully completed a test purchase.';
    message.classList.add('active');
  }
  if (location.href.includes(cancelUrl)) {
    message.textContent = 'Welcome back! You canceled a test purchase.';
    message.classList.add('active');
  }

  var showEl = function(selector) {
    querySample(selector).classList.remove('hidden');
  };

  var hideEl = function(selector) {
    querySample(selector).classList.add('hidden');
  };

  document.querySelectorAll('.close-sample-btn').forEach(function(el) {
    el.addEventListener('click', function(evt) {
      var target = evt.target;
      showEl('.sr-root');
      showEl('.sr-header.sample');
      target.parentElement.classList.add('hidden');
    });
  });

  querySample('#checkout-github-btn').addEventListener('click', function(evt) {
    showEl('.sr-clone.github');
    hideEl('.sr-header.sample');
    hideEl('.sr-root');
  });

  querySample('#checkout-cli-btn').addEventListener('click', function(evt) {
    showEl('.sr-clone.cli');
    hideEl('.sr-header.sample');
    hideEl('.sr-root');
  });
}

(function() {
  var successUrl = window.successUrl;
  var cancelUrl = window.cancelUrl;
  var sampleName = window.sampleName;

  var initCheckout = () => {
    _initCheckout(successUrl, cancelUrl, sampleName);
  };

  if (document.readyState !== 'loading') {
    initCheckout();
  } else {
    document.addEventListener('DOMContentLoaded', initCheckout);
  }
})();
