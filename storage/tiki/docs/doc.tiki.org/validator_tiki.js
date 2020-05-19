/* (c) Copyright by authors of the Tiki Wiki CMS Groupware Project
 *
 * All Rights Reserved. See copyright.txt for details and a complete list of authors.
 * Licensed under the GNU LESSER GENERAL PUBLIC LICENSE. See license.txt for details.
 * $Id: validator_tiki.js 69994 2019-05-13 05:34:26Z nelsonko $
 */


jQuery.validator.setDefaults({
	onkeyup: false,
	errorClass: 'invalid-feedback',
	errorPlacement: function(error, element) {
		if ($(element).parents('.input-group').length > 0) {
			error.insertAfter($(element).parents('.input-group').first());
		} else {
			error.appendTo($(element).parent());
		}
	},
	highlight: function(element) {
		$(element).addClass('is-invalid');
		// Highlight chosen element if exists
		$("#" + element.getAttribute("id") + "_chosen").addClass("is-invalid");
	},
	unhighlight: function(element) {
		$(element).removeClass("is-invalid");
		// Unhighlight chosen element if exists
		$("#" + element.getAttribute("id") + "_chosen").removeClass("is-invalid");
	},
	ignore: '.ignore'
});


// see http://stackoverflow.com/questions/1300994/

jQuery.validator.addMethod("required_in_group", function (value, element, options) {
	var numberRequired = options[0], excluded;
	var selector = options[1];
	if (typeof options[2] != 'undefined') {
		excluded = options[2];
	} else {
		excluded = '';
	}
	//Look for our selector within the parent form
	var validOrNot = $(selector, element.form).filter(
			function () {
				// for the case where there is a other option, to allow users to
				// jump to the other form input without trigger the validation
				if ($(this).data('tiki_never_visited')) return 'dummy-value-for-validation';
				// Each field is kept if it has a value
				return ($(this).val() && $(this).val().toLowerCase() != excluded);
				// Set to true if there are enough, else to false
			}).length >= numberRequired;

	var validator = this;
	// The elegent part - this element needs to check the others that match the
	// selector, but we don't want to set off a feedback loop where each element
	// has to check each other element. It would be like:
	// Element 1: "I might be valid if you're valid. Are you?"
	// Element 2: "Let's see. I might be valid if YOU'RE valid. Are you?"
	// Element 1: "Let's see. I might be valid if YOU'RE valid. Are you?"
	// ...etc, until we get a "too much recursion" error.
	//
	// So instead we
	//  1) Flag all matching elements as 'currently being validated'
	//  using jQuery's .data()
	//  2) Re-run validation on each of them. Since the others are now
	//     flagged as being in the process, they will skip this section,
	//     and therefore won't turn around and validate everything else
	//  3) Once that's done, we remove the 'currently being validated' flag
	//     from all the elements
	if (!$(element).data('being_validated')) {
		var fields = $(selector, element.form);
		fields.data('being_validated', true);
		// .valid() means "validate using all applicable rules" (which
		// includes this one)
		validator.valid();
		fields.data('being_validated', false);
	}

	return validOrNot;

	// {0} below is the 0th item in the options field
}, jQuery.validator.format(tr("Please fill out {0} of these fields.")));

// for validating tracker file attachments based on required_in_group
// similar but needs a different message

jQuery.validator.addMethod("required_tracker_file", function (value, element, options) {
	var numberRequired = options[0];
	var selector = options[1];
	var validOrNot = $(selector, element.form).filter(
			function () {
				return $(this).val();
			}).length >= numberRequired;

	if (!$(element).data('being_validated')) {
		var fields = $(selector, element.form);
		fields.data('being_validated', true);
		fields.valid();
		fields.data('being_validated', false);
	}
	return validOrNot;
}, jQuery.validator.format("File required"));

// for validating email fields where multiple addresses can be entered
// separator is options[0] and defaults to comma

jQuery.validator.addMethod("email_multi", function (value, element, options) {
	var separator = options[0] || ",";
	var emails = $(element).val().split(separator);

	for (var i = 0; i < emails.length; i++) {
		if (!$.validator.methods["email"].call( this, $.trim(emails[i]), element )) {
			return false;
		}
	}

	return true;

}, jQuery.validator.format("Please enter valid email addresses separated by commas"));

jQuery.validator.addClassRules("email_multi", {
	email_multi: true
});

