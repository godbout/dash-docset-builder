//$Id: tiki-js.js 70974 2019-09-15 02:08:32Z lindonb $

// simple translation function for tiki 6
function tr(str) {
	// The lang object defined in lang/xx/language.js (included automatically) holds JS string translations.
	if (typeof lang !== "undefined" /* language.js is included after tiki-js.js. This prevents errors in case tr() is called before language.js is loaded. Ideally, language.js would be loaded before tr() is defined. */ && typeof lang[str] == 'string') {
		return lang[str];
	} else {
		return str;
	}
}

var lang = {};	// object to hold JS string translations
				// default strings empty, override in lang/xx/language.js
				// which will be included automatically

// end translation

function browser() {
	var b = navigator.appName;
	if (b == "Netscape") { this.b = "ns"; }
	else { this.b = b; }
	this.version = navigator.appVersion;
	this.v = parseInt(this.version, 10);
	this.ns = (this.b=="ns" && this.v>=5);
	this.op = (navigator.userAgent.indexOf('Opera')>-1);
	this.safari = (navigator.userAgent.indexOf('Safari')>-1);
	this.op7 = (navigator.userAgent.indexOf('Opera')>-1 && this.v>=7);
	this.ie56 = (this.version.indexOf('MSIE 5')>-1||this.version.indexOf('MSIE 6')>-1);
	/* ie567 added by Enmore */
	this.ie567 = (this.version.indexOf('MSIE 5')>-1||this.version.indexOf('MSIE 6')>-1||this.version.indexOf('MSIE 7')>-1);
	this.iewin = (this.ie56 && navigator.userAgent.indexOf('Windows')>-1);
	/* iewin7 added by Enmore */
	this.iewin7 = (this.ie567 && navigator.userAgent.indexOf('Windows')>-1);
	this.iemac = (this.ie56 && navigator.userAgent.indexOf('Mac')>-1);
	this.moz = (navigator.userAgent.indexOf('Mozilla')>-1);
	this.moz13 = (navigator.userAgent.indexOf('Mozilla')>-1 && navigator.userAgent.indexOf('1.3')>-1);
	this.oldmoz = (navigator.userAgent.indexOf('Mozilla')>-1 && navigator.userAgent.indexOf('1.4')>-1 || navigator.userAgent.indexOf('Mozilla')>-1 && navigator.userAgent.indexOf('1.5')>-1 || navigator.userAgent.indexOf('Mozilla')>-1 && navigator.userAgent.indexOf('1.6')>-1);
	this.ns6 = (navigator.userAgent.indexOf('Netscape6')>-1);
	this.docom = (this.ie56||this.ns||this.iewin||this.op||this.iemac||this.safari||this.moz||this.oldmoz||this.ns6);
}

function toggle_dynamic_var(name) {
	var displayContainer = document.getElementById('dyn_'+name+'_display');
	var editContainer = document.getElementById('dyn_'+name+'_edit');

	// Create form element and append all inputs from "edit" span
	var form = document.createElement('form');
	form.setAttribute('method', 'post');
	form.setAttribute('name', 'dyn_vars');
	form.style.display = "inline";
	editContainer.parentNode.insertBefore(form, editContainer);
	form.appendChild(editContainer);

	// Show form
	if (displayContainer.style.display == "none") {
		editContainer.style.display = "none";
		displayContainer.style.display = "inline";
	} else {
		displayContainer.style.display = "none";
		editContainer.style.display = "inline";
	}
}

function chgArtType() {
	var articleType = document.getElementById('articletype').value;
	var typeProperties = articleTypes[articleType];

	var propertyList = ['show_topline','y',
	                    'show_subtitle','y',
	                    'show_linkto','y',
	                    'show_author','y',
	                    'use_ratings','y',
	                    'heading_only','n',
	                    'show_image_caption','y',
	                    'show_pre_publ','y',
	                    'show_post_expire','y',
	                    'show_image','y',
	                    'show_expdate','y'
	                    ];
	if (typeof articleCustomAttributes != 'undefined') {
		propertyList = propertyList.concat(articleCustomAttributes);
	}
	var l = propertyList.length, property, value, display;
	for (var i=0; i<l; i++) {
		property = propertyList[i++];
		value = propertyList[i];

		if (typeProperties[property] == value || (!typeProperties[property] && value == "n")) {
			display = "";
		} else {
			display = "none";
		}

		if (document.getElementById(property)) {
			document.getElementById(property).style.display = display;
		} else {
			var j = 1;
			while (document.getElementById(property+'_'+j)) {
				document.getElementById(property+'_'+j).style.display = display;
				j++;
			}
		}
	}
}

function toggleSpan(id) {
	$("#" + id).toggle();
}

function toggleBlock(id) {
	$("#" + id).toggle();
}

function toggleTrTd(id) {
	$("#" + id).toggle();
}

function changeText(el, newText) {
	// Safari work around
	if (el.innerText) {
		el.innerText = newText;
	} else if (el.firstChild && el.firstChild.nodeValue) {
		el.firstChild.nodeValue = newText;
	}
}

function toggleToc() {
	var toc = document.getElementById('toc').getElementsByTagName('ul')[0];

	if (toc && toc.style.display == 'none') {
		toc.style.display = 'block';
	} else {
		toc.style.display = 'none';
	}
}

function chgTrkFld(f,o) {
	var opt = 0;
	document.getElementById('z').style.display = "none";
	document.getElementById('zDescription').style.display = "";
	document.getElementById('zStaticText').style.display = "none";
	document.getElementById('zStaticTextToolbars').style.display = "none";

	for (var i = 0; i < f.length; i++) {
		var c = f.charAt(i);
		if (document.getElementById(c)) {
			var ichoiceParent = document.getElementById('itemChoicesRow');
			var ichoice = document.getElementById(c + 'itemChoices');
			if (c == o) {
				document.getElementById(c).style.display = "";
				document.getElementById('z').style.display = "block";
				if (c == 'S') {
					document.getElementById('zDescription').style.display = "none";
					document.getElementById('zStaticText').style.display = "";
					document.getElementById('zStaticTextToolbars').style.display = "";
				}
				if (ichoice) {
					ichoice.style.display = "";
					ichoiceParent.style.display = "";
				} else {
					ichoiceParent.style.display = "none";
				}
			} else {
				document.getElementById(c).style.display = "none";
				if (ichoice) {
					ichoice.style.display = "none";
				}
			}
		}
	}
}

function chgTrkLingual(item) {
	document.getElementById("multilabelRow").style.display = ( item == 't' || item == 'a' ) ? '' : 'none';
}

