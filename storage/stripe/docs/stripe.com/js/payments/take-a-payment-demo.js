(function() {
  // A reference to Stripe.js
  var stripe;
  var clientSecret;

  var sampleCard = {
    number: '4000000000003220',
    exp_month: 12,
    exp_year: new Date().getFullYear() + 1,
    cvc: '123',
    zip: '94103',
  };

  var sampleName = window.sampleName;

  // Limit scope in case a page has multiple instances of this sample
  function querySample(selector) {
    return document
      .querySelector('#take-a-payment-demo' + '.' + sampleName)
      .querySelector(selector);
  }

  // Animate the card form by simulating typing in the inputs and related Stripe Elements parameters.
  function animateCardForm(card, cardElement) {
    fillText(cardElement, 'cardNumber', card.number);

    setTimeout(function() {
      fillText(
        cardElement,
        'cardExpiry',
        card.exp_month + '/' + String(card.exp_year).substr(2),
      );
    }, 1000);
    setTimeout(function() {
      fillText(cardElement, 'cardCvc', card.cvc);
    }, 1500);
    setTimeout(function() {
      fillText(cardElement, 'postalCode', card.zip);
    }, 2000);
  }

  // Fill the content of an card element value.
  function fillText(element, valueName, valueContent) {
    var progress = 0;
    var timer = setInterval(function() {
      var valueContentPartial = String(valueContent).substring(0, progress++);
      // It's a Stripe Element, so use the private API to update the partial value.
      var value = {};
      value[valueName] = valueContentPartial;
      element.update({__privateValue: value});

      if (progress > valueContent.length) {
        clearInterval(timer);
      }
    }, 75);
  }

  var closeSample = function(el) {
    querySample('.sr-payment-form').classList.add('hidden');
    el.classList.remove('hidden');
  };

  var showEl = function(selector) {
    querySample(selector).classList.remove('hidden');
  };

  var hideEl = function(selector) {
    querySample(selector).classList.add('hidden');
  };

  var disableDemo = function() {
    querySample('#card-errors').innerText =
      "Oh no, there's an error with this demo. We're working to fix it!";
    querySample('#submit').disabled = true;
    showEl('#card-errors');
  };

  var createPaymentIntent = function(callback) {
    return $.ajax('/docs/demo-endpoint/create-payment-intent', {
      type: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      success: function(data) {
        // Pass the public key and client secret to the callback
        callback(data);
      },
    });
  };

  document.querySelectorAll('.close-sample-btn').forEach(function(el) {
    el.addEventListener('click', function(evt) {
      var target = evt.target;
      showEl('.sr-root');
      showEl('.sr-header.sample');
      target.parentElement.classList.add('hidden');
    });
  });

  var githubButton = querySample('#github-btn');
  githubButton &&
    githubButton.addEventListener('click', function(evt) {
      showEl('.sr-clone.github');
      hideEl('.sr-header.sample');
      hideEl('.sr-root');
    });

  var cliButton = querySample('#cli-btn');
  cliButton &&
    cliButton.addEventListener('click', function(evt) {
      showEl('.sr-clone.cli');
      hideEl('.sr-header.sample');
      hideEl('.sr-root');
    });

  querySample('#restart-btn').addEventListener('click', function(evt) {
    showEl('.sr-header.sample');
    hideEl('.sr-header.completed');
    showEl('.sr-payment-form');
    hideEl('.sr-result');

    querySample('#submit').disabled = true;
    createPaymentIntent(function(result) {
      // Get new PaymentIntent
      if (!result.clientSecret) {
        disableDemo();
      } else {
        clientSecret = result.clientSecret;
        querySample('#submit').disabled = false;
      }
    });
  });

  // Create initial PaymentIntent and set up Elements
  createPaymentIntent(function(result) {
    if (!result.clientSecret) {
      // Disable demo if we don't have a client secret
      disableDemo();
    } else {
      var elementsData = setupElements(result);
      var stripe = elementsData.stripe;
      var card = elementsData.card;
      // Keep global reference to our client secret
      clientSecret = result.clientSecret;
      var fillCardBtn = querySample('.fill-card');
      fillCardBtn.disabled = false;
      fillCardBtn.addEventListener('click', function(evt) {
        animateCardForm(sampleCard, card);
      });
      querySample('#submit').addEventListener('click', function(evt) {
        evt.preventDefault();
        // Initiate payment when the submit button is clicked
        pay(stripe, card);
      });
    }
  });

  // Set up Stripe.js and Elements to use in checkout form
  var setupElements = function(data) {
    stripe = Stripe(data.publicKey);

    var elements = stripe.elements();
    var style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    };

    var card = elements.create('card', {style: style});
    card.mount(querySample('#card-element'));

    return {
      stripe: stripe,
      card: card,
      clientSecret: data.clientSecret,
    };
  };

  /*
   * Calls stripe.handleCardPayment which creates a pop-up modal to
   * prompt the user to enter extra authentication details without leaving your page
   */
  var pay = function(stripe, card) {
    clearError();
    changeLoadingState(true);

    // Initiate the payment.
    // If authentication is required, handleCardPayment will automatically display a modal
    stripe.handleCardPayment(clientSecret, card).then(function(result) {
      if (result.error) {
        // Show error to your customer
        showError(result.error.message);
      } else {
        // The payment has been processed!
        showSuccess();
      }
    });
  };

  /* ------- Post-payment helpers ------- */

  /* Shows a success / error message when the payment is complete */
  var showSuccess = function() {
    stripe.retrievePaymentIntent(clientSecret).then(function(result) {
      var paymentIntent = result.paymentIntent;
      var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

      var codeBlock = querySample('.sr-result pre code');
      codeBlock.textContent = paymentIntentJson;
      Prism.highlightElement(codeBlock);

      hideEl('.sr-payment-form');
      hideEl('.sr-header.sample');
      showEl('.sr-header.completed');
      showEl('.sr-result');

      setTimeout(function() {
        querySample('.sr-result').classList.add('expand');
        querySample('#embedded-demo').style.height = '400px';
      }, 200);

      changeLoadingState(false);
    });
  };

  var showError = function(errorMsgText) {
    changeLoadingState(false);
    querySample('#card-errors').textContent = errorMsgText;
  };

  var clearError = function() {
    querySample('#card-errors').textContent = '';
  };

  // Show a spinner on payment submission
  var changeLoadingState = function(isLoading) {
    if (isLoading) {
      querySample('#submit').disabled = true;
      showEl('#spinner');
      hideEl('#button-text');
    } else {
      querySample('#submit').disabled = false;
      showEl('#button-text');
      hideEl('#spinner');
    }
  };
})();