/**
 * Wait for AJAX form validation to finish before proceeding with submit
 *
 * @param	form form element
 * @param	event submission event (optional)
 * @return	{Boolean}
 */
function process_submit(form, event) {

	var $form = $(form);
	if (!$form.attr("is_validating")) {
		$form.attr("is_validating", true);
		$form.validate();
	}
	if ($form.validate().pendingRequest > 0) {
		$(form).data("resubmit", true);
		setTimeout(function() {process_submit(form, event);}, 500);
		return false;
	}
	$form.attr("is_validating", false);

	if (!$form.valid()) {
		return false;
	}

	// soft-disable submit button(s)
	if ($form.data("ajax")) {
		$form.find("input[type=submit]").css("opacity", 0.3);
		$form.parents(".modal").find(".auto-btn").css("opacity", 0.3);
	} else {
		$form.find("input[type=submit]").off("click").css("opacity", 0.3);
		$form.parents(".modal").find(".auto-btn").off("click").css("opacity", 0.3);
	}
	if( $(form).hasClass("confirm-action") ) {
		$form.tikiModal(tr("Saving..."));
	}
	// prevent form from submitting twice
	if (!$form.data('submitted')) {
		$form.data('submitted', true);
	} else {
		return false;
	}
	// deal with ajax validation submission function not sending the value of the button that submitted the form (only really happend with legacy tracker insertion screens)
	if( typeof event !== 'undefined' && event.target ) {
		var btn = $(event.target);
		if (btn.is('form')) {
			var btnform = btn;
			var btn = btnform.find("input[type=submit]:focus");
			// workaround for safari
			if( btn.length == 0 ) {
				btn = btnform.find("input[type=submit]:first");
			}
		}
		$( "<input type='hidden'/>" )
			.attr( "name", btn.attr('name') )
			.val( btn.val() )
			.appendTo( $form );
	}
	if( $form.data("resubmit") ) {
		$form.data("resubmit", false);
		$form.submit();
	}
	// if the form is using ajax, send the request here instead of letting the form submit
	if ($form.data("ajax")) {
		if ($form.data("ajax_action") == "update") {
			$form.tracker_update_item({
					trackerId: $form.data('tracker_id'),
					itemId: $form.data('item_id'),
					ajax: true
				}, function(trackerInfo) {
				// soft-reenable submit
				$form.data('submitted', false);
				$form.find("input[type=submit]").off("click").css("opacity", 1);
				$form.parents(".modal").find(".auto-btn").off("click").css("opacity", 1);
			});
		} else {
			$form.tracker_insert_item({
					trackerId: $form.data('tracker_id'),
					ajax: true
				}, function(trackerInfo) {
				// soft-reenable submit
				$form.data("ajax_action", "update");
				$form.data('item_id', trackerInfo.itemId);
				$form.data('submitted', false);
				$form.find("input[type=submit]").off("click").css("opacity", 1);
				$form.parents(".modal").find(".auto-btn").off("click").css("opacity", 1);
			});
		}
		return false;
	}
	return true;
}

jQuery.validator.addMethod("validate_cron_runtime", function (value, element, options) {
	var cronTime = value.trim();
	var regex = "^(\\*|((\\*\\/)?[1-5]?[0-9])|[1-5]?[0-9]-[1-5]?[0-9]|[1-5]?[0-9](,[1-5]?[0-9])*) (\\*|((\\*\\/)?(1?[0-9]|2[0-3]))|(1?[0-9]|2[0-3])-(1?[0-9]|2[0-3])|(1?[0-9]|2[0-3])(,(1?[0-9]|2[0-3]))*) (\\*|((\\*\\/)?([1-9]|[12][0-9]|3[0-1]))|([1-9]|[12][0-9]|3[0-1])-([1-9]|[12][0-9]|3[0-1])|([1-9]|[12][0-9]|3[0-1])(,([1-9]|[12][0-9]|3[0-1]))*) (\\*|((\\*\\/)?([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2])|([1-9]|1[0-2])(,([1-9]|1[0-2]))*)) (\\*|((\\*\\/)?[0-6])|[0-6](,[0-6])*|[0-6]-[0-6])$";
	if (cronTime.match(regex) === null) {
		$(element).addClass('is-invalid');
		return false;
	}
	$(element).parents('.form-group').first().removeClass('is-invalid');
	return true;
}, jQuery.validator.format(tr("Cron run time is not valid")));
