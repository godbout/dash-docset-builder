/**
 * (c) Copyright by authors of the Tiki Wiki CMS Groupware Project
 *
 * All Rights Reserved. See copyright.txt for details and a complete list of authors.
 * Licensed under the GNU LESSER GENERAL PUBLIC LICENSE. See license.txt for details.
 * $Id: pluginedit_list.js 67519 2018-09-17 16:17:27Z jonnybradley $
 *
 * Handles list plugin GUI
 */


// event for plugin list
$(document)
	.off('plugin_list_ready')
	.on('plugin_list_ready', function (params) {

		var $textarea = params.modal.find("textarea[name=content]");
		jqueryTiki.plugins.list.setup($textarea);

	});

$(document).ready(function () {

	jqueryTiki.plugins = jqueryTiki.plugins || {};

	jqueryTiki.plugins.list = {
		/**
		 * Local data
		 */
		current: {},
		fields: {},
		plugins: {},
		objectType: null,
		$editor: null,

		/**
		 * Main GUI setup
		 *
		 * @param $textarea
		 */
		setup: function ($textarea) {

			var gui = this;

			gui.current = {};
			gui.fields = {};
			gui.plugins = {};
			gui.trackers = {};
			gui.objectType = null;
			gui.sortableOptions = {
				listType: "ul",
				maxLevels: 2,
				handle: "div:first",
				items: "li",
				disableNesting: "no-nesting"
			};

			// display GUI interface here
			gui.$editor = $("<div>")
				.addClass('plugin-list-editor clearfix');

			var buildMainToolbar = function () {
				var $tb = $("<div>")
					.addClass("btn-toolbar")
					.append(
						gui.buildToolBar(gui.plugins, "", "", function () {
							if ($(this).data("plugin")) {
								var params = [];
								if ($(this).data("value")) {
									params[$(this).data("value")] = "";
								}
								$ul.append(
									gui.addPlugin({
										name: $(this).data("plugin"),
										params: params,
										plugins: []
									})
								).nestedSortable(gui.sortableOptions);

								return false;
							}
							$(".dropdown-menu", $tb).hide();
						}),
						$("<div>")
							.addClass("btn-group")
							.append(
								$("<a>")
									.addClass("btn btn-primary btn-sm btn-source ml-2")
									.append(
										$("<span>").getIcon("list"),
										" ",
										tr("Source")
									)
									.click(function () {
										toggleGui();
									})
									.attr("title", tr("Toggle source mode"))
									.attr("href", "#")
							)
					);

				$(".dropdown-toggle", $tb).removeClass("btn-link btn-sm").addClass("btn-primary btn-sm");

				return $tb;
			};

			var $toolbar = buildMainToolbar();
			gui.$editor.append($toolbar);

			var $ul = $("<ul>")
				.addClass('plugin-list-gui clearfix')
				.appendTo(gui.$editor);

			var toggleGui = function () {
				var $btn = gui.$editor.find(".btn-source");
				if ($textarea.is(":visible")) {
					showGui();

					$btn.empty().append($("<span>").getIcon("list"), tr("Source"));

					$(".dropdown-toggle", gui.$editor)
						.removeClass("disabled")
						.css("opacity", 1);
				} else {

					gui.saveToTextarea();

					// show the label column
					$textarea.parents(".row")
						.find("> label").show()
						.parent().find("> .col-sm-12").removeClass("col-sm-12").addClass("col-sm-9");

					$textarea.show();
					$ul.hide();

					$btn.empty().append($("<span>").getIcon("mouse-pointer"), tr("GUI"));

					$(".dropdown-toggle", gui.$editor)
						.addClass("disabled")
						.css("opacity", 0.3);
				}
			};

			var showGui = function () {
				$textarea
					.parents(".row")
					.find("> label").hide()			// hide the label column
					.parent().find("> .col-sm-9").removeClass("col-sm-9").addClass("col-sm-12")
					.tikiModal(tr("Loading..."));

				$.getJSON(
					$.service("plugin", "list_edit"),
					{
						body: $textarea.val()
					},
					function (data) {
						try {
							if (data) {
								$textarea.hide();
								$ul.empty().show();
								$(".gui-only", $toolbar)
									.prop("disabled", false)
									.css("opacity", 1);

								gui.current = data.current;
								gui.plugins = data.plugins;
								gui.fields = data.fields;
								gui.fields.formatted = [];
								gui.trackers = data.trackers;

								for (var p = 0; p < gui.current.length; p++) {	// check for format names and add to fields
									if (gui.current[p].name === "format" && typeof gui.current[p].params.name !== "undefined") {
										gui.fields.formatted.push(gui.current[p].params.name);
									}
								}

								for (p = 0; p < gui.current.length; p++) {
									$ul.append(
										gui.addPlugin(gui.current[p])
									);
								}

								if (jqueryTiki.chosen) {
									gui.$editor.find("select").trigger("chosen:updated");
								}

								$toolbar.replaceWith(buildMainToolbar()).applyChosen();
								$textarea.tikiModal();
							}
						}
						catch (e) {
							console.error(e);
							$ul.empty().hide();
							$toolbar.hide();
							$textarea
								.tikiModal()
								.show()
								.showError(tr("List plugin syntax is currently not compatible with the GUI, so source editing only is available."));
						}
					}
				);

			};

			$ul.nestedSortable(gui.sortableOptions);

			$textarea
				.before(gui.$editor)
				.parents("form:first")
				.submit(function () {
					return $textarea.is(":visible") || gui.saveToTextarea();
				});

			showGui();
		},

		/**
		 * Convert the current state of the GUI into plugin markup in the content textarea
		 */
		saveToTextarea: function () {
			var $ul = this.$editor.find(".plugin-list-gui"), currentPlugins, markup = "";

			var findPlugins = function ($element, parentPluginName) {
					parentPluginName = parentPluginName || "";

					var plugins = [];

					$element.find(".plugin").each(function () {
						var body,
							$plugin = $(this),
							pluginName = $plugin.data("name"),
							params = {};

						if ($plugin.is(".done")) {
							return plugins;
						}

						$plugin.find("> .params .input-group").each(function () {
							var $param = $(this),
								paramName = $param.find(".param-name > span").text();

							params[paramName] = $param.find("> select, > input").val();
						});

						$plugin.addClass("done");

						if (pluginName === "wiki text") {
							body = $plugin.find("textarea").val();
						} else {
							body = "";
						}

						plugins.push({
							name: pluginName,
							params: params,
							body: body,
							plugins: findPlugins($plugin, pluginName),
							parent: parentPluginName
						});

					});

					return plugins;
				},
				getSyntax = function (plugin, indent, noLineFeeds) {
					indent = indent && !noLineFeeds ? indent : "  ";
					noLineFeeds = noLineFeeds || false;
					var name = plugin.plugins.length ? plugin.name.toUpperCase() : plugin.name;
					var output = "\n\n";

					if (name === "wiki text") {
						output = plugin.body;
					} else {
						output = indent + "{" + name + (plugin.plugins.length ? "(" : "");

						for (var param in plugin.params) {
							if (plugin.params.hasOwnProperty(param)) {
								output += " " + param + "=\"" + plugin.params[param] + "\"";
							}
						}
						output += (plugin.plugins.length ? ")" : "") + "}";
						if (!noLineFeeds) {
							output += "\n";
						}

						for (var i = 0; i < plugin.plugins.length; i++) {
							output += getSyntax(plugin.plugins[i], indent + "  ", name === "OUTPUT" && !plugin.params.template);
						}
						if (plugin.plugins.length) {
							output += "{" + name + "}\n"
						}
					}
					return output;
				};


			currentPlugins = findPlugins($ul);

			for (var i = 0; i < currentPlugins.length; i++) {
				markup += getSyntax(currentPlugins[i]);
			}

			this.$editor.parent().find("textarea[name=content]").val(markup);

			return true;
		},

		/**
		 * Add the visual representation of a plugin
		 *
		 * @param plugin Object          plugin to add
		 * @param parentPath string      location of the enclosing plugin
		 * @return $li jQuery            list item representing the plugin
		 */
		addPlugin: function (plugin, parentPath) {


			var gui = this,
				pluginName = plugin.name,
				paramsDef = gui.plugins[pluginName] ? gui.plugins[pluginName].params : null,
				parentPlugin;

			parentPath = parentPath || "";

			parentPlugin = gui.getPlugin(parentPath);

			if (typeof plugin === 'string') {			// from current plugins
				pluginName = tr("wiki text");
				plugin = plugin.replace(/^\s*[\r\n]/, "");	// strip off initial blank line

				if (!$.trim(plugin)) {
					return null;
				}
			} else if (pluginName === "wiki text") {	// from the toolbar
				plugin = "";
			} else if (!paramsDef && parentPlugin.params) {
				paramsDef = parentPlugin.params;
			}

			if (!paramsDef && typeof plugin !== 'string') {
				console.log("addPlugin error: " + pluginName + "->" + parentPlugin.name + " not found");
				return null;
			}

			var $li = $("<li>")
				.addClass("plugin inline-form card")
				.data("name", pluginName)
				.append(
					$("<div>")
						.addClass("card-header d-flex justify-content-between mb-3")
						.append(
							$("<div>")
								.addClass("d-flex")
								.append($("<div>").addClass("name")
									.text(pluginName))
							,
							$("<a>")
								.addClass("close small text-danger")
								.html("&times;")
								.click(function () {
									$(this).parents("li:first").remove();
								})
						)
				);

			if (pluginName !== "output" && pluginName !== "format") {
				$li.addClass("no-nesting");
			} else {
				$li.find(".card-header > div:first").append(
					$("<div>").addClass("btn-toolbar").append(
						gui.buildToolBar(gui.plugins, pluginName, "", function () {
							if ($(this).data("plugin")) {
								var params = [];
								if ($(this).data("value")) {
									params[$(this).data("value")] = "";
								}
								$ul.append(
									gui.addPlugin({
										name: $(this).data("plugin"),
										params: params,
										plugins: []
									})
								).nestedSortable(gui.sortableOptions);

								return false;
							}
							$(".dropdown-menu", $tb).hide();
						})
					)
				);
			}

			if (pluginName === "wiki text") {
				$li.append(
					$("<div>")
						.addClass("params card-body row")
						.append(
							$("<textarea>")
								.addClass("form-control")
								.val(typeof plugin === "string" ? plugin : "")
						)
				);
				return $li;
			}

			var $paramsDivs = $("<div>").addClass("params card-body d-flex flex-wrap"),
				value = "", otherParams = [];

			for (var paramName in plugin.params) {
				if (plugin.params.hasOwnProperty(paramName)) {

					value = plugin.params[paramName];

					if (plugin.params) {
						otherParams = plugin.params;
					} else if (paramsDef[paramName] && paramsDef[paramName].params) {
						otherParams = paramsDef[paramName].params;
					}
					$paramsDivs.append(this.buildParam(pluginName, paramName, value, parentPath, otherParams));
				}
			}
			// would be nice to move the extra params dropdown to the card header TODO
			$li.find(".card-header > div:first").append($paramsDivs.find(".btn-group").detach());

			$li.append($paramsDivs);

			var $ul = $("<ul>");

			if (plugin.plugins && plugin.plugins.length) {

				parentPath += "/" + plugin.name;

				// note Object.values does not exist in IE/Edge but Object.keys does
				if (plugin.params && Object.keys(plugin.params).length) {
					parentPath += "/" + Object.keys(plugin.params)[0];
					parentPath += "/" + plugin.params[Object.keys(plugin.params)[0]];
				}

				for (var i = 0; i < plugin.plugins.length; i++) {
					$ul.append(
						gui.addPlugin(
							plugin.plugins[i],
							parentPath + (plugin.plugins[i].name ? "/" + plugin.plugins[i].name : "")
						)
					);
				}
			}

			$ul.appendTo($li);

			return $li;
		},

		/**
		 *
		 * @param path string     path of plugin to find, e.g. output/template/table/column
		 *
		 * @return Object         the plugin
		 */
		getPlugin: function (path) {
			if (!path) {
				return {};
			}

			var parts = path.split("/"),
				plugin = this.plugins, pluginOrParam = plugin;

			for (var i = 0; i < parts.length; i++) {
				if (parts[i]) {
					if (typeof  pluginOrParam[parts[i]] !== "undefined") {
						pluginOrParam = pluginOrParam[parts[i]];
						plugin = pluginOrParam;
					} else if (pluginOrParam.plugins && typeof pluginOrParam.plugins[parts[i]] !== "undefined") {
						pluginOrParam = pluginOrParam.plugins[parts[i]];
						plugin = pluginOrParam;
					} else if (pluginOrParam.params && typeof pluginOrParam.params[parts[i]] !== "undefined") {
						pluginOrParam = pluginOrParam.params[parts[i]];
					} else if (pluginOrParam.options && typeof pluginOrParam.options[parts[i]] !== "undefined") {
						pluginOrParam = pluginOrParam.options[parts[i]];
					}
				}
			}

			return plugin;
		},

		/**
		 * Create the div representing the parameter to attach to the plugin li element
		 *
		 * @param pluginName String
		 * @param paramName String
		 * @param value String
		 * @param parentPath String
		 * @param otherParams Object
		 * @return {*|jQuery}
		 */
		buildParam: function (pluginName, paramName, value, parentPath, otherParams) {
			var paramDef, gui = this, $input, $moreParamsDropDown = "";

			if (paramName === "empty") {	// dummy parameter for output etc
				return;
			}

			if (paramName === "*") {	// wildcard for wikiplugins - TODO better
				paramName = prompt("Enter wikiplugin parameter name");
			}

			value = value || "";
			parentPath = parentPath || "";
			otherParams = otherParams || {};

			var parentPlugin = gui.getPlugin(parentPath);

			if (gui.plugins[pluginName] && typeof gui.plugins[pluginName].params[paramName] !== "undefined") {
				// simple case first, e.g. filter.content
				paramDef = this.plugins[pluginName].params[paramName];
			}
			if (!paramDef && parentPlugin && parentPlugin.params) {
				// nested output/column etc plugins e.g. format.display.name
				if (parentPlugin.params) {
					paramDef = parentPlugin.params[paramName];
				} else {
					paramDef = parentPlugin.plugins[pluginName].params[paramName];
				}
			}
			if (!paramDef && otherParams) {
				// for params dependent on others, like filter.lat with filter.distance or display.singleList with display.categorylist
				for (var otherParam in otherParams) {
					if (otherParams.hasOwnProperty(otherParam)) {
						if (otherParam === paramName) {

							paramDef = otherParams[otherParam];
							break;

						}
					}
				}
			}

			if (!paramDef) {
				console.log("Warning: param " + paramName + " not found in plugin " + pluginName);
				paramDef = {};
			}

			paramDef.name = paramName;
			var path = parentPath + "/" + pluginName + "/" + paramName;

			if (paramDef.options) {			// select
				var list = gui.arrayKeys(paramDef.options);
				if (pluginName === "output" && paramName === "template" && value &&
					($.inArray(value, list) === -1 || value === "input")) {

					$input = $("<input>")
						.addClass("param-value form-control")
						.val(value === "input" ? "" : value);
				} else {
					$input = gui.buildSelector(
						list,
						value,
						path
					);
				}
			} else {
				switch (paramDef.type) {
					case "object_type":
						gui.objectType = value;
						$input = gui.objectTypesSelector(value);
						break;

					case "field":
						if (otherParams.format && otherParams.format === "wikiplugin") {
							gui.trackerId = otherParams.content || otherParams.exact;
							$input = gui.pluginsSelector(value);
						} else {
							if (value === "tracker_id") {
								gui.trackerId = otherParams.content || otherParams.exact;
							}
							$input = gui.fieldsSelector(value);
						}
						break;

					case "number":
						$input = $("<input>")
							.attr("type", "number")
							.attr("step", paramDef.step ? paramDef.step : 1)
							.addClass("param-value form-control")
							.val(value);
						break;

					default:	// text
						$input = $("<input>")
							.addClass("param-value form-control")
							.val(value);

				}
			}

			$input.change(function () {	// add param specific toolbar
				if ($input.is("select") && paramDef.options && $input.val() && paramDef.options[$input.val()].plugins) {
					$input.parents(".plugin").find(".btn-toolbar").empty().append(
						gui.buildToolBar(paramDef.options[$input.val()].plugins, pluginName, path + "/" + $input.val(), function () {
							if ($(this).data("plugin")) {
								var params = [];
								if ($(this).data("value")) {
									params[$(this).data("value")] = "";
								}

								$(this).parents(".plugin").find("> ul").append(
									gui.addPlugin({
										name: $(this).data("plugin"),
										params: params,
										plugins: []
									}, $(this).data("path"))
								).nestedSortable(gui.sortableOptions);

								return false;
							}
							$(".dropdown-menu", $tb).hide();
						})
					);
				}
			});

			// quick fix to get extra params for format options
			if (paramName === "format" && this.plugins.display.params.name.params.format.options[value]) {
				paramDef = this.plugins.display.params.name.params.format.options[value]
			}

			if (paramDef.params) {	// extra params

				$input.data("params", gui.arrayKeys(paramDef.params));
				$moreParamsDropDown = this.buildDropDown(
					gui.arrayKeys(paramDef.params),
					tr("Parameters"),
					function () {
						var otherParams = paramDef.params;
						$input.parents(".params").append(
							gui.buildParam(pluginName, $(this).data("value"), "", path, otherParams)
						);
					}
				);
			}

			if (value) {
				setTimeout(function () {
					$input.change();
				}, 100);
			}

			return $("<div class='col-md-6'>")
				.append(
					$moreParamsDropDown,
					$("<div class='input-group input-group-sm mb-2'>")
						.append(
							$("<div class='param-name input-group-prepend'>")
								.append(
									$("<span class='input-group-text'>").text(paramName)
								),
							$input,
							$("<div class='input-group-append'>")
								.append(
									$("<a class='input-group-text text-danger'>")
										.html("&times;")
										.click(function () {
											$(this).parents(".input-group").remove();
										})
								)
						)
				);

		},

		arrayKeys: function (object) {
			var list = [];

			for (var key in object) {
				if (object.hasOwnProperty(key)) {
					list.push(key);
				}
			}
			return list;
		},

		objectTypesSelector: function (value) {

			var gui = this;

			return this.buildSelector(
				this.arrayKeys(this.fields.object_types),
				value,
				"",
				function () {
					gui.objectType = $(this).val();
				}
			);
		},
		pluginsSelector: function (value) {

			return $("<input>")
				.addClass("param-value form-control")
				.val(value);
		},
		paramsSelector: function (value) {

			return this.buildSelector(
				this.arrayKeys(this.plugins[value]),
				''
			);
		},
		fieldsSelector: function (value) {
			var i, fields;
			if (this.objectType && this.fields.object_types.hasOwnProperty(this.objectType)) {
				fields = this.fields.object_types[this.objectType];
				if (this.trackerId && this.trackers[this.trackerId]) {
					var generalFields = [], myTrackerFields = [], otherTrackerFields = [];
					for (i in fields) {	// N.B. although fields.object_types are arrays here they appear as objects
						if (fields.hasOwnProperty(i)) {
							if (fields[i].indexOf("tracker_field_") === 0) {
								if ($.inArray(fields[i], this.trackers[this.trackerId]) > -1) {
									myTrackerFields.push(fields[i]);
								} else {
									otherTrackerFields.push(fields[i]);
								}
							} else {
								generalFields.push(fields[i]);
							}
						}
					}
					fields = generalFields;
					fields.push("--");
					fields = fields.concat(myTrackerFields);
					fields.push("--");
					fields = fields.concat(otherTrackerFields);
				} else {
					var fieldsArray = [];
					for (i in fields) {	// convert object to an array
						if (fields.hasOwnProperty(i)) {
							fieldsArray.push(fields[i]);
						}
					}
					fields = fieldsArray;
				}
			} else {
				for (var type in this.fields.object_types) {
					if (this.fields.object_types.hasOwnProperty(type)) {
						if ($.inArray(value, this.fields.object_types[type]) > -1) {
							this.objectType = type;
							fields = this.fields.object_types[type];
						}
					}
				}
			}

			if (fields) {
				fields.push("--");	// separator before globals if object specific fields are found
			} else {
				fields = [];
			}

			// always add globals
			for (i = 0; i < this.fields.global.length; i++) {
				if ($.inArray(this.fields.global[i], fields) < 0) {
					fields.push(this.fields.global[i]);
				}
			}

			if (this.fields.formatted) {
				fields = fields.concat(this.fields.formatted);
			}

			return this.buildSelector(fields, value);
		},
		buildSelector: function (list, value, parentPath, changeFunction) {

			parentPath = parentPath || "";

			var $select = $("<select>")
				.addClass("form-control nochosen");

			$select.append(
				$("<option>").val("").text("")
			);

			for (var item in list) {
				if (list.hasOwnProperty(item)) {
					if (list[item] !== "--") {
						$select.append(
							$("<option>")
								.val(list[item])
								.text(tr(list[item]))
								.prop("selected", list[item] === value)
								.data("path", parentPath + "/" + list[item])
						);
					} else {
						$select.append("<option disabled>──────────</option>");
					}
				}
			}

			if (changeFunction) {
				$select.change(changeFunction);
			}

			return $select;
		},
		buildDropDown: function (list, title, clickFunction, icon, plugin, parentPath) {
			if (!list.length) {
				return "";
			}

			icon = icon || "plus";
			title = title || tr("Add");
			clickFunction = clickFunction || function () {
			};
			plugin = plugin || "";
			parentPath = parentPath || "";

			var $div = $("<div>")
					.addClass("btn-group")
					.append(
						$("<a>")
							.addClass("btn btn-link dropdown-toggle btn-sm")
							.data("toggle", "dropdown")
							.attr("title", tr("Add") + " " + title)
							.attr("href", "#")
							.append(
								title,
								$("<span>").getIcon(icon).addClass("pl-2")
							)
					),
				$ul = $("<div>")
					.addClass("dropdown-menu")
					.appendTo($div)
					.append(
						$("<div>")
							.addClass("dropdown-header")
							.text(title)
					);

			for (var item in list) {
				if (list.hasOwnProperty(item)) {
					$ul.append(
						$("<a>")
							.addClass("dropdown-item")
							.data("value", list[item])
							.data("plugin", plugin)
							.data("path", parentPath + "/" + plugin + "/" + list[item])
							.text(tr(list[item]))
					);
				}
			}

			$(".dropdown-toggle", $div).dropdown();
			$div.find(".dropdown-menu a").click(function () {
				clickFunction.call(this);
				$(".dropdown-menu", $div).removeClass('show');
			});
			$(".dropdown-menu", $div).mouseleave(function () {
				$(".dropdown-menu", $div).removeClass('show');
			});

			return $div;
		},
		buildToolBar: function (plugins, parent, parentPath, clickFunction) {
			if (!plugins) {
				return "";
			}

			parent = parent || "";
			parentPath = parentPath || "";

			clickFunction = clickFunction || function () {
			};

			var $div = $("<div>").addClass("btn-group");

			for (var plugin in plugins) {
				if (plugins.hasOwnProperty(plugin) && plugins[plugin].icon &&
					((!parent && !plugins[plugin].parents) || (parent && $.inArray(parent, plugins[plugin].parents) > -1))
				) {
					$div.append(
						this.buildDropDown(
							this.arrayKeys(plugins[plugin].params),
							plugin,
							clickFunction,
							plugins[plugin].icon,
							plugin,
							parentPath
						)
					);
				}
			}

			return $div;
		}

	};

});

