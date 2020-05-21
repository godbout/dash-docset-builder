/* (c) Copyright by authors of the Tiki Wiki CMS Groupware Project
 *
 * All Rights Reserved. See copyright.txt for details and a complete list of authors.
 * Licensed under the GNU LESSER GENERAL PUBLIC LICENSE. See license.txt for details.
 *
 * $Id: autoToc.js 75489 2020-02-05 00:39:17Z pom2ter $
 *
 * Rewritten for bootstrap tiki 15.x 2015-2016
 * Based on work by Jobi Carter keacarterdev@gmail.com
 */

$.buildAutoToc = function () {
	var $page = $("body"),
		$top = $("#top");


	//if a wiki page, and if there is no toc-off div and not printing
	if ($top.length && !$("#toc-off").length && location.href.indexOf("tiki-print.php") == -1) {

		var $headers = $("h1.pagetitle:visible", "#col1").add($(":header", $top)).not("#toctitle > h3");

		//if there are more than one $headers on the page
		if ($headers.length > 1) {

			var $tocDiv = $("<div id='autotoc' contenteditable='false' role='complimentary' class='col-sm-3 autotoc' />");

			//create object to store processed IDs.
			var processedId = {};

			//function to process header Id generation. If an ID which has been processed is generated again and passed in again, the id name will be incremented to id_[1*]
			function processId(id) {
				if (id in processedId) {
					//if processed before
					//iterate count for header with this ane
					processedId[id] += 1;
					//set the new id to id plus count for header
					var newId = id + "_" + processedId[id];
				} else {
					//if not processed before
					//add to "dictionary' with count of 0
					processedId[id] = 0;
					//return id passed in
					newId = id;
				}
				return newId;
			}

			// open HTML $list
			var $list = $("<ul class='navbar-nav mr-auto nav' />"),
					$currentList = $list,		// pointer to where to add items
					headerLevel,				// how deep we are
					previousHeaderLevel = 0; 	//start from indentation level 0, with header one as base


			//Iterate over the $headers
			$headers.each(function () {

				//get header level for header to see if this header should be processed or not
				var $this = $(this);
				headerLevel = parseInt($this.prop("tagName").substring(1));

				//grab the whole header element to show as the anchor text (stripping the html tags)
				var aText = $.trim($this.html().replace(/(<([^>]+)>)/ig,""));

				//generate and set id if necessary (if element does not already have an id, create one)
				var id = $this.attr("id");
				if (!id){
					// Set the id to the the inner text of the header, with underscores instead of spaces (" ").
					// processId checks if the ID has been assigned yet, and if so, increments the Id with a number at the end of the id name
					id = processId(aText.replace(/\W/g, "_"));

				} else {
					id = id.replace(":", "\\:").replace(".", "\\.").replace("#", "\\#");
				}
				//set the element's id to the constructed ID
				$this.attr("id", id);
				//construct the anchor URL with chars jquery doesn't like escaped
				var url = "#" + id;

				//create the HTML anchor item with the text from the header and pointing to baseurl#divId
				var $item = $("<li><a href=" + url + " class='dropdown-item'>" + aText + "</a></li>");


				if (previousHeaderLevel && headerLevel > previousHeaderLevel) {	// deeper level

					//open a new sublist for each level of difference
					var $lastItem = $("li:last", $currentList).append($("<ul class='nav' />"));
					$currentList = $("ul:last", $lastItem);

				} else if (headerLevel < previousHeaderLevel) {					// up some levels

					$currentList = $($currentList.parents("ul")[previousHeaderLevel - headerLevel - 1]);

				}

				$currentList.append($item);

				//set current header level to previous header level for next iteration
				previousHeaderLevel = headerLevel;
			});

			// append the $list
			if (!jqueryTiki.autoToc_inline) {
				$("#page-data").addClass("col-sm-9 page-data-autotoc").css({'display': 'inline-block', 'padding-left': '0'});
				if (jqueryTiki.autoToc_pos === "left" || jqueryTiki.autoToc_pos === "top") {
					$tocDiv.append($list).css('clear','left').insertBefore('#page-data');
				} else {
					$tocDiv.append($list).css({'clear': 'right', 'float': 'right'}).insertAfter('#page-data');
				}

				//change behaviour if header is fixed
				var fixed_height = 0;
				var toc_offset = parseInt(jqueryTiki.autoToc_offset);
				if ($('#header_outer').css('position') === 'fixed') {
					fixed_height = $('#header_outer').height() + 10;
					$('<style type="text/css">.affix{top:' + (toc_offset + fixed_height) + 'px;max-height:calc(100vh - ' + (toc_offset + fixed_height + 10) + 'px);}</style>').appendTo('head');
					$('#autotoc li a').click(function(e) {
						var href = $(this).attr('href');
						anchorOffset = $(href).offset().top - fixed_height;
						$('html, body').animate({scrollTop: anchorOffset});
					});
				}

				//Fix fixed position and width and left offset when resize window
				$(window).resize(function() {
//					leftoffset = $('#page-data').offset().left + $('#page-data').width() + 30;
//					$("> .nav", "#autotoc").css('left', leftoffset);
					$('#autotoc .nav').width($('#autotoc').width());
					affix();
				}).resize();

				// trigger the bootstrap affix and scrollspy
				$page.scrollspy({
					target: "#autotoc",
					offset: (toc_offset + fixed_height)
				});

				function affix() {
					$(window).on('scroll', function (e) {
						var scrollpos = $(window).scrollTop();
						var offsetpos = $('#page-data').height() - $('#autotoc > .nav').height();
						var top = $('#page-data').offset().top - (toc_offset + fixed_height);
						var bottom = $('#page-data').offset().top + $('#page-data').height() - $('#autotoc > .nav').height() - (toc_offset + fixed_height);

						if (scrollpos > top) {
							if (scrollpos > bottom) {
								$('#autotoc > .nav').removeClass('affix').addClass('affix-bottom').css('top', offsetpos + 'px');
							}
							else {
								$('#autotoc > .nav').addClass('affix').removeClass('affix-bottom').css('top', '');
							}
						} else {
							$('#autotoc > .nav').removeClass('affix');
						}

						$('#autotoc .nav li a').each(function(){
							if ( $(this).hasClass('active') ) {
								$(this).parents('li').addClass('open');
							} else {
								$(this).parentsUntil('.navbar-nav .nav').removeClass('open');
							}
						});
					});
				}
				//$("> .nav", "#autotoc").affix('checkPosition');//Prevent bottom overlap if page loaded in max-bottom of page (not working)
			} else {
				$tocDiv.prepend($list).prependTo($top);
			}
		}
	}
};

$(document).ready(function () {
	$.buildAutoToc();
});