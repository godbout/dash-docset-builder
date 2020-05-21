/** $Id: tiki-confirm.js 71519 2019-11-18 01:37:45Z lindonb $
 *
 * To facilitate popup confirmation forms and related checking of security
 * timeout for state-changing actions
 */

/**
 * Onclick method used on form submit or anchor elements when a popup
 * confirmation form is desired and where ajax is not being used.
 *
 * - for forms, typically used for state-changing actions that cannot be
 * undone, where a confirmation is advisable.
 * - should also be used for any anchor that triggers a state-changing action
 * since requests that change the database should not be GET requests.
 * - all form inputs or anchor url parameters are converted to form inputs in
 * the popup confirmation form.
 * - the related action in the php file should be conditioned on
 * $access->checkCsrfForm() so the anti-CSRF protection can be applied. This
 * will also redirect to a confirmation form in the case that javascript is not
 * enabled.
 *
 * Example in a smarty template: onclick="confirmSimple(event, '{tr}Delete
 * selected items?{/tr}', '{ticket mode=get}')"
 *
 * @param event		object		Click event
 * @param title		string		Confirmation text. Default is tr('Complete
 *     this action?')
 * @param ticket	string		Security token. For anchors, in a smarty
 *     template use '{ticket mode=get}'. For forms, this parameter is normally
 *     not needed as the form includes the ticket as a hidden input, normally
 *     using the smarty function {ticket}, and the function will use that for
 *     the ticket
 * @returns {boolean}
 */
function confirmSimple(event, title, ticket) {
	return confirmPopup(event, false, title, ticket);
}

/**
 * Onclick method to capture all form inputs when triggering ajax services
 * modal with a form submission.
 *
 * - the formaction attribute of the submit element or the action attribute of
 * the form must be set using the bootstrap_modal smarty function
 * - for a submit button related to a select element:
 * 		- the name attribute of the select element must be set to action
 * (name=action)
 * 		- the select option value being submitted should be the action value
 * only (e.g., remove_users)
 * 		- the submit element's formaction attribute value or the form's
 * action attribute value will be used for the first part of the services url,
 * ie without the action specified - eg {bootstrap_modal controller=user}
 * 		- the above requirements for a submitted select value (ie,
 * name=action, value contains only the action, rest of url in formaction or
 * form action attribute) is necessary for ajax services to work when
 * javascript is not enabled
 *
 * @param event		object		Click event
 * @returns {boolean}
 */
function confirmAjax(event) {
	return confirmPopup(event, true);
}

/**
 * Utility used by the two methods above, confirmSimple() and confirmAjax()
 *
 *
 * @param event		object		Click event
 * @param ajax		boolean		whether or not this is an ajax service
 * @param title		string		Confirmation text. Default is tr('Complete
 *     this action?'). Not needed for ajax services since the service will
 *     provide the text
 * @param ticket	string		Security token. Usually not needed for form
 *     submissions since the function will get the token from the form inputs
 * @returns {boolean}
 */
