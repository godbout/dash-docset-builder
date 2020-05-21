//$Id: codemirror_tiki.js 75230 2020-01-07 12:10:31Z jonnybradley $

jQuery.fn.extend({
	flexibleSyntaxHighlighter: function(s) {
		if ($(this).length === 0) {
			return this;
		}
		s = jQuery.extend({
			mode: "tiki",
			lineNumbers: false,
			lineWrapping: true,
			readOnly: false,
			force: false,
			theme: window.codeMirrorTheme || 'default'
		}, s);

		if ($.isEmptyObject(syntaxHighlighter.modes)) {
			syntaxHighlighter.modes = $.extend(syntaxHighlighter.modes, CodeMirror.modes);
		}

		var geshiColors = {
			'4cs': '',
			'6502acme': '',
			'6502kickass': '',
			'6502tasm': '',
			'68000devpac': '',
			'abap': '',
			'actionscript3': '',
			'actionscript': '',
			'ada': '',
			'algol68': '',
			'apache': '',
			'applescript': '',
			'apt_sources': '',
			'asm': '',
			'asp': 'vbscript',
			'autoconf': '',
			'autohotkey': '',
			'autoit': '',
			'avisynth': '',
			'awk': '',
			'bash': 'shell',
			'basic4gl': '',
			'bf': '',
			'bibtex': '',
			'blitzbasic': '',
			'bnf': '',
			'boo': '',
			'caddcl': '',
			'cadlisp': '',
			'cfdg': '',
			'cfm': '',
			'chaiscript': '',
			'cil': '',
			'clojure': 'clojure',
			'c_mac': '',
			'cmake': '',
			'cobol': '',
			'c': 'clike',
			'cpp': 'clike',
			'cpp-qt': 'clike',
			'csharp': 'clike',
			'css': 'css',
			'cuesheet': '',
			'dcs': '',
			'delphi': '',
			'diff': 'diff',
			'div': '',
			'dos': '',
			'dot': '',
			'd': '',
			'ecmascript': '',
			'eiffel': '',
			'email': '',
			'e': '',
			'erlang': '',
			'f1': '',
			'fo': '',
			'fortran': '',
			'freebasic': '',
			'fsharp': '',
			'gambas': '',
			'gdb': '',
			'genero': '',
			'genie': '',
			'gettext': '',
			'glsl': '',
			'gml': '',
			'gnuplot': '',
			'go': 'go',
			'groovy': 'groovy',
			'gwbasic': '',
			'haskell': 'haskell',
			'hicest': '',
			'hq9plus': '',
			'html4strict': 'htmlmixed',
			'icon': '',
			'idl': '',
			'ini': '',
			'inno': '',
			'intercal': '',
			'io': '',
			'java5': 'clike',
			'java': 'clike',
			'javascript': 'javascript',
			'j': '',
			'jquery': 'javascript',
			'kixtart': '',
			'klonec': '',
			'klonecpp': '',
			'latex': '',
			'lb': '',
			'lisp': '',
			'locobasic': '',
			'logtalk': '',
			'lolcode': '',
			'lotusformulas': '',
			'lotusscript': '',
			'lscript': '',
			'lsl2': '',
			'lua': 'lua',
			'm68k': '',
			'magiksf': '',
			'make': '',
			'mapbasic': '',
			'matlab': '',
			'mirc': '',
			'mmix': '',
			'modula2': '',
			'modula3': '',
			'mpasm': '',
			'mxml': 'xml',
			'mysql': 'sql',
			'newlisp': '',
			'nsis': '',
			'oberon2': '',
			'objc': 'clike',
			'objeck': '',
			'ocaml-brief': '',
			'ocaml': '',
			'oobas': '',
			'oracle11': '',
			'oracle8': '',
			'oxygene': '',
			'oz': '',
			'pascal': 'pascal',
			'pcre': '',
			'perl6': 'perl',
			'perl': 'perl',
			'per': '',
			'pf': '',
			'php-brief': 'php',
			'php': 'php',
			'pic16': '',
			'pike': '',
			'pixelbender': '',
			'plsql': 'plsql',
			'postgresql': 'plsql',
			'povray': '',
			'powerbuilder': '',
			'powershell': '',
			'progress': '',
			'prolog': '',
			'properties': 'properties',
			'providex': '',
			'purebasic': '',
			'python': 'python',
			'qbasic': 'vbscript',
			'q': '',
			'rails': '',
			'rebol': '',
			'reg': '',
			'robots': '',
			'rpmspec': '',
			'rsplus': 'r',
			'ruby': 'ruby',
			'sas': '',
			'scala': '',
			'scheme': '',
			'scilab': '',
			'sdlbasic': '',
			'smalltalk': 'smalltalk',
			'smarty': 'smarty',
			'systemverilog': '',
			'tcl': '',
			'teraterm': '',
			'text': '',
			'thinbasic': '',
			'tsql': 'sql',
			'typoscript': '',
			'unicon': '',
			'vala': '',
			'vbnet': 'vbscript',
			'vb': 'vbscript',
			'verilog': '',
			'vhdl': '',
			'vim': '',
			'visualfoxpro': '',
			'visualprolog': '',
			'whitespace': '',
			'whois': '',
			'winbatch': '',
			'xbasic': '',
			'xml': 'xmlpure',
			'xorg_conf': '',
			'xpp': '',
			'z80': '',
			'zxbasic': ''
		};

		s.mode = (geshiColors[s.mode] ? geshiColors[s.mode] : s.mode);

		jQuery(this).addClass('CodeMirrorPrepSize'); //we have to hide all the textareas or pre objects to know how much space we can take up
		
		jQuery(this).each(function() {
			var settings = jQuery.extend(true, {}, s);
			settings.parent = jQuery(this).parent();
			
			//removes the toggle button
			settings.parent.find('.cm-remove').remove();
			
			var o = jQuery(this);
			if (o.hasClass('codeMirror') && !o.is(':visible')) return;

			if ((!settings.force && !o.is('pre')) || !s.mode) {
				if (!o.data('codemirror') || o.data("nocodemirror")) {
					jQuery(this)
						.removeClass('CodeMirrorPrepSize')
						.show();
					return;
				}
			}
			
			var textarea;
			settings.parent.visible(function() {
				var syntax, wrap, theme, lineNumbers;

				if (!o.is(':input')) {
					syntax = o.data('syntax');
					lineNumbers = o.data('line-numbers');
					wrap = o.data('wrap');
					theme = o.data('theme');

					textarea =  $('<textarea class="preCodeMirror"></textarea>')
						.val(o.text())
						.insertAfter(o);

					if (syntax) textarea.data('syntax', (geshiColors[syntax] ? geshiColors[syntax] : syntax));
					if (lineNumbers) textarea.data('line-numbers', lineNumbers);
					if (wrap) textarea.data('wrap', wrap);
					if (theme) textarea.data('theme', theme);
					settings.readOnly = true;
				} else {
					textarea = o;
					settings.readOnly = textarea.attr('readonly'); //make sure we inherit the textarea's readonly attribute
				}
				
				//-->Width fix
				settings.width = settings.parent.width();
				settings.height = o.height();
				o.removeClass('CodeMirrorPrepSize');

				//prevent the bottom scrollbar from popping up if not enough height
				settings.height = (settings.height < 25 ? 25 : settings.height);
				settings.width = (settings.width < 50 ? 50 : settings.width);
				//-->End Width fix

				if (textarea.data('codeMirrorRelationshipFullscreen')) return false;
				if (!textarea.length) return false;
				if (!window.CodeMirror) return false;
				
				function applyOverride(override, setting) {
					var attr = textarea.data(override);
					if (!settings[setting]) {
						settings[setting] = attr;
					} else if (!attr) {
						attr = settings[setting];
					}
					settings[setting] = attr;
					return settings[setting];
				}

				var mode = applyOverride('syntax', 'mode');
				lineNumbers = applyOverride('line-numbers', 'lineNumbers');
				wrap = applyOverride('wrap', 'lineWrapping');
				theme = applyOverride('theme', 'theme');

				if (s.readOnly) {
					if (!syntaxHighlighter.modes.hasOwnProperty(mode)) {
						o
							.removeClass('CodeMirrorPrepSize')
							.show();

						textarea.remove();
						return;
					}
					o.hide();
				}

				if (!mode) {
					syntaxHighlighter.remove(textarea);
					syntaxHighlighter.ready(textarea, settings, "");
				} else {
					o.addClass('CodeMirrorHide');
					var scrollTop = o.scrollTop(),
					textareaHeight = o.innerHeight();

					syntaxHighlighter.remove(textarea);

					var editor = syntaxHighlighter.ready(textarea, settings, mode),
					editorWindow = jQuery(editor.getWrapperElement()).find('.CodeMirror-scroll').addBack(),
					scroller = jQuery(editor.getScrollerElement());
					scroller.scrollTop(scrollTop * (scroller.innerHeight() / textareaHeight));

					o.removeClass('CodeMirrorHide');

					editorWindow.find('div:first')
						.css('width', 'auto')
						.css('height', 'auto');

					if (settings.readOnly) {
						editorWindow
							.css('height', 'auto')
							.css('overflow', 'hidden');
					}

					o.trigger('syntaxHighlighterLoaded');
				}
				if (settings.theme == "off" && !settings.readOnly && $("textarea", this).data("codeMirrorRelationship") === 0) {
					$(".cm-remove").click();	// cheap fix to have codemirror available but off by default
				}
			}, true);
		});
		
		return this;
	}
});

