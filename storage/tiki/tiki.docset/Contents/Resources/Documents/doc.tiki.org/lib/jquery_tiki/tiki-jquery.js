/* global $ */

// $Id: tiki-jquery.js 76357 2020-05-18 00:08:29Z lindonb $
// JavaScript glue for jQuery in Tiki
//
// Tiki 6 - $ is now initialised in jquery.js
// but let's keep $jq available too for legacy custom code

var $jq = $,
	$window = $(window),
	$document = $(document);

// Check / Uncheck all Checkboxes
function switchCheckboxes (tform, elements_name, state, hiddenToo) {
	// checkboxes need to have the same name elements_name
	// e.g. <input type="checkbox" name="my_ename[]">, will arrive as Array in php.
	if (hiddenToo == undefined) {
		hiddenToo = false;
	}
	var closeTag;
	if (hiddenToo) {
		closeTag = '"]';
	} else {
		closeTag = '"]:visible';
	}
	$(tform).contents().find('input[name="' + jQuery.escapeSelector(elements_name) + closeTag).prop('checked', state).change();
}

// add id's of any elements that don't like being animated here
var jqNoAnimElements = ['help_sections', 'ajaxLoading'];

function show(foo, f, section) {
	if ($.inArray(foo, jqNoAnimElements) > -1 || typeof jqueryTiki === 'undefined') {		// exceptions that don't animate reliably
		$("#" + foo).show();
	} else if ($("#" + foo).hasClass("tabcontent")) {		// different anim prefs for tabs
		showJQ("#" + foo, jqueryTiki.effect_tabs, jqueryTiki.effect_tabs_speed, jqueryTiki.effect_tabs_direction);
	} else {
		showJQ("#" + foo, jqueryTiki.effect, jqueryTiki.effect_speed, jqueryTiki.effect_direction);
	}
	if (f) {setCookie(foo, "o", section);}
}

function hide(foo, f, section) {
	if ($.inArray(foo, jqNoAnimElements) > -1 || typeof jqueryTiki === 'undefined') {		// exceptions
		$("#" + foo).hide();
	} else if ($("#" + foo).hasClass("tabcontent")) {
		hideJQ("#" + foo, jqueryTiki.effect_tabs, jqueryTiki.effect_tabs_speed, jqueryTiki.effect_tabs_direction);
	} else {
		hideJQ("#" + foo, jqueryTiki.effect, jqueryTiki.effect_speed, jqueryTiki.effect_direction);
	}
	if (f) {
//		var wasnot = getCookie(foo, section, 'x') == 'x';
		setCookie(foo, "c", section);
//		if (wasnot) {
//			history.go(0);	// used to reload the page with all menu items closed - broken since 3.x
//		}
	}
}

// flip function... unfortunately didn't use show/hide (ay?)
function flip(foo, style) {
	var $foo = $("#" + foo);
	if (style && style !== 'block' || foo === 'help_sections' || foo === 'fgalexplorer' || typeof jqueryTiki === 'undefined') {	// TODO find a better way?
		$foo.toggle();	// inlines don't animate reliably (yet) (also help)
		if ($foo.css('display') === 'none') {
			setSessionVar('show_' + tiki_encodeURIComponent(foo), 'n');
		} else {
			setSessionVar('show_' + tiki_encodeURIComponent(foo), 'y');
		}
	} else {
		if ($foo.css("display") === "none") {
			setSessionVar('show_' + tiki_encodeURIComponent(foo), 'y');
			show(foo);
		}
		else {
			setSessionVar('show_' + tiki_encodeURIComponent(foo), 'n');
			hide(foo);
		}
	}
}

// handle JQ effects
function showJQ(selector, effect, speed, dir) {
	if (effect === 'none') {
		$(selector).show();
	} else if (effect === '' || effect === 'normal') {
		$(selector).show(400);	// jquery 1.4 no longer seems to understand 'nnormal' as a speed
	} else if (effect == 'slide') {
		$(selector).slideDown(speed);
	} else if (effect === 'fade') {
		$(selector).fadeIn(speed);
	} else if (effect.match(/(.*)_ui$/).length > 1) {
		$(selector).show(effect.match(/(.*)_ui$/)[1], {direction: dir}, speed);
	} else {
		$(selector).show();
	}
}

function hideJQ(selector, effect, speed, dir) {
	if (effect === 'none') {
		$(selector).hide();
	} else if (effect === '' || effect === 'normal') {
		$(selector).hide(400);	// jquery 1.4 no longer seems to understand 'nnormal' as a speed
	} else if (effect === 'slide') {
		$(selector).slideUp(speed);
	} else if (effect === 'fade') {
		$(selector).fadeOut(speed);
	} else if (effect.match(/(.*)_ui$/).length > 1) {
		$(selector).hide(effect.match(/(.*)_ui$/)[1], {direction: dir}, speed);
	} else {
		$(selector).hide();
	}
}

// ajax loading indicator

function ajaxLoadingShow(destName) {
	var $dest, $loading, pos, x, y, w, h;

	if (typeof destName === 'string') {
		$dest = $('#' + destName);
	} else {
		$dest = $(destName);
	}
	if ($dest.length === 0 || $dest.parents(":hidden").length > 0) {
		return;
	}
	$loading = $('#ajaxLoading');

	// find area of destination element
	pos = $dest.offset();
	// clip to page
	if (pos.left + $dest.width() > $window.width()) {
		w = $window.width() - pos.left;
	} else {
		w = $dest.width();
	}
	if (pos.top + $dest.height() > $window.height()) {
		h = $window.height() - pos.top;
	} else {
		h = $dest.height();
	}
	x = pos.left + (w / 2) - ($loading.width() / 2);
	y = pos.top + (h / 2) - ($loading.height() / 2);


	// position loading div
	$loading.css('left', x).css('top', y);
	// now BG
	x = pos.left + ccsValueToInteger($dest.css("margin-left"));
	y = pos.top + ccsValueToInteger($dest.css("margin-top"));
	w = ccsValueToInteger($dest.css("padding-left")) + $dest.width() + ccsValueToInteger($dest.css("padding-right"));
	h = ccsValueToInteger($dest.css("padding-top")) + $dest.height() + ccsValueToInteger($dest.css("padding-bottom"));
	$('#ajaxLoadingBG').css('left', pos.left).css('top', pos.top).width(w).height(h).fadeIn("fast");

	show('ajaxLoading');


}

function ajaxLoadingHide() {
	hide('ajaxLoading');
	$('#ajaxLoadingBG').fadeOut("fast");
}


function ajaxSubmitEventHandler(successCallback, dataType) {
	return function (e) {
		e.preventDefault();
		var form = this, act;
		act = $(form).attr('action');
		var modal = $(form).closest('.modal-dialog');

		if (! act) {
			act = url;
		}

		dataType = dataType || 'json';

		if (typeof $(form).valid === "function") {
			if (!$(form).valid()) {
				return false;
			} else if ($(form).validate().pendingRequest > 0) {
				$(form).validate();
				setTimeout(function() {$(form).submit();}, 500);
				return false;
			}
		}

		modal.tikiModal(tr('Loading...'));

		// if there is a file is included in form, use FormData, otherwise, serialize the form input values.
		// FormData still has issues in IE, though they've been fixed in Edge.
		if ($(form).find("input[type=file]").length){
			var formData = new FormData(form);
		} else {
			var formData= $(form).serialize();
		}

		var formSubmission = {
			type: 'POST',
			data: formData,
			dataType: dataType,
			success: function (data) {
				successCallback.apply(form, [data]);
			},
			error: function (jqxhr) {
				// 	Headers sent from Feedback class already handled through an ajaxComplete
				if (! jqxhr.getResponseHeader('X-Tiki-Feedback')) {
					modal.tikiModal();
					$(form).showError(jqxhr);
				}
			},
			complete: function () {
				modal.tikiModal();
			}
		};

		// if the encryption type on the form is set to 'multipart/form-data' or formData is a FormData object
		// we must set contentType and processData to false on the ajax submission
		if (form.enctype === "multipart/form-data" || formData.constructor === FormData) {
			formSubmission.contentType = false;
			formSubmission.processData = false;
		}

		$.ajax(act, formSubmission);
		return false;
	};
}

function checkDuplicateRows( button, columnSelector, rowSelector, parentSelector ) {
	if (typeof columnSelector === 'undefined') {
		columnSelector = "td";
	}
	if (typeof rowSelector === 'undefined') {
		rowSelector = "tr:not(:first)";
	}
	if (typeof parentSelector === 'undefined') {
		parentSelector = "table:first";
	}
	var $rows = $(button).parents(parentSelector).find(rowSelector);
	$rows.each(function( ix, el ){
		if ($("input:checked", el).length === 0) {
			var $el = $(el);
			var line = $el.find(columnSelector).text();
			$rows.each(function( ix, el ){
				if ($el[0] !== el && $("input:checked", el).length === 0) {
					if (line === $(el).find(columnSelector).text()) {
						$(":checkbox:first", el).prop("checked", true);
					}
				}
			});
		}
	});
}

$.fn.tiki_popover = function () {
	var list, $container = this;

	// To allow table elements etc in tips and popovers
	if (typeof $.fn.tooltip.Constructor.Default.whiteList === "object") {
		var myDefaultWhiteList = $.fn.tooltip.Constructor.Default.whiteList;

		myDefaultWhiteList.table = [];
		myDefaultWhiteList.thead = [];
		myDefaultWhiteList.tbody = [];
		myDefaultWhiteList.tr = [];
		myDefaultWhiteList.th = [];
		myDefaultWhiteList.td = [];
		myDefaultWhiteList.form = ["action", "method"];
		myDefaultWhiteList.input = ["name", "value", "type"];
		myDefaultWhiteList.button = ["type", "disabled", "name", "value", "onclick"];
		myDefaultWhiteList.time = ["datetime"];	// for timeago
		myDefaultWhiteList.a = ["target", "href", "title", "rel", "data-toggle", "data-backdrop",
								"data-target", "onclick"];	// data items for smarty_function_bootstrap_modal
	}

	/*
	 * Prepare the data so all elements so the data is all in the right format for bootstrap popovers
	 */
	list = $container.find('.tips[title!=""], .tikihelp[title!=""]')
		.each(function () {
			var $element = $(this);

			if ($element.attr('title')) {
				$.each(['|', ':', '<br/>', '<br>'], function (key, sep) {
					var parts = $element.attr('title').split(sep);
					if (parts.length > 1) {
						$element.attr('title', parts.shift());
						$element.data('content', parts.join(sep));
					}
				});
			} else {
				$element.attr('title', '');
			}

			if (! $element.data('trigger')) {
				$element.data('trigger', 'hover');
			}
			// default Tiki delay
			$element.data('delay', { "show": 0, "hide": 10 });
		});

	$.merge(list, $container.find("a[data-toggle=popover]:not(.tips[title!='']):not(.tikihelp[title!=''])"));

	list.filter('.bottom').data('placement', 'bottom');
	list.filter('.left').data('placement', 'left');
	list.filter('.slow').data('delay', { "show": 500, "hide": 0 });

	list.find('img').attr('title', ''); // Remove the img title to avoid browser tooltip
	list.filter('[data-trigger="click"]')
		.click(function (e) {
			e.preventDefault();
		});

	// Handle common cases
	list
		.popover({
			container: 'body',
			html: true,
			boundary: "window",
			placement: $.tikiPopoverWhereToPlace
		});

	$container.find('.ajaxtips').each(function() {
		var me = $(this),
			trigger = me.data('trigger') || 'hover';

		$(this).popover({
			trigger: trigger,
			html: true,
			delay: { "show": 0, "hide": 10 },
			placement: $.tikiPopoverWhereToPlace,
			boundary: "window",
			content: function () {
				var link = this, content = $(this).data('content');

				if (!content) {
					$.get($(this).data('ajaxtips'), function (data) {
						content = data;

						$(link).data('content', content);
						$(link).popover('show');
					});

					// display a spinner while waiting for the ajax call to return the content
					content = "<div class='text-center p-3'><img src='img/spinner.gif' alt='Loading...'></div>";
				}

				return content;
			}
		});
	});

	// only have one popover showing at a time
	$document.on("show.bs.popover", function ( e ) {
		var event = e;
		$('.popover:visible:not(.tour-tour)').each(function () {
			if (this.previousElementSibling !== event.target) {
				$(this).popover('hide');
			}
		});
	});

	$document.on("hide.bs.popover", function ( e ) {
		var $popover = $('.popover:visible:not(.tour-tour)');

		// if mouse is over the popover
		if ($popover.find(":hover").length) {
			// change the leave event to be when leaving the popover
			$popover.mouseleave(function () {
				$(this).popover("hide");
			});
			// and cancel the hide event
			e.preventDefault();
			return false;
		}
	});

	return $container;
};

$.tikiPopoverWhereToPlace = function (pop, el) {
	var pxNum = function(str) {
			return (str || '').replace('px', '') * 1;
		},
		$win = $(window),
		$el = $(el),
		width = $el.offsetParent().width(),
		height = $el.offsetParent().height(),
		$pop = $(pop),
		allowedImgWidth = width * 0.60,
		allowedImgHeight = height * 0.60,
		manualImageWidth = $el.data('width'),
		leftPos = $el.offset().left,
		rightPos = leftPos + $el.outerWidth(),
		bottomPos = $el.offset().top + $el.outerHeight() - $win.scrollTop(),
		$img = $pop.find('div[style*="background-image"],img').first(),
		$imgContainer = $img.parent(),
		$imgPopover = $imgContainer.parent(),
		imgWidth = pxNum($img.css('width')),
		imgHeight = pxNum($img.css('height')),
		newImgWidth,
		newImgHeight,
		widthBuffer,
		heightBuffer;

	if ($el.data("placement")) {
		return $el.data("placement");	// element already has popover placement set
	}

	if (manualImageWidth) {
		$img.css({
			width: manualImageWidth + 'px'
		});

		$pop.css({
			"max-width" : '100%'
		});

		imgWidth = manualImageWidth;
	}

	//lets check the size of the popover img
	if (imgWidth > allowedImgWidth || imgHeight > allowedImgHeight) {
		widthBuffer = (pxNum($imgContainer.css('padding-left')) + pxNum($imgContainer.css('margin-left')) + pxNum($imgContainer.css('border-left-width'))) * 2;
		heightBuffer = (pxNum($imgContainer.css('padding-top')) + pxNum($imgContainer.css('margin-top')) + pxNum($imgContainer.css('border-top-width'))) * 2;

		// proportionate the image relative to what is allowed
		if(allowedImgWidth/imgWidth > allowedImgHeight/imgHeight){
			newImgWidth = allowedImgWidth;
			newImgHeight = imgHeight*(allowedImgWidth/imgWidth);
		} else {
			newImgWidth = imgWidth*(allowedImgHeight/imgHeight);
			newImgHeight = allowedImgHeight;
		}

		$img.css({
			backgroundSize: newImgWidth + 'px ' + newImgHeight + 'px',
			width: newImgWidth + 'px',
			height: newImgHeight + 'px'
		});

		$imgPopover.css({
			maxWidth: (newImgWidth + widthBuffer) + 'px',
			maxHeight: (newImgHeight + heightBuffer) +'px'
		});
	}


	var $popTemp = $("<div class='popover temp'><div class='popover-body'>" + $el.data("content") + "</div></div>");
	$("body").append($popTemp);
	var popWidth = $popTemp.outerWidth(),
		popHeight = $popTemp.outerHeight();

	$popTemp.remove();

	if (width - leftPos < popWidth && width - rightPos < popWidth) {
		if (bottomPos > popHeight ||
			bottomPos + popHeight > $win.height()) {
			return 'top';
		} else {
			return 'bottom';
		}
	} else if (width - leftPos > popWidth) {
		return 'left';
	} else if (width - rightPos > popWidth) {
		return 'right';
	}
	if (imgWidth && width - leftPos + imgWidth > width) return 'bottom';

	return 'auto';
};

