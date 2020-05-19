// $Id: tiki-bootstrapmodalfix.js 56872 2015-12-02 17:49:31Z arildb $
// Workaround ckeditor and datepicker problems in Bootstrap 3
// Refer http://ckeditor.com/forums/Support/Issue-with-Twitter-Bootstrap
// and https://github.com/twbs/bootstrap/issues/5816
// and others on the web
//
// NOTE this is not a clean solutions but works for now and there does not seem to be better way

$.fn.modal.Constructor.prototype.enforceFocus = function () {
	$(document)
		.off('focusin.bs.modal') // guard against infinite focus loop
		.on('focusin.bs.modal', $.proxy(function (e) {
			if (this.$element[0] !== e.target && !this.$element.has(e.target).length
				// add custom exclusion conditions you need here:
				&& 
				!$(e.target.parentNode).hasClass('cke_dialog_ui_input_select') && !$(e.target.parentNode).hasClass('cke_dialog_ui_input_text')
				&&
				!$(e.target).hasClass('ui-datepicker-month') && !$(e.target).hasClass('ui-datepicker-year')
				){
				this.$element.trigger('focus')
			}
		}, this))

};
