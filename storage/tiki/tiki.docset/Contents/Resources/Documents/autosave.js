// $Id: autosave.js 57614 2016-02-27 13:01:30Z jonnybradley $

var auto_save_submit = false;
var sending_auto_save = false;
var auto_save_debug = false;	// for development use

function remove_save(editorId, autoSaveId) {
	if (typeof editorId !== 'string' || !editorId || !autoSaveId || auto_save_submit) {
		return;	// seems to get jQuery events arriving here or has been submitted before
	}
	if (sending_auto_save) {	// wait if autosaving
		setTimeout(function () { remove_save(editorId, autoSaveId); }, 100);
	}
	auto_save_submit = true;
	$.ajax({
		url: $.service("autosave", "delete"),
		data: {
			editor_id: editorId,
			referer: autoSaveId
		},
		type: "POST",
		async: false,	// called on form submit (save or cancel) so need to wait otherwise the call gets cancelled
		// good callback
		success: function(data) {
			// act casual?
		},
		// bad callback - no good info in the params :(
		error: function(req, status, error) {
			if (error && auto_save_debug) {
				alert(tr("Auto Save removal returned an error: ") + error);
			}
		}
	});
}

function toggle_autosaved(editorId, autoSaveId) {
	if (typeof autoSaveId === 'undefined') { autoSaveId = ''; }
	var output = '', prefix = '';
	var $textarea = $('#' + editorId);
	var textareaEditor = syntaxHighlighter.get($textarea);
	var cked = typeof CKEDITOR !== 'undefined' ? CKEDITOR.instances[editorId] : null;
	if (!$textarea.data("original")) {	// no save version already?
		if (cked) { prefix = 'cke_contents_'; }
		ajaxLoadingShow(prefix + editorId);

		$.getJSON( $.service("autosave", "get"), {
				editor_id: editorId,
				referer: autoSaveId
			},
			function(data) {
				output = data.data;
				// back up current
				$textarea.data("original", $textarea.val());
				if (cked) {
					cked.setData(output);
				} else if (textareaEditor) {
					textareaEditor.setValue(output);
				} else if ($("#"+editorId).length) {	// wiki editor
					$textarea.val(output);
				}
				ajaxLoadingHide();
			}
		);

	} else {	// toggle back to original
		syntaxHighlighter.sync($textarea);
		
		output = $textarea.data("original");
		if (cked) {
			cked.setData(output);	// cked leaves the original content in the ta
		} else if (textareaEditor) {
			textareaEditor.setValue(output);
		} else if ($("#"+editorId).length) {	// wiki editor
			$("#"+editorId).val(output);
		}
		$textarea.data("original", "");
	}
	// swap the messages around (fixed to first textarea only for now)
	var msg = $(".autosave_message_2:first").text();
	$(".autosave_message_2:first").text($(".autosave_message:first").text());
	$(".autosave_message:first").text(msg);

	return output;
}

function auto_save_allowHtml(form) {
	return $("input[name=allowhtml]:checked", form).length ||
		($("input[name=allowhtml][type=hidden]", form).length &&
			$("input[name=allowhtml][type=hidden]", form).val() ? 1 : 0);
}

function auto_save( editorId ) {

	if (!editorId && auto_save_debug) { alert(tr("Auto save: No editorId set")) }

	if ( !auto_save_submit && !sending_auto_save) {

		var $textarea = $('#' + editorId);
		var autoSaveId = $textarea.data("autoSaveId");

		syntaxHighlighter.sync($textarea);
		
		var data = $textarea.val();
		var allowHtml = auto_save_allowHtml($textarea.prop("form"));

		if (data !== $textarea.data("original") || $textarea.data("last") !== data || $textarea.data("old_allowhtml") != allowHtml) {
			$textarea.data("last", data);
			sending_auto_save = true;
			$.ajax({
				url: $.service("autosave", "save"),
				data: {
					editor_id: editorId,
					referer: autoSaveId,
					data: data
				},
				type: "POST",
				// good callback
				success: function(data) {
					// update button when it's there (TODO)
					if (ajaxPreviewWindow && typeof ajaxPreviewWindow.get_new_preview === 'function') {
						 ajaxPreviewWindow.get_new_preview();
					} else {
						ajax_preview( editorId, autoSaveId, true );
					}
					$textarea.data("old_allowhtml", allowHtml);
					sending_auto_save = false;
				},
				// bad callback - no good info in the params :(
				error: function(req, status, error) {
					if (error) {
						if (error == "Forbidden") {
							error = req.responseText.replace(/(<([^>]+)>)/ig,"");
						}
						alert(tr("Auto Save error: ") + error);
					}
					sending_auto_save = false;
				}
			});
		} else {	// not changed, reset timeout
		}
	}
}

function register_id( editorId, autoSaveId ) {
	var $textarea = $('#' + editorId);
	$textarea.data("autoSaveId", autoSaveId);
	if (typeof syntaxHighlighter.sync === 'function') {
		syntaxHighlighter.sync($textarea);
	}
	$textarea.parents('form').submit(function() { remove_save(editorId, autoSaveId); });
	$textarea.change(function () { auto_save( editorId ); });
}

var ajaxPreviewWindow;

function ajax_preview(editorId, autoSaveId, inPage) {
	if (editorId) {
		var $textarea = $('#' + editorId);
		var $autosavepreview = $("#autosave_preview");
		syntaxHighlighter.sync($textarea);
		var allowHtml = auto_save_allowHtml($textarea.prop("form"));
		if (!ajaxPreviewWindow) {
			if (inPage) {
				var $prvw = $("#autosave_preview:visible");
				if ($prvw.length) {
					ajaxLoadingShow($autosavepreview);
					var h = location.search.match(/&hdr=(\d?)/);
					h = h && h.length ? h[1] : "";
					$.get($.service("edit", "preview"), {
						editor_id: editorId,
						autoSaveId: autoSaveId,
						inPage: 1,
						hdr: h,
						allowHtml: allowHtml
					}, function(data) {
						// remove JS and disarm links
						data = data.replace(/\shref/gi, " tiki_href").
								replace(/\sonclick/gi, " tiki_onclick").
								replace(/<script[.\s\S]*?<\/script>/mgi, "");
						$(".preview_contents", $autosavepreview).html(data);
						$("#preview_diff_style").val(function(){return getCookie("preview_diff_style","preview","");});
						ajaxLoadingHide();
					});
				}
			} else {
				initPreviewWindow(editorId, autoSaveId, allowHtml);
			}
		} else {
			if (typeof ajaxPreviewWindow.get_new_preview === 'function') {
				ajaxPreviewWindow.get_new_preview();
				ajaxPreviewWindow.focus();
			} else {
				initPreviewWindow(editorId, autoSaveId, allowHtml);
			}
		}
	} else {
		if (auto_save_debug) {
			alert("Auto save data not found");
		}
	}
	
}

function initPreviewWindow (editorId, autoSaveId, allowHtml) {
	var features = 'menubar=no,toolbar=no,fullscreen=no,titlebar=no,status=no,width=600';
	var url = $.service("edit", "preview", {editor_id: editorId, autoSaveId: autoSaveId, allowHtml: allowHtml });
	window.open(url, "_blank", features);
}

$(window).on("unload", function () {
	if (ajaxPreviewWindow && typeof ajaxPreviewWindow.get_new_preview === 'function') {
		ajaxPreviewWindow.close();
	}
});