//An effective way of interacting with a codemirror editor
var syntaxHighlighter;
syntaxHighlighter = {
	modes: {},
	ready: function (textarea, settings, mode) {
		var changeCount = 0,
			previewTimer = null,
			previewDelay = 5000,
			updateAutoSaveAndPreview = function () {
				textarea.val(editor.getValue()).change();
				if (window.auto_save) {
					auto_save(textarea.attr('id'));
				}
			},
			editor = CodeMirror.fromTextArea(textarea[0], {
				stylesheet: 'default',
				lineNumbers: settings.lineNumbers,
				readOnly: settings.readOnly,
				mode: mode,
				lineWrapping: settings.lineWrapping,
				theme: settings.theme === "off" ? "default" : settings.theme
			});

		settings = $.extend({
			changeText: tr("Change Highlighter"),
			removeText: tr("Toggle Highlighter")
		}, settings);

		editor.on("change", function (cm, change) {
			previewDelay = 2000;
			changeCount++;
			if (previewTimer) {
				clearTimeout(previewTimer);
			}

			if (changeCount > 25) {
				changeCount = 0;
				previewDelay = 100
			}
			previewTimer = setTimeout(updateAutoSaveAndPreview, previewDelay);
		});

		editor.on("blur", function () {
			if (previewTimer) {
				clearTimeout(previewTimer);
			}
			updateAutoSaveAndPreview();
		});

		if (settings.readOnly) {
			$(editor.getWrapperElement())
				.addClass('codelisting')
				.css('padding', '0px');
		}

		// Only size the scrollbar - not the children!
		if (settings.height) {
			$(editor.getScrollerElement()).height(settings.height);
		}
		
		if (settings.width) {
			//design has a max-width set, and we really shouldn't override that if possible, so account for that when setting width
			var scroller = $(editor.getScrollerElement());
			var maxWidth = (scroller.parent().css('max-width') + '').replace('px', '') * 1;

			settings.width = (maxWidth < settings.width ? maxWidth : settings.width);

			scroller
				.width(settings.width);
		}

		var parents = textarea.parents('form');
		if (!parents.data('codeMirrorActive')) {
			parents
				.submit(function () {
					if (textarea.data('codeMirrorRelationship')) { //always get value from textarea, but onlu update it if active
						textarea
							.val(editor.getValue())
							.change();
					}
				})
				.data('codeMirrorActive', true);
		}

		if (!settings.readOnly) {
			syntaxHighlighter.add(editor, textarea);

			var changeButton = jQuery(
				'<a class="btn btn-success btn-sm cm-change">' +
					settings.changeText +
				'</a>')
				.insertAfter(textarea.next())
				.click(function () {
					//Modes
					var options = tr('Modes:') + '<br />';
					options += "<select class='cm-mode'>";
					options += "<option value=''>" + tr("Select a Mode") + "</option>";

					var modes = CodeMirror.modes;
					for (var i in modes) {
						if (modes.hasOwnProperty(i)) {
							options += '<option value="' + i + '">' + i + '</option>';
						}
					}
					options += "</select><br />";

					//Modes
					options += tr('Theme:') + '<br />';
					options += '<select class="cm-theme">';
					options += '<option value="default">default</option>';
					options += '<option value="3024-day">3024-day</option>';
					options += '<option value="3024-night">3024-night</option>';
					options += '<option value="ambiance">ambiance</option>';
					options += '<option value="ambiance-mobile">ambiance-mobile</option>';
					options += '<option value="base16-dark">base16-dark</option>';
					options += '<option value="base16-light">base16-light</option>';
					options += '<option value="blackboard">blackboard</option>';
					options += '<option value="cobalt">cobalt</option>';
					options += '<option value="eclipse">eclipse</option>';
					options += '<option value="elegant">elegant</option>';
					options += '<option value="erlang-dark">erlang-dark</option>';
					options += '<option value="lesser-dark">lesser-dark</option>';
					options += '<option value="mbo">mbo</option>';
					options += '<option value="midnight">midnight</option>';
					options += '<option value="monokai">monokai</option>';
					options += '<option value="neat">neat</option>';
					options += '<option value="night">night</option>';
					options += '<option value="paraiso-dark">paraiso-dark</option>';
					options += '<option value="paraiso-light">paraiso-light</option>';
					options += '<option value="rubyblue">rubyblue</option>';
					options += '<option value="solarized">solarized</option>';
					options += '<option value="the-matrix">the-matrix</option>';
					options += '<option value="tomorrow-night-eighties">tomorrow-night-eighties</option>';
					options += '<option value="twilight">twilight</option>';
					options += '<option value="vibrant-ink">vibrant-ink</option>';
					options += '<option value="xq-dark">xq-dark</option>';
					options += '<option value="xq-light">xq-light</option>';
					options += '</select><br />';

					//Others
					options += tr('Options:') + '<br />';
					options += '<input class="opt" type="checkbox" value="lineNumbers" ' + (settings.lineNumbers ? 'checked="true"' : '') + '/>' + tr("Line Numbers") + '<br />';
					options += '<input class="opt" type="checkbox" value="lineWrapping" ' + (settings.lineWrapping ? 'checked="true"' : '') + '/>' + tr("Line Wrapping") + '<br />';

					var msg = jQuery('<div />')
						.html(options)
						.dialog({
							title: settings.changeText,
							modal: true,
							buttons: [
								{
									text: tr("Update"),
									click: function () {
										var newSettings = {
											mode: msg.find('.cm-mode').val(),
											theme: msg.find('.cm-theme').val()
										};

										msg.find('.opt').each(function () {
											var o = jQuery(this);
											newSettings[o.val()] = o.is(':checked');
										});

										changeButton.remove();
										editor.toTextArea();

										textarea.data('syntax', newSettings.mode);

										textarea.flexibleSyntaxHighlighter(jQuery.extend(settings, newSettings));

										msg.dialog("destroy");
									}
								},
								{
									text: tr("Cancel"),
									click: function () {
										msg.dialog("destroy");
									}
								}
							]
						});

					msg.find(".cm-mode").val(mode);
					msg.find(".cm-theme").val(settings.theme && settings.theme !== "off" ? settings.theme : "default");
				});

			var removeButton = jQuery(
				'<a class="btn btn-sm btn-link cm-remove" style="float: right;">' +
					settings.removeText +
				'</a>')
				.insertAfter(changeButton)
				.click(function () {
					var scrollTop;
					if ($(editor.getTextArea()).css("display") == "none") {
						if ($('.CodeMirror-fullscreen').length) syntaxHighlighter.fullscreen(textarea);

						syntaxHighlighter.remove(textarea);
						var scroller = $(editor.getScrollerElement()),
							scrollerHeight = scroller.innerHeight();
						scrollTop = scroller.scrollTop();

						editor.toTextArea();

						textarea
							.removeClass('CodeMirrorPrepSize')
							.show()
							.removeData('codeMirrorRelationship')
							.scrollTop(scrollTop * (textarea.innerHeight() / scrollerHeight));
						changeButton.remove();
					} else {
						scrollTop = $(document.body).scrollTop();
						textarea.flexibleSyntaxHighlighter(settings);
						$(document.body).scrollTop(scrollTop);
					}
					return false;
				});
		}

		setTimeout(function () {
			editor.refresh();
		}, 1000);

		return editor;
	},
	sync: function (textarea) {
		var editor = this.get(textarea);
		if (editor) textarea.val(editor.getValue());
	},
	add: function (editor, $input, none, skipResize) {
		window.codeMirrorEditor = (window.codeMirrorEditor ? window.codeMirrorEditor : []);
		var i = window.codeMirrorEditor.push(editor);

		if ($.fn.resizable && !skipResize) {
			var codeWrapper = $(editor.getWrapperElement());

			codeWrapper
				.resizable({
					minWidth: codeWrapper.width(),
					minHeight: codeWrapper.height(),
					alsoResize: codeWrapper.find('div.CodeMirror-scroll'),
					resize: function () {
						editor.refresh();
					}
				})
				.trigger("resizestop");
		}

		$input
			.data('codeMirrorRelationship', i - 1)
			.addClass('codeMirror')
			.on('sync', function () {
				syntaxHighlighter.sync($input);
			});
	},
	remove: function ($input) {
		var relationship = parseInt($input.data('codeMirrorRelationship'));
		if (relationship) {
			window.codeMirrorEditor[relationship] = null;
			$input.removeData('codeMirrorRelationship');
		}
	},
	get: function ($input) {
		var relationship = parseInt($input.data('codeMirrorRelationship'));

		if (window.codeMirrorEditor) {
			if (window.codeMirrorEditor[relationship]) {
				return window.codeMirrorEditor[relationship];
			}
		}
		return false;
	},
	fullscreen: function (textarea) {
		$('.CodeMirror-fullscreen').find('.CodeMirror').addBack().css('height', '');

		//removes wiki command buttons (save, cancel, preview) from fullscreen view
		$('.CodeMirror-fullscreen .actions').remove();

		textarea.parent().parent().toggleClass('CodeMirror-fullscreen');
		$('body').toggleClass('noScroll');
		$('.tabs,.rbox-title, .modules').toggle();

		var isFullscreen = ($('.CodeMirror-fullscreen').length ? true : false);

		var win = $(window).data('cm-resize', true),
			screen = $('.CodeMirror-fullscreen'),
			editorObj = screen.find('.CodeMirror'),
			toolbar = $('#editwiki_toolbar');
			editzonefooter = $('.CodeMirror-fullscreen .edit-zone-footer');

		if (isFullscreen) {
			editorObj.resizable( "disable" );

			//adds wiki command buttons (save, cancel, preview) from fullscreen view
			$('.actions', '#col1').clone().appendTo('.CodeMirror-fullscreen');
			var actions = $('.CodeMirror-fullscreen .actions');

			win.resize(function () {
				if (win.data('cm-resize') && screen) {
					screen.css('height', win.height() + 'px');

					editorObj.height(win.height() - toolbar.height() - editzonefooter.outerHeight() - actions.outerHeight());
				}
			}).resize();
		} else {
			editorObj.resizable( "enable" );
			$(window).removeData('cm-resize');
		}

		return false;
	},
	find: function (textareaEditor, val) {
		this.searchCursor[val] = textareaEditor.getSearchCursor(val);

		if (this.searchCursor[val].findNext()) {
			textareaEditor.setSelection(this.searchCursor[val].from(), this.searchCursor[val].to());
		}
	},
	searchCursor: {},
	replace: function (textareaEditor, val, replaceVal) {
		this.searchCursor[val] = textareaEditor.getSearchCursor(val);

		if (this.searchCursor[val].find()) {
			this.searchCursor[val].replace(replaceVal);

			while (this.searchCursor[val].findNext()) {
				this.searchCursor[val].replace(replaceVal);
			}
		}
	},
	insertAt: function (textareaEditor, replaceString, perLine, blockLevel, replaceSelection) {
		var toBeReplaced = /text|page|area_id/g;
		var handle = textareaEditor.getCursor(true);
		var selection = textareaEditor.getSelection();
		var cursor = textareaEditor.getCursor();

		var newString = '';

		if (perLine) { //for bullets
			if (textareaEditor.somethingSelected()) {//we kill all content because we already have the selection, and when we split it and re-insert, we get the lines again
				textareaEditor.replaceSelection('');
			} else {
				selection = textareaEditor.getLine(handle.line);
			}
			var lines = selection.split(/\n/g);
			jQuery(lines).each(function (i) {
				newString += replaceString.replace(toBeReplaced, this + '') + (i == lines.length - 1 ? '' : '\n');
			});

			if (textareaEditor.getSelection()) {
				textareaEditor.replaceSelection(newString);
			} else {
				textareaEditor.replaceRange(
					newString,
					{line: handle.line, ch: 0},
					{line: handle.line, ch: 0}
				);
			}
		} else if (blockLevel) {
			selection = textareaEditor.getLine(handle.line);

			if (selection) {
				textareaEditor.replaceRange(
					replaceString.replace(toBeReplaced, selection),
					{line: handle.line, ch: 0},
					{line: handle.line, ch: selection.length}
				);
			} else {
				textareaEditor.replaceRange(
					replaceString,
					{line: handle.line, ch: 0},
					{line: handle.line, ch: 0}
				);
			}

		} else if (replaceString) {
			cursor = textareaEditor.getCursor();

			if (replaceSelection) {
				textareaEditor.replaceSelection(replaceString);
			} else if (replaceString.match(toBeReplaced) && selection) {
				textareaEditor.replaceSelection(replaceString.replace(toBeReplaced, selection));
			} else {
				textareaEditor.replaceSelection(replaceString);
			}

			cursor.ch += textareaEditor.getSelection().length;
			textareaEditor.setCursor(cursor);
		} else {
			textareaEditor.replaceRange(textareaEditor.lineCount() - 1, 'end', newString);
		}

		textareaEditor.focus();
	},
	selection: function (textareaEditor, getStartEnd) {
		var selection = textareaEditor.getSelection();

		if (getStartEnd) {
			var startCursor = textareaEditor.getCursor(true),
				endCursor = textareaEditor.getCursor(false),
				val = (textareaEditor.getValue() + '').split('\n'),
				i;

			var result = {
				start: 0,
				end: 0
			};

			//get length of everything before current line
			for (i = 0; i <= startCursor.line; i++) {
				if (i < startCursor.line) {
					result.start += val[i].length;
				} else {
					//add the current line up to the position of the cursor that is selected
					result.start += startCursor.ch;
				}
			}

			//add everything up to the end line into
			for (i = 0; i <= endCursor.line; i++) {
				if (i < endCursor.line) {
					result.end += val[i].length;
				} else {
					result.end += endCursor.ch;
				}
			}

			return result;
		}

		return selection;
	},
	setSelection: function (textareaEditor, start, end) {
		var val = (textareaEditor.getValue() + ''),
			selection = {},
			startCursor = {line: 0, ch: 0},
			endCursor = {line: 0, ch: 0};

		selection.before = val.substring(0, start);
		selection.val = val.substring(start, end);
		selection.after = val.substring(end, val.length);
		selection.linesBefore = selection.before.split('\n');
		selection.lines = selection.val.split('\n');
		selection.linesAfter = selection.after.split('\n');

		startCursor.line = selection.linesBefore.length - 1;
		startCursor.ch = selection.linesBefore[selection.linesBefore.length - 1].length;

		endCursor.line = (startCursor.line + (selection.lines.length - 1));
		endCursor.ch = selection.lines[selection.lines.length - 1].length;

		//if the start and end line are the same, we must add them together in order to offset anything before it
		if (startCursor.line == endCursor.line) {
			endCursor.ch += startCursor.ch;
		}

		//console.log([startCursor, endCursor, selection, start, end]);

		textareaEditor.setSelection(startCursor, endCursor);
	}
};

