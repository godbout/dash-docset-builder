/* (c) Copyright by authors of the Tiki Wiki CMS Groupware Project
 *
 * All Rights Reserved. See copyright.txt for details and a complete list of authors.
 * Licensed under the GNU LESSER GENERAL PUBLIC LICENSE. See license.txt for details.
 *
 * $Id: iconsets.js 66110 2018-04-19 18:22:38Z luciash $
 *
 * Support for client side iconsets
 */

(function ($) {

	/**
	 * Get the element object for an icon depending on the current iconset
	 *
	 * @param name {string}        Name of the icon as defined in the iconset
	 * @returns {*|HTMLElement}
	 */
	$.fn.getIcon = function (name) {
		var icon = jqueryTiki.iconset.icons[name],
			$output = $(), attr = "";
		if (! icon) {
			if (jqueryTiki.iconset.defaults.indexOf(name) > -1) {
				icon = { id: name };
			}
		}


		if (icon) {
			icon.tag     =  icon.tag     || jqueryTiki.iconset.tag;
			icon.prepend =  icon.prepend || jqueryTiki.iconset.prepend;
			icon.append  =  icon.append  || jqueryTiki.iconset.append;

			$output = $("<" + icon.tag + ">");
			attr = icon.prepend + icon.id + icon.append;

			if (icon.tag === "img") {
				$output.attr("src", attr);
				$output = $("<span>")
					.addClass("icon")
					.addClass("icon-" + name)
					.append($output);
			} else {
				$output.addClass(attr)
					.addClass("icon")
					.addClass("icon-" + name);
			}

		} else {
			$output = $().getIcon("warning");
			console.log("iconset: icon not found:" + name);
		}

		return $output;
	};

	/**
	 * Change an existing icon's icon
	 * Could be a span for a font-icon or an img for legacy
	 *
	 * @param name string    Name of the icon as defined in the iconset
	 *
	 */

	$.fn.setIcon = function(name) {
		return $(this)
			.replaceWith(
				$(this).getIcon(name)
			);
	}

})(jQuery);