function confirmPopup(event, ajax, title, ticket) {
	if (!event) {
		return false;
	}
	$('div.popover').hide();
	if (checkTimeout()) {
		event.preventDefault();
		//used when the bootstrap_modal smarty function is used with a form in order to capture all form inputs
		if (ajax) {
			var target = $('.modal.fade:not(.show)').first(),
				//use action specified in formaction attribute of the clicked element first
				formAction = $(event.currentTarget).attr('formaction') || $(event.currentTarget.form).attr('action');
			$.post(formAction, $(event.currentTarget.form).serialize(),
				function (data)
			{
				$('.modal-content', target).html(data);
				target.modal().trigger('tiki.modal.redraw');
			});
			return false;
		//this section for other submitted forms that don't use ajax
		} else {
			if (event.currentTarget.form) {
				// If the submit only needs to be confirmed if certain select options are chosen, then the
				// confirm-simple class is added to the options that should be confirmed in addition to adding
				// the onclick method confirmSimple() to the submit element. In this case, bypass confirmation if
				// such an option has not been selected
				var optionConfirm = $(event.currentTarget.form).find('select > option.confirm-simple'),
					selected = $(event.currentTarget.form).find('select > option.confirm-simple:selected');
				// proceed if it is not a select element or it is and an option with the confirm-simple class has
				// been selected
				if (!optionConfirm.length || selected.length) {
					var formId = $(event.currentTarget.form).attr('id') ? $(event.currentTarget.form).attr('id')
							+ '-confirm-simple' : 'confirm-simple',
						formName = $(event.currentTarget.form).attr('name') ? $(event.currentTarget.form).attr('name')
							+ '-confirm-simple' : 'confirm-simple',
						newForm = $('<form/>', {name : formName, id : formId,
							action : $(event.currentTarget.form).attr('action'), method : 'post'}),
						inputs = $(event.currentTarget.form).find('input, textarea, select > option:selected');
					$.each(inputs, function () {
						if (this.type !== 'submit' && (this.type !== 'checkbox' || this.checked === true)
							&& (this.type !== 'radio' || this.checked === true))
						{
							var name = this.tagName === 'OPTION' ? $(this).parent('select').attr('name') : this.name;
							newForm.append($('<input />', {type: 'hidden', name: name, value: this.value}));
						}
					});
					if (event.currentTarget.name) {
						newForm.append($('<input />', {type: 'hidden', name: event.currentTarget.name,
							value: event.currentTarget.value}));
					}
					if (selected.length) {
						$.each(selected, function (key, item) {
							if ($(selected[key]).data('confirm-text')) {
								title = $(selected[key]).data('confirm-text');
								return false;
							}
						});
					}
					simpleConfirmForm(event.currentTarget, newForm, title, ticket).modal();
				} else {
					$(event.currentTarget.form).submit();
				}
			//if a link was clicked
			} else if (event.currentTarget.tagName === 'A') {
				var newForm = $('<form/>', {id : 'confirm-simple', action : event.currentTarget.pathname,
						method : 'post'}),
					params = event.currentTarget.search.substr(1).split('&');
				if (params) {
					for (var i = 0; i < params.length; i++) {
						var parampair = params[i].split("=")
						newForm.append($('<input />', {type: 'hidden', name: decodeURIComponent(parampair[0]),
							value: decodeURIComponent(parampair[1])}));
					}
				}
				simpleConfirmForm(event.currentTarget, newForm, title, ticket).modal();
			}
		}
	}
}

/**
 * Utility used by the previous function confirmPopup() to create and return
 * the popup form
 *
 * @param clickedElement	object		Element clicked
 * @param newForm			object		Form that has been started and that
 *     will be completed with this function
 * @param title				string		Confirmation text. Alternatively
 *     the function will look for a data-confirm-text attribute before using
 *     the default tr('Complete this action?')
 * @param ticket			string		Security token
 * @returns {jQuery}
 */
function simpleConfirmForm(clickedElement, newForm, title, ticket) {
	if (! title) {
		title = $(clickedElement).data('confirm-text') ? $(clickedElement).data('confirm-text')
			: tr('Complete this action?');
	}
	if (! ticket && ! $(newForm).find('input[name=ticket]').length && $(clickedElement).data('ticket')) {
		ticket = $(clickedElement).data('ticket');
	}
	if (! $(newForm).find('input[name=ticket]').length && ticket) {
		newForm.append($('<input />', {type: 'hidden', name: 'ticket', value: ticket}));
	}
	newForm.append($('<input />', {type: 'hidden', name: 'confirmForm', value: 'y'}));
	var target = $('.modal.fade:not(.in)').first();
	$('.modal-content', target).html(
		'<div class="modal-header">' +
		'<h4 class="modal-title" id="myModalLabel">' + title + '</h4>' +
		$(newForm).prop('outerHTML') +
		'</div>' +
		'<div class="modal-footer">' +
		'<button type="button" class="btn btn-primary btn-dismiss" data-dismiss="modal">' + tr('Close') + '</button>' +
		'<input type="submit" class="btn btn-primary" value="' + tr('OK') +
		'" onclick="$(\'#' + $(newForm).attr('id') + '\').submit(); return false;"> ' +
		'</div>'
	);
	return target;
}

/**
 * Onclick method to capture all form inputs when triggering ajax services when
 * there are no modals involved
 *
 *  - the formaction attribute of the submit element or the action attribute of
 * the form must be set using the service smarty function
 */
function postForm (event) {
	event.preventDefault();
	var formAction = $(event.currentTarget).attr('formaction') || $(event.currentTarget.form).attr('action');
	$.post(formAction, $(event.currentTarget.form).serialize(), function (data) {});
	return false;
}

/**
 *	See checkTimeout() documentation below. Used for a form that has a
 * security ticket so that the user is warned that the ticket is timed out
 * before entering data into the form.	This may not work for forms in popups
 * (e.g., tooltips) but the checkTimeout() onclick method below will
 */