/*
	keep the popover open while the user is hovering over it
	based on http://jsfiddle.net/raving/2thfaxeu thanks
*/
if ($.fn.popover) {
	var originalLeave = $.fn.popover.Constructor.prototype.leave;
	$.fn.popover.Constructor.prototype.leave = function(obj){
		var self = obj instanceof this.constructor ?
			obj : $(obj.currentTarget)[this.type](this.getDelegateOptions()).data('bs.' + this.type);
		var container, timeout;

		originalLeave.call(this, obj);

		if(self.$tip) {
			container = self.$tip;
			timeout = self.timeout;
			container.one('mouseenter', function(){
				//We entered the actual popover – call off the dogs
				clearTimeout(timeout);
				//Let's monitor popover content instead
				container.one('mouseleave', function(){
					$.fn.popover.Constructor.prototype.leave.call(self, self);
				});
			})
		}
	};
}



$(function() { // JQuery's DOM is ready event - before onload
	if (!window.jqueryTiki) window.jqueryTiki = {};

	// Reflections
	if (jqueryTiki.reflection) {
		$("img.reflect").reflect({});
	}

	if (jqueryTiki.tooltips) {
		$(document).tiki_popover();
	}

	// superfish setup (CSS menu effects)
	if (jqueryTiki.superfish) {
		$('ul.cssmenu_horiz').supersubs({
						minWidth:    11,   // minimum width of sub-menus in em units
						maxWidth:    20,   // maximum width of sub-menus in em units
						extraWidth:  1     // extra width can ensure lines don't sometimes turn over
															 // due to slight rounding differences and font-family
		});
		$('ul.cssmenu_vert').supersubs({
						minWidth:    11,   // minimum width of sub-menus in em units
						maxWidth:    20,   // maximum width of sub-menus in em units
						extraWidth:  1     // extra width can ensure lines don't sometimes turn over
															 // due to slight rounding differences and font-family
		});
		$('ul.cssmenu_horiz').superfish({
			animation: {opacity:'show', height:'show'},	// fade-in and slide-down animation
			speed: 'fast',								// faster animation speed
			onShow: function(){
				if ($(this).data('active')) return;

				$(this)
					.data('active', true)
					.moveToWithinWindow();
			},
			onHide: function(){
				$(this).removeData('active');
			}
		});
		$('ul.cssmenu_vert').superfish({
			animation: {opacity:'show', height:'show'},	// fade-in and slide-down animation
			speed: 'fast',								// faster animation speed
			onShow: function(){
				if ($(this).data('active')) return;

				$(this)
					.data('active', true)
					.moveToWithinWindow();
			},
			onHide: function(){
				$(this).removeData('active');
			}
		});
	}

	$.fn.applyColorbox = function() {
		$(this).find("a[data-box*='box']").colorbox({
			rel: function(){
				return $(this).attr('data-box');
			},
			transition: "elastic",
			maxHeight:"95%",
			maxWidth:"95%",
			overlayClose: true,
			current: jqueryTiki.cboxCurrent
		});

		// now, first let suppose that we want to display images in ColorBox by default:

		// this matches data-box attributes containing type=img or no type= specified
		$(this).find("a[data-box*='box'][data-box*='type=img'], a[data-box*='box'][data-box!='type=']").colorbox({
			photo: true
		});
		// data-box attributes containing slideshow (this one must be without #col1)
		$(this).find("a[data-box*='box'][data-box*='slideshow']").colorbox({
			photo: true,
			slideshow: true,
			slideshowSpeed: 3500,
			preloading: false,
			width: "100%",
			height: "100%"
		});
		// this are the defaults matching all *box links which are not obviously links to images...
		// (if we need to support more, add here... otherwise it is possible to override with type=iframe in data-box attribute of a link)
		//  (from here one to speed it up, matches any link in #col1 only - the main content column)
		$(this).find("#col1 a[data-box*='box']:not([data-box*='type=img']):not([href*='display']):not([href*='preview']):not([href*='thumb']):not([data-box*='slideshow']):not([href*='image']):not([href$='\.jpg']):not([href$='\.jpeg']):not([href$='\.png']):not([href$='\.gif'])").colorbox({
			iframe: true,
			width: "95%",
			height: "95%"
		});
		// hrefs starting with ftp(s)
		$(this).find("#col1 a[data-box*='box'][href^='ftp://'], #col1 a[data-box*='box'][href^='ftps://']").colorbox({
			iframe: true,
			width: "95%",
			height: "95%"
		});
		// data-box attributes containing type=flash
		$(this).find("#col1 a[data-box*='box'][data-box*='type=flash']").colorbox({
			inline: true,
			width: "60%",
			height: "60%",
			href: function () {
				var $el = $("#cb_swf_player");
				if ($el.length === 0) {
					$el = $("<div id='cb_swf_player' />");
					$(document.body).append($("<div />").hide().append($el));
				}
				//$(this).media.swf(el, { width: 400, height: 300, autoplay: true, src: $(this).attr("href") });
				swfobject.embedSWF($(this).attr("href"), "cb_swf_player", "100%", "90%", "9.0.0", "vendor_bundled/vendor/bower-asset/swfobject/swfobject/expressInstall.swf");
				return $("#cb_swf_player");
			}
		});
		// data-box attributes with type=iframe (if someone needs to override anything above)
		$(this).find("#col1 a[data-box*='box'][data-box*='type=iframe']").colorbox({
			iframe: true
		});
		// inline content: hrefs starting with #
		$(this).find("#col1 a[data-box*='box'][href^='#']").colorbox({
			inline: true,
			width: "50%",
			height: "50%",
			href: function(){
				return $(this).attr('href');
			}
		});

		// titles (for captions):

		// by default get title from the title attribute of the link (in all columns)
		$(this).find("a[data-box*='box'][title]").colorbox({
			title: function(){
				return $(this).attr('title');
			}
		});
		// but prefer the title from title attribute of a wrapped image if any (in all columns)
		$(this).find("a[data-box*='box'] img[title]").colorbox({
			title: function(){
				return $(this).attr('title');
			},
			photo: true,				// and if you take title from the image you need photo
			href: function(){			// and href as well (for colobox 1.3.6 tiki 5.0)
				return $(this).parent().attr("href");
			}
		});

		/* Shadowbox params compatibility extracted using regexp functions */
		var re, ret;
		// data-box attributes containing title param overrides title attribute of the link (shadowbox compatible)
		$(this).find("#col1 a[data-box*='box'][data-box*='title=']").colorbox({
			title: function () {
				re = /(title=([^;\"]+))/i;
				ret = $(this).attr("data-box").match(re);
				return ret[2];
			}
		});
		// data-box attributes containing height param (shadowbox compatible)
		$(this).find("#col1 a[data-box*='box'][data-box*='height=']").colorbox({
			height: function () {
				re = /(height=([^;\"]+))/i;
				ret = $(this).attr("data-box").match(re);
				return ret[2];
			}
		});
		// data-box attributes containing width param (shadowbox compatible)
		$(this).find("#col1 a[data-box*='box'][data-box*='width=']").colorbox({
			width: function () {
				re = /(width=([^;\"]+))/i;
				ret = $(this).attr("data-box").match(re);
				return ret[2];
			}
		});

		// links generated by the {COLORBOX} plugin
		if (jqueryTiki.colorbox) {
			$(this).find("a[data-box^='shadowbox[colorbox']").each(function () {$(this).attr('savedTitle', $(this).attr('title'));});
			$(this).find("a[data-box^='shadowbox[colorbox']").colorbox({
				title: function() {
					return $(this).attr('savedTitle');	// this fix not required is colorbox was disabled
				}
			});
		}
	};

	$.applyColorbox = function() {
		if (jqueryTiki.colorbox) {
			$('body').applyColorbox();
		}
	};

	// ColorBox setup (Shadowbox, actually "<any>box" replacement)
	if (jqueryTiki.colorbox && !jqueryTiki.mobile) {
		$().on('cbox_complete', function(){
			$("#cboxTitle").wrapInner("<div></div>");
		});

		$.applyColorbox();
	}	// end if (jqueryTiki.colorbox)

	if (jqueryTiki.zoom) {
		$("a[data-box*=zoom]").each(function () {
			$(this)
				.wrap('<span class="img_zoom"></span>')
				.parent()
				.zoom({
					url: $(this).attr("href")
				});
		});
	}

	$.fn.applyChosen = function () {
		if (jqueryTiki.chosen) {
			$("select:not(.allow_single_deselect):not(.nochosen)").tiki("chosen");
		}
	};

	$.applyChosen = function() {
		return $('body').applyChosen();
	};

	if (jqueryTiki.chosen) {
		$.applyChosen();
	}

	$( function() {
		$("#keepOpenCbx").click(function() {
			if (this.checked) {
				setCookie("fgalKeepOpen", "1");
			} else {
				setCookie("fgalKeepOpen", "");
			}
		});
		var keepopen = getCookie("fgalKeepOpen");
		$("#keepOpenCbx").prop("checked", !! keepopen);
	});
	// end fgal fns


	$.paginationHelper();

	// bind clickModal to links with or in click-modal class
	$(document).on('click', 'a.click-modal, .click-modal a', $.clickModal({
		size: 'modal-lg',
		backdrop: 'static',
		success: function (data) {
			let redirect = $(this).data('modal-submit-redirect-url') || $(this).parent().data('modal-submit-redirect-url');
			window.location.href = redirect || window.location.href.replace(/#.*$/, '');
		}
	}));

	if (jqueryTiki.numericFieldScroll === "none" || jqueryTiki.numericFieldScroll === null){
		// disable mousewheel on a input number field when in focus
		// (to prevent  browsers change the value when scrolling)
		$('form').on('focus', 'input[type=number]', function (e) {
			$(this).on('wheel.disableScroll', function (e) {
				e.preventDefault()
			})
		});
		$('form').on('blur', 'input[type=number]', function (e) {
			$(this).off('wheel.disableScroll')
		});
	}
});		// end $document.ready

//For ajax/custom search
$document.on('pageSearchReady', function() {
	$.paginationHelper();
});

// moved from tiki-list_file_gallery.tpl in tiki 6
function checkClose() {
	if (!$("#keepOpenCbx").prop("checked")) {
		window.close();
	} else {
		window.blur();
		if (window.opener) {
			window.opener.focus();
		}
	}
}


/*
 * JS only textarea fullscreen function (for Tiki 5+)
 */

$(function() {	// if in translation-diff-mode go fullscreen automatically
	if ($("#diff_outer").length && !$.trim($(".wikipreview .wikitext").html()).length) {	// but not if previewing (TODO better)
		toggleFullScreen("editwiki");
	}
});

function sideBySideDiff() {
	if ($('.side-by-side-fullscreen').size()) {
		$('.side-by-side-fullscreen').remove();
		return;
	}

	var $diff = $('#diff_outer').remove(), $zone = $('.edit-zone');
	$zone.after($diff.addClass('side-by-side-fullscreen'));
	$diff.find('#diff_history').height('');
}

function toggleFullScreen(area_id) {

	if ($("input[name=wysiwyg]").val() === "y") {		// quick fix to disable side-by-side translation for wysiwyg
		$("#diff_outer").css({
			position: "inherit",
			height: "400px",
			overflowX: "auto"
		});
		return;
	}

	var textarea = $("#" + area_id);

	//codemirror interation and preservation
	var textareaEditor = syntaxHighlighter.get(textarea);
	if (textareaEditor) {
		syntaxHighlighter.fullscreen(textarea);
		sideBySideDiff();
		return;
	}

	var toolbar = $('#editwiki_toolbar'),
		preview = $("#autosave_preview"),
		comment = $("#comment").parents("fieldset:first"),
		screen = $('.TextArea-fullscreen'),
		zone = $('.edit-zone', screen);

	screen.add(textarea).css('height', '');

	//removes wiki command buttons (save, cancel, preview) from fullscreen view
	$('.TextArea-fullscreen .actions').remove();
	if (textarea.parent().hasClass("ui-wrapper")) {
		textarea.resizable("destroy");	// if codemirror is off, jquery-ui resizable messes this up
	}

	var textareaParent = textarea.parents(".tab-content:first").toggleClass('TextArea-fullscreen');

	if (textareaParent.hasClass('TextArea-fullscreen')) {
		$('body').css('overflow', 'hidden');
		$('.tabs,.rbox-title').toggle();
		$('#fullscreenbutton').hide();

		var win = $window
			.data('cm-resize', true),
			diff = $("#diff_outer"),
			msg = $(".translation_message"),
			actions = $('.actions', textarea.parents("form"));

		//adds wiki command buttons (save, cancel, preview) to fullscreen view
		actions.clone().appendTo('.TextArea-fullscreen');
		actions = $('.actions', $('.TextArea-fullscreen'));

		comment.css({   // fix comments fieldset to bottom and hide others (like contributions)
			position: "absolute",
			bottom: actions.outerHeight() + "px",
			width: "100%"
		}).nextAll("fieldset").hide();

		preview.css({
			position: "absolute",
			top: 0,
			left: 0
		});

		win.resize(function() {
			screen = $('.TextArea-fullscreen');
			actions = $('.actions', screen);
			comment = $("#comment").parents("fieldset:first");
			if (win.data('cm-resize') && screen) {
				screen.css('height', win.height() + 'px');
				var swidth = win.width() + "px";
				var commentMargin = parseInt(comment.css("paddingTop").replace("px", "")) * 4;
				commentMargin += parseInt(comment.css("borderBottomWidth").replace("px", "")) * 2;
				var innerHeight = win.height() - comment.outerHeight() - commentMargin - actions.outerHeight();
						 // reducing innerHeight by 85px in prev line makes the "Describe the change you made:" and
						 // "Monitor this page:" edit fields visible and usable. Tested in all 22 themes in Tiki-12 r.48429

				if (diff.length) {
					swidth = (screen.width() / 2) + "px";
					innerHeight -= msg.outerHeight();
					msg.css("width", (screen.width() / 2 - msg.css("paddingLeft").replace("px", "") - msg.css("paddingRight").replace("px", "")) + "px");
					diff.css({
						width: swidth,
						height: innerHeight + 'px'
					});
					$('#diff_history').height(innerHeight + "px");
				}
				textarea.css("width", swidth);
				toolbar.css('width', swidth);
				zone.css("width", swidth);
				preview.css("width", swidth);
				textarea.css('height', (innerHeight - toolbar.outerHeight()) + "px");
			}
		});
		setTimeout(function () {$window.resize();}, 500);	// some themes (coelesce) don't show scrollbars unless this is delayed a bit
	} else {
		textarea.css("width", "");
		toolbar.css('width', "");
		zone.css({ width: "", height: ""});
		screen.css("width", "");
		comment.css({ position: "", bottom: "", width: "" }).nextAll("fieldset").show();
		preview.css({ position: "", top: "", left: "" });
		$('body').css('overflow', '');
		$('.tabs,.rbox-title').toggle();
		$('#fullscreenbutton').show();
		$window.removeData('cm-resize');
	}

	sideBySideDiff();
}

/* Simple tiki plugin for jQuery
 * Helpers for autocomplete and sheet
 */
var xhrCache = {}, lastXhr;	// for jq-ui autocomplete

$.fn.tiki = function(func, type, options, excludepage) {
	var opts = {}, opt;
	switch (func) {
		case "autocomplete":
			if (jqueryTiki.autocomplete && jqueryTiki.ui) {
				if (typeof type === 'undefined') { // func and type given
					// setup error - alert here?
					return null;
				}
				options = options || {};
				var requestData = {}, _renderItem = null;

				var url = "";
				switch (type) {
					case "pagename":
						url = "tiki-listpages.php?listonly&initial=" + (options.initial ? options.initial + "&nonamespace" : "")+"&exclude_page="+excludepage;
						break;
					case "groupname":
						url = "tiki-ajax_services.php?listonly=groups";
						break;
					case "username":
						url = "tiki-ajax_services.php?listonly=users";
						break;
					case "usersandcontacts":
						url = "tiki-ajax_services.php?listonly=usersandcontacts";
						break;
					case "userrealname":
						url = "tiki-ajax_services.php?listonly=userrealnames";
						break;
					case "tag":
						url = "tiki-ajax_services.php?listonly=tags&separator=+";
						break;
					case "icon":
						url = null;
						opts.source = Object.keys(jqueryTiki.iconset.icons);

						_renderItem = function(ul, item) {
							return $("<li>")
									.attr("data-value", item.value )
									.append($().getIcon(item.value))
									.append(" ")
									.append(item.label)
									.appendTo(ul);
						};
						break;
					case 'trackername':
						url = "tiki-ajax_services.php?listonly=trackername";
						break;
					case 'trackervalue':
						if (typeof options.fieldId === "undefined") {
							// error
							return null;
						}
						$.extend( requestData, options );
						options = {};
						url = "list-tracker_field_values_ajax.php";
						break;
					case "reference":
						url = "tiki-ajax_services.php?listonly=references";
						break;
				}
				var multiple = options.multiple && (type == 'usersandcontacts' || type == 'userrealname' || type == 'username' || type == 'reference');
				opts = $.extend({		//  default options for autocompletes in tiki
					minLength: 2,
					source: function( request, response ) {
						if( multiple ) {
							request.term = (''+request.term).split( /,\s*/ ).pop();
						}
						if (options.tiki_replace_term) {
							request.term = options.tiki_replace_term.apply(null, [request.term]);
						}
						var cacheKey = "ac." + type + "." + request.term;
						if ( cacheKey in xhrCache ) {
							response( xhrCache[ cacheKey ] );
							return;
						}
						request.q = request.term;
						$.extend( request, requestData );
						lastXhr = $.getJSON( url, request, function( data, status, xhr ) {
							xhrCache[ cacheKey ] = data;
							if ( xhr === lastXhr ) {
								response( data, function (item) {
									return item
								})
							}});
					},
					focus: function(ev) {
						// Important for usability handling below to prevent non-valid selections
						ev.preventDefault();
					},
					search: function() {
						if( multiple ) {
							// custom minLength
							var term = (''+this.value).split( /,\s*/ ).pop();
							if ( term.length < 2 ) {
								return false;
							}
						}
					},
					select: function(e, ui) {
						if( multiple ) {
							var terms = ''+this.value;
							terms = terms.replace(';', ',');
							terms = terms.split( /,\s*/ );
							// remove the current input
							terms.pop();
							// add the selected item
							terms.push( ui.item.value );
							// add placeholder to get the comma-and-space at the end
							terms.push( "" );
							this.value = terms.join( ", " );
							return false;
						} else {
							$(this).data('selected', true);
						}
					}
				}, opts);
				$.extend(opts, options);

				if(options.mustMatch && multiple) {
					// Control editing of autocomplete to avoid messing with selection
					this.on("keydown", function (e) {
						if (e.which === 8 || e.which === 46) {
							e.preventDefault();
							var terms = ''+this.value;
							terms = terms.replace(';', ',');
							terms = terms.split( /,\s*/ );
							// remove the current input and the last previous item
							var lastterm = terms.pop();
							if (lastterm === '') {
								terms.pop();
							}
							// add placeholder to get the comma-and-space at the end
							terms.push( "" );
							this.value = terms.join( ", " );
						} else if (e.which === 37 || e.which === 39) {
							e.preventDefault();
						}
					});
					this.on("focus click", function() {
						var currentVal = $(this).val();
						$(this).val('').val(currentVal);
					});
				} else if (options.mustMatch) {
					if ($(this).val()) {
						// if there is value to begin then consider as selected
						$(this).data('selected', true);
					}
					$(this).on("blur", function() {
						if (! $(this).data('selected')) {
							$(this).val('');
						}
					});
					$(this).on("keydown", function(e) {
						if ($(this).data('selected') && (e.which === 8 || e.which === 46)) {
							e.preventDefault();
							$(this).val('');
							$(this).data('selected', false);
						} else if ($(this).data('selected') && (e.which > 47 || e.which === 32)) {
							e.preventDefault();
						} else if (e.which === 13 && !$(this).data('selected')) {
							e.preventDefault();
						}
					});
				}

		 		return this.each(function() {
					var $element = $(this).autocomplete(opts).blur( function() {
						$(this).removeClass( "ui-autocomplete-loading").change();
					});
					if (_renderItem && $element.length) {
						$element.autocomplete("instance")._renderItem = _renderItem;
					}
				});
			}
			break;
		case "carousel":
			if (jqueryTiki.carousel) {
				opts = {
						imagePath: "vendor_bundled/vendor/jquery-plugins/infinitecarousel/images/",
						autoPilot: true
					};
				$.extend(opts, options);
				return this.each(function() {
					$(this).infiniteCarousel(opts);
				});
			}
			break;
		case "datepicker":
		case "datetimepicker":
			if (jqueryTiki.ui) {
				switch (type) {
					case "jscalendar":	// replacements for jscalendar
										// timestamp result goes in the options.altField
						if (typeof options.altField === "undefined") {
							alert("jQuery.ui datepicker jscalendar replacement setup error: options.altField not set for " + $(this).attr("id"));
							debugger;
						}
						opts = {
							showOn: "both",
							buttonText: '',
							dateFormat: jqueryTiki.shortDateFormat,
							timeFormat: jqueryTiki.shortTimeFormat,
							showButtonPanel: true,
							altFormat: "@",
							altFieldTimeOnly: false,
							onClose: function(dateText, inst) {
								$.datepickerAdjustAltField(func, inst);
							}
						};
						break;
					default:
						opts = {
							showOn: "both",
							buttonText: '',
							dateFormat: jqueryTiki.shortDateFormat,
							showButtonPanel: true,
							firstDay: jqueryTiki.firstDayofWeek
						};
						break;
				}
				$.extend(opts, options);
				if (func === "datetimepicker") {
					return this.each(function() {
							$(this).datetimepicker(opts);
						});
				} else {
					return this.each(function() {
						$(this).datepicker(opts);
					});
				}
			}
			break;
		case "accordion":
			if (jqueryTiki.ui) {
				opts = {
						autoHeight: false,
						collapsible: true,
						navigation: true
//						change: function(event, ui) {
//							// sadly accordion active property is broken in 1.7, but fix is coming in 1.8 so TODO
//							setCookie(ui, ui.options.active, "accordion");
//						}
					};
				$.extend(opts, options);
				return this.each(function() {
					$(this).accordion(opts);
				});
			}
			break;
		case "chosen":
			if (jqueryTiki.chosen) {
				opts = { allow_single_deselect: true, search_contains: true };		// allow_single_deselect happens if first item is empty
				if ($("html").attr("dir") === "rtl") {
					$(this).addClass("chosen-rtl");
				}
				$.map({		// translate the strings
					placeholder_text_multiple: "Select Some Options",
					placeholder_text_single: "Select an Option",
					no_results_text: "No results match"
				}, function (v, k) {
					opts[k] = tr(v);
				});
				$.extend(opts, options);
				return this.each(function() {
					var opts2 = $.extend({}, opts),
						$select = $(this);

					if ($select.is(":hidden") && !opts.width) {
						// from https://github.com/harvesthq/chosen/pull/1580
						var $hiddenElement = $select.clone().appendTo("body");
						if ($select.is('.form-control')) {
							opts2.width = '100%';
						} else {
							opts2.width = $hiddenElement.outerWidth();
						}
						$hiddenElement.remove();
					}
					var hidden = $();
					$select.chosen(opts2)
						.on('chosen:showing_dropdown', function(){
							hidden = $(this).parents(":not(body,.modal)").filter(function(){
								return $(this).css('overflow') === 'hidden';
							}).css('overflow', 'visible');
						})
						.on('chosen:hiding_dropdown', function(){
							hidden.css('overflow', 'hidden');
						});

					if (jqueryTiki.chosen_sortable && $select.prop("multiple")) {
						var $choices = $select.next(".chosen-container-multi").find("> .chosen-choices");
						$choices
							.mousedown(function (event) {
								if ($(event.target).is('span')) {
									event.stopPropagation();
								}
							})
							.sortable({
								items: "li:not(.search-field)"
							})
							.parents("form:first").submit(function () {
								if (! $(this).data("chosen-multi-submitted") && ! $select.hasClass("nochosen")) {
									var $options = $choices.find("li:not(.search-field) a").map(function () {
										return $select.find("option")[$(this).data("option-array-index")];
									});
									if ($options.length) {
										$select.children().remove();
										$select.append($options).change();
									}
									$(this).data("chosen-multi-submitted", true);
								}
							});
					}
				});
			}
			break;
	}	// end switch(func)
};

(function($) {
	$.datepickerAdjustAltField = function(func, inst) {
		$.datepicker._updateAlternate(inst);	// make sure the hidden field is up to date
		var val = $(inst.settings.altField).val(), timestamp;
		if (func === "datetimepicker") {
			val = val.substring(0, val.indexOf(" "));
			timestamp = parseInt(val / 1000, 10);
			if (!timestamp || isNaN(timestamp)) {
				$.datepicker._setDateFromField(inst);	// seems to need reminding when starting empty
				$.datepicker._updateAlternate(inst);
				val = $(inst.settings.altField).val();
				val = val.substring(0, val.indexOf(" "));
				timestamp = parseInt(val / 1000, 10);
			}
			if (timestamp && inst.settings && inst.settings.timepicker) {	// if it's a datetimepicker add on the time
				var time = inst.settings.timepicker.hour * 3600 +
					inst.settings.timepicker.minute * 60 +
					inst.settings.timepicker.second;
				timestamp += time;
			}
		} else {
			timestamp = parseInt(val / 1000, 10);
		}
		$(inst.settings.altField).val(timestamp ? timestamp : "").change();
	};

	// the jquery.ui _gotoToday function doesn't seem to work any more, so override that and add a call to _setDate
	$.datepicker._jquibase_gotoToday = $.datepicker._gotoToday;
	$.datepicker._gotoToday = function (id) {
		var inst = this._getInst($(id)[0]);
		this._jquibase_gotoToday(id);
		this._setDate(inst, new Date());
		// the alternate field gets updated when the dialog closes
	};


	/**
	 * Adds annotations to the content of text in ''container'' based on the
	 * content found in selected dts.
	 *
	 * Used in comments.tpl
	 */
	$.fn.addnotes = function( container ) {
		return this.each(function(){
			var comment = this;
			var text = $('dt:contains("note")', comment).next('dd').text();
			var title = $('h4:first', comment).clone();
			var body = $('.comment-body:first', comment).clone();
			body.find('dt:contains("note")').closest('dl').remove().addClass('card');

			if( text.length > 0 ) {
				var parents = container.find(':contains("' + text + '")').parent();
				var node = container.find(':contains("' + text + '")').not(parents)
					.addClass('note-editor-text alert-info')
					.each( function() {
						var child = $('dl.note-list',this);
						if( ! child.length ) {
							child = $('<dl class="note-list list-group-item-info"/>')
								.appendTo(this)
								.hide();

							$(this).click( function() {
								child.toggle();
							} );
						}

						child.append( title )
							.append( $('<dd/>').append(body) );
					} );
			}
		});
	};

	/**
	 * Convert a zone to a note editor by attaching handlers on mouse events.
	 */
	$.fn.noteeditor = function (editlink, link) {
		var hiddenParents = null;
		var annote = $(link)
			.click( function( e ) {
				e.preventDefault();

				var $block = $('<div/>');
				var annotation = $(this).attr('annotation');
				$(this).fadeOut(100);

				$block.load(editlink.attr('href'), function () {
					var msg = "";
					if (annotation.length < 20) {
						msg = tr("The text you have selected is quite short. Select a longer piece to ensure the note is associated with the correct text.") + "<br />";
					}

					msg = "<p class='description comment-info'>" + msg + tr("Tip: Leave the first line as it is, starting with \";note:\". This is required") + "</p>";
					$block.prepend($(msg));
					$('textarea', this)
						.val(';note:' + annotation + "\n\n").focus();

					$('form', this).submit(function () {
						$.post($(this).attr('action'), $(this).serialize(), function () {
							$block.dialog('destroy');
							// update the comments list
							editlink.closest('.comment-container').reload();
						});
						return false;
					});

					$block.dialog({
						modal: true,
						width: 500,
						height: 400
					});
				});
			} )
			.appendTo(document.body);

			$(this).mouseup(function( e ) {
				var range;
				if( window.getSelection && window.getSelection().rangeCount ) {
					range = window.getSelection().getRangeAt(0);
				} else if( window.selection ) {
					range = window.selection.getRangeAt(0);
				}

				if( range ) {
					var str = $.trim( range.toString() );

					if( str.length && -1 === str.indexOf( "\n" ) ) {
						annote.attr('annotation', str);
						annote.fadeIn(100).position( {
							of: e,
							at: 'bottom left',
							my: 'top left',
							offset: '20 20'
						} );
					} else {
						if (annote.css("display") != "none") {
							annote.fadeOut(100);
						}
						if ($("form.comments").css("display") == "none") {
							$("form.comments").show();
						}
						if (hiddenParents) {
							hiddenParents.hide();
							hiddenParents = null;
						}
					}
				}
			});
	};

	$.fn.browse_tree = function () {
		this.each(function () {
			$('.treenode:not(.done)', this)
				.addClass('done')
				.each(function () {
					if (getCookie($('ul:first', this).attr('data-id'), $('ul:first', this).attr('data-prefix')) !== 'o') {
						$('ul:first', this).css('display', 'none');
					}
					var $placeholder = $('span.ui-icon:first:not(.control)', this);
					if ($('ul:first', this).length) {
						var dir = $('ul:first', this).css('display') === 'block' ? 's' : 'e';
						if ($placeholder.length) {
							$placeholder.replaceWith('<span class="flipper ui-icon ui-icon-triangle-1-' + dir + '" style="float: left;margin-top:.2em;"/>');
						} else {
							$(this).prepend('<span class="flipper ui-icon ui-icon-triangle-1-' + dir + '" style="float: left;margin-top:.2em;"/>');
						}
					} else {
						if ($placeholder.length) {
							$placeholder.replaceWith('<span style="float:left;width:16px;height:16px;margin-top:.2em;"/>');
						} else {
							$(this).prepend('<span style="float:left;width:16px;height:16px;margin-top:.2em;"/>');
						}
					}
					if ($('div.checkbox', this).length) {
						$('div.checkbox', this).css("margin-left", "16px");
					}
				});

			$('.flipper:not(.done)')
				.addClass('done')
				.css('cursor', 'pointer')
				.click(function () {
					var body = $(this).parent().find('ul:first');
					if ('block' === body.css('display')) {
						$(this).removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');
						body.hide('fast');
						setCookie(body.data("id"), "", body.data("prefix"));
					} else {
						$(this).removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
						body.show('fast');
						setCookie(body.data("id"), "o", body.data("prefix"));
					}
				});
		});

		return this;
	};

	var fancy_filter_create_token = function(value, label) {
		var close, token;
		console.log();

		close = $('<span class="ui-icon ui-icon-close"/>')
			.click(function () {
				var ed = $(this).parent().parent();
				$(this).parent().remove();
				ed.change();
				return false;
			});

		token = $('<span class="token"/>')
			.attr('data-value', value)
			.text(label)
			.attr('contenteditable', false)
			.disableSelection()
			.append(close);

		return token[0];
	};

	var fancy_filter_build_init = function(editable, str, options) {
		if (str === '') {
			str = '&nbsp;';
		}

		editable.html(str.replace(/(\d+)/g, '<span>$1</span>'));

		if (options && options.map) {
			editable.find('span').each(function () {
				var val = $(this).text();
				$(this).replaceWith(fancy_filter_create_token(val, JSON.parse(options.map)[val] ? JSON.parse(options.map)[val] : val));
			});
		}
	};

	$.fn.fancy_filter = function (operation, options) {
		this.each(function () {
			switch (operation) {
			case 'init':
				var editable = $('<div class="fancyfilter form-control"/>'), input = this;

				if (editable[0].contentEditable !== null) {
					fancy_filter_build_init(editable, $(this).val(), options);
					editable.attr('contenteditable', true);
					$(this).after(editable).hide();
				}

				editable
					.keyup(function() {
						$(this).change();
						$(this).mouseup();
					})
					.change(function () {
						$(input).val($('<span/>')
							.html(editable.html())
							.find('span').each(function() {
								$(this).replaceWith(' ' + $(this).attr('data-value') + ' ');
							})
							.end().text().replace(/\s+/g, ' '));
					})
					.mouseup(function () {
						input.lastRange = window.getSelection().getRangeAt(0);
					});

				break;
			case 'add':
				var editable = $(this).next();
				editable.find("span[data-value='"+ options.token +"']").remove();
				var node = fancy_filter_create_token(options.token, options.label);
				editable.append(node);
				editable.change();
				break;
			}
		});

		return this;
	};

	$.fn.drawGraph = function () {
		this.each(function () {
			var $this = $(this);
			var width = $this.width();
			var height = $this.height() ? $this.height() : Math.ceil( width * 9 / 16 );
			var nodes = $this.data('graph-nodes');
			var edges = $this.data('graph-edges');

			var g = new Graph;
			$.each(nodes, function (k, i) {
				g.addNode(i);
			});
			$.each(edges, function (k, i) {
				var style = { directed: true };
				if( i.preserve ) {
					style.color = 'red';
				}
				g.addEdge( i.from, i.to, style );
			});

			var layouter = new Graph.Layout.Spring(g);
			layouter.layout();

			var renderer = new Graph.Renderer.Raphael($this.attr('id'), g, width, height );
			renderer.draw();
		});

		return this;
	};

	/**
	 * Handle textarea and input text selections
	 * Code from:
	 *
	 * jQuery Autocomplete plugin 1.1
	 * Copyright (c) 2009 Jörn Zaefferer
	 *
	 * Dual licensed under the MIT and GPL licenses:
	 *   http://www.opensource.org/licenses/mit-license.php
	 *   http://www.gnu.org/licenses/gpl.html
	 *
	 * Now deprecated and replaced in Tiki 7 by jquery-ui autocomplete
	 */
	$.fn.selection = function(start, end) {
		if (start !== undefined) {
			if (end === undefined) {
				end = start;
			}
			return this.each(function() {
				if( this.selectionStart) {
					this.selectionStart = start;
					this.selectionEnd = end;
				} else if( this.setSelectionRange ){
					this.setSelectionRange(start, end);
				} else if( this.createTextRange ){
					var selRange = this.createTextRange();
					if (start == end) {
						selRange.move("character", start);
						selRange.select();
					} else {
						selRange.collapse(true);
						selRange.moveStart("character", start);
						selRange.moveEnd("character", end - start);	// moveEnd is relative
						selRange.select();
					}
				}
			});
		}
		var field = this[0];
		if( field.selectionStart !== undefined) {
			return {
				start: field.selectionStart,
				end: field.selectionEnd
			}
		} else if ( field.createTextRange ) {
			// from http://the-stickman.com/web-development/javascript/finding-selection-cursor-position-in-a-textarea-in-internet-explorer/
			// The current selection
			var range = document.selection.createRange();
			// We'll use this as a 'dummy'
			var stored_range = range.duplicate();
			// Select all text
			stored_range.moveToElementText( field );
			// Now move 'dummy' end point to end point of original range
			stored_range.setEndPoint( 'EndToEnd', range );
			// Now we can calculate start and end points
			var textProperty = range.htmlText ? "htmlText" : "text";	// behaviour changed in IE10 (approx) so htmlText has unix line-ends which works (not 100% sure why)
			var selectionStart = stored_range[textProperty].length - range[textProperty].length;
			var selectionEnd = selectionStart + range[textProperty].length;
			return {
				start: selectionStart,
				end: selectionEnd
			}

		}	};

	$.fn.comment_toggle = function () {
		this.each(function () {
			var $target = $(this.hash);
			$target.hide();

			$(this).click(function () {
				if ($target.is(':visible')) {
					$target.hide(function () {
						$(this).empty();
					});
				} else {
					$target.comment_load($(this).attr('href'));
				}

				return false;
			});
			if (location.search.indexOf("comzone=show") > -1 || location.hash.match(/threadId=?(\d+)/)) {
				var comButton = this;
				setTimeout(function() {
					$(comButton).click();
				}, 500);
			}
		});

		return this;
	};

	$.fn.comment_load = function (url) {
		var $top = $('#top');
		$('.note-list', $top).remove();

		this.each(function () {
			var comment_container = this;
			if (! comment_container.reload) {
				comment_container.reload = function () {
					$(comment_container).empty().comment_load(url);
				};
			}
			$(this).addClass('comment-container');
			$(this).load(url, function (response, status) {
				$(this).show();

				if (jqueryTiki.useInlineComment && ! jqueryTiki.useInlineAnnotations) {
					$('.comment.inline dt:contains("note")', this)
						.closest('.comment')
						.addnotes($top);

					$top.noteeditor($('.comment-form:last a', comment_container), '#note-editor-comment');
				}

				$('.button.comment-form.autoshow a').addClass('autoshown').click().removeClass('autoshown'); // allow autoshowing of comment forms through autoshow css class

				var match = location.hash.match(/threadId=?(\d+)/);
				if (match) {
					var $tab = $(this).parents(".tab-pane"),
						$tabContent = $(this).parents(".tab-content");

					// if we're in an inactive tab then show the right one for this comment threadId
					if ($tab.length && ! $tab.is(".active")) {
						$tabContent.find(".tab-pane").each(function (index) {
							if (this === $tab[0]) {
								$(".nav-tabs li:nth(" + index + ") a", $tabContent.parent()).tab("show");
							}
						})
					}
					var $comment = $(".comment[data-comment-thread-id=" + match[1] + "]");
					var top = $comment.offset().top;
					$('html, body').animate({
						scrollTop: top
					}, 2000, function () {
						$comment.animate({
							backgroundColor: "#ff8"
						}, 250, function () {
							$comment.animate({
								backgroundColor: ""
							}, 1000);
						});
					});

				}
			});
		});

		return this;
	};

	$(document).on('click', '.comment-form.buttons > a.btn', function () {
		var comment_container = $(this).closest('.comment-container, .ui-dialog-content')[0];

		$('.comment-form form:not(.commentRatingForm)', comment_container).each(function() {		// remove other forms apart from the ratings vote form
			var $p = $(this).parent();
			$p.empty().addClass('button').addClass('buttons').append($p.data('previous'));
		});
		if (!$(this).hasClass('autoshown')) {
			$(".comment").each(function () {
				$("article > *:not(ol)", this).each(function () {
					$(this).css("opacity", 0.6);
				});
			});
		}
		$(this).parents('.comment:first').find("*").css("opacity", 1);

		var $formContainer = null;
		if ($(this).data('target')) {
			$formContainer = $($(this).data('target'));
		} else {
			$formContainer = $(this).parents('.buttons');
		}
		$(this).parents('.buttons').data('previous', $(this).siblings().addBack()).empty().removeClass('buttons').removeClass('button');

		// Update buttons if loaded as a modal
		$('.modal.fade.show').trigger('tiki.modal.redraw');

		$formContainer.load($(this).attr('href'), function () {
			var form = $('form', this).submit(function () {
				var errors, current = this;
				$(current).tikiModal(tr("Saving..."));
				//Synchronize textarea and codemirror before comment is posted
				if (typeof syntaxHighlighter.sync === 'function') {
					syntaxHighlighter.sync($(current).find("textarea.wikiedit"));
				}
				$.post($(current).attr('action'), $(current).serialize(), function (data, st) {
					$(current).tikiModal();
					if (data.threadId) {
						$(current).closest('.comment-container').reload();
						$('span.count_comments').each(function () {

							var action = $(current).attr('action').match(/tiki-comment-(\w*)/),
								count = parseInt($(this).text());

							if (action) {
								switch (action[1]) {
									case "post":
										count++;
										break;
									case "remove":
										count--;
										break;
									case "edit":
									case "moderate":
										break;
								}
								$(this).text(count);
							}
						});
						if (data.feedback && data.feedback[0]) {
							alert(data.feedback.join("\n"));
						}
					} else {
						errors = $('ol.errors', form).empty();
						if (!errors.length) {
							$(':submit', current).after(errors = $('<ul class="alert-warning"/>'));
						}

						$.each(data.errors, function (k, v) {
							errors.append($('<li/>').text(v));
						});
					}
				}, 'json');
				return false;
			});

			//allow syntax highlighting
			if ($.fn.flexibleSyntaxHighlighter) {
				window.codeMirrorEditor = [];
				form.find('textarea.wikiedit').flexibleSyntaxHighlighter();
			}
		});
		return false;
	});

	// scroll to post if #threadId on url in forums
	if ($("body.tiki_forums").length) {
		let match = location.hash.match(/threadId=?(\d+)/);
		if (match) {
			let $comment = $("#" + match[0] + ".post");
			let top = $comment.offset().top;
			$('html, body').animate({
				scrollTop: top
			}, 2000, function () {
				$comment.animate({
					backgroundColor: "#ff8"
				}, 250, function () {
					$comment.animate({
						backgroundColor: ""
					}, 1000);
				});
			});
		}
	}

	$.fn.input_csv = function (operation, separator, value) {
		this.each(function () {
			var values = $(this).val().split(separator);
			if (values[0] === '') {
				values.shift();
			}

			if (operation === 'add' && -1 === values.indexOf("" + value)) {
				values.push(value);
			} else if (operation === 'delete') {
				value = String(value);
				while (-1 !== $.inArray(value, values)) {
					values.splice($.inArray(value, values), 1);
				}
			}

			$(this).val(values.join(separator));
		});

		return this;
	};

	$.service = function (controller, action, query) {
		var append = '';

		if (query) {
			append = '?' + $.buildParams(query);
		}

		if (action) {
			return 'tiki-' + controller + '-' + action + append;
		} else {
			return 'tiki-' + controller + '-x' + append;
		}
	};

	$.serviceUrl = function (options) {
		var o = $.extend({}, options), controller = options.controller, action = options.action;
		delete(o.controller);
		delete(o.action);
		return $.service(controller, action, o);
	};

	$.buildParams = function (query, prefix, suffix) {
		prefix = prefix || '';
		suffix = suffix || '';

		return $.map(query, function (v, k) {
			if ($.isPlainObject(v)) {
				return $.buildParams(v, k + '[', ']');
			} else {
				return prefix + k + suffix + '=' + tiki_encodeURIComponent(v);
			}
		}).join('&');
	};

	$.fn.serviceDialog = function (options) {
		this.each(function () {
			var $dialog = $('<div/>'), origin = this, buttons = {};
			$(this).append($dialog).data('serviceDialog', $dialog);

			if (! options.hideButtons) {
				buttons[tr('OK')] = function () {
					$dialog.find('form:visible').submit();
				};
				buttons[tr('Cancel')] = function () {
					$dialog.dialog('close');
					if ($dialog.data('ui-dialog')) {
						$dialog.dialog('destroy');
					}
				};
			}

			$dialog.dialog({
				title: options.title,
				minWidth: options.width ? options.width : 500,
				height: (options.fullscreen ? $window.height() - 20 : (options.height ? options.height : 600)),
				width: (options.fullscreen ? $window.width() - 20 : null),
				close: function () {
					if (options.close) {
						options.close.apply([], this);
					}
					if ($(this).data('ui-dialog')) {
						$(this).dialog('destroy').remove();
					}
				},
				buttons: buttons,
				modal: options.modal,
				zIndex: options.zIndex
			});

			$dialog.loadService(options.data, $.extend(options, {origin: origin}));
		});

		return this;
	};
	$.fn.loadService =  function (data, options) {
		var $dialog = this, controller = options.controller, action = options.action, url;

		this.each(function () {
			if (! this.reload) {
				this.reload = function () {
					$(this).loadService(data, options);
				};
			}
		});

		if (typeof data === "string") {
			data = parseQuery(data);
		}
		if (data && data.controller) {
			controller = data.controller;
		}

		if (data && data.action) {
			action = data.action;
		}

		if (options.origin && $(options.origin).is('a')) {
			url = $(options.origin).attr('href');
		} else if (options.url) {
			url = options.url;
		} else {
			url = $.service(controller, action);
		}

		$dialog.tikiModal(tr("Loading..."));

		$.ajax(url, {
			data: data,
			error: function (jqxhr) {
				$dialog.html(jqxhr.responseText);
			},
			success: function (data) {
				$dialog.html(data);
				$dialog.find('.ajax').click(function (e) {
					$dialog.loadService(null, {origin: this});
					return false;
				});
				$dialog.find('.service-dialog').click(function (e) {
					if ($dialog.data('ui-dialog')) {
						$dialog.dialog('close');
					}
					return true;
				});

				$dialog.find('form .submit').hide();

				$dialog.find('form:not(.no-ajax)').off("submit").submit(ajaxSubmitEventHandler(function (data) {
					data = (data ? data : {});

					if (data.FORWARD) {
						$dialog.loadService(data.FORWARD, options);
					} else if ($dialog.data('ui-dialog')) {
						$dialog.dialog('destroy').remove();
					}

					if (options.success) {
						options.success.apply(options.origin, [data]);
					}
				}));

				if (options.load) {
					options.load.apply($dialog[0], [data]);
				}

				$('.confirm-prompt', this).requireConfirm({
					success: function (data) {
						if (data.FORWARD) {
							$dialog.loadService(data.FORWARD, options);
						} else {
							$dialog.loadService(options.data, options);
						}
					}
				});
			},
			complete: function () {
				$dialog.tikiModal();
				if ($dialog.find('form').size() == 0 && $dialog.data('ui-dialog')) {
					// If the result contains no form, skip OK/Cancel, and just allow to close
					var buttons = $dialog.dialog('option', 'buttons'), n = {};
					if (buttons[tr('Cancel')]) {
						n[tr('OK')] = buttons[tr('Cancel')];
						$dialog.dialog('option', 'buttons', n);
					}
				}
			}
		});
	};

	$.fn.confirmationDialog = function (options) {
		var modal = $('#bootstrap-modal'),
			modalHeader = modal.find('.modal-header'),
			modalBody = $('<div class="modal-body"><p></p></div>'),
			modalFooter = $('<div class="modal-footer"></div>'),
			modalFooterConfirm = $('<button type="button" class="btn btn-success">' + tr('Confirm') + '</button>'),
			modalFooterClose = $('<button type="button" class="btn btn-secondary" data-dismiss="modal">' + tr('Close') + '</button>');

		//needed because modal-content is globally being cleared after appearing for the first time
		if (!modalHeader || modalHeader.length === 0) {
			modal.find('.modal-content').append('<div class="modal-header"><h4></h4></div>');
			modalHeader = modal.find('.modal-header');
		}

		if (options.title) {
			modalHeader.find('h4').text(options.title);
		} else {
			modalHeader.find('h4').text(tr('Confirmation Modal'));
		}

		if (options.message) {
			modalBody.find('p').text(options.message);
		} else {
			modalBody.find('p').text(tr('Please confirm you want to perform this action.'));
		}

		modalFooter.append(modalFooterClose, modalFooterConfirm);
		modalHeader.after(modalBody);
		modalBody.after(modalFooter);

		modal.on('hidden.bs.modal', function (e) {
			if (options.close) {
				options.close();
			}
		});

		modalFooterConfirm.on('click', function (e) {
			modal.modal('hide');
			if (options.success) {
				options.success();
			}
		});

		modal.modal('show');

		return this;
	};

	$.fn.requireConfirm = function (options) {
		this.click(function (e) {
			e.preventDefault();
			$(this).doConfirm(options);
			return false;
		});

		return this;
	};

	$.fn.doConfirm = function (options) {
		var message = options.message, link = this;

		if (! message) {
			message = $(this).data('confirm');
		}

		if (confirm (message)) {
			var $this = $(this);
			$this.tikiModal(" ");

			$.ajax($(this).attr('href'), {
				type: 'POST',
				dataType: 'json',
				data: {
					'confirm': 1
				},
				success: function (data) {
					$this.tikiModal();
					options.success.apply(link, [data]);
				},
				error: function (jqxhr) {
					$this.tikiModal();
					$(link).closest('form').showError(jqxhr);
				}
			});
		}
	};

	$.fn.showError = function (message) {
		if (message.responseText) {
			if (message.getResponseHeader("Content-Type").indexOf("text/html") === -1) {
				var data = JSON.parse(message.responseText);
				message = data.message;
			} else {
				message = $(message.responseText).text();	// can be html
			}
		} else if (typeof message !== 'string') {
			message = "";
		}
		this.each(function () {
			var parts, that = this;
			if (parts = message.match(/^<!--field\[([^\]]+)\]-->(.*)$/)) {
				field = parts[1];
				message = parts[2];

				if (that[field]) {
					that = that[field];
				}
			}

			var validate = false, errors = {}, field, $additional = $('<ul>');

			if (jqueryTiki.validate) {
				validate = $(that).closest('form').validate()
			}

			if (validate) {
				if (! $(that).attr('name')) {
					$(that).attr('name', $(that).attr('id'));
				}

				if (that !== validate.currentForm) {
					field = $(that).attr('name');
				}

				if (field) {
					errors[field] = message;
					validate.showErrors(errors);
				} else {
					// No specific field, assign as form error
					$additional.append($('<li>').text(message));
				}

				setTimeout(function () {
					$('#tikifeedback li').filter(function () {
						return $(this).text() === message;
					}).remove();

					if ($('#tikifeedback ul').is(':empty')) {
						$('#tikifeedback').empty();
					}
				}, 100);
			} else {
				$additional.append($('<li>').text(message));
			}

			if (! $additional.is(':empty')) {
				// Write form errors at the top, please stop removing them
				$('.ajax-errors', this).remove();
				$('<div class="ajax-errors alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>')
					.prependTo(this)
					.append($additional);
			}

			// Style the bootstrap form-group as an error
			$('.form-group').removeClass('has-error')
				.find('label.error:visible')
				.addClass('form-text')
				.prepend('<span class="fas fa-flag"/> ')
				.closest('.form-group').addClass('has-error')
		});

		return this;
	};

	$.fn.clearError = function () {
		this.each(function () {
			$(this).closest('form').find('label.error[for="' + $(this).attr('name') + '"]').remove();
			$(this).closest('form').find('.form-group.has-error').removeClass('has-error');
		});

		return this;
	};

	// sort result containing all galleries
	function sortResult(result) {
		result.sort(function(a, b) {
			var titleA = a.parent_title.toUpperCase(); // ignore upper and lowercase
			var titleB = b.parent_title.toUpperCase(); // ignore upper and lowercase
			if (titleA < titleB) {
				return -1;
			}
			if (titleA > titleB) {
				return 1;
			}

			// names must be equal
			return 0;
		});

	}

	// search the title of each parent gallery
	function parentTitle(result, parent) {
		var title='';
		$.each(result, function(key, value) {
			if(value.object_id == parent){
				title= value.title + ' > ';
			}
		});
		return title;
	}

	function loadSelectorData(filter, args, success) {
		if (! $.object_selector_cache) {
			$.object_selector_cache = {};
		}

		if ($.isFunction(args)) {
			success = args;
			args = {};
		}

		var item, url;

		url = $.service('search', 'lookup', $.extend(args, {
			filter: filter
		}));

		if (item = $.object_selector_cache[url]) {
			if (item.data) {
				success(item.data);
			} else {
				item.queue.push(success);
			}
		} else {
			item = $.object_selector_cache[url] = {
				data: null,
				queue: [success]
			};
			$.getJSON(url, function (data) {
				item.data = data;
				$.each(item.queue, function (k, f) {
					f(data);
				});
				item.queue = [];
			});
		}
	}
	$._object_selector_add_item = function (type, $select, $results, parent_title, item, title, status_icon, selected) {
		var checkname = $select.closest('.object-selector, .object-selector-multi')
			.find('.primary').attr('id') + '_sel';
		var suffix = $results.find('.form-check').lenght || 0;

		$('<option>')
			.val(item)
			.data('label', title)
			.text(parent_title + '' + title.replace(/\n/g, " / "))  //replace newline with a slash since it's in a select
			.prop('selected', selected)
			.appendTo($select);

		$('<div class="form-check"><input type="' + type + '" class="form-check-input" ><label class="form-check-label"></label></div>')
			.find('label').append(status_icon ? status_icon + ' ' + title : title).end()
			.find(':radio, :checkbox')
				.attr('name', checkname)
				.prop('checked', selected)
				.val(item)
			.end()
			.appendTo($results);
	};

	$.fn._object_selector_update_results = function (type, result, initial) {
		var $container = this,
			$results = $container.find('.results'),
			$select = $container.find('select'),
			$noresults = $('.no-result', this),
			selection = [];

		this.find(':radio:checked, :checkbox:checked')
			.not('.protected')
			.each(function () {
				selection.push($(this).val());
			});

		this.find(':radio:not(:checked), :checkbox:not(:checked)')
			.not('.protected')
			.closest('.form-check')
			.remove();

		$select
			.find('option:not(:checked)')
			.not('.protected')
			.remove();

		$noresults.toggleClass('d-none', selection.length !== 0);

		// add all galleries parent titles
		$.each(result, function (key, value) {
			value.parent_title = parentTitle(result, value.parent_id);
			result[key] = value;
		});

		// sort result by galleries parent titles
		sortResult(result);

		$.each(result, function (key, value) {
			var current = value.object_type + ':' + value.object_id;
			var selected = false;

			if (value.object_id == '') {
				current = value.object_type;
			}

			var currentValue = $select.data('current-value');
			if (currentValue == current) {
				selected = true;
			}

			if (-1 === selection.indexOf(current)) {
				if (initial) {
					$._object_selector_add_item(type, $select, $([]), value.parent_title, current, value.title, value.status_icon, selected);
				} else {
					$._object_selector_add_item(type, $select, $results, value.parent_title, current, value.title, value.status_icon, selected);
				}
			} else {
				$("option[value='" + current + "']", $select).text(value.title);
			}
		});

		$select.trigger('chosen:updated');
	};

	$.fn.object_selector = function (action, value, title) {
		var args = arguments;

		this.each(function () {
			var input = this
				, $simple = $(this).prev()
				, filter = $(input).data('filters')
				, threshold = $(input).data('threshold')
				, format = $(input).data('format') || ''
				, sort = $(input).data('sort') || 'score_desc'
				, parentobject = $(input).data('parent')
				, parentkey = $(input).data('parentkey')
				, searchField = $(input).data('searchfield') || 'title'
			;

			$(input).addClass('primary').hide();
			$simple.hide();

			var $spinner = $(this).parent(),
				$container = $(input).closest('.object-selector'),
				$select = $container.find('select').first(),
				$filter = $container.find(':text.filter').first(),
				$search = $container.find('input.search').first(),
				$panel = $container.find('.card').first();

			if (action === 'set') {
				$select.val(value);
				if ($select.val() !== value && title) {
					// for multilingual, object returned is JSON. try to parse and split
					// with ' / ', otherwise catch and use title as is.
					try
					{
						var titleObj = JSON.parse(title);
						var titleArr = $.map(titleObj, function(el) { return el });
						title = titleArr.join(" / ");
					}
					catch(e)
					{
						// do nothing
					}
					$._object_selector_add_item('radio', $select, $container.find('.results'), null, value, title, null, true);

					$select.trigger('chosen:updated');
				}

				$(input)
					.val(value)
					.data('label', title)
					.change();

				return;
			}

			if (action === 'setfilter') {
				filter[args[1]] = args[2];
				$(input).data('filters', filter);
				$container.find('.too-many').hide();
				$search.click();
				return;
			}

			if (parentobject && parentkey) {
				filter[parentkey] = $(parentobject).val();
				$(parentobject).on('change', function () {
					$(input)
						.data('use-threshold', 1)
						.object_selector('setfilter', parentkey, $(this).val());
				});
			}

			if (threshold !== -1) {
				$spinner.tikiModal(" ");
				loadSelectorData(filter, {maxRecords: threshold, format: format, sort_order: sort}, function (data) {
					$container._object_selector_update_results('radio', data.resultset.result, true);

					$spinner.tikiModal();

					if (data.resultset.count <= threshold) {
						$select.parent().removeClass('d-none');
					} else {
						$panel.removeClass('d-none');
					}
				});
			} else {
				$panel.removeClass('d-none');
			}
			$panel.on('click', ':radio', function () {
				if ($(this).is(':checked')) {
					$(input).object_selector('set', $(this).val(), $(this).parent().text());
				}
			});

			$(input).change(function () {
				var val = $(this).val(), id = null;
				if (val) {
					var splitarray = val.split(':');
					id = splitarray[1];
					if(splitarray.length > 2){
						for(var i = 2; i < splitarray.length; i++)
						{
							id = id + ':' + splitarray[i];
						}
					}
				}

				if ($simple.val() != id) {
					$simple.val(id).change();
				}
			});
			$simple.change(function () {
				var target = filter.type + ':' + $(this).val();

				if (filter.type && $(input).val() != target) {
					$(input).val(target).change();
				}
			});
			$select.change(function () {
				if ($(input).val() != $select.val()) {
					$(input).data('label', $select.find('option:selected').text());
					$(input).val($select.val()).change();
				}
			});

			$search.click(function () {
				$spinner = $filter.parent().tikiModal(" ");
				var selectorArgs = {format: format, sort_order: sort};
				if ($(input).data('use-threshold') && threshold !== -1) {
					selectorArgs.maxRecords = threshold;
					$(input).data('use-threshold', 0);
				}
				filter[searchField] = $filter.val();
				loadSelectorData(filter, selectorArgs, function (data) {
					$container._object_selector_update_results('radio', data.resultset.result, false);

					$spinner.tikiModal();
				});
			});

			$filter.keypress(function (e) {
				if (e.which === 13) {
					e.preventDefault();
					$search.click();
				}
			});
		});

		return this;
	};

	$.fn.object_selector_multi = function (action) {
		var args = arguments;
		this.each(function () {
			var $textarea = $(this).hide().addClass('primary')
				, $container = $(this).closest('.object-selector-multi')
				, $select = $container.find('select')
				, $simpleinput = $textarea.prev(':text').hide()
				, $basic = $container.find('.basic-selector')
				, $panel = $container.find('.card')
				, $search = $container.find('input.search').first()
				, $filter = $container.find(':text.filter').first()
				, filter = $textarea.data('filters')
				, wildcard = $textarea.data('wildcard')
				, threshold = $textarea.data('threshold')
				, format = $textarea.data('format') || ''
				, parentobject = $textarea.data('parent')
				, parentkey = $textarea.data('parentkey')
				, sort = $textarea.data('sort') || 'score_desc'
				, initialValues = $select.val()
				, separator = $simpleinput.data('separator')
				, searchField = $textarea.data('searchfield') || 'title'
				, extratype = $textarea.data('extratype')
				;

			if (action === 'setfilter') {
				filter[args[1]] = args[2];
				$textarea.data('filters', filter);
				$container.find('.too-many').hide();
				$search.click();
				return;
			}

			if (parentobject && parentkey) {
				filter[parentkey] = $(parentobject).val();
				$(parentobject).on('change', function () {
					$textarea
						.data('use-threshold', 1)
						.object_selector_multi('setfilter', parentkey, $(this).val());
				});
			}

			if (threshold !== -1) {
				$container.tikiModal(' ');
				loadSelectorData(filter, {maxRecords: threshold, format: format, sort_order: sort}, function (data) {
					$container.tikiModal('');
					var results = data.resultset.result;
					if (extratype) {
						var objectIndex = data.resultset.count;
						$.each(extratype, function(key, value) {
							results[objectIndex] = {"object_type": key, "object_id": "", "title": value};
							objectIndex++;
						});
					}
					$container._object_selector_update_results('checkbox', results, true);

					if (data.resultset.count <= threshold) {
						$basic.removeClass('d-none');
					} else {
						$panel.removeClass('d-none');
						// add .nochosen here even though Chosen has been applied previously so chosen_sortable doesn't update the value
						$select.addClass("nochosen");
					}
				});
			} else {
				$panel.removeClass('d-none');
			}

			$filter.keypress(function (e) {
				if (e.which === 13) {
					e.preventDefault();
					$search.click();
				}
			});

			$search.click(function () {
				var $spinner = $filter.parent().tikiModal(" ");
				var selectorArgs = {format: format, sort_order: sort};
				if ($textarea.data('use-threshold') && threshold !== -1) {
					selectorArgs.maxRecords = threshold;
					$textarea.data('use-threshold', 0);
				}
				if (wildcard == 'y') {
					filter[searchField] = '*' + $filter.val() + '*';
				} else {
					filter[searchField] = $filter.val();
				}
				loadSelectorData(filter, selectorArgs, function (data) {
					$container._object_selector_update_results('checkbox', data.resultset.result, false);
					$spinner.tikiModal();
				});
			});

			$panel.on('click', ':checkbox', function () {
				var list = $.makeArray($container.find(':checkbox:checked').map(function () {
					return $(this).val();
				}));
				$textarea.val(list.join("\n")).change();
			});
			$select.on('change', function () {
				var list = $(this).val() || [];
				$textarea.val(list.join("\n")).change();
			});

			if (separator) {
				$textarea.on('change', function () {
					var lines = $(this).val().split("\n"), ids = [];
					$.each(lines, function (k, line) {
						var parts = line.split(':');
						if (parts.length === 2) {
							ids.push(parts[1]);
						}
					});
					$simpleinput.val(ids.join(separator)).change();
				});
			}
		});
	};

	$.fn.sortList = function () {
		var list = $(this), items = list.children('li').get();

		items.sort(function(a, b) {
			var compA = $(a).text().toUpperCase();
			var compB = $(b).text().toUpperCase();
			return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
		});

		$.each(items, function(idx, itm) {
			list.append(itm);
		});
	};
	$.localStorage = {
		store: function (key, value) {
			var fullKey = this._build(key);
			if (window.localStorage) {
				if (value) {
					window.localStorage[fullKey] = $.toJSON({
						date: Date.now(),
						data: value
					});
				} else {
					delete window.localStorage[fullKey];
				}
			}
		},
		load: function (key, callback, fetch, duration) {
			var payload, fullKey = this._build(key);

			if (window.localStorage && window.localStorage[fullKey]) {
				payload = JSON.parse(window.localStorage[fullKey]);

				if (duration) {
					// Expired, refetch
					if (payload.date + duration*1000 < Date.now()) {
						fetch(function (data) {
							$.localStorage.store(key, data);
							callback(data);
						});
						return;
					}
				}

				callback(payload.data);
			} else {
				fetch(function (data) {
					$.localStorage.store(key, data);
					callback(data);
				});
			}
		},
		_build: function (key) {
			// Use an alternate key to ensure old data structure
			// does not collide
			return key + "_2";
		}
	};

	var favoriteList = [];
	$.fn.favoriteToggle = function () {
		this
			.each(function () {
				var type, obj, isFavorite, link = this;
				type = $(this).queryParam('type');
				obj = $(this).queryParam('object');


				isFavorite = function () {
					var ret = false;
					$.each(favoriteList, function (k, v) {
						if (v === type + ':' + obj) {
							ret = true;
							return false;
						}
					});

					return ret;
				};

				$(this).find('span').remove(); //removes the previous star icon
				$(this).prepend($('<span />').attr({
					'class' : isFavorite() ? 'fas fa-star fa-fw' : 'far fa-star fa-fw',
					'title' : isFavorite() ? tr('Remove from favorites') : tr('Add to favorites')
				}));

				if (isFavorite()) {
					$(this).addClass( 'favorite_selected' );
					$(this).removeClass( 'favorite_unselected' );
				} else {
					$(this).addClass( 'favorite_unselected' );
					$(this).removeClass( 'favorite_selected' );
				}
				$(this)
					.filter(':not(".register")')
					.addClass('register')
					.click(function () {
						$.post($(this).attr('href'), {
							target: isFavorite() ? 0 : 1
						}, function (data) {
							favoriteList = data.list;
							$.localStorage.store($(link).data('key'), favoriteList);

							$(link).favoriteToggle();
						}, 'json');
						return false;
					});
			});
		return this;
	};

	$.fn.queryParam = function (name) {
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
		var results = regex.exec(this[0].href);

		if(results == null) {
			return "";
		} else {
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		}
	};

	$(function () {
		var list = $('.favorite-toggle');

		if (list.length > 0) {
			$.localStorage.load(
				list.data('key'),
				function (data) {
					favoriteList = data;
					list
						.favoriteToggle()
						.removeClass('favorite-toggle');
				},
				function (recv) {
					$.getJSON($.service('favorite', 'list'), recv);
				},
				3600 // Valid for 1h
			);
		}
	});

	// global ajax event handlers
	$document.ajaxComplete(function () {
		$('.favorite-toggle')
			.favoriteToggle()
			.removeClass('favorite-toggle');
	});

	$document.ajaxError(function (event, jqxhr, settings, thrownError) {

		if (settings.preventGlobalErrorHandle) {
			return;
		}

		$(".modal.fade.show").modal("hide");
		var message;
		if (!thrownError && jqxhr.status !== 200) {
			if (jqxhr.status) {
				message = jqxhr.status + " " + jqxhr.statusText;
			} else {
				message = "AJAX: " + jqxhr.statusText + " " + jqxhr.status + " (" + jqxhr.state() + ") for URL: " + settings.url;
			}
		}
		if (message) {
			$("#tikifeedback").showError(message);
		}
	});

	/**
	 * Show a loading spinner on top of a button (or whatever)
	 *
	 * @param $spinner empty or jq object $spinner		if empty, spinner is added and returned and element "disabled"
	 * 											if spinner then spinner is removed and element returned to normal
	 *
	 * @return jq object $spinner being shown or null when removing
	 */

	$.fn.showBusy = function( $spinner ) {
		if (!$spinner) {
			var pos = $(this).position();
			$spinner = $("<img src='img/spinner.gif' alt='" + tr("Wait") + "' class='ajax-spinner' />").
					css({
						"position": "absolute",
						"top": pos.top + ($(this).height() / 2),
						"left": pos.left + ($(this).width() / 2) - 8
					}).data("target", this);
			$(this).parent().find(".ajax-spinner").remove();
			$(this).parent().append($spinner);
			$(this).attr("disabled", true).css("opacity", 0.5);
			return $spinner;
		} else {
			$($spinner.data("target")).attr("disabled", false).css("opacity", 1);
			$spinner.remove();
			return null;
		}
	}

	//	copy tracker action column to 1st row if table has horizontal scrolling
	$('.table-responsive:not(.article-types)').each(function () {
		var table = $(this);
		// mobile friendly tables
		if (table.find('table:not(.tablesorter) tbody tr').width() - 10 > table.width()) {
			if (!table.hasClass('large-table-no-wrap')) table.addClass('large-table-no-wrap');
			if (screen.width <= 767) {
				$('<div class="toggle-table-wrap d-md-none"><button type="button" class="btn btn-link fas fa-toggle-off"></button></div>').insertBefore(table);
				var checkall = false;
				table.find('table.table:not(.caltable) th').each(function (e) {
					var header = $(this).html();
					if ($(this).find('div').hasClass('form-check') || ($(this).find('input').hasClass('form-check-input') && e == 0)) {
						$(this).addClass('visible-header');
						header = "";
					}

					// page history exception
					if ($(this).find('input[name=compare]').length) {
						$(this).addClass('visible-header').addClass('compare-pages');
						header = "";
					}

					table.find('table.table tbody tr').each(function () {
						var cell = $(this).find('td').eq(e);
						if (checkall) cell.addClass('checkmargin');
						if ($.trim(cell.html()) == '') {
							cell.addClass('hidecell');
						} else {
							cell.prepend("<div class='header' style='display:none'>" + header + "</div>");
						}
						if (e == 0) {
							if ((cell.hasClass('checkbox-cell') || cell.find('input:checkbox')) && cell.find('.header').html() == '') {
								cell.addClass('checkall').removeClass('checkmargin');
								checkall = true;
							}
						}
					});
				});

				// this is for calendars
				table.find('table.caltable > tbody > tr:first > td.heading').each(function (e) {
					var header = $(this).html();
					table.find('table.caltable > tbody > tr:not(:first)').each(function () {
						var cell = $(this).find('> td').eq(e);
						cell.prepend("<div class='header' style='display:none'>" + header + "</div>");
					});
				});
			}
		}

		// action column
		if (table.find('table').width() - 5 > table.width()) {
			if (screen.width > 767) {
				if (table.find('table td.action').length) {
					table.find('table td.action').each(function () {
						$(this).parent().prepend($(this).clone());
					});
					table.find('table tr').eq(0).prepend('<th style="width:20px;"></th>');
				}
			}
		}
	});

	// mobile: wrap large table data on click
	$('.toggle-table-wrap button').each(function () {
		$(this).on('click', function () {
			if ($(this).hasClass('fa-toggle-on')) {
				$(this).removeClass('fa-toggle-on').addClass('fa-toggle-off');
				$(this).parent().next().removeClass('large-table').addClass('large-table-no-wrap');
			} else {
				$(this).removeClass('fa-toggle-off').addClass('fa-toggle-on');
				$(this).parent().next().removeClass('large-table-no-wrap').addClass('large-table');
			}
		});
	});

})(jQuery);

// Prevent memory leaks in IE
// Window isn't included so as not to unbind existing unload events
// More info:
//	- http://isaacschlueter.com/2006/10/msie-memory-leaks/
if ( window.attachEvent && !window.addEventListener ) {
	window.attachEvent("onunload", function() {
		for ( var id in jQuery.cache ) {
			var item = jQuery.cache[ id ];
			if ( item.handle ) {
				if ( item.handle.elem === window ) {
					for ( var type in item.events ) {
						if ( type !== "unload" ) {
							// Try/Catch is to handle iframes being unloaded, see #4280
							try {
								jQuery.event.remove( item.handle.elem, type );
							} catch(e) {}
						}
					}
				} else {
					// Try/Catch is to handle iframes being unloaded, see #4280
					try {
						jQuery.event.remove( item.handle.elem );
					} catch(e) {}
				}
			}
		}
	});
}

$.tikiModal = function(msg) {
	return $('body').tikiModal(msg);
};

//Makes modal over window or object so ajax can load and user can't prevent action
$.fn.tikiModal = function(msg) {
	var obj = $(this);
	if (!obj.length) {
		return null;			// happens after search index rebuild in some conditions
	}
	var lastModal = obj.data('lastModal');

	if (!lastModal) {
		lastModal = Math.floor(Math.random() * 1000);
		obj.data('lastModal', lastModal);
	}
	var box = {
		top: obj.offset().top,
		left: obj.offset().left,
		height: obj.outerHeight(),
		width: obj.outerWidth()
	};
	var modal = $('body').find('#modal_' + lastModal);
	var spinner = $('<img src="img/spinner.gif" style="vertical-align: top; margin-right: .5em;" />');

	if (!msg) {
		modal
			.fadeOut(function() {
				$(this).remove();
			});
		obj.removeData('lastModal');
		return obj;
	}

	if (modal.length) {
		modal
			.find('.dialog')
			.empty()
			.html(spinner)
			.append(msg);
		return obj;
	}

	modal = $('<div id="modal_' + lastModal + '" class="tiki-modal">' +
					'<div class="mask" />' +
					'<div class="dialog"></div>' +
			'</div>')
		.appendTo('body');

	var zIndex = 0;
	if (obj.is("body")) {
		zIndex = 2147483646 - 1;	// maximum
		box.top = obj.offset().top + $window.scrollTop();
		box.left = obj.offset().left + $window.scrollLeft();
	} else {
		obj.parents().addBack().each(function () {
			var z = $(this).css("z-index");
			if (z && z !== 'auto' && z > zIndex) {
				zIndex = Number(z);
			}
		});
	}

	//Set height and width to mask to fill up the whole screen or the single element
	modal
		.width(box.width)
		.height(box.height)
		.css('top', 	box.top + 'px')
		.css('left', 	box.left + 'px')
		.find('.mask')
			.height(box.height)
			.fadeTo(1000, 0.6)
		.parent()
		.find('.dialog')
			.hide()
			.append(spinner)
			.append(msg);
	var dialog = modal.find('.dialog');
	if (obj.is("body")) {
		dialog.css({
			top: (box.top + $window.innerHeight()/2 - $window.scrollTop()) + "px",
			left: (box.left + $window.innerWidth()/2 - $window.scrollLeft()) + "px"
		});
	}
	dialog.css({
		marginTop: (dialog.height() / -2) + "px",
		marginLeft: (dialog.width() / -2) + "px"
	}).show();

	if (zIndex) {
		modal.css("z-index", zIndex + 1);
	}
	return obj;
};

//makes the width of an input change to the value
$.fn.valWidth = function() {
	var me = $(this);
	return me.ready(function() {
		var h = me.height();
		if (!h) {
			h = me.offsetParent().css("font-size");
			if (h) {
				h = parseInt(h.replace("px", ""));
			}
		}
		me.keyup(function() {
			var width = me.val().length * h;

			me
				.stop()
				.animate({
					width: (width > h ? width : h)
				}, 200);
		})
		.keyup();
	});
};

//For making pagination have the ability to enter page/offset number and go
$.paginationHelper = function() {
	$('.pagenums').each(function() {
		var me = $(this);
		var step = me.find('input.pagenumstep');
		var endOffset = (me.find('input.pagenumend').val() - 1) * step.data('step');
		var url = step.data('url');
		var offset_jsvar = step.data('offset_jsvar');
		var offset_arg = step.data('offset_arg');

		me.find('span.pagenumstep').replaceWith(
			$('<input type="text" style="font-size: inherit; " />')
				.val(step.val())
				.change(function() {
					var newOffset = step.data('step') * ($(this).val() - 1);

					if (newOffset >= 0) {
						//make sure the offset isn't too high
						newOffset = (newOffset > endOffset ? endOffset : newOffset);

						//THis is for custom/ajax search handling
						window[offset_jsvar] = newOffset;
						if (step[0]) {
							if (step.attr('onclick')) {
								step[0].onclick();
								return;
							}
						}

						//if the above behavior isn't there, we update location
						document.location = url + offset_arg + "=" + newOffset;
					}
				})
				.keyup(function(e) {
					switch(e.which) {
						case 13: $(this).blur();
					}
				})
				.valWidth()
		);
	});
};

//a sudo "onvisible" event
$.fn.visible = function(fn, isOne) {
	if (fn) {
		$(this).each(function() {
			var me = $(this);
			if (isOne) {
				me.one('visible', fn);
			} else {
				me.on('visible', fn);
			}

			function visibilityHelper() {
				if (!me.is(':visible')) {
					setTimeout(visibilityHelper, 500);
				} else {
					me.trigger('visible');
				}
			}

			visibilityHelper();
		});
	} else {
		$(this).trigger('visible');
	}

	return this;
};

$.download = function(url, data, method){
	//url and data options required
	if( url && data ){
		//data can be string of parameters or array/object
		data = typeof data == 'string' ? data : jQuery.param(data);
		//split params into form inputs
		var inputs = '';
		jQuery.each(data.split('&'), function(){
			var pair = this.split('=');
			inputs+='<input type="hidden" name="'+ pair[0] +'" value="'+ pair[1] +'" />';
		});
		//send request
		jQuery('<form action="'+ url +'" method="'+ (method||'post') +'">'+inputs+'</form>')
		.appendTo('body').submit().remove();
	}
};

$.uiIcon = function(type) {
	return $('<div style="width: 1.4em; height: 1.4em; margin: .2em; display: inline-block; cursor: pointer;">' +
		'<span class="ui-icon ui-icon-' + type + '">&nbsp;</span>' +
	'</div>')
	.hover(function(){
		$(this).addClass('ui-state-highlight');
	}, function() {
		$(this).removeClass('ui-state-highlight');
	});
};

$.uiIconButton = function(type) {
	return $.uiIcon(type).addClass('ui-state-default ui-corner-all');
};

$.rangySupported = function(fn) {
	if (window.rangy) {
		rangy.init();
		var cssClassApplierModule = rangy.modules.CssClassApplier;
		return fn();
	}
};

$.fn.rangy = function(fn) {
	var me = $(this);
	$.rangySupported(function() {
		$document.mouseup(function(e) {
			if (me.data('rangyBusy')) return;

			var selection = rangy.getSelection();
			var html = selection.toHtml();
			var text = selection.toString();

			if (text.length > 3 && rangy.isUnique(me[0], text)) {
					if (fn)
						if ($.isFunction(fn))
							fn({
								text: text,
								x: e.pageX,
								y: e.pageY
							});
			}
		});
	});
	return this;
};

$.fn.rangyRestore = function(phrase, fn) {
	var me = $(this);
	$.rangySupported(function() {
		phrase = rangy.setPhrase(me[0], phrase);

		if (fn)
			if ($.isFunction(fn))
				fn(phrase);
	});
	return this;
};

$.fn.rangyRestoreSelection = function(phrase, fn) {
	var me = $(this);
	$.rangySupported(function() {
		phrase = rangy.setPhraseSelection(me[0], phrase);

		if (fn)
			if ($.isFunction(fn))
				fn(phrase);
	});
	return this;
};

$.fn.realHighlight = function() {
	var o = $(this);
	$.rangySupported(function() {
		rangy.setPhraseBetweenNodes(o.first(), o.last(), document);
	});
	return this;
};

$.fn.ajaxEditDraw = function(options) {
	var me = $(this).attr('href', 'tiki-ajax_services.php');

	//defaults
	options = $.extend({
		saved: function() {},
		closed: function() {}
	}, options);

	$.tikiModal(tr('Loading editor'));

	me.serviceDialog({
		title: me.attr('title'),
		data: {
			controller: 'draw',
			action: 'edit',
			fileId: me.data('fileid'),
			galleryId: me.data('galleryid'),
			imgParams: me.data('imgparams'),
			raw: true
		},
		modal: true,
		zIndex: 9999,
		fullscreen: true,
		load: function (data) {
			//prevent from happeneing over and over again
			if (me.data('drawLoaded')) return false;

			me.data('drawLoaded', true);

			me.drawing = $('#tiki_draw')
				.loadDraw({
					fileId: me.data('fileid'),
					galleryId: me.data('galleryid'),
					name: me.data('name'),
					imgParams: me.data('imgparams'),
					data: $('#fileData').val()
				})
				.on('savedDraw', function(e, o) {
					me.data('drawLoaded', false);
					me.drawing.parent().dialog('destroy');
					me.drawing.remove();

					//update the image that did exist in the page with the new one that now exists
					var img = $('.pluginImg' + me.data('fileid')).show();

					if (img.length < 1) document.location = document.location + '';

					var w = img.width(), h = img.height();

					if (img.hasClass('regImage')) {
						var replacement = $('<div />')
							.attr('class', img.attr('class'))
							.attr('style', img.attr('style'))
							.attr('id', img.attr('id'))
							.insertAfter(img);

						img.remove();
						img = replacement;
					}

					var src = me.data('src');

					$('<div class=\"svgImage\" />')
						.load(src ? src : 'tiki-download_file.php?fileId=' + o.fileId + '&display', function() {

							$(this)
								.css('position', 'absolute')
								.fadeTo(0, 0.01)
								.prependTo('body')
								.find('img,svg')
								.scaleImg({
									width: w,
									height: h
								});

							img.html($(this).children());

							$(this).remove();
						});

					if (!options.saved) return;

					options.saved(o.fileId);

					me.data('fileid', o.fileId);			// replace fileId on edit button
					if (o.imgParams && o.imgParams.fileId) {
						o.imgParams.fileId = o.fileId;
						me.data('imgparams', o.imgParams);
					}
				})
				.submit(function() {
					me.drawing.saveDraw();
					return false;
				})
				.on('loadedDraw', function() {
					//kill the padding around the dialog so it looks like svg-edit is one single box
					me.drawing
						.parent()
						.css('padding', '0px');

					var serviceDialog = me.data('serviceDialog');
					if (serviceDialog) {
						var drawFrame = $('#svgedit');
						serviceDialog
							.on('dialogresize', function() {
								drawFrame.height(serviceDialog.height() - 4);
							})
							.trigger('dialogresize');
					}

					$.tikiModal();
				});

			me.drawing.find('#drawMenu').remove();
		},
		close: function() {
			if (me.data('drawLoaded')) {
				me.data('drawLoaded', false);
				me.drawing.remove();

				if (!options.closed) return;
				options.closed(me);
			}
		}
	});

	return false;
};

$.notify = function(msg, settings) {
	settings = $.extend({
		speed: 10000
	},settings);

	var notify = $('#notify');

	if (!notify.length) {
		notify = $('<div id="notify" />')
			.css('top', '5px')
			.css('right', '5px')
			.css('position', 'fixed')
			.css('z-index', 9999999)
			.css('padding', '5px')
			.width($window.width() / 5)
			.prependTo('body');
	}

	var note = $('<div class="notify ui-state-error ui-corner-all ui-widget ui-widget-content" />')
		.append(msg)
		.css('padding', '5px')
		.css('margin', '5px')
		.mousedown(function() {
			return false;
		})
		.hover(function() {
			$(this)
				.stop()
				.fadeTo(500, 0.3)
		}, function() {
			$(this)
				.stop()
				.fadeTo(500, 1)
		})
		.prependTo(notify);

	setTimeout(function() {
		note
			.fadeOut()
			.slideUp();

		//added outside of fadeOut to ensure removal
		setTimeout(function() {
			note.remove();
		}, 1000);

	}, settings.speed);
};

function delayedExecutor(delay, callback)
{
	var timeout;

	return function () {
		var args = arguments;
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}

		timeout = setTimeout(function () {
			callback.apply(this, args)
		}, delay);
	};
}

$(function () {

		// Show/hide the sidebars //
		////////////////////////////

	$(".toggle_zone").click(function () {
		var $this = $(this), zone="",
			icon_left = "toggle-left", icon_right = "toggle-right";

		if ($this.is(".right")) {
			zone = "right";
			icon_left = "toggle-right";
			icon_right = "toggle-left"
		} else if ($this.is(".left")) {
			zone = "left";
		}
		if ($this.find(".icon-" + icon_left).length) {	// hide it
			$this.find(".icon").setIcon(icon_right);
			setCookie("hide_zone_" + zone, 'y');
			$("body").addClass("hide_zone_" + zone);
		} else {
			$this.find(".icon").setIcon(icon_left);
			deleteCookie("hide_zone_" + zone);
			$("body").removeClass("hide_zone_" + zone);
		}

		$(window).trigger("resize");

		return false; // do not modify URL by adding # on the click
	});
});

// try and reposition the menu ul within the browser window
$.fn.moveToWithinWindow = function() {
	var $el = $(this);
	var h = $el.height(),
	w = $el.width(),
	o = $el.offset(),
	po = $el.parent().offset(),
	st = $window.scrollTop(),
	sl = $window.scrollLeft(),
	wh = $window.height(),
	ww = $window.width();

	if (w + o.left > sl + ww) {
		$el.animate({'left': sl + ww - w - po.left}, 'fast');
	}
	if (h + o.top > st + wh) {
		$el.animate({'top': st + wh - (h > wh ? wh : h) - po.top}, 'fast');
	} else if (o.top < st) {
		$el.animate({'top': st - po.top}, 'fast');
	}
};

$.fn.scaleImg = function (max) {
	$(this).each(function() {
		//Here we want to make sure that the displayed contents is the right size
		var h, w, img = $(this),
		actual = {
			height: img.height(),
			width: img.width()
		},
		original = $(this).clone(),
		parent = img.parent();

		var winner = '';

		if (actual.height > max.height) {
			winner = 'height';
		} else if (actual.width > max.width) {
			winner = 'width';
		}

		//if there is no winner, there is no need to resize
		if (winner) {
			//we resize both images and svg, we check svg first
			var g = img.find('g');
			if (g.length) {
				img
					.attr('preserveAspectRatio', 'xMinYMin meet');

				parent
					.css('overflow', 'hidden')
					.width(max.width)
					.height(max.height);

				g.attr('transform', 'scale( ' + (100 / (actual[winner] / max[winner]) * 0.01)  + ' )');
			} else {
				//now we resize regular images
				if (actual.height > actual.width) {
					h = max.height;
					w = Math.ceil(actual.width / actual.height * max.height);
				} else {
					w = max.width;
					h = Math.ceil(actual.height / actual.width * max.width);
				}
				img.css({ height: h, width: w });
			}

			img
				.css('cursor', "url(img/icons/zoom.gif),auto")
				.click(function () {
					$('<div/>').append(original).dialog({
						modal: true,
						width: Math.min($(window).width(), actual.width + 20),
						height: Math.min($(window).height(), actual.height + 50)
					});
					return false;
				});
		}
	});

	return this;
};


// Compatibility to old jquery to resolve a bug in fullcalendar
$.curCSS = function (element, property) {
	return $(element).css(property);
};


$.fn.registerFacet = function () {
	this.each(function () {
		var element = this, entries = $($(this).data('for')).val()
			.split(" " + $(this).data('join') + " ")
			.map(function (value) {
				return (value.charAt(0) === '"') ? value.substr(1, value.length - 2) : value;
			});

		function applyFilter(value) {
			if (value) {
				value = $.makeArray(value);
				value = value
					.map(function (value) {
						return (-1 === value.indexOf(' ')) ? value : ('"' + value + '"');
					})
					.join(" " + $(element).data('join') + " ");
			}
			$($(element).data('for')).val(value).change();
		}

		if ($(element).is('select')) {
			$(this)
				.val(entries)
				.trigger("chosen:updated") // for chosen
				.change(function () {
					var value = $(this).val();
					applyFilter(value);
				});
		} else if ($(element).has(':checkbox').length) {
			$(':checkbox', element)
				.each(function () {
					if (-1 !== $.inArray($(this).val(), entries)) {
						$(this).prop('checked', true);
					}
				})
				.on('click', function () {
					applyFilter($(':checked', element).map(function () {
						return $(this).val();
					}));
				});
		}

		var selected = $('option:selected, :checkbox:checked', this).length,
			all = $('option, :checkbox', this).length;

		if (all === 1 && selected === 0) {
			$(this).closest('.facet-hide-group').hide();
		}
	});

	return this;
};

$.fn.reload = function () {
	this.each(function () {
		if (this.reload) {
			this.reload();
		} else if($(this).data('reload')) {
			$(this).loadService({}, {
				url: $(this).data('reload')
			});
		}
	});
	return this;
};

$(document).on('mouseover', '.media[data-href]', function () {
	$(this).css('cursor', 'pointer');
});
$(document).on('mouseout', '.media[data-href]', function () {
	$(this).css('cursor', 'default');
});
$(document).on('click', '.media[data-href]', function () {
	document.location.href = $(this).data('href');
});

$(document).on('hidden.bs.modal', '.footer-modal.fade', function () {
	// Required for bootstrap to allow changing the content of a modal
	$(this).removeData('bs.modal').find('.modal-content').empty();

	// With multiple stacked modals, which is not officially supported by bootstrap,
	// focus on the last modal would be lost.
	$('body').toggleClass('modal-open', $('.modal.fade.show').length > 0);
	$(".modal-backdrop.show:first").remove();
});

$(document).on('submit', '.modal-body form:not(.no-ajax)', ajaxSubmitEventHandler(function (data) {
	//if FORWARD is set in the returned data, load the passed service into the modal
	// rather than close the modal and refresh the page.
	if (data && data.FORWARD) {
		var $this = $(this);
		if ($this.is("form")) {
			$this = $this.parent();
		}
		$this.children().remove();
		$this.loadService(data.FORWARD, {
			origin: this,
			load: function () {
				$(this).closest('.modal').trigger('tiki.modal.redraw');
			}
		});
	} else {
		// reload() causes a request to update the browser cache - similar to pressing the reload button.
		// so we must not reload() but set the href. This behaves simililar to clicking a link - which keeps the browser cache.
		// The difference is: NOT loading about 50+ js / css files!
		//document.location.reload();
		document.location.href = document.location.href.replace(/#.*$/, "");	// remove the hash from the URL if there is one otherwise the page doesn't reload
	}
}));

// When data-size is set on the toggle-link, alter the size of the modal
$(document).on('click', '[data-toggle=modal][data-size]', function () {
	var target = $(this).data('target'), size = $(this).data('size');

	$(target)
		.one('hidden.bs.modal', function () {
			$('.modal-dialog', this).removeClass(size);
		})
		.find('.modal-dialog').addClass(size)
		;
});

$(document).on('click', '[data-toggle=modal][data-modal-title]', function () {
	var target = $(this).data('target'), title = $(this).data('modal-title');

	$(target)
		.one('loaded.bs.modal', function () {
			$('.modal-title', this).text(title);
		})
		;
});

$(document).on('loaded.bs.modal', '.modal.fade', function () {
	$(this).trigger('tiki.modal.redraw');
});

// START BOOTSTRAP 4 CHANGE
$(document).on('shown.bs.modal', '.modal', function (event) {
	// fixes for bootstrap4
	var $button = $(event.relatedTarget); // Button that triggered the modal
	var remote = $button.data('remote'); // Extract info from data-* attributes
	var $modal = $(this);

	var href = remote ? remote : $button.attr("href");

	if (href) {
		$modal.find('.modal-content').load(href, function () {
			$(this).trigger("tiki.modal.redraw");
		});
	} else {
		$modal.trigger("tiki.modal.redraw");
	}
	// END BOOTSTRAP 4 CHANGE
});

$(document).on('tiki.modal.redraw', '.modal.fade', function () {
	var modal = this, $button;

	// On Modal show, find all buttons part of a .submit block and create
	// proxies of them in the modal footer
	$('.modal-footer .auto-btn', modal).remove();
	$('div.submit .btn', modal).each(function () {
		var $submit = $(this);
		if ($submit.is('a:not(.custom-handling)')) {
			$button = $submit;
		} else {
			$submit.hide();
			$button = $('<button>')
				.text($submit.val() || $submit.text())
				.attr('class', $submit.attr('class'))
				.addClass('auto-btn')
				.click(function () {
					if ($submit.data("alt_controller") && $submit.data("alt_action")) {
						$submit.parents("form").attr("action", $.service($submit.data("alt_controller"), $submit.data("alt_action")));
					}
					$submit.click();
					if (typeof $submit.parents("form").validate !== "function") {
						// make the button look disabled and ignore further clicks
						$button.off("click").css("opacity", 0.3);
					}
				});
		}
		$('.modal-footer', modal).append($button);
	});

	if ($.fn.flexibleSyntaxHighlighter) {
		$('textarea', modal).flexibleSyntaxHighlighter();
	}

	$(".nav-tabs", this).each(function () {
		if ($(".active", this).length === 0) {
			$("li:first-child a", this).tab("show");
		}
	});

	if ($.applyChosen) {
		$(this).applyChosen();
	}

	if (jqueryTiki.colorbox) {
		$(this).applyColorbox();
	}

	if (jqueryTiki.tooltips) {
		$(this).tiki_popover();
	}
	// START BOOTSTRAP 4 CHANGE

	$('.modal-body :input', modal).first().focus();
	$('.modal-backdrop.show:not(.fade)').remove(); // Bootstrap keeps adding more of these

	// handle $ajaxtimer for alerts that are not using the confirmAction handler
	if ($("#timer-seconds", modal).length) {
		var $seconds = $("#timer-seconds"),
			counter = $seconds.text(),
			timer = setInterval(function () {
				$seconds.text(--counter);
				if (counter === 0 || counter < 0) {
					$.closeModal();
					window.location = window.location.href;
				}
			}, 1000);
	}
	// END BOOTSTRAP 4 CHANGE
});

/**
 * Make .depends elements show or hide depending on the state of the "on" element
 * for checkboxes only so far
 */
$(document).on("ready tiki.modal.redraw", function () {
	$(".depends").each(function () {
		var $depends = $(this),
			on = $depends.data("on");

		$("[name=" + on + "]").change(function () {
			if ($(this).is("input[type=checkbox]") && $(this).is(":checked")) {
				$depends.show();
			} else {
				$depends.hide();
			}
		}).change();

	});
});

$(function () {
	var $tabs = $('a[data-toggle=tab][href="' + document.location.hash + '"]'),
		tabShown = false,
		notShown = [];

	if (document.location.search.match(/cookietab=/)) {
		tabShown = true;
	} else if (document.location.hash && $tabs.length) {
		$tabs.tab('show');
		tabShown = true;
	} else {
		$(".tabs").each(function () {
			var name = $(this).data("name"),
				t = getCookie(name, "tabs", "notfound");

			var $tab = $('a[data-toggle=tab].active', this);	// class "active" set serverside from $cookietab var
			if (t && $tab.length === 0) {
				$tab = $('a[data-toggle=tab][href="' + t + '"]');
			}

			if ($tab.length) {
				$tab.tab('show');
				tabShown = true;
			} else if (name) {
				notShown.push(name);
			}
		});
	}
	if (typeof $().tab === "function") {
		if (!tabShown && !notShown.length) {
			$("a[data-toggle=tab]:first").tab("show");
		} else if (notShown.length) {
			for (var i = 0; i < notShown.length; i++) {
				$(".tabs[data-name=" + notShown[i] + "] a[data-toggle=tab]:first").tab("show");
			}
		}
	}

	$('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
		if ($(this).parents(".tab-content").length === 0) {
			document.location.hash = $(e.target).attr("href");
		}
		setCookieBrowser($(this).parents(".tabs:first").data("name"), $(e.target).attr("href"), "tabs");
	}).click(function () {
		var scroll = $window.scrollTop();	// prevent window jumping to tabs on click
		$(this).tab('show');
		$window.scrollTop(scroll);
	});

	$("input[name='session_protected']").on('click', function () {
		if ($(this).prop('type') == 'checkbox' && $(this).data('tiki-admin-child-block') == '#session_protected_childcontainer') {
			var checkbox = $("input[name='session_protected']");
			if (checkbox.prop('checked') && location.protocol != 'https:') {
				$(this).confirmationDialog({
					title: tr('Warning - Protect all sessions with HTTPS'),
					message: tr('You seem to be accessing the website using HTTP only, if your HTTPS settings are not correct, you will be locked out of the website'),
					success: function () {
						checkbox.prop('checked', true);
					}
				});
				return false;
			}
		}
	});
});

$.openModal = function (options) {
	var href = options.remote; 	// BOOTSTRAP 4 CHANGE

	if (-1 === href.indexOf('?')) {
		href += '?modal=1';
	} else {
		href += '&modal=1';
	}

	// START BOOTSTRAP 4 CHANGE
	$('.modal.fade:not(.show):first')
		// Bind a single event to trigger as soon as the form appears
		.one('hidden.bs.modal', options.close || function () {})
		// Make the form load
		.find(".modal-content")
		.load(href, function () {

			var $modal = $(this).parents(".modal");

			$modal.modal(options);

			if ($modal.is(':visible')){
				$modal.trigger("tiki.modal.redraw");
			} else {
				$modal.modal("show");
			}

			$('.modal-title', this).text(options.title);

			if (options.size) {
				$modal.find('.modal-dialog').addClass(options.size);
				$modal.one('hidden.bs.modal', function () {
					$('.modal-dialog', this).removeClass(options.size);
				});
			}

			if (options.open) {
				options.open.apply(this);
			}

			// END BOOTSTRAP 4 CHANGE
		});

};

$.closeModal = function (options) {
	options = options || {};
	var done = options.done;
	if (done) {
		done = function () {
			// Wait until the event loop ends before considering really done
			setTimeout(options.done, 0);
		};
	}

	$('.modal.fade.show').last()	// BOOTSTRAP 4 CHANGE
		.one('hidden.bs.modal', done || function () {})
		.modal('hide');
};

$.fn.clickModal = function (options, href) {
	this.click($.clickModal(options, href));
	return this;
};

$.clickModal = function (options, href) {
	return function (e) {
		var control = this, url;
		if (! href) {
			url = $(this).attr('href');
		} else {
			url = href;
		}
		if ($.isFunction(e.preventDefault)) {
			e.preventDefault();
		}

		$.openModal({
			title: options.title,
			size: options.size,
			remote: url,
			open: function () {
				if (options.open) {
					options.open.apply(this, []);
				}

				$('form:not(.no-ajax)', this)
					.addClass('no-ajax') // Remove default ajax handling, we replace it
					.submit(ajaxSubmitEventHandler(function (data) {
						if (options.success) {
							options.success.apply(control, [data]);
						}
					}));
			}
		});
	};
};

/**
 * Open a tab on the current page, e.g.:
 * <a href="#" onclick="showTab(2); return false;">Open tab 2 on this page</a>
 *
 * Assumes the tab is in the main column of the page and that one tab is already showing.
 *
 * @param tabNumber         number of the tab on the current page to show
 * @returns {boolean}
 */
function showTab(tabNumber) {
	var thisTabId = $('#col1').find('.tab-pane.active').attr('id'),
		tabNames = thisTabId.substr(0, thisTabId.indexOf('-') + 1)
	;
	$('a[href="#' + tabNames + tabNumber + '"]').tab('show');
}

/**
 * Send feedback to a popup modal or to div#tikifeedback using bootstrap alert variations (error, warning, success, info)
 *
 * @param mes           array       The message
 * @param type          string      Type of alert: error, warning, success or info (default)
 * @param modal         boolean     true for popup modal, false (default) to use the div#tikifeedback that is on every page
 * @param title         string      Custom message title
 * @param icon          string      Custom icon
 * @param killall       boolean     true for removing other feedbacks already open, false (default) (only for non modal)
 * @param custom        string      Custom target in jquery selection notation (only for non modal)
 */
function feedback (mes, type, modal, title, icon, killall, custom)
{
	mes = mes || [];
	if (!$.isArray(mes)) {
		mes = [mes];
	}
	if (mes.length == 1) {
		var meshtml = [mes][0];
	} else {
		var meshtml = '<ul>';
		$.each(mes, function(i, val) {
			if (val) {
				meshtml += '<li>' + val + '</li>';
			}
		});
		meshtml += '</ul>';
	}
	type = type || 'info'; modal = modal || false; killall = killall || false; custom = $(custom).length ? $(custom).first() : null;
	var target, map =
	{
		'error': {title:tr('Error'), class:'danger', icon:'error'},
		'warning': {title:tr('Warning'), class:'warning', icon:'warning'},
		'success': {title:tr('Success'), class:'success', icon:'success'},
		'info': {title:tr('Note'), class:'info', icon:'information'}
	};
	var check = ['error', 'warning', 'success', 'info'];
	type = $.inArray(type, check) > -1 ? type : 'info';
	title = title || map[type]['title'];
	icon = icon || map[type]['icon'];
	icon = $.fn.getIcon(icon);
	if (modal) {
		if (mes.length > 0) {
			meshtml = '<div class="alert alert-dismissable alert-' + map[type]['class'] + '">' + meshtml + '</div>';
		} else {
			meshtml = '';
		}
		target = $('.modal.fade:not(.show)').first();
		$('.modal-content', target).html(
			'<div class="modal-header">' +
				'<h4 class="text-' + map[type]['class'] + '">' + icon[0].outerHTML + ' ' + title + '</h4>' +
				'<button type="button" class="close pull-right" data-dismiss="modal">x</button>' +
			'</div>' +
			'<div class="modal-body">' +
				meshtml +
			'</div>'
		);
		target.modal();
	} else {
		var tfb = $(custom ? custom : 'div#tikifeedback');
		if (killall) {
			tfb.find('div.alert.alert-dismissable').remove();
		}
		if (mes.length == 0) {
			meshtml = '';
		}
		tfb.append(
			'<div class="alert alert-dismissable alert-' + map[type]['class'] + '">' +
				'<button type="button" class="close" data-dismiss="modal">x</button>' +
				'<h4>' + icon[0].outerHTML + ' ' + title + '</h4>' +
				meshtml +
			'</div>'
		).on('click' , 'button.close' , function() {
			$(this).parent().remove();
		});
		placeFeedback(tfb);
	}
}

/**
 * Utility for tikifeedback to place the feedback at the top of the page (at div#tikifeedback) or viewport, whichever is
 * lower to allow it to be seen. If shown at the top of the view port, after 5 seconds it will move to its normal
 * position, which is the first element in div#col1
 *
 * @param object
 */
function placeFeedback(object) {
	if ($('.modal.fade.show').length) {
		$('#col1, #col2, #col3').css('z-index', 'auto');
		object.css('z-index', 3000);
		object.find('div').css('z-index', 3000);
	}
	if (object.offset().top < $(window).scrollTop()) {
		object.find('div.alert').append('<div id="move-message" style="font-size:smaller;margin-top:10px"><em>'
			+ tr('This message will move to the top of the page after a few seconds.') + '</em>');
		//it's important to not define top until after the tfb object has been manipulated
		object.offset({'top': $(window).scrollTop()});
		object.css('z-index', 3000);
		setTimeout(function() {
			object.fadeOut(1000, function() {
				//move back to usual position and clear style attribute so subsequent feedback appears properly
				$('div#col1').prepend(object);
				object.css({'z-index':'', 'position':'', 'top': ''});
				object.find('div#move-message').css('visibility', 'hidden');
				object.fadeIn();
			});
		}, 5000);
	}

}

// thanks to Rob W on https://stackoverflow.com/a/8962023/2459703
$.fn.closestDescendent = function(filter) {
		var $found = $(),
				$currentSet = this; // Current place
		while ($currentSet.length) {
				$found = $currentSet.filter(filter);
				if ($found.length) break;  // At least one match: break loop
				// Get all children of the current set
				$currentSet = $currentSet.children();
		}
		return $found.first(); // Return first match of the collection
};

window.regCapsLock = function () {};

// Avoid that jquery appends a cachebuster to scripts loaded via a regular script tag when the base content was loaded from an xhr call
// I.e xhr call loads same html boilerplate and that boilerplate contains a script tag that loads some .js script.
// In this case, jquery would add a cachebuster to the js request, and no cache would be work.
$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
	if ( options.dataType == 'script' || originalOptions.dataType == 'script' ) {
		options.cache = true;
	}
});

//Preview for the upload avatar popup
function readURL(input) {
	if (input.files && input.files[0]) {
		$(".btn-upload-avatar").removeClass('disabled');
		var reader = new FileReader();
		reader.onload = function (e) {
			$('.user-avatar-preview img').attr('src', e.target.result);
		}
		reader.readAsDataURL(input.files[0]);
	}
}
$(document).on('change', '#userfile', function(){
	readURL(this);
});


function objectLockToggle(icon) {

	var $this = $(icon).tikiModal(" "),
		action = $this.data("is_locked") ? "unlock" : "lock";

	$.post($.service(
		"object",
		action,
		{
			type: $this.data("type"),
			object: $this.data("object"),
			value: $this.data("is_locked") ? "" : jqueryTiki.username
		}
		), function (data) {
			if (data && data.locked) {
				$this.find(".icon").setIcon("lock");
				$this.data("is_locked", "1")
					.attr("title", tr("Locked by " + jqueryTiki.userRealName))
					.parent().find("input[name=locked]").val(jqueryTiki.username);
			} else {
				$this.find(".icon").setIcon("unlock");
				$this.data("is_locked", "")
					.attr("title", "")
					.parent().find("input[name=locked]").val("");
			}
		},
		"json").done(function () {
		$this.tikiModal();
	});

	return false;
}


/**
 * Remove accents from chars
 * vendor_bundled/vendor/mottie/tablesorter/js/jquery.tablesorter.combined.js:2373
 *
 * @param str
 */
(function setup_removediacritics_function(){
	var characterEquivalents = {
	'a' : '\u00e1\u00e0\u00e2\u00e3\u00e4\u0105\u00e5', // áàâãäąå
	'A' : '\u00c1\u00c0\u00c2\u00c3\u00c4\u0104\u00c5', // ÁÀÂÃÄĄÅ
	'c' : '\u00e7\u0107\u010d', // çćč
	'C' : '\u00c7\u0106\u010c', // ÇĆČ
	'e' : '\u00e9\u00e8\u00ea\u00eb\u011b\u0119', // éèêëěę
	'E' : '\u00c9\u00c8\u00ca\u00cb\u011a\u0118', // ÉÈÊËĚĘ
	'i' : '\u00ed\u00ec\u0130\u00ee\u00ef\u0131', // íìİîïı
	'I' : '\u00cd\u00cc\u0130\u00ce\u00cf', // ÍÌİÎÏ
	'o' : '\u00f3\u00f2\u00f4\u00f5\u00f6\u014d', // óòôõöō
	'O' : '\u00d3\u00d2\u00d4\u00d5\u00d6\u014c', // ÓÒÔÕÖŌ
	'ss': '\u00df', // ß (s sharp)
	'SS': '\u1e9e', // ẞ (Capital sharp s)
	'u' : '\u00fa\u00f9\u00fb\u00fc\u016f', // úùûüů
	'U' : '\u00da\u00d9\u00db\u00dc\u016e' // ÚÙÛÜŮ
	};

	var characterRegex, characterRegexArray;

	function removeDiacritics(str) {
		var chr,
			acc = '[',
			eq = characterEquivalents;

		if ( !characterRegex ) {
			characterRegexArray = {};
			for ( chr in eq ) {
				if ( typeof chr === 'string' ) {
					acc += eq[ chr ];
					characterRegexArray[ chr ] = new RegExp( '[' + eq[ chr ] + ']', 'g' );
				}
			}
			characterRegex = new RegExp( acc + ']' );
		}
		if ( characterRegex.test( str ) ) {
			for ( chr in eq ) {
				if ( typeof chr === 'string' ) {
					str = str.replace( characterRegexArray[ chr ], chr );
				}
			}
		}
		return str;
	}

	window.removeDiacritics = removeDiacritics;
})();

/**
 * Fetch feedback sent through ajax and place into the tikifeedback div that is on each page
 * If tikifeedback div is outside of the viewport, place it at the top of the viewport and have it move to the
 * normal position (first element in div#col1) after 5 seconds
 */
$(document).ajaxComplete(function (e, jqxhr) {
	var feedback = jqxhr.getResponseHeader('X-Tiki-Feedback'),
		tfb = $('#tikifeedback');
	if (feedback) {
		feedback = decodeURIComponent(feedback); // decodeURIComponent() reverses rawurlencode().
		tfb.fadeIn(200, function() {
			//place html from ajax X-Tiki-Feedback into the div#tikifeedback
			tfb.html($($.parseHTML(feedback)).filter('#tikifeedback').html());
			tfb.find('div.alert').each(function() {
				var	title = $(this).find('span.rboxtitle').text().trim(),
					content = $(this).find('div.rboxcontent').text().trim();
				$(this).find('span.rboxtitle').text(title);
				$(this).find('div.rboxcontent').text(content);
			});
			//place tikifeedback div into window view if necessary
			placeFeedback(tfb);
		});
	}
	tfb.find('.clear').on('click', function () {
		$(tfb).empty();
		//move back to usual position and clear style attribute so subsequent feedback appears properly
		$('div#col1').prepend(tfb);
		tfb.css({'z-index':'', 'position':'', 'top': ''});
		return true;
	});
});

$(document).on('keydown', 'textarea.autoheight', function(evt){
	var el = this;
	var height = Math.max(el.clientHeight, el.offsetHeight, el.scrollHeight);
	el.style.cssText = 'height:' + height + 'px; overflow-y: hidden';
	setTimeout(function(){
		el.scrollTo(0,0);
	}, 0);
});

$(document).on('change', '.preference :checkbox:not(.pref-reset)', function () {
	var childBlock = $(this).data('tiki-admin-child-block')
		, childMode = $(this).data('tiki-admin-child-mode')
		, checked = $(this).is(':checked')
		, disabled = $(this).prop('disabled')
		, $depedencies = $(this).parents(".adminoption").find(".pref_dependency")
		, childrenElements = null
	;
	var childrenElements = $(this).parents('.adminoptionbox').nextAll('.adminoptionboxchild').eq(0).find(':input[id^="pref-"]');

	if (childBlock) {
		childrenElements = $(childBlock).find(':input[id^="pref-"]');
	}

	if (childMode === 'invert') {
		// FIXME: Should only affect childBlock, not $depedencies. From r54386
		checked = ! checked;
	}

	if (disabled && checked) {
		$(childBlock).show('fast');
		$depedencies.show('fast');
	} else if (disabled || ! checked) {
		/* Only hides child preferences if they are all at default values.
		Purpose questioned in https://sourceforge.net/p/tikiwiki/mailman/tikiwiki-cvs/thread/F2DE8896807BF045932776107E2E783D350674DB%40CT20SEXCHP02.FONCIERQC.INTRA/#msg36171225
		 */
		var hideBlock = true;
		childrenElements.each(function( index ) {
			var value = $( this ).val();
			var valueDefault = $( this ).siblings('span.pref-reset-wrapper').children('.pref-reset').attr('data-preference-default');

			if (typeof valueDefault != 'undefined' && value != valueDefault) {
				hideBlock = false;
			}
		});

		if (hideBlock) {
			$(childBlock).hide('fast');
			$depedencies.hide('fast');
		}
	} else {
		$(childBlock).show('fast');
		$depedencies.show('fast');
	}
});

$(document).on('click', '.pref-reset-wrapper a', function () {
	var box = $(this).closest('span').find(':checkbox');
	box.click();
	$(this).closest('span').children( ".pref-reset-undo, .pref-reset-redo" ).toggle();
	return false;
});

$(document).on('click', '.pref-reset', function() {
	var c = $(this).prop('checked');
	var $el = $(this).closest('.adminoptionbox').find('input:not(:hidden),select,textarea')
		.not('.system').attr( 'disabled', c )
		.css("opacity", c ? .6 : 1 );
	var defval = $(this).data('preference-default');

	if ($el.is(':checkbox')) {
		$(this).data('preference-default', $el.prop('checked') ? 'y' : 'n');
		$el.prop('checked', defval === "y");
	} else {
		$(this).data('preference-default', $el.val());
		$el.val(defval);
	}
	$el.change();
	if (jqueryTiki.chosen) {
		$el.trigger("chosen:updated");
	}
});

$(document).on('change', '.preference select', function () {
	var childBlock = $(this).data('tiki-admin-child-block')
		, selected = $(this).val()
		, childMode = $(this).data('tiki-admin-child-mode')
	;

	$(childBlock).hide();
	$(childBlock + ' .modified').show();
	$(childBlock + ' .modified').parent().show();

	if (selected && /^[\w-]+$/.test(selected)) {
		$(childBlock).filter('.' + selected).show();
	}
	if (childMode === 'notempty' && selected.length) {
		$(childBlock).show();
	}
});

$(document).on('change', '.preference :radio', function () {
	var childBlock = $(this).data('tiki-admin-child-block');

	if ($(this).prop('checked')) {
		$(childBlock).show('fast');
		$(this).closest('.preference').find(':radio').not(this).change();
	} else {
		$(childBlock).hide();
	}
});

$(function () {
	$('.preference :checkbox, .preference select, .preference :radio').change();
});
