/**
 * (c) Copyright by authors of the Tiki Wiki CMS Groupware Project
 *
 * All Rights Reserved. See copyright.txt for details and a complete list of authors.
 * Licensed under the GNU LESSER GENERAL PUBLIC LICENSE. See license.txt for details.
 * $Id: pluginedit.js 75189 2019-12-16 17:01:23Z jonnybradley $
 *
 * Handles wiki plugin edit forms
 */


(function ($) {

	/* wikiplugin editor */
	window.popupPluginForm = function (area_id, type, index, pageName, pluginArgs, bodyContent, edit_icon, selectedMod) {

		var $textArea = $("#" + area_id);

		if ($textArea.length && $textArea[0].createTextRange) {	// save selection for IE
			storeTASelection(area_id);
		}

		var container = $('<div class="plugin"></div>');

		if (!index) {
			index = 0;
		}
		if (!pageName && jqueryTiki.current_object.type === "wiki page") {
			pageName = jqueryTiki.current_object.object;
		}
		var textarea = $textArea[0];
		var replaceText = false;

		if (!pluginArgs && !bodyContent) {
			pluginArgs = {};
			bodyContent = "";

			dialogSelectElement(area_id, '{' + type.toUpperCase(), '{' + type.toUpperCase() + '}');
			var sel = getTASelection(textarea);
			if (sel && sel.length > 0) {
				sel = sel.replace(/^\s\s*/, "").replace(/\s\s*$/g, "");	// trim
				if (sel.length > 0 && sel.substring(0, 1) === '{') { // whole plugin selected
					var l = type.length,
						thisType = sel.match(/\{(\w+)/);
					thisType = thisType[1].toUpperCase();
					if (thisType === type.toUpperCase()) { // same plugin
						var rx = new RegExp("{" + type + "[\\(]?([\\s\\S^\\)]*?)[\\)]?}([\\s\\S]*){" + type + "}", "mi"); // using \s\S matches all chars including lineends
						var m = sel.match(rx);
						if (!m) {
							rx = new RegExp("{" + type + "[\\(]?([\\s\\S^\\)]*?)[\\)]?}([\\s\\S]*)", "mi"); // no closing tag
							m = sel.match(rx);
						}
						if (m) {
							var paramStr = m[1];
							bodyContent = m[2];

							var pm = paramStr.match(/([^=]*)=\"([^\"]*)\"\s?/gi);
							if (pm) {
								for (var i = 0; i < pm.length; i++) {
									var ar = pm[i].split("=");
									if (ar.length) { // add cleaned vals to params object
										pluginArgs[ar[0].replace(/^[,\s\"\(\)]*/g, "")] = ar[1].replace(/^[,\s\"\(\)]*/g, "").replace(/[,\s\"\(\)]*$/g, "");
									}
								}
							}
						}
						replaceText = sel;
					} else if (confirm("Click OK to include the " + thisType + " plugin inside a " + type.toUpperCase() + " plugin. Click Cancel to edit the " + thisType + " plugin.")) {
						bodyContent = sel;
						replaceText = true;
					} else {
						// different plugin, try again with the selected plugin type
						window.popupPluginForm(area_id, thisType, index, pageName, null, "", edit_icon, selectedMod);
						return;
					}
				} else { // not (this) plugin
					if (type === 'mouseover') { // For MOUSEOVER, we want the selected text as label instead of body
						bodyContent = '';
						pluginArgs = {};
						pluginArgs['label'] = sel;
					} else {
						bodyContent = sel;
					}
					replaceText = true;
				}
			} else {	// no selection
				replaceText = false;
			}
		}

		var $modal;
		if (selectedMod) {
			$modal = $('body > .modal.fade.show').first();	// if selecting a new module then reuse the existing modal
		} else {
			$modal = $('body > .modal.fade:not(.show)').first();
		}

		var url = $.service("plugin", "edit", {
			area_id: area_id,
			type: type,
			index: index,
			page: pageName,
			pluginArgs: pluginArgs,
			bodyContent: bodyContent,
			edit_icon: !!edit_icon,
			selectedMod: selectedMod ? selectedMod : "",
			modal: 1
		});

		// START BOOTSTRAP 4 CHANGE
		// Make the form load into the modal
		var prepareModal = function () {			// Bind remote loaded event

			if ($modal.is(":visible") && ! selectedMod) {
				return;
			}

			// enables conditional display of inputs with a "parentparam" selector
			handlePluginFieldsHierarchy();
			// bind form button events and form validation
			handleFormSubmit($modal, type, edit_icon, area_id, replaceText);
			// Trigger jQuery event 'plugin_#type#_ready' (see plugin_code_ready in codemirror_tiki.js for example)
			$document
				.trigger({
					type: 'plugin_' + type + '_ready',
					container: container,
					arguments: arguments,
					modal: $modal
				})
				.trigger({
					type: 'plugin_ready',
					container: container,
					arguments: arguments,
					modal: $modal
				});

			if ($modal.is(":visible")) {
				return;
			}
			// actually show the modal now
			$('.modal-dialog').addClass("modal-lg");
			// this should not be needed but the modal doesn't appear without it... FIXME
			$modal.modal("show");

			if ($("form", this).length && edit_icon) {
				$modal.one("hidden.bs.modal", function () {
					// unset semaphore on object/page on cancel
					$.getJSON($.service("semaphore", "unset"), {
						object_id: pageName
					});
				});
			}
		};

		$modal.on("tiki.modal.redraw", function () {
			prepareModal();
		});

		$modal
			.find(".modal-content")
			.load(url, function () {
				if ($modal.is(":visible")) {
					$(this).trigger("tiki.modal.redraw");
				} else {
					$(this).modal("show");
				}
			});
			// END BOOTSTRAP 4 CHANGE


	};

	/*
	 * Hides all children fields in a wiki-plugin form and
	 * add javascript events to display them when the appropriate
	 * values are selected in the parentparam fields.
	 */
	function handlePluginFieldsHierarchy() {
		var $container = $('#plugin_params');

		var parents = {};

		$("[data-parent_name]", $container).each(function () {
			var parentName = $(this).data("parent_name"),
				parentValue = $(this).data("parent_value");
			if (parentName) {
				var $parent = $('[name$="params[' + parentName + ']"]', $container);

				var $row = $(this).parents(".form-group");
				$row.addClass('parent_' + parentName + '_' + parentValue);

				if ($parent.val() !== parentValue) {
					if (!$parent.val() && $("input, select", $row).val()) {
						$parent.val(parentValue);
					} else {
						$row.hide();
					}
				}

				if (!parents[parentName]) {
					parents[parentName] = {
						children: [],
						parentElement: $parent
					};
				}

				parents[parentName]['children'].push($(this).attr("id"));
			}
		});

		$.each(parents, function (parentName, parent) {
			parent.parentElement.change(function () {
				$.each(parent.children, function (index, id) {
					$container.find('#' + id).parents(".form-group").hide();
				});
				$container.find('.parent_' + parentName + '_' + this.value).show();
			})
				.change().trigger("chosen:updated");
		});
	}

	/**
	 * set up insert/replace button and submit handler in "textarea" edit mode
	 *
	 * @param container
	 * @param type
	 * @param edit_icon
	 * @param area_id
	 * @param replaceText
	 */
	function handleFormSubmit(container, type, edit_icon, area_id, replaceText) {

		var params = [], viewPageMode = !!edit_icon, bodyContent = "";

		var $form = $("form", container);

		$form.submit(function () {

			if (typeof process_submit === "function" && ! process_submit(this)) {
				return false;
			}

			if (type === "list" && ! viewPageMode && typeof jqueryTiki.plugins.list.saveToTextarea === "function") {
				jqueryTiki.plugins.list.saveToTextarea();
			}

			$("[name^=params]", $form).each(function () {

				var name = $(this).attr("name"),
					matches = name.match(/params\[(.*)\]/),
					val = $(this).val();

				if (!matches) {
					// it's not a parameter, skip
					if (name === "content") {
						bodyContent = $(this).val();
					}
					return;
				}

				if (val && ! viewPageMode) {
					val = val.replace(/"/g, '\\"');	// escape double quotes
					params.push(matches[1] + '="' + val + '"');
				}
			});

			var blob, pluginContentTextarea = $("[name=content]", $form),
				pluginContentTextareaEditor = syntaxHighlighter.get(pluginContentTextarea);

			if (! viewPageMode) {
				if (!bodyContent) {
					bodyContent = (pluginContentTextareaEditor ? pluginContentTextareaEditor.getValue() : pluginContentTextarea.val());
				}
				if (bodyContent) {
					blob = '{' + type.toUpperCase() + '(' + params.join(' ') + ')}' + bodyContent + '{' + type.toUpperCase() + '}';
				} else {
					blob = '{' + type.toLowerCase() + ' ' + params.join(' ') + '}';
				}

				insertAt(area_id, blob, false, false, replaceText);
				$form.parents(".modal").modal("hide");

				return false;
			}
			return true;
		});
	}

})(jQuery);
