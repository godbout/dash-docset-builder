(function ($) {
	/**
	 * One executor is created for each object containing inline fields.
	 * When the field is modified, the executor is triggered.
	 *
	 * As a delayed executor, a period of grace is given for the field to
	 * be corrected or other fields to be modified. Each modification resets 
	 * the counter.
	 *
	 * When modifications stop happening, the entire object is stored in a
	 * single AJAX request.
	 */
	var executors = {}, obtainExecutor;

	obtainExecutor = function (container, delay) {
		var url = $.serviceUrl($(container).data('object-store-url'));

		if (executors[url]) {
			return executors[url];
		}

		return executors[url] = delayedExecutor(delay || 5000, function (cancelled) {
			if (cancelled) {
				return;
			}
			var parts = [];
			var containers = [];
			$('.editable-inline.modified :input, .editable-dialog.modified :input').each(function () {
				var container = $(this).closest('.editable-inline, .editable-dialog')[0];
				var ownership = $.serviceUrl($(container).data('object-store-url'));

				if (ownership === url) {
					parts.push($(this).serialize());

					if (-1 === containers.indexOf(container)) {
						containers.push(container);
					}
				}
			});

			$(containers).each(function () {
				$(this).tikiModal($(this).width() > 30 ? tr("Saving...") : " ");
			});

			$.post(url, parts.join('&'), 'json')
				.success(function () {
					$(containers).
						removeClass('modified').
						removeClass('unsaved').
						trigger('changed.inline.tiki').
						trigger('saved.tiki').
						filter(function () {
							// The post-save value application is only for cases where the field was initially fetched
							return $(this).data('field-fetch-url');
						}).
						each(function () {
							var $this = $(this),
								obj = $.extend($(this).data('field-fetch-url'), { mode: "output" });	// use the url for the field input in output mode

							$.get($.serviceUrl(obj))
								.success(function (data) {
									$this.removeClass("loaded")
										.tikiModal()
										.html($.trim(data.replace("<!DOCTYPE html>", "")))
										.attr("title", $(this).data("saved_title") || "")
										.removeData("saved_title");
									if( $this.data('saved_overflow') ) {
										$this.closest('td').css('overflow', $this.data('saved_overflow'));
									}
									var editIcon = $.fn.getIcon('edit');
									$(editIcon).addClass('ml-2');
									$this.append(editIcon);
								});
						});
				})
				.error(function () {
					$(containers).filter('.modified').
						addClass('unsaved').
						trigger('changed.inline.tiki');
					$.getJSON($.service('object', 'report_error'));
				})
				;
		});
	};

	$(document).on('click', '.editable-inline:not(.loaded)', function (e) {

		if ($(e.target).is("a")) {
			return true;
		}

		var container = this
			, url = $.serviceUrl($(this).data('field-fetch-url'))
			, overflow = $(container).closest('td').css('overflow');
			;

		$(container).
			addClass('loaded').
			data("saved_html", $(container).parent().html()).
			data("saved_text", $(container).text()).
			data("saved_overflow", overflow).
			closest('td').css('overflow', 'visible');

		if ($(container).data('group')) {
			$('.editable-inline:not(.loaded)')
				.filter(function () {
					return $(this).data('group') == $(container).data('group');
				})
				.not(container)
				.click();
		}

		if (url) {
			url = url.replace(/mode=output/, "mode=input");
			$.get(url)
				.success(function (data) {
					var w = $(container).parent().width();	// td width
					$(container).html(data);
					$("input, select", container).each(function () {
						$(this).keydown(function (e) {
							if (e.which === 13) {			// enter
								$(this).blur();
								return false;
							} else if (e.which === 9) {		// tab
								$(this).blur();
								if (e.shiftKey) {
									$(this).parents("td:first").prev().find(".editable-inline:first").click();
								} else {
									$(this).parents("td:first").next().find(".editable-inline:first").click();
								}
								return false;
							} else if (e.which === 27) {	// escape
								$(this).off('change');
								var url = $.serviceUrl($(container).data('object-store-url'));
								var executor = executors[url];
								executor.apply(document, [true]);

								$(container).parent().html(
									$(container).data("saved_html")
								).find(".editable-inline:first").removeClass("loaded");

								if( $(container).data('saved_overflow') ) {
									$(container).closest('td').css('overflow', $(container).data('saved_overflow'));
								}

							} else {
								return true;
							}
						}).width(Math.min($(this).width(), w));

						$(this).focus();
					});
					var $select = $("select", container).css("width", "auto");
					if (jqueryTiki.chosen) {
						if ($select.length) {
							$select.tiki("chosen");
						}
					}
					// radio buttons need to have different name attributes per item
					var $radios = $("input[type=radio]", container);
					if ($radios.length) {
						var itemId = $(container).data("field-fetch-url").itemId;
						$radios.each(function () {
							$(this).attr("name", $(this).attr("name") + "~item" + itemId);
						});
					}
				})
				.error(function () {
					$(container).addClass('failure');
				})
				;
		}
	});

	$(document).on('change', '.editable-inline.loaded :input:not(.isDatepicker)', function () {
		var container, executor;
		
		container = $(this).closest('.editable-inline')[0];
		executor = obtainExecutor(container);
		$(container).
			data("saved_title", $(container).attr("title")).
			attr("title", tr("Queued for saving")).
			addClass('modified').
			trigger('changed.inline.tiki');

		executor();
	});

	$(document).on('click', '.editable-dialog:not(.loaded)', function () {
		var container = this,
			fields = {};
		
		$('.editable-dialog:not(.loaded)')
			.filter(function () {
				return $(this).data('group') == $(container).data('group');
			})
			.each(function (k) {
				fields['fields[' + k + '][label]'] = $(this).data('label');
				fields['fields[' + k + '][fetch]'] = $(this).data('field-fetch-url');
				fields['fields[' + k + '][store]'] = $(this).data('object-store-url');
			});

		$('#bootstrap-modal').modal('show');
		$('#bootstrap-modal .modal-content')
			.load(
				$.service('edit', 'inline_dialog', {
					modal: 1
				}), fields,
				function () {
					$('#bootstrap-modal').trigger('tiki.modal.redraw');
				}
			);
	});

	$(document).on('submit', '.inline-edit-dialog', function (e) {
		e.preventDefault();

		var reload = delayedExecutor(500, function () {
			document.location.reload();
		});

		$('#boostrap-modal').tikiModal(tr('Loading...'));
		$('.editable-dialog.loaded', this)
			.addClass('modified')
			.one('saved.tiki', function () {
				if ($('.editable-dialog.loaded.modified', this).size() === 0) {
					reload();
				}
			})
			.each(function () {
				var executor = obtainExecutor(this, 100);
				executor();
			});
	});

	$(function () {
		if (jqueryTiki.ui) {
			$('.inline-sort-handle')
				.next().children().on('changed.inline.tiki', function () {
					$(this).parent().prev()
						.toggleClass('text-warning', $(this).hasClass('modified'))
						.toggleClass('text-danger', $(this).hasClass('unsaved'));
				})
				.closest('tbody, ul, ol')
				.each(function () {
					var $list = $('.inline-sort-handle', this);

					var first = $list.eq(0).data('current-value') || 1;
					var second = $list.eq(1).data('current-value') || 2;

					this.first = first;
					this.increment = (second - first) || 1;
				})
				.sortable({
					handle: '.inline-sort-handle',
					stop: function () {
						var first = this.first, increment = this.increment;

						$('.inline-sort-handle', this).next().find(':input:first').each(function (position) {
							var val = $(this).val(), target = first + position * increment;

							if (val != target) {
								$(this).val(target).change();
							}
						});
					}
				});
		}
	});
})(jQuery);