function multitoggle(f,o) {
	for (var i = 0; i < f.length; i++) {
		if (document.getElementById('fid'+f[i])) {
			if (f[i] == o) {
				document.getElementById('fid'+f[i]).style.display = "block";
			} else {
				document.getElementById('fid'+f[i]).style.display = "none";
			}
		}
	}
}

function setMenuCon(foo) {
	var it = foo.split(",");
	document.getElementById('menu_url').value = it[0];
	document.getElementById('menu_name').value = it[1];
	if (it[2]) {
		document.getElementById('menu_section').value = it[2];
	} else {
		document.getElementById('menu_section').value = '';
	}
	if (it[3]) {
		document.getElementById('menu_perm').value = it[3];
	} else {
		document.getElementById('menu_perm').value = '';
	}
	flip('weburls');
}

function genPass(w1) {
	var lower, upper, num, other, l, p, pstr, i, letter, j, temp;
	lower = 'abcdefghijklmnopqrstuvwxyz';
	upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	num = '0123456789';
	other = '_$%#!@*+';
	l = 8;
	p = [];
	//ensure at least 2 upper case letters, 2 numbers, and 2 other characters
	for (i = 0; i < l; i++) {
		if (i < 2) {
			letter = lower.charAt(Math.round(Math.random() * (lower.length - 1)));
		} else if (i < 4) {
			letter = upper.charAt(Math.round(Math.random() * (upper.length - 1)));
		} else if (i < 6) {
			letter = num.charAt(Math.round(Math.random() * (num.length - 1)));
		} else {
			letter = other.charAt(Math.round(Math.random() * (other.length - 1)));
		}
		p[i] = letter;
	}
	//shuffle the characters since they are blocks of 2 per above
	for (i = p.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		temp = p[i];
		p[i] = p[j];
		p[j] = temp;
	}
	//implode into a string
	pstr = p.join('');
	document.getElementById(w1).value = pstr;
}

function setUserModule(foo1) {
	document.getElementById('usermoduledata').value = foo1;
}

function replaceLimon(vec) {
	document.getElementById(vec[0]).value = document.getElementById(vec[0]).value.replace(vec[1], vec[2]);
}

function setSelectionRange(textarea, selectionStart, selectionEnd) {
	var $textareaEditor = syntaxHighlighter.get($(textarea));
	if ($textareaEditor) {
		syntaxHighlighter.setSelection($textareaEditor, selectionStart, selectionEnd);
		return;
	}

	$(textarea).selection(selectionStart, selectionEnd);
}

function getTASelection( textarea ) {
	var $textareaEditor = syntaxHighlighter.get($(textarea));
	if ($textareaEditor) {
		return $textareaEditor.getSelection();
	}

	var ta_id = $(textarea).attr("id"), r, cked, output;
	if (cked = typeof CKEDITOR !== 'undefined' ? CKEDITOR.instances[ta_id] : null) {
		// get selection from ckeditor
		return cked.getSelection().getSelectedText();

	} else {
		if (typeof $(textarea).attr("selectionStartSaved") != 'undefined' && $(textarea).attr("selectionStartSaved")) { // forgetful firefox/IE now
			return textarea.value.substring($(textarea).attr("selectionStartSaved"), $(textarea).attr("selectionEndSaved"));
		} else if ((typeof textarea != 'undefined') && (typeof textarea.selectionStart != 'undefined')) {
			return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
		} else { // IE
			r = document.selection.createRange();
			return r.text;
		}
	}
}

var ieFirstTimeInsertKludge = null;

function storeTASelection( area_id ) {
	if (typeof CKEDITOR === 'undefined' || typeof CKEDITOR.instances[area_id] === 'undefined') {
		var $el = $("#" + area_id);
		var sel = $el.selection();
		$el.attr("selectionStartSaved", sel.start)
				.attr("selectionEndSaved", sel.end)
				.attr("scrollTopSaved", $el.attr("scrollTop"));
	}
	if (ieFirstTimeInsertKludge === null) {
		ieFirstTimeInsertKludge = true;
	}
}

function setCaretToPos (textarea, pos) {
	setSelectionRange(textarea, pos, pos);
}

function getCaretPos (textarea) {
	var $textareaEditor = syntaxHighlighter.get($(textarea));
	if ($textareaEditor) {
		var endPoint = $textareaEditor.cursorCoords();
		return (endPoint.x ? endPoint.x : 0);
	}

	if (typeof textarea.selectionEnd != 'undefined') {
		return textarea.selectionEnd;
	} else if ( document.selection ) {

		textarea.focus();
		var range = document.selection.createRange();
		if (range === null) {
			return 0;
		}
		var re = textarea.createTextRange();
		var rc = re.duplicate();
		re.moveToBookmark(range.getBookmark());
		rc.setEndPoint('EndToStart', re);
		return rc.text.length ? rc.text.length : 0;

	} else {
		return 0;
	}
}