$(function() {
	$('textarea')
			.flexibleSyntaxHighlighter();

	$('.codelisting').each(function () {
		$(this).flexibleSyntaxHighlighter({
			readOnly: true,
			mode: 'null',
			width: $(this).width() + 'px',
			height: $(this).parent().height() + 'px'
		})
	});

	//for plugin code
	$(document)
		.off('plugin_code_ready')
		.on('plugin_code_ready', function (args) {
			var updateTextarea = function () {
				colors.val(colorsSelector.val());

				$(".CodeMirror, .cm-change", args.modal).remove();
				code.removeClass('codeMirror').flexibleSyntaxHighlighter({
					mode: colorsSelector.val(),
					lineNumbers: ln.val() === "1",
					theme: theme.val(),
					force: true
				});
				if (codeMirrorTheme === "off" && ! theme.val()) {
					$(".cm-remove").click();	// cheap fix to have codemirror available but off by default
				}
			};
			var colors = args.modal.find('#param_colors_input').hide(),
				ln = args.modal.find('#param_ln_input').change(function () {
					updateTextarea.call(this);
				}),
				theme = args.modal.find('#param_theme_input').change(function () {
					updateTextarea.call(this);
				}),
				code = args.modal.find('textarea[name=content]'),
				colorsSelector = $('<select class="form-control"/>')
					.insertAfter(colors)
					.change(function () {
						updateTextarea.call(this);
					});

			var modes = CodeMirror.modes;
			for(var i in modes) {
				if (modes.hasOwnProperty(i)) {
					$('<option />').text(i).attr('value', i).appendTo(colorsSelector);
				}
			}

			setTimeout(function () {	// let the default cm code trigger first
				colorsSelector.val(colors.val()).change().trigger("chosen:updated");
			}, 100);
		});

	//for plugin html
	$(document)
		.off('plugin_html_ready')
		.on('plugin_html_ready', function(args) {
			var code = args.modal.find('textarea:first');
			
			code.flexibleSyntaxHighlighter({
				mode: 'xml',
				lineNumbers: true,
				force: true
			});
		});
		
	//for plugin r
	$(document)
		.off('plugin_r_ready')
		.on('plugin_r_ready', function(args) {
			var r = args.modal.find('textarea:first');
		
			r.flexibleSyntaxHighlighter({
				mode: 'r',
				lineNumbers: true,
				force: true
			});
		});

	//for plugin r
	$(document)
		.off('plugin_rr_ready')
		.on('plugin_rr_ready', function(args) {
			var r = args.modal.find('textarea:first');
		
			r.flexibleSyntaxHighlighter({
				mode: 'r',
				lineNumbers: true,
				force: true
			});
		});
});