$('form').has('input[name=ticket]').on('mousedown keydown', 'select', function() {
	checkElement(this);
}).on('mousedown keydown', 'input', function() {
	checkElement(this);
}).on('mousedown keydown', 'textarea', function() {
	checkElement(this);
});

/**
 * Utility used in previous method so that the security timeout warning is only
 * shown the first time a form element is clicked. This is so that any contents
 * in the input element can be copied if needed before losing the data. See
 * also checkTimeout() method below.
 *
 * @param element
 * @returns {boolean}
 */
function checkElement (element) {
	// don't check timeout again if already check and expired so that the warning only comes up the first time
	// the input element is clicked
	if ($(element).hasClass('already-warned')) {
		return  true;
	} else {
		if (! checkTimeout()) {
			$(element).addClass('already-warned');
		}
		return true;
	}
}

/**
 * Onclick method that generates a popup warning and stops the click event if
 * the security timeout period has elapsed.
 *
 * This method is only needed for state-changing actions for which no
 * confirmation popup is desired since the above methods that provide
 * confirmation popups (confirmSimple() and confirmAjax()) already apply this
 * method
 *
 * The timeout period is determined by the securityTimeout preference setting
 *
 * @returns {boolean}
 */
function checkTimeout() {
	if ((($.now() - now.getTime()) / 1000) < jqueryTiki.securityTimeout) {
		return true;
	} else {
		event.preventDefault();
		feedback(
			[tr('The security ticket for this form has expired.') + ' '
				+ tr('To apply your changes, note or copy them, reload the page, re-enter them and retry submitting.')],
			'warning',
			true,
			tr('Security ticket timed out')
		);
		var target = $('.modal.fade:not(.show)').first();
		$('.modal-body', target).after(
			'<div class="modal-footer">' +
			'<a href="#" onclick="$.closeModal();return false;" class="btn btn-primary">'
			+ tr('Close this dialog') +
			'</a>' +
			'<a href="' + location.href + '" onclick="location.reload();return false;" class="btn btn-secondary">'
			+ tr('Reload now (discards changes)') +
			'</a>'+
			'</div>'
		);
		return false;
	}
}

/**
 * Use data posted from a popup modal as input for the ajax service action
 *
 * @param event
 */
function confirmAction(event) {
	//this is the ajax action once the confirm submit button is clicked
	event.preventDefault();
	if (typeof event.currentTarget !== 'undefined' && event.currentTarget.form !== 'undefined') {
		var targetForm = event.currentTarget.form;
	} else if (typeof event.target !== 'undefined' && event.target.form !== 'undefined') {
		var targetForm = event.target.form;
	}
	$.ajax({
		dataType: 'json',
		url: $(targetForm).attr('action'),
		type: 'POST',
		data: $(targetForm).serialize(),
		success: function (data) {
			if (!data) {
				$.closeModal();
				return;
			}
			var extra = data.extra || false, dataurl = data.url || false, dataError = data.error || false,
				strip = data.strip || false;
			if (extra) {
				/* Simply close modal. Feedback is added to the page without refreshing in the ajax service using the
				the standard Feedback class function send_headers(). Used when there is an error in submitting modal
				form */
				if (extra === 'close') {
					$.closeModal();
				//Close modal and refresh page. Feedback can be added to the refreshed page in the ajax service using
				//the Feedback class
				} else if (extra === 'refresh') {
					$.closeModal();
					//strip off anchor or query and anchor if specified
					if (strip) {
						if (strip === 'anchor' || strip === 'queryAndAnchor') {
							var href = document.location.href.replace(/#.*$/, "");
							document.location.href = document.location.href.replace(/#.*$/, "");
							if (strip === 'queryAndAnchor') {
								document.location.href = document.location.href.replace(/\?.*$/, "");
							}
						}
					} else {
						document.location.reload();
					}
				}
			}
			//send to another page, or to same page when reload is needed
			if (dataurl) {
				$.closeModal();
				document.location.assign(dataurl);
			}
			//send error
			if (dataError) {
				if (dataError === 'CSRF') {
					dataError = tr('Potential cross-site request forgery (CSRF) detected. Operation blocked. The security ticket may have expired - reloading the page may help.');
				}
				$.closeModal();
				feedback (
					dataError,
					'error'
				);
				console.log(dataError);
			}
			return false;
		}
	});
}