function insertAt(elementId, replaceString, blockLevel, perLine, replaceSelection) {

	// inserts given text at selection or cursor position
	var $textarea = $('#' + elementId);
	var $textareaEditor = syntaxHighlighter.get($textarea);
	var toBeReplaced = /text|page|area_id/g; //substrings in replaceString to be replaced by the selection if a selection was done
	var hiddenParents = $textarea.parents('fieldset:hidden:last');
	if (hiddenParents.length) { hiddenParents.show(); }

	if ($textareaEditor) {
	 	syntaxHighlighter.insertAt($textareaEditor, replaceString, perLine, blockLevel, replaceSelection);
		return;
	 // get ckeditor handling out of the way - can only be simple text insert for now
	} else if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances[elementId]) {
		// get selection from ckeditor
		var cked = CKEDITOR.instances[elementId];
		if (cked) {
			var isPlugin = replaceString.match(/^\s?\{/m);		// do match in two halves due to multiline problems
			if (isPlugin) {
				isPlugin = replaceString.match(/\}\s?$/m);		// not so simple {plugin} match
			}
			isPlugin = isPlugin && isPlugin.length > 0;

			var sel = cked.getSelection(), rng;
			if (sel) { // not from IE sometimes?
				rng = sel.getRanges();
				if (rng.length) {
					rng = rng[0];
				}
			}
			var plugin_el, com;
			if (isPlugin && rng && !rng.collapsed) {
				com = cked.getSelection().getStartElement();
				if (typeof com !== 'undefined' && com && com.$) {
					while (!$(com.$).hasClass("tiki_plugin") && com.$.nextSibling && com.$ !== rng.endContainer.$) {	// loop through selection if multiple elements
						com = new CKEDITOR.dom.element(com.$.nextSibling);
						if ($(com.$).hasClass("tiki_plugin") || $(com.$).find(".tiki_plugin").length === 0) {	// found it or parent (hmm)
							break;
						}
					}
					if (!$(com.$).hasClass("tiki_plugin")) { // not found it yet?
						plugin_el = $(com.$).find(".tiki_plugin"); // using jQuery
						if (plugin_el.length == 1) { // found descendant plugin
							com = new CKEDITOR.dom.element(plugin_el[0]);
						} else {
							plugin_el = $(com.$).parents(".tiki_plugin:last"); // try parents
							if (plugin_el.length == 1) { // found p plugin
								com = new CKEDITOR.dom.element(plugin_el[0]);
							} else { // still not found it? sometimes Fx seems to get the editor body as the selection...
								var plugin_type = replaceString.match(/^\s?\{([\w]+)/);
								if (plugin_type.length > 1) { plugin_type = plugin_type[1].toLowerCase(); }

								plugin_el = $(com.$).find("[plugin=" + plugin_type + "].tiki_plugin"); // find all of them
								if (plugin_el.length == 1) { // good guess!
									com = new CKEDITOR.dom.element(plugin_el[0]);
								} else {
									// Does not seem to be a problem at least with the image plugin, commenting out for release but keeping it here in case problem reappears
									//if (!confirm(tr("Development notice: Could not find plugin being edited, sorry. Choose cancel to debug."))) {
									//	debugger;
									//}
								}
							}
						}
					}
				}
				if (com && com.hasClass("tiki_plugin")) {
					var html = cked.getData().replace(com.data("syntax"), replaceString);
					cked.setData(html);
					return;
				}
			}
			// catch all other issues and do the insert wherever ckeditor thinks best,
			// sadly as the first element sometimes FIXME
			//cked.focus();	seems calling focus here makes the editor focus disappear in webkit - still FIXME

			try {
				cked.insertText(replaceString);
			} catch (e) {
				prompt(tr("Development notice: The editor selection has been lost, here is the text to insert."), replaceString);
				return;
			}
			if (typeof cked.reParse === "function" &&	// also ((wiki links)) or tables
				(isPlugin || replaceString.match(/^\s?\(\(.*?\)\)\s?$/) || replaceString.match(/^||.*||$/))) {

				var bookmarks = cked.getSelection().createBookmarks2(true);	// remember selection

				cked.reParse();

				cked.getSelection().selectBookmarks( bookmarks );		// restore selection
			}
		}
		return;
	}

	if (!$textarea.length && elementId === "fgal_picker") {	// ckeditor file browser
		$(".cke_dialog_contents").find("input:first").val(replaceString.replace("&amp;", "&"));
		return;
	} else if ($textarea.is(":input") && elementId === "fgal_picker_id") {
		$textarea.val(replaceString);
		return;
	}

	$textarea.focus();

	var val = $textarea.val();
	var selection = $textarea.selection();
	var scrollTop=$textarea[0].scrollTop;

	if (selection.start === 0 && selection.end === 0 &&
					typeof $textarea.attr("selectionStartSaved") != 'undefined') {	// get saved textarea selection
		if ($textarea.attr("selectionStartSaved")) {	// forgetful firefox/IE
			selection.start = $textarea.attr("selectionStartSaved");
			selection.end = $textarea.attr("selectionEndSaved");
			if ($textarea.attr("scrollTopSaved")) {
				scrollTop = $textarea.attr("scrollTopSaved");
				$textarea.attr("scrollTopSaved", "");
			}
			$textarea.attr("selectionStartSaved", "").attr("selectionEndSaved", "");
		} else {
			selection.start = getCaretPos($textarea[0]);
			selection.end = selection.start;
		}
	}

	// deal with IE's two char line ends
	var lines, startoff = 0, endoff = 0;
	if ($textarea[0].createTextRange && $textarea[0].value !== val) {
		val = $textarea[0].value;	// use raw value of the textarea
		if (val.substring(selection.start, selection.start + 1) === "\n") {
			selection.start++;
		}
		lines = val.substring(0, selection.start).match(/\r\n/g);
			if (lines) {
			startoff -= lines.length;	// remove one char per line for IE
			}
		}
	var selectionStart = selection.start;
	var selectionEnd = selection.end;

	if ( blockLevel ) {
		// Block level operations apply to entire lines

		// +1 and -1 to handle end of line caret position correctly
		selectionStart = val.lastIndexOf( "\n", selectionStart - 1 ) + 1;
		var blockEnd = val.indexOf( "\r", selectionEnd ); // check for IE first
		if (blockEnd < 0) {
			selectionEnd = val.indexOf( "\n", selectionEnd );
		} else {
			selectionEnd = blockEnd;
		}
		if (selectionEnd < 0) {
			selectionEnd = val.length;
		}
	}

	var newString = '';
	if ((selectionStart != selectionEnd) && !$textareaEditor) { // has there been a selection
		if ( perLine ) {
			lines = val.substring(selectionStart, selectionEnd).split("\n");
			for( var k = 0; lines.length > k; ++k ) {
				if ( lines[k].length !== 0 ) {
					newString += replaceString.replace(toBeReplaced, lines[k]);
				}
				if ( k != lines.length - 1 ) {
					newString += "\n";
				}
			}
		} else {
			if (replaceSelection) {
				newString = replaceString;
			} else if (replaceString.match(toBeReplaced)) {
				newString = replaceString.replace(toBeReplaced, val.substring(selectionStart, selectionEnd));
			} else {
				newString = replaceString + '\n' + val.substring(selectionStart, selectionEnd);
			}
		}

		$textarea.val(val.substring(0, selectionStart)
						+ newString
						+ val.substring(selectionEnd)
					);
		lines = newString.match(/\r\n/g);
		if (lines) {
			endoff   -= lines.length;	// lines within the replacement for IE
		}
		setSelectionRange($textarea[0], selectionStart + startoff, selectionStart + startoff + newString.length + endoff);

	} else { // insert at caret
		$textarea.val(val.substring(0, selectionStart)
						+ replaceString
						+ val.substring(selectionEnd)
					);
		lines = replaceString.match(/\r\n/g);
		if (lines) {
			endoff   -= lines.length;	// lines within the replacement for IE
		}
		setCaretToPos($textarea[0], selectionStart + startoff + replaceString.length + endoff);

	}
	$textarea.attr("scrollTop", scrollTop);
	if (this.iewin && ieFirstTimeInsertKludge) {
		setTimeout(function(){		// not only does IE reset the scrollTop and selection the first time a dialog is used
			if (newString.length) {	// but somehow all the ints have been converted into strings...
				setSelectionRange($textarea[0], parseInt(selectionStart,10) + parseInt(startoff,10),
						parseInt(selectionStart,10) + parseInt(startoff,10) + newString.length + parseInt(endoff,10));
			}
			$textarea.attr("scrollTop", scrollTop);
		}, 1000);
		ieFirstTimeInsertKludge = false;
	}

	if (hiddenParents.length) { hiddenParents.hide(); }
	if (typeof auto_save === "function") {
		auto_save(elementId);
	}
}

function setUserModuleFromCombo(id, textarea) {
	document.getElementById(textarea).value = document.getElementById(textarea).value
				+ document.getElementById(id).options[document.getElementById(id).selectedIndex].value;
}


function toggle(foo) {
	var display = $("#"+foo).css('display');
	if (display == "none") {
		show(foo, true, "menu");
	} else {
		if (display == "block") {
			hide(foo, true, "menu");
		} else {
			show(foo, true, "menu");
		}
	}
}

function flip_thumbnail_status(id) {
	var elem = document.getElementById(id);
	if ( elem.className == 'thumbnailcontener' ) {
		elem.className += ' thumbnailcontenerchecked';
	} else {
		elem.className = 'thumbnailcontener';
	}
}

function flip_class(itemid, class1, class2) {
	var elem = document.getElementById(itemid);
	if (elem && typeof elem != 'undefined') {
		elem.className = elem.className == class1 ? class2 : class1;
		setCookie('flip_class_' + itemid, elem.className);
	}
}

function tikitabs( focus, tabElement) {
	var container, ofocus = focus;
	if (typeof tabElement === "undefined") {
		container = $(".tabset:first");
	} else {
		container = $(tabElement).parents(".tabset:first");
	}

	if (focus > $("> .tabs .tabmark", container).length) {
		focus = 1;	// limit to number of tabs - somehow getting set to 222 sometimes
	}

	while ($("> .tabs .tabmark.tab" + focus + ":first", container).is(":hidden")) {
		focus++;
	}
	if ($("> .tabs .tabmark.tab" + focus + ":first", container).length === 0) {
		focus = ofocus;
	}

	$("> .tabs .tabmark:not(.tab" + focus + ":first)", container).removeClass("tabactive");		// may need .addClass("tabinactive");
	$("> .tabs .tabmark.tab" + focus + ":first", container).addClass("tabactive");				// and .removeClass("tabinactive");
	$("> .tabcontent:not(.content" + focus + ":first)", container).hide();
	$("> .tabcontent.content" + focus + ":first", container).show();
	setCookie( $(".tabs:first", container).data("name"), focus, "tabs", "session");

}

/* foo: name of the menu
 * def: menu type (e:extended, c:collapsed, f:fixed)
 * the menu is collapsed function of its cookie: if no cookie is set, the def is used
 */
function setfolderstate(foo, def, img, status) {
	if (!status) {
		status = getCookie(foo, "menu", "o");
	}
	if (!img) {
		if (document.getElementsByName('icn' + foo)[0].src.search(/[\\\/]/)) {
			img = document.getElementsByName('icn' + foo)[0].src.replace(/.*[\\\/]([^\\\/]*)$/, "$1");
		} else {
			img = 'folder.png';
		}
	}
	var src = img; // default
	if (status == 'c') {
		hide(foo, false, "menu");
	} else {
		show(foo, false, "menu");
	}
	if (status == 'c' && def != 'd') { /* need to change the open icon to a close one*/
		src = src.replace(/^o/, '');
	} else if (status != 'c' && def == 'd' && src.indexOf('o') !== 0) { /* need to change the close icon to an open one */
		src = 'o' + img;
	}
	document.getElementsByName('icn' + foo)[0].src = document.getElementsByName('icn' + foo)[0].src.replace(/[^\\\/]*$/, src);
}

function setheadingstate(foo) {
	var status = getCookie(foo, "showhide_headings");
	var $foo = $("#" + foo);
	if (status == "o") {
		$foo.show();
		collapseSign("flipper" + foo);
	} else if (status == "c") {
		$foo.hide();
		expandSign("flipper" + foo);
	}
}

function setsectionstate(foo, def, img, status) {
	var src;
	if (!status) {
		status = getCookie(foo, "menu", "o");
	}
	if (status == "o") {
		show(foo);
		if (img) { src = "o" + img; }
	} else if (status != "c" && def != 'd') {
		show(foo);
		if (img) { src = "o" + img; }
	} else /* if (status == "c") */ {
		hide(foo);
		if (img) { src = img; }
	}
	if (img && document.getElementsByName('icn' + foo).length) {
		document.getElementsByName('icn' + foo)[0].src = document.getElementsByName('icn' + foo)[0].src.replace(/[^\\\/]*$/, src);
	}
}

function icntoggle(foo, img) {
	var $icn = $("#icn" + foo);
	var src = $icn.attr("src");
	if (!src) {
		src = "";
	}
	if (!img) {
		if (src.search(/[\\\/]/)) {
			img = src.replace(/.*[\\\/]([^\\\/]*)$/, "$1");
		} else {
			img = 'folder.png';
		}
	}
	if ($("#" + foo + ":hidden").length) {
		show(foo, true, "menu");
		$icn.attr("src", src.replace(/[^\\\/]*$/, 'o' + img));

	} else {
		hide(foo, true, "menu");
		img = img.replace(/(^|\/|\\)o(.*)$/, '$1$2');
		$icn.attr("src", src.replace(/[^\\\/]*$/, img));
	}
}

/**
 * New version of icntoggle function above to better deal with iconsets
 * Different than the above function, both versions of the icon are included in the template with one hidden
 * @param foo
 * @param clicked
 */

function icontoggle(foo, clicked) {
	//expand or collapse
	if ($("#" + foo + ":hidden").length) {
		show(foo, true, "menu");
	} else {
		hide(foo, true, "menu");
	}
	//toggle icon display
	var id = clicked.id;
	$('#' + id + ' .toggle-open').toggle();
	$('#' + id + ' .toggle-closed').toggle();
	return false;
}


//Initialize a cross-browser XMLHttpRequest object.
//The object return has to be sent using send(). More parameters can be
//given.
//callback - The function that will be called when the response arrives
//First parameter will be the status
//(HTTP Response Code [200,403, 404, ...])
//method - GET or POST
//url - The URL to open
function getHttpRequest( method, url, async )
{
	if ( async === undefined ) {
		async = false;
	}
	var request;

	if ( window.XMLHttpRequest ) {
		request = new XMLHttpRequest();
	} else if ( window.ActiveXObject )
	{
		try
		{
			request = new ActiveXObject( "Microsoft.XMLHTTP" );
		}
		catch( ex )
		{
			request = new ActiveXObject("MSXML2.XMLHTTP");
		}
	}
	else {
		return false;
	}
	if ( !request ) {
		return false;
	}
	request.open( method, url, async );

	return request;
}

//name - name of the cookie
//value - value of the cookie
// [expires] - expiration date of the cookie (defaults to end of current session)
// [path] - path for which the cookie is valid (defaults to path of calling document)
// [domain] - domain for which the cookie is valid (defaults to domain of calling document)
// [secure] - Boolean value indicating if the cookie transmission requires a secure transmission
//* an argument defaults when it is assigned null as a placeholder
//* a null placeholder is not required for trailing omitted arguments
function setSessionVar(name,value) {
	var request = getHttpRequest( "GET", "tiki-cookie-jar.php?" + name + "=" + tiki_encodeURIComponent(value));
	request.send('');

	if (tiki_cookie_jar) {
		tiki_cookie_jar[name] = value;
	}
}

function setCookie(name, value, section, expires, path, domain, secure) {
	if (getCookie(name, section) == value) {
		return true;
	}
	if (!expires) {
		expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);
	}
	if (expires === "session") {
		expires = "";
	}
	if (typeof jqueryTiki != "undefined" && jqueryTiki.no_cookie) {
		var request = getHttpRequest( "GET", "tiki-cookie-jar.php?" + name + "=" + encodeURIComponent( value ) );
		try {
			request.send('');
			// alert("XMLHTTP/set"+request.readyState+request.responseText);
			tiki_cookie_jar[name] = value;
			return true;
		}
		catch( ex )	{
			setCookieBrowser(name, value, section, expires, path, domain, secure);
			return false;
		}
	}
	else {
		setCookieBrowser(name, value, section, expires, path, domain, secure);
		return true;
	}
}
function setCookieBrowser(name, value, section, expires, path, domain, secure) {
	if (section) {
		var valSection = getCookie(section);
		var name2 = "@" + name + ":";
		if (valSection) {
			if (new RegExp(name2).test(valSection)) {
				valSection  = valSection.replace(new RegExp(name2 + "[^@;]*"), name2 + value);
			} else {
				valSection = valSection + name2 + value;
			}
			setCookieBrowser(section, valSection, null, expires, path, domain, secure);
		}
		else {
			valSection = name2+value;
			setCookieBrowser(section, valSection, null, expires, path, domain, secure);
		}

	}
	else {
		var curCookie = name + "=" + encodeURIComponent(value) + ((expires) ? "; expires=" + expires.toGMTString() : "")
		+ ((path) ? "; path=" + path : "") + ((domain) ? "; domain=" + domain : "") + ((secure) ? "; secure" : "");
		document.cookie = curCookie;
	}
}

//name - name of the desired cookie
//section - name of group of cookies or null
// * return string containing value of specified cookie or null if cookie does not exist
function getCookie(name, section, defval) {
	if ( typeof jqueryTiki != "undefined" && jqueryTiki.no_cookie && (window.XMLHttpRequest || window.ActiveXObject) && typeof tiki_cookie_jar != "undefined" && tiki_cookie_jar.length > 0) {
		if (typeof tiki_cookie_jar[name] == "undefined") {
			return defval;
		}
		return tiki_cookie_jar[name];
	}
	else {
		return getCookieBrowser(name, section, defval);
	}
}
function getCookieBrowser(name, section, defval) {
	if (typeof defval === "undefined") { defval = null; }
	if (section) {
		var valSection = getCookieBrowser(section);
		if (valSection) {
			var name2 = "@"+name+":";
			var val = valSection.match(new RegExp(name2 + "([^@;]*)"));
			if (val) {
				return decodeURIComponent(val[1]);
			} else {
				return defval;
			}
		} else {
			return defval;
		}
	} else {
		var dc = document.cookie;

		var prefix = name + "=";
		var begin = dc.indexOf("; " + prefix);

		if (begin == -1) {
			begin = dc.indexOf(prefix);

			if (begin !== 0) {
				return defval;
			}
		} else { begin += 2; }

		var end = document.cookie.indexOf(";", begin);

		if (end == -1) {
			end = dc.length;
		}
		return decodeURIComponent(dc.substring(begin + prefix.length, end));
	}
}

//name - name of the cookie
//[path] - path of the cookie (must be same as path used to create cookie)
// [domain] - domain of the cookie (must be same as domain used to create cookie)
// * path and domain default if assigned null or omitted if no explicit argument proceeds
function deleteCookie(name, section, expires, path, domain, secure) {
	if (section) {
		var valSection = getCookieBrowser(section);
		var name2 = "@" + name + ":";
		if (valSection) {
			if (new RegExp(name2).test(valSection)) {
				valSection  = valSection.replace(new RegExp(name2 + "[^@;]*"), "");
				setCookieBrowser(section, valSection, null, expires, path, domain, secure);
			}
		}
	}
	else {

//		if ( !setCookie( name, '', 0, path, domain ) ) {
//		if (getCookie(name)) {
		document.cookie = name + "="
		+ ((path) ? "; path=" + path : "") + ((domain) ? "; domain=" + domain : "") + "; expires=Thu, 01-Jan-70 00:00:01 GMT";
//		}
	}
}

//date - any instance of the Date object
//* hand all instances of the Date object to this function for "repairs"
function fixDate(date) {
	var base = new Date(0);

	var skew = base.getTime();

	if (skew > 0) {
		date.setTime(date.getTime() - skew);
	}
}


//Expand/collapse lists

function flipWithSign(foo) {
	if (document.getElementById(foo).style.display == "none") {
		show(foo, true, "showhide_headings");
		collapseSign("flipper" + foo);
	} else {
		hide(foo, true, "showhide_headings");
		expandSign("flipper" + foo);
	}
}

//set the state of a flipped entry after page reload
function setFlipWithSign(foo) {
	if (getCookie(foo, "showhide_headings", "o") == "o") {
		collapseSign("flipper" + foo);

		show(foo);
	} else {
		expandSign("flipper" + foo);

		hide(foo);
	}
}

function expandSign(foo) {
	if (document.getElementById(foo)) {
		document.getElementById(foo).firstChild.nodeValue = "[+]";
	}
}

function collapseSign(foo) {
	if (document.getElementById(foo)) {
		document.getElementById(foo).firstChild.nodeValue = "[-]";
	}
} // flipWithSign()

// Set client timezone
// moved to lib/setup/javascript.php

//function added for use in navigation dropdown
//example :
//<select name="anything" onchange="go(this);">
//<option value="http://tiki.org">tiki.org</option>
//</select>
function go(o) {
	if (o.options[o.selectedIndex].value !== "") {
		location.replace(o.options[o.selectedIndex].value);

		o.options[o.selectedIndex] = 1;
	}

	return false;
}


//function: targetBlank
//desc: opens a new window, XHTML-compliant replacement of the "TARGET" tag
//added by: Ralf Lueders (lueders@lrconsult.com)
//date: Sep 7, 2003
//params: url: the url for the new window
//mode='nw': new, full-featured browser window
//mode='popup': new windows, no features & buttons

function targetBlank(url,mode) {
	var features = 'menubar=yes,toolbar=yes,location=yes,directories=yes,fullscreen=no,titlebar=yes,hotkeys=yes,status=yes,scrollbars=yes,resizable=yes';
	switch (mode) {
	// new full-equipped browser window
	case 'nw':
		break;
		// new popup-window
	case 'popup':
		features = 'menubar=no,toolbar=no,location=no,directories=no,fullscreen=no,titlebar=no,hotkeys=no,status=no,scrollbars=yes,resizable=yes';
		break;
	default:
		break;
	}
	window.open(url,'_blank',features);
}

//function: confirmTheLink
//desc: pop up a dialog box to confirm the action
//added by: Franck Martin
//date: Oct 12, 2003
//params: theLink: The link where it is called from
//params: theMsg: The message to display
function confirmTheLink(theLink, theMsg)
{
    // Confirmation is not required if browser is Opera (crappy js implementation)
	if (typeof(window.opera) != 'undefined') {
		return true;
	}

	var is_confirmed = confirm(theMsg);
	// if (is_confirmed) {
	// theLink.href += '&amp;is_js_confirmed=1';
	// }

	return is_confirmed;
}

/** \brief: insert img tag in textarea
 *
 */
function insertImgFile(elementId, fileId, oldfileId,type,page,attach_comment) {
	var textarea = $('#' + elementId)[0];
	var fileup   = $('input[name=' + fileId + ']')[0];
	var oldfile  = $('input[name=' + oldfileId + ']')[0];
	var prefixEl = $('input[name=prefix]')[0];
	var prefix   = "img/wiki_up/";

	if (!textarea || ! fileup) {
		return;
	}
	if ( prefixEl) { prefix= prefixEl.value; }

	var filename = fileup.value, dirs, str;
	var oldfilename = oldfile.value;

    if (filename == oldfilename || filename === "" ) { // insert only if name really changed
		return;
	}
	oldfile.value = filename;

	if (filename.indexOf("/")>=0) { // unix
		dirs = filename.split("/");
		filename = dirs[dirs.length-1];
	}
	if (filename.indexOf("\\")>=0) { // dos
		dirs = filename.split("\\");
		filename = dirs[dirs.length-1];
	}
	if (filename.indexOf(":")>=0) { // mac
		dirs = filename.split(":");
		filename = dirs[dirs.length-1];
	}
	// @todo - here's a hack: we know its ending up in img/wiki_up.
	// replace with dyn. variable once in a while to respect the tikidomain
	if (type == "file") {
		str = "{file name=\""+filename + "\"";
		var desc = $('#' + attach_comment).val();
		if (desc) {
			str = str + " desc=\"" + desc + "\"";
		}
		str = str + "}";
	} else {
		str = "{img src=\"img/wiki_up/" + filename + "\" }\n";
	}
	insertAt(elementId, str);
}

/* add new upload image form in page edition */
var img_form_count = 2, needToConfirm = false;
function addImgForm() {
	var new_text = document.createElement('span');
	new_text.setAttribute('id','picfile' + img_form_count);
	new_text.innerHTML = '<input name=\'picfile' + img_form_count + '\' type=\'file\' onchange=\'insertImgFile("editwiki","picfile' + img_form_count + '","hasAlreadyInserted","img")\'/><br />';
	document.getElementById('new_img_form').appendChild(new_text);
	needToConfirm = true;
	img_form_count ++;
}

browser();

//This was added to allow wiki3d to change url on tiki's window
window.name = 'tiki';

var fgals_window = null;

function openFgalsWindow(filegal_manager_url, reload) {
	if (fgals_window && typeof fgals_window.document != "undefined" && !fgals_window.closed) {
		if (reload) {
			fgals_window.location.replace(filegal_manager_url);
		}
		fgals_window.focus();
	} else {
		fgals_window=window.open(filegal_manager_url,'_blank','menubar=1,scrollbars=1,resizable=1,height=500,width=800,left=50,top=50');
	}
	$(window).on("unload", function(){	// tidy
		fgals_window.close();
	});
}

/* Count the number of words (spearated with space) */
function wordCount(maxSize, source, cpt, message) {
	var formcontent = source.value;
	var str = formcontent.replace(/^\s+|\s+$/g, '') ;
	formcontent = str.split(/[^\S]+/);
	if (maxSize > 0 && formcontent.length > maxSize) {
		alert(message);
		source.value = source.value.substr(0, source.value.length-1);
	} else {
		document.getElementById(cpt).value = formcontent.length;
	}
}
function charCount(maxSize, source, cpt, message) {
	var formcontent = source.value.replace(/(\r\n|\n|\r)/g, '  ');
	if (maxSize > 0 && formcontent.length > maxSize) {
		alert(message);
		source.value = source.value.substr(0, maxSize);
	} else {
		document.getElementById(cpt).value = formcontent.length;
	}
}

//Password strength
//Based from code by:
//Matthew R. Miller - 2007
//www.codeandcoffee.com
//originally released as "free software license"

/*
 * Password Strength Algorithm:
 *
 * Password Length: 5 Points: Less than 4 characters 10 Points: 5 to 7
 * characters 25 Points: 8 or more
 *
 * Letters: 0 Points: No letters 10 Points: Letters are all lower case 20
 * Points: Letters are upper case and lower case
 *
 * Numbers: 0 Points: No numbers 10 Points: 1 number 20 Points: 3 or more
 * numbers
 *
 * Characters: 0 Points: No characters 10 Points: 1 character 25 Points: More
 * than 1 character
 *
 * Bonus: 2 Points: Letters and numbers 3 Points: Letters, numbers, and
 * characters 5 Points: Mixed case letters, numbers, and characters
 *
 * Password Text Range: >= 90: Very Secure >= 80: Secure >= 70: Very Strong >=
 * 60: Strong >= 50: Average >= 25: Weak >= 0: Very Weak
 *
 */


//Settings
// -- Toggle to true or false, if you want to change what is checked in the password
var m_strUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var m_strLowerCase = "abcdefghijklmnopqrstuvwxyz";
var m_strNumber = "0123456789";
var m_strCharacters = "!@#$%^&*?_~";

//Check password
function checkPassword(strPassword)
{
	// Reset combination count
	var nScore = 0;

	// Password length
	// -- Less than 4 characters
	if (strPassword.length < 5)
	{
		nScore += 5;
	}
	// -- 5 to 7 characters
	else if (strPassword.length > 4 && strPassword.length < 8)
	{
		nScore += 10;
	}
	// -- 8 or more
	else if (strPassword.length > 7)
	{
		nScore += 25;
	}

	// Letters
	var nUpperCount = countContain(strPassword, m_strUpperCase);
	var nLowerCount = countContain(strPassword, m_strLowerCase);
	var nLowerUpperCount = nUpperCount + nLowerCount;
	// -- Letters are all lower case
	if (nUpperCount === 0 && nLowerCount !== 0)
	{
		nScore += 10;
	}
	// -- Letters are upper case and lower case
	else if (nUpperCount !== 0 && nLowerCount !== 0)
	{
		nScore += 20;
	}

	// Numbers
	var nNumberCount = countContain(strPassword, m_strNumber);
	// -- 1 number
	if (nNumberCount == 1)
	{
		nScore += 10;
	}
	// -- 3 or more numbers
	if (nNumberCount >= 3)
	{
		nScore += 20;
	}

	// Characters
	var nCharacterCount = countContain(strPassword, m_strCharacters);
	// -- 1 character
	if (nCharacterCount == 1)
	{
		nScore += 10;
	}
	// -- More than 1 character
	if (nCharacterCount > 1)
	{
		nScore += 25;
	}

	// Bonus
	// -- Letters and numbers
	if (nNumberCount !== 0 && nLowerUpperCount !== 0)
	{
		nScore += 2;
	}
	// -- Letters, numbers, and characters
	if (nNumberCount !== 0 && nLowerUpperCount !== 0 && nCharacterCount !== 0)
	{
		nScore += 3;
	}
	// -- Mixed case letters, numbers, and characters
	if (nNumberCount !== 0 && nUpperCount !== 0 && nLowerCount !== 0 && nCharacterCount !== 0)
	{
		nScore += 5;
	}


	return nScore;
}

//Runs password through check and then updates GUI
function runPassword(strPassword, strFieldID)
{
	// Get controls
	var ctlBar = document.getElementById(strFieldID + "_bar");
	var ctlText = document.getElementById(strFieldID + "_text");
	var ctlTextInner = document.getElementById(strFieldID + "_text_inner");
	if (!ctlBar || !ctlText || !ctlTextInner) {
		return;
	}
	if (strPassword.length > 0) {
		// Check password
		var nScore = checkPassword(strPassword);

		// Set new width
		ctlBar.style.width = nScore + "%";

		// Color and text
		var icon, strText, strColor;
		// -- Very Secure
		if (nScore >= 90)
		{
			icon = 'ok';
			strText = tr("Very Secure");
			strColor = "#0ca908";
		}
		// -- Secure
		else if (nScore >= 80)
		{
			icon = 'ok';
			strText = tr("Secure");
			strColor = "#0ca908";
		}
		// -- Very Strong
		else if (nScore >= 70)
		{
			icon = 'ok';
			strText = tr("Very Strong");
			strColor = "#0ca908";
		}
		// -- Strong
		else if (nScore >= 60)
		{
			icon = 'ok';
			strText = tr("Strong");
			strColor = "#0ca908";
		}
		// -- Average
		else if (nScore >= 40)
		{
			icon = 'none';
			strText = tr("Average");
			strColor = "#e3cb00";
		}
		// -- Weak
		else if (nScore >= 25)
		{
			icon = 'error';
			strText = tr("Weak");
			strColor = "#ff0000";
		}
		// -- Very Weak
		else
		{
			icon = 'error';
			strText = tr("Very Weak");
			strColor = "#ff0000";
		}
		ctlBar.style.backgroundColor = strColor;
		$(ctlBar).show();
		if (icon === 'none') {
			$(ctlText).children('span.icon').hide();
		} else if (icon === 'ok') {
			$(ctlText).children('span.icon-ok').css('color', strColor).show();
			$(ctlText).children('span.icon-error').hide();
		} else if (icon === 'error') {
			$(ctlText).children('span.icon-ok').hide();
			$(ctlText).children('span.icon-error').css('color', strColor).show();
		}
		$(ctlTextInner).text(tr('Strength') + ': ' + strText).show();
	} else {
		$(ctlText).children().hide();
		$(ctlTextInner).hide();
		$(ctlBar).hide();
	}
}

//Checks a string for a list of characters
function countContain(strPassword, strCheck)
{
	// Declare variables
	var nCount = 0, i;

	for (i = 0; i < strPassword.length; i++)
	{
		if (strCheck.indexOf(strPassword.charAt(i)) > -1)
		{
			nCount++;
		}
	}

	return nCount;
}

function checkPasswordsMatch(in1, in2, el) {
	if ($(in1).val().length) {
		if ($(in1).val() == $(in2).val()) {
			$(el).children('#match').show();
			$(el).children('#nomatch').hide();
			return true;
		} else {
			$(el).children('#match').hide();
			$(el).children('#nomatch').show();
			return false;
		}
	} else {
		$(el).children().hide();
	}
}

/**
 * Adds an Option to the quickpoll section.
 */
function pollsAddOption()
{
	var newOption = $( '<input />')
		.attr('type', 'text')
		.attr('name', 'options[]')
		.attr('placeholder', tr('New option'))
		.addClass('form-control');
	$('#tikiPollsOptions').append($('<div class="mb-2"></div>').append(newOption));
}

/**
 * toggles the quickpoll section
 */
function pollsToggleQuickOptions()
{
	$( '#tikiPollsQuickOptions' ).toggle(function () {
		var display = $( '#tikiPollsQuickOptions' ).css('display');
		if (display === 'none') {
			$('#tikiPollsOptionsButton').text(tr('Show Options'));
		} else {
			$('#tikiPollsOptionsButton').text(tr('Hide Options'));
		}
	});
}

/**
 * toggles div for droplist with Disabled option
 */

function hidedisabled(divid,value) {
	if (value=='disabled') {
		document.getElementById(divid).style.display = 'none';
	} else {
		document.getElementById(divid).style.display = 'block';
	}
}

/* for filegals */
// Uniformize thumbnail size. Uses non-standard element.offsetHeight
function adjustThumbnails() {
	var i,j,h = 0;
	var t = document.getElementById("thumbnails").childNodes;

	// Find maximum height
	for ( i = 0; i < t.length; i++ ) {
		if ( t[i].className == "thumbnailcontener" ) {
			var t2 = t[i].childNodes;
			for ( j = 0; j < t2.length; j++ ) {
				if ( t2[j].className == "thumbnail" ) {
					t2[j].style.height = "100%";
					t2[j].style.overflow = "visible";
				}
			}
			if ( t[i].offsetHeight >= h ) {
				h = t[i].offsetHeight;
			}
			t[i].style.height = h+"px"; // Set height to maximum. Is that not redundant given the following loop? Chealer 20170911
		}
	}

	// Set height to maximum
	for ( i = 0; i < t.length; i++ ) {
		if ( t[i].className == "thumbnailcontener" ) {
			if ( t[i].offsetHeight <= h ) {
				t[i].style.height = h+"px";
			} else {
				break;
			}
		}
	}
}

function open_webdav(url) {
	// Works only in IE
	if (typeof ActiveXObject != 'undefined') {
		var EditDocumentButton = new ActiveXObject("SharePoint.OpenDocuments.1");
		EditDocumentButton.EditDocument(url);
	} else {
		prompt(tr('URL to open this file with WebDAV'), url);
	}
}

function ccsValueToInteger(str) {
	var v = str.replace(/[^\d]*$/, "");
	if (v) {
		v = parseInt(v, 10);
	}
	if (isNaN(v)) {
		return 0;
	} else {
		return v;
	}
}

// function to allow multiselection in checkboxes
// must be called like this :
//
// <input type="checkbox" class="form-check-input" onclick="checkbox_list_check_all(form_name,[checkbox_name_1,checkbox_name2 ...],true|false);">
function checkbox_list_check_all(form,list,checking) {
  for (var checkbox in list) {
    document.forms[form].elements[list[checkbox]].checked=checking;
  }
}

if (!window.syntaxHighlighter) {
	window.syntaxHighlighter = {
		get: function() {return null;}
	};
}

/**
* Wrapper for javascript encodeURI
*/
function tiki_encodeURI(rawstr)
{
	return encodeURI(rawstr);
}

/**
* Wrapper for javascript decodeURI
*/
function tiki_decodeURI(encstr)
{
	return decodeURI(encstr.replace(/\+/g, " "));
}

/**
* Wrapper for javascript encodeURIComponent
*/
function tiki_encodeURIComponent(rawstr)
{
	var str = encodeURIComponent(rawstr);
    return str;
}

/**
* Wrapper for javascript decodeURIComponent
*/
function tiki_decodeURIComponent(encstr)
{
    var str = decodeURIComponent(encstr.replace(/\+/g, " "));
    return str;
}

//Date helpers for to and from unix times
Date.prototype.toUnix = function() {
	return Math.round(this.getTime() / 1000.0);
};

var UnixDate = function(unixDate) {
	return new Date(unixDate * 1000);
};

Date.parseUnix = function(date) {
	date = new Date(Date.parse(date));
	return date.toUnix();
};

/**
 * Tracker rating field adjust after voing using ajax
 * (when rendered in search results)
 *
 * @param element
 * @param data    array containing result
 *            'my_rate',
 *            'numvotes',
 *            'voteavg',
 *            'request_rate',
 *            'value',
 *            'mode',
 *            'labels',
 *            'rating_options'
 * @param vote
 */

function adjustRating(element, data, vote) {

	var $sibs, $help, $unvote;

	if (vote === "NULL") {	// unvote
		$sibs = $("span > a", $(element).parent());
		$help = $(element).prev().prev();
		$unvote    = $(element);
	} else {
		$sibs = $(element).siblings().addBack();
		$help = $(element).parent().next();
		$unvote    = $help.nextAll("a");
	}

	for (var i = 0; i < $sibs.length; i++) {
		var v = $($sibs[i]).data("vote"), icon = "";

		if (v <= data[0].voteavg && data[0].numvotes > 0) {
			if (data[0].result && data[0].my_rate == v) {
				icon = 'star-selected';
			} else {
				icon = 'star';
			}
		} else if (v - data[0].voteavg <= 0.5 && data[0].numvotes > 0) {
			if (data[0].result && data[0].my_rate == v) {
				icon = 'star-half-selected';
			} else {
				icon = 'star-half-rating';
			}
		} else {
			if (data[0].result && data[0].my_rate == v) {
				icon = 'star-empty-selected';
			} else {
				icon = 'star-empty';
			}
		}
		$($sibs[i]).find('.icon-' + icon).css('display', 'inline');
		$($sibs[i]).find('.icon').not('.icon-' + icon).css('display', 'none');
	}

	var t = tr("Number of votes:") + " " + data[0].numvotes + ", " + tr("Average:") + " " + data[0].voteavg;
	if (data[0].result) {
		if (data[0].my_rate != "NULL") {
			t = t + ", " + tr("Your rating:") + " " + data[0].my_rate;
			$unvote.show();
		} else {
			$unvote.hide();
		}
	} else {
		t = t + ", " + tr("Vote not accepted");
	}
	$help.text("(" + data[0].numvotes + ")")
			.next().attr("title", t);
}

function sendVote(element, itemId, fieldId, vote) {
	$(element).parent().tikiModal(" ");
	$.getJSON(
		$.service(
			'tracker',
			'vote',
			{i:itemId,f:fieldId,v:vote}
		), function(data){
			$(element).parent().tikiModal();
			adjustRating(element, data, vote);
		}
	);
}

/**
 *
 * @param str string	Query or hash string to parse
 * @returns object
 */
function parseQuery(str) {
	var arr, pair, key, val, out = {}, b1, b2, key2;

	if (str.substr(0, 1) === "?" || str.substr(0, 1) === "#") {
		str = str.substr(1);
	}
	arr = str.split("&");
	for (var i = 0; i < arr.length; i++) {
		pair = arr[i].split("=");
		key = tiki_decodeURIComponent(pair[0]);
		val = pair.length > 1 ? tiki_decodeURIComponent(pair[1]) : "";

		if ((b1 = key.indexOf("[")) > -1 && (b2 = key.substr(b1+1).indexOf("]")) > -1) {
			key2 = key.substr(b1 + 1, b2);
			key = key.substr(0, b1);
			if (key2) {
				if (typeof out[key] != "object") {
					out[key] = {};
				}
				out[key][key2] = val;
			} else {
				if (typeof out[key] != "object") {
					out[key] = [];
				}
				out[key].push(val);
			}
		} else {
			out[key] = val;
		}
	}
	return out;
}

document.addEventListener('DOMContentLoaded', function(){
	setTimeout(function(){
		var progressBar = document.getElementById("progressBar");
		
		if(progressBar) {
			progressBar.remove();
		}
	}, 500);
});
