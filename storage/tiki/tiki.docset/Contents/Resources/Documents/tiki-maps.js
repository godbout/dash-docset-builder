(function () {
	var mapNumber = 0, currentProtocol = document.location.protocol;

	if (currentProtocol != 'http:' && currentProtocol != 'https:') {
		currentProtocol = 'https:';
	}

	function delayedExecutor(delay, callback)
	{
		var timeout;

		return function () {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}

			timeout = setTimeout(callback, delay);
		};
	}

	function getBaseLayers()
	{
		var layers = [], tiles = jqueryTiki.mapTileSets, factories = {
			openstreetmap: function () {
				return new OpenLayers.Layer.OSM();
			},
			mapquest_street: function () {
				return new OpenLayers.Layer.XYZ(
					"MapQuest OpenStreetMap",
					"http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png",
					{sphericalMercator: true}
				);
			},
			mapquest_aerial: function () {
				return new OpenLayers.Layer.XYZ(
					"MapQuest Open Aerial",
					"http://oatile1.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png",
					{sphericalMercator: true}
				);
			},
			google_street: function () {
				if (typeof google !== "undefined") {
					return new OpenLayers.Layer.Google(
						"Google Streets",
						{numZoomLevels: 20}
					);
				} else {
					return null;
				}
			},
			google_satellite: function () {
				if (typeof google !== "undefined") {
					return new OpenLayers.Layer.Google(
						"Google Satellite",
						{type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
					);
				} else {
					return null;
				}
			},
			google_hybrid: function () {
				if (typeof google !== "undefined") {
					return new OpenLayers.Layer.Google(
						"Google Hybrid",
						{type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20}
					);
				}
			},
			google_physical: function () {
				if (typeof google !== "undefined") {
					return new OpenLayers.Layer.Google(
						"Google Physical",
						{type: google.maps.MapTypeId.TERRAIN}
					);
				} else {
					return null;
				}
			},
			blank: function () {
				// Fake layer to hide all tiles
				var layer = new OpenLayers.Layer.OSM(tr('Blank'));
				layer.isBlank = true;
				return layer;
			/* Needs additional testing
			},
			visualearth_road: function () {
				return new OpenLayers.Layer.VirtualEarth(
					"Virtual Earth Roads",
					{'type': VEMapStyle.Road}
				);
			*/
			}
		};

		if (tiles.length === 0) {
			tiles.push('openstreetmap');
		}

		$.each(tiles, function (k, name) {
			var f = factories[name];

			if (f) {
				layers.push(f());
			}
		});

		return layers;
	}

	function parseCoordinates(value) {
		var matching = value.match(/^(-?[0-9]*(\.[0-9]+)?),(-?[0-9]*(\.[0-9]+)?)(,(.*))?$/);

		if (matching) {
			var lat = parseFloat(matching[3]);
			var lon = parseFloat(matching[1]);
			var zoom = matching[6] ? parseInt(matching[6], 10) : 0;

			return {lat: lat, lon: lon, zoom: zoom};
		}

		return null;
	}

	function writeCoordinates(lonlat, map, fixProjection) {
		var original = lonlat;

		if (fixProjection) {
			lonlat = lonlat.transform(
				map.getProjectionObject(),
				new OpenLayers.Projection("EPSG:4326")
			);

			if (lonlat.lon < 0.01 && lonlat.lat < 0.01) {
				lonlat = original;
			}
		}

		return formatLocation(lonlat.lat, lonlat.lon, map.getZoom());
	}

	function formatLocation (lat, lon, zoom)
	{
		// Convert , decimal points - where those are used
		var strLon = '' + lon;
		strLon.replace(',', '.');
		var strLat = '' + lat;
		strLat.replace(',', '.');
		return strLon + ',' + strLat + ',' + zoom;
	}

	$.fn.createMap = function () {
		this.each(function () {
			var id = $(this).attr('id'), container = this, desiredControls;
			$(container).css('background', 'white');
			desiredControls = $(this).data('map-controls');
			if (desiredControls === undefined) {
				desiredControls = 'controls,layers,search_location,current_location,streetview,navigation';
			}

			desiredControls = desiredControls.split(',');

			var setupHeight = function () {
				var height = $(container).height();
				if (0 === height) {
					height = $(container).width() / 4.0 * 3.0;
				}

				$(container).closest('.height-size').each(function () {
					height = $(this).data('available-height');
					$(this).css('padding', 0);
					$(this).css('margin', 0);
				});

				$(container).height(height);
			};
			setupHeight();

			$(window).resize(setupHeight);

			if (! id) {
				++mapNumber;
				id = 'openlayers' + mapNumber;
				$(this).attr('id', id);
			}

			setTimeout(function () {
				OpenLayers.ImgPath = "lib/openlayers/theme/dark/";
				var map = container.map = new OpenLayers.Map(id, {
					controls: [],
					theme: null
				});
				var layers = getBaseLayers();

				// these functions attempt to retrieve values for the style attributes,
				// falling back to others if not all options are specified
				// e.g. if "select-fill-color" is not provided it will use "fill-color", or just "color" attributes

				var getColor = function (feature, intent, type) {
					return feature.attributes[intent + "-" + type + "-color"] ||
						feature.attributes[intent + "-color"] ||
						feature.attributes[type + "-color"] ||
						feature.attributes["color"] ||
						"#6699cc";
				};

				var getStyleAttribute = function (feature, intent, type, def) {
					return feature.attributes[intent + "-" + type] ||
						feature.attributes[type] ||
						def;
				};

				container.defaultStyleMap = new OpenLayers.StyleMap({
					"default": new OpenLayers.Style(OpenLayers.Util.applyDefaults({
						cursor: "pointer"
					}, OpenLayers.Feature.Vector.style['default']), {
						context: {
							getFillColor: function (feature) {
								return getColor(feature, "default", "fill");
							},
							getStrokeColor: function (feature) {
								return getColor(feature, "default", "stroke");
							},
							getStrokeWidth: function (feature) {
								return getStyleAttribute(feature, "default", "stroke-width", 3);
							},
							getStrokeDashstyle: function (feature) {
								return getStyleAttribute(feature, "default", "stroke-dashstyle", "solid");
							},
							getPointRadius: function (feature) {
								return getStyleAttribute(feature, "default", "point-radius", 5);
							},
							getFillOpacity: function (feature) {
								return getStyleAttribute(feature, "default", "fill-opacity", 0.5);
							},
							getStrokeOpacity: function (feature) {
								return getStyleAttribute(feature, "default", "stroke-opacity", 0.9);
							}
						}
					}),
					"select": new OpenLayers.Style(OpenLayers.Util.applyDefaults({
						cursor: "pointer"
					}, OpenLayers.Feature.Vector.style['select']), {
						context: {
							getFillColor: function (feature) {
								return getColor(feature, "select", "fill");
							},
							getStrokeColor: function (feature) {
								return getColor(feature, "select", "stroke");
							},
							getStrokeWidth: function (feature) {
								return getStyleAttribute(feature, "select", "stroke-width", 3);
							},
							getStrokeDashstyle: function (feature) {
								return getStyleAttribute(feature, "select", "stroke-dashstyle", "solid");
							},
							getPointRadius: function (feature) {
								return getStyleAttribute(feature, "select", "point-radius", 5);
							},
							getFillOpacity: function (feature) {
								return getStyleAttribute(feature, "select", "fill-opacity", 0.9);
							},
							getStrokeOpacity: function (feature) {
								return getStyleAttribute(feature, "select", "stroke-opacity", 0.9);
							}
						}
					}),
					"temporary": new OpenLayers.Style(OpenLayers.Util.applyDefaults({
						cursor: "pointer"
					}, OpenLayers.Feature.Vector.style['temporary']), {
						context: {
							getFillColor: function (feature) {
								return getColor(feature, "temporary", "fill");
							},
							getStrokeColor: function (feature) {
								return getColor(feature, "temporary", "stroke");
							},
							getStrokeWidth: function (feature) {
								return getStyleAttribute(feature, "temporary", "stroke-width", 4);
							},
							getStrokeDashstyle: function (feature) {
								return getStyleAttribute(feature, "temporary", "stroke-dashstyle", "solid");
							},
							getPointRadius: function (feature) {
								return getStyleAttribute(feature, "temporary", "point-radius", 5);
							},
							getFillOpacity: function (feature) {
								return getStyleAttribute(feature, "temporary", "fill-opacity", 0.3);
							},
							getStrokeOpacity: function (feature) {
								return getStyleAttribute(feature, "temporary", "stroke-opacity", 0.9);
							}
						}
					}),
					"vertex": new OpenLayers.Style(OpenLayers.Util.applyDefaults({
						fillColor: "#6699cc",
						strokeColor: "#6699cc",
						pointRadius: 5,
						fillOpacity: ".7",
						strokeDashstyle: "solid"
					}, OpenLayers.Feature.Vector.style['temporary']))
				});

				var markerStyle = {
					externalGraphic: "${url}",
					graphicWidth: "${width}",
					graphicHeight: "${height}",
					graphicXOffset: "${offsetx}",
					graphicYOffset: "${offsety}",
					graphicOpacity: typeof window.chrome === "undefined" ? 0.9 : 1
					// Google Chrome v34 makes some markers invisible if not 100% opaque
				}, vectorStyle = {
					fillColor: "${getFillColor}",
					strokeColor: "${getStrokeColor}",
					strokeDashstyle: "${getStrokeDashstyle}",
					strokeWidth: "${getStrokeWidth}",
					pointRadius: "${getPointRadius}",
					fillOpacity: "${getFillOpacity}",
					strokeOpacity: "${getStrokeOpacity}"
				};

				container.defaultStyleMap.addUniqueValueRules("default", "intent", {
					"marker": markerStyle, "vectors": vectorStyle
				});

				container.defaultStyleMap.addUniqueValueRules("select", "intent", {
					"marker": markerStyle, "vectors": vectorStyle
				});

				container.defaultStyleMap.addUniqueValueRules("temporary", "intent", {
					"marker": markerStyle, "vectors": vectorStyle
				});

				container.layer = layers[0];
				container.vectors = new OpenLayers.Layer.Vector(tr("Editable"), {
					styleMap: container.defaultStyleMap
				});
				container.uniqueMarkers = {};
				container.layers = {};
				try {
					map.addLayers(layers);
					map.addLayer(container.vectors);
				} catch (e) {
					console.log("Map error: problem adding layer " + e.message);
				}

				container.resetPosition = function () {
					map.setCenter(new OpenLayers.LonLat(0, 0), 3);
				};
				container.resetPosition();

				function setupLayerEvents(vectors) {
					vectors.events.on({
						featureunselected: function (event) {
							if (event.feature.executor) {
								event.feature.executor();
							}
							$(container).setMapPopup(null);
						},
						featuremodified: function (event) {
							if (event.feature.executor) {
								event.feature.executor();
							}
						},
						beforefeatureadded: function (event) {
							if (! event.feature.attributes.color) {
								event.feature.attributes.color = '#6699cc';
							}
							if (! event.feature.attributes.intent) {
								event.feature.attributes.intent = "vectors";
							}
						}
					});
				}

				setupLayerEvents(container.vectors);

				container.modeManager = {
					modes: [],
					activeMode: null,
					addMode: function (options) {
						var mode = $.extend({
							name: tr('Default'),
							icon: null,
							events: {
								activate: [],
								deactivate: []
							},
							controls: [],
							layers: []
						}, options);

						$.each(mode.layers, function (k, layer) {
							layer.displayInLayerSwitcher = false;
							layer.setVisibility(false);
							map.addLayer(layer);
						});

						$.each(mode.controls, function (k, control) {
							control.autoActivate = false;
							map.addControl(control);
						});

						this.modes.push(mode);

						this.register('activate', mode.name, mode.activate);
						this.register('deactivate', mode.name, mode.deactivate);

						if (! this.activeMode) {
							this.activate(mode);
						}

						$(container).trigger('modechanged');

						return mode;
					},
					switchTo: function (modeName) {
						var manager = this;
						$.each(this.modes, function (k, mode) {
							if (mode.name === modeName) {
								manager.activate(mode);
							}
						});
					},
					register: function (eventName, modeName, callback) {
						$.each(this.modes, function (k, mode) {
							if (mode.name === modeName && callback) {
								mode.events[eventName].push(callback);
							}
						});
					},
					activate: function (mode) {
						if (this.activeMode) {
							this.deactivate();
						}

						this.activeMode = mode;

						$.each(mode.controls, function (k, control) {
							control.activate();
						});
						$.each(mode.layers, function (k, layer) {
							layer.setVisibility(true);
						});
						$.each(mode.events.activate, function (k, f) {
							f.apply([], container);
						});

						$(container).trigger('modechanged');
					},
					deactivate: function () {
						if (! this.activeMode) {
							return;
						}

						$.each(this.activeMode.controls, function (k, control) {
							control.deactivate();
						});
						$.each(this.activeMode.layers, function (k, layer) {
							layer.setVisibility(false);
						});
						$.each(this.activeMode.events.deactivate, function (k, f) {
							f.apply([], container);
						});

						this.activeMode = null;
					}
				};

				var defaultMode = {
					controls: []
				};

				map.addControl(new OpenLayers.Control.Attribution());

				if (-1 !== $.inArray('coordinates', desiredControls)) {
					map.addControl(new OpenLayers.Control.MousePosition({
						displayProjection: new OpenLayers.Projection("EPSG:4326")
					}));
				}

				if (layers.length > 0 && -1 !== $.inArray('scale', desiredControls)) {
					map.addControl(new OpenLayers.Control.ScaleLine());
				}

				if (layers.length > 0 && -1 !== $.inArray('navigation', desiredControls)) {
					defaultMode.controls.push(new OpenLayers.Control.NavToolbar());
				}

				if (layers.length > 0 && -1 !== $.inArray('controls', desiredControls)) {
					if (-1 !== $.inArray('levels', desiredControls)) {
						map.addControl(new OpenLayers.Control.PanZoomBar());
					} else {
						map.addControl(new OpenLayers.Control.PanZoom());
					}
				}

				if (layers.length > 1 && -1 !== $.inArray('layers', desiredControls)) {
					map.addControl(new OpenLayers.Control.LayerSwitcher());
				}

				var highlightControl, selectControl, vectorLayerList = [container.vectors];

				if ($(container).data("tooltips")) {
					defaultMode.controls.push(highlightControl = new OpenLayers.Control.SelectFeature(vectorLayerList, {
						hover: true,
						highlightOnly: true,
						renderIntent: "temporary",
						clickout: true,
						eventListeners: {
							beforefeaturehighlighted: null,
							featurehighlighted: function (evt) {

								if (container.tooltipPopup) {
									map.removePopup(container.tooltipPopup);
									container.tooltipPopup = null;
								}

								if (evt.feature.layer.selectedFeatures.indexOf(evt.feature) > -1) {
									return;
								}

								var lonlat = map.getLonLatFromPixel(
									// get mouse position
									this.handlers.feature.evt.xy
								);
								var popup = new OpenLayers.Popup.Anchored(
									'myPopup',
									lonlat,
									new OpenLayers.Size(150, 18),
									"<small>" + evt.feature.attributes.content + "</small>",
									{size: {w: 14, h: 14}, offset: {x: -7, y: -7}},
									false
								);
								container.tooltipPopup = popup;
								popup.autoSize = true;
								popup.updateSize();
								map.addPopup(popup);
							},
							featureunhighlighted: function (evt) {
								if (container.tooltipPopup) {
									map.removePopup(container.tooltipPopup);
									container.tooltipPopup = null;
								}
							}
						}
					}));
				}

				defaultMode.controls.push(selectControl = new OpenLayers.Control.SelectFeature(vectorLayerList, {
					onSelect: function (feature) {
						if (container.tooltipPopup) {
							map.removePopup(container.tooltipPopup);
							container.tooltipPopup = null;
						}
						if (feature.attributes.url === container.markerIcons.loadedMarker["default"].url) {
							feature.attributes.url = container.markerIcons.loadedMarker.selection.url;
							feature.layer.redraw();
						}
						var type = feature.attributes.type
							, object = feature.attributes.object
							, lonlat = feature.geometry.getBounds().getCenterLonLat()
							, loaded = false
							;

						if (feature.attributes.itemId) {
							type = 'trackeritem';
							object = feature.attributes.itemId;
						}

						if (type && object) {
							loaded = $(container).loadInfoboxPopup({
								type: type,
								object: object,
								lonlat: lonlat,
								content: feature.attributes.content,
								close: function () {
									selectControl.unselect(feature);
								},
								feature: feature
							});
						}

						if (! loaded && feature.attributes.content) {
							var popup = new OpenLayers.Popup.FramedCloud('feature', lonlat, null, feature.attributes.content, null, true, function () {
								$(container).setMapPopup(null);
							});
							popup.autoSize = true;

							$(container).setMapPopup(popup);
						}

						if (feature.clickHandler) {
							feature.clickHandler();
						}
					},
					onUnselect: function (feature) {
						if (feature.attributes.url === container.markerIcons.loadedMarker.selection.url) {
							feature.attributes.url = container.markerIcons.loadedMarker["default"].url;
							feature.layer.redraw();
						}
					}
				}));

				if (layers.length > 0 && -1 !== $.inArray('overview', desiredControls)) {
					var overview = new OpenLayers.Control.OverviewMap({minRatio: 128, maxRatio: 256, maximized: true});
					overview.desiredZoom = function () {
						return Math.min(Math.max(1, map.getZoom() - 6), 3);
					};
					overview.isSuitableOverview = function() {
						return this.ovmap.getZoom() === overview.desiredZoom() && this.ovmap.getExtent().contains(map.getExtent());
					};
					overview.updateOverview = function() {
						overview.ovmap.setCenter(map.getCenter());
						overview.ovmap.zoomTo(overview.desiredZoom());
						this.updateRectToMap();
					};

					map.addControl(overview);
				}

				container.markerIcons = {
					loadedMarker: {},
					actionQueue: {},
					loadingMarker: [],
					loadMarker: function (name, src) {
						this.loadingMarker.push(name);
						this.actionQueue[name] = [];

						var img = new Image(), me = this;
						img.onload = function () {
							var width = this.width, height = this.height, action;
							me.loadedMarker[name] = {
								intent: 'marker',
								url: src,
								width: width,
								height: height,
								offsetx: - width / 2,
								offsety: - height
							};

							while (action = me.actionQueue[name].pop()) {
								action();
							}
						};
						$(img).on("error", function () {
							console.log("Map error loading marker image " + src);
							var index = container.markerIcons.loadingMarker.indexOf(src), action;
							if (index > -1) {
								container.markerIcons.loadingMarker.splice(index, 1);
							}
							while (action = me.actionQueue[name].pop()) {
								action();
							}
						});
						img.src = src;
					},
					createMarker: function (name, lonlat, callback) {
						if (this.loadedMarker[name]) {
							this._createMarker(name, lonlat, callback);
							return;
						}

						if (-1 === $.inArray(name, this.loadingMarker)) {
							this.loadMarker(name, name);
						}

						var me = this;
						this.actionQueue[name].push(function () {
							me._createMarker(name, lonlat, callback);
						});
					},
					_createMarker: function (name, lonlat, callback) {
						if (lonlat) {
							var properties = $.extend(this.loadedMarker[name] || this.loadedMarker.default, {}), marker;
							marker = new OpenLayers.Feature.Vector(
								new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat),
								properties
							);
							callback(marker);
						}
					}
				};

				container.getLayer = function (name) {
					var vectors;

					if (name) {
						if (! container.layers[name]) {
							vectors = container.layers[name] = new OpenLayers.Layer.Vector(name, {
								styleMap: container.defaultStyleMap,
								rendererOptions: {zIndexing: true}
							});

							container.map.addLayer(vectors);
							vectorLayerList.push(vectors);
							container.map.setLayerZIndex(vectors, vectorLayerList.length * 1000);
							setupLayerEvents(vectors);

							if (highlightControl && highlightControl.active) {
								highlightControl.deactivate();
								highlightControl.activate();
							}
							if (selectControl.active) {
								selectControl.deactivate();
								selectControl.activate();
							}
						}

						return container.layers[name];
					}

					return container.vectors;
				};

				container.clearLayer = function (name) {
					var vectors = container.getLayer(name);

					var toRemove = [];
					$.each(vectors.features, function (k, f) {
						if (f && f.attributes.itemId) {
							toRemove.push(f);
						} else if (f && f.attributes.type && f.attributes.object) {
							toRemove.push(f);
						}
					});
					vectors.removeFeatures(toRemove);
				};

				container.markerIcons.loadMarker('default', 'lib/openlayers/img/marker.svg');
				container.markerIcons.loadMarker('selection', 'lib/openlayers/img/marker-gold.svg');

				if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
					container.toMyLocation = $('<a/>')
						.css('display', 'block')
						.attr('href', '')
						.click(function () {
							navigator.geolocation.getCurrentPosition(function (position) {
								var lonlat = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform(
									new OpenLayers.Projection("EPSG:4326"),
									map.getProjectionObject()
								);

								map.setCenter(lonlat);
								map.zoomToScale(position.coords.accuracy * OpenLayers.INCHES_PER_UNIT.m);

								$(container).addMapMarker({
									lat: position.coords.latitude,
									lon: position.coords.longitude,
									unique: 'selection'
								});
							});
							return false;
						})
						.text(tr('To My Location'));

					if (-1 !== $.inArray('current_location', desiredControls)) {
						$(container).after(container.toMyLocation);
					}
				}

				container.searchLocation = $('<a/>')
					.css('display', 'block')
					.attr('href', '')
					.click(function () {
						var address = prompt(tr('What address are you looking for?'), "");

						$(container).trigger('search', [ { address: address } ]);
						return false;
					})
					.text(tr('Search Location'));

				if (-1 !== $.inArray('search_location', desiredControls)) {
					$(container).after(container.searchLocation);
				}

				var field = $(container).data('target-field');
				var central = null, useMarker = true;

				if (field) {
					field = $($(container).closest('form')[0][field]);

					$(container).setupMapSelection({
						field: field
					});
					var value = field.val();
					central = parseCoordinates(value);

					if (central) { // cope with zoom levels greater than what OSM layer[0] can cope with
						var geLayer;
						if (central.zoom > 19) {
							geLayer = map.getLayersByName("Google Satellite");
						} else if (central.zoom > 18) {
							geLayer = map.getLayersByName("Google Streets");
						}
						if (geLayer) {
							container.layer = geLayer[0];
							map.setBaseLayer(container.layer);
							map.baseLayer.setVisibility(true);
						}
					}
				}

				if ($(container).data('marker-filter')) {
					var filter = $(container).data('marker-filter');
					$(filter).each(function () {
						var lat = $(this).data('geo-lat')
							, lon = $(this).data('geo-lon')
							, zoom = $(this).data('geo-zoom')
							, extent = $(this).data('geo-extent')
							, icon = $(this).data('icon-src')
							, object = $(this).data('object')
							, type = $(this).data('type')
							, content = $(this).clone().data({}).wrap('<span/>').parent().html()
							;

						if (! extent) {
							if ($(this).hasClass('primary') || this.href === document.location.href) {
								central = {lat: lat, lon: lon, zoom: zoom ? zoom : 0};
							} else {
								$(container).addMapMarker({
									type: type,
									object: object,
									lon: lon,
									lat: lat,
									content: content,
									icon: icon ? icon : null
								});
							}
						} else if ($(this).is('img')) {
							var graphic = new OpenLayers.Layer.Image(
								$(this).attr('alt'),
								$(this).attr('src'),
								OpenLayers.Bounds.fromString(extent),
								new OpenLayers.Size($(this).width(), $(this).height())
							);

							graphic.isBaseLayer = false;
							graphic.alwaysInRange = true;
							container.map.addLayer(graphic);
						}
					});
				}

				var provided = $(container).data('geo-center');

				if (provided && !central) {
					central = parseCoordinates(provided);
					useMarker = false;
				}

				if (central) {
					container.resetPosition = function () {
						var lonlat = new OpenLayers.LonLat(central.lon, central.lat).transform(
							new OpenLayers.Projection("EPSG:4326"),
							map.getProjectionObject()
						);

						map.setCenter(lonlat, central.zoom);
					};

					container.resetPosition();

					if (useMarker) {
						var icon = icon = $(container).data('icon-src') || 'selection';
						$(container).addMapMarker({
							lon: central.lon,
							lat: central.lat,
							unique: icon
						});
					}
				}

				container.modeManager.addMode(defaultMode);

				if (jqueryTiki.googleStreetView) {
					container.streetview = {
						buttons: []
					};

					if (jqueryTiki.googleStreetViewOverlay) {
						container.streetview.overlay = new OpenLayers.Layer.XYZ(
							"StreetView Overlay",
							currentProtocol + "//mts1.google.com/vt?hl=en-US&lyrs=svv|cb_client:apiv3&style=40,18&x=${x}&y=${y}&z=${z}",
							{sphericalMercator: true, displayInLayerSwitcher: false}
						);
						container.map.addLayer(container.streetview.overlay);

						container.map.events.on({
							move: function () {
								if (container.streetview.overlay.visibility) {
									container.streetview.overlay.redraw();
								}
							}
						});
					}

					var StreetViewHandler = OpenLayers.Class(OpenLayers.Control, {
						defaultHandlerOptions: {
							'single': true,
							'double': false,
							'pixelTolerance': 0,
							'stopSingle': false,
							'stopDouble': false
						},
						initialize: function(options) {
							this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
							OpenLayers.Control.prototype.initialize.apply(this, arguments);
							this.handler = new OpenLayers.Handler.Click(
								this,
								{
									'click': this.trigger
								},
								this.handlerOptions
							);
						},
						trigger: function(e) {
							var width = 600, height = 500;

							var lonlat = map.getLonLatFromViewPortPx(e.xy).transform(
								map.getProjectionObject(),
								new OpenLayers.Projection("EPSG:4326")
							);

							var canvas = $('<div/>')[0];
							$(canvas)
								.appendTo('body')
								.dialog({
									title: tr('Panorama'),
									width: width,
									height: height + 30,
									modal: true,
									close: function () {
										$(canvas).dialog('destroy');
									},
									buttons: container.streetview.getButtons(canvas)
								});

							canvas.getImageUrl = function () {
								var pov =  canvas.panorama.getPov();
								var pos =  canvas.panorama.getPosition();
								var base = currentProtocol + '//maps.googleapis.com/maps/api/streetview?'
									+ 'size=' + width + 'x' + height + '&'
									+ 'location=' + tiki_encodeURIComponent(pos.toUrlValue()) + '&'
									+ 'heading=' + tiki_encodeURIComponent(pov.heading) + '&'
									+ 'pitch=' + tiki_encodeURIComponent(pov.pitch) + '&'
									+ 'key=' + tiki_encodeURIComponent(jqueryTiki.googleMapsAPIKey) + '&'
									+ 'sensor=false'
								;

								return base;
							};

							canvas.getPosition = function () {
								var pos =  canvas.panorama.getPosition();

								return formatLocation(pos.lat(), pos.lng(), 12);
							};

							canvas.panorama = new google.maps.StreetViewPanorama(canvas, {
								position: new google.maps.LatLng(lonlat.lat, lonlat.lon),
								zoomControl: false,
								scrollwheel: false,
								disableDoubleClickZoom: true
							});
							var timeout = setTimeout(function () {
								alert(tr('StreetView is not available at this specific point on the map. Zoom in as needed and make sure to click on a blue line.'));
								$(canvas).dialog('close');
							}, 5000);
							google.maps.event.addListener(canvas.panorama, 'pano_changed', function () {
								if (! canvas.panorama.getPano()) {
									alert(tr('StreetView is not available at this specific point on the map. Zoom in as needed and make sure to click on a blue line.'));
									$(canvas).dialog('close');
								}
								clearTimeout(timeout);
							});
						}
					});

					container.modeManager.addMode({
						name: 'StreetView',
						controls: [ new StreetViewHandler(), new OpenLayers.Control.NavToolbar() ],
						activate: function () {
							if (container.streetview.overlay) {
								container.streetview.overlay.setVisibility(true);
							}
						},
						deactivate: function () {
							if (container.streetview.overlay) {
								container.streetview.overlay.setVisibility(false);
							}
						}
					});

					container.streetview.addButton = function (label, callback) {
						container.streetview.buttons.unshift({
							label: label,
							callback: callback
						});
					};

					container.streetview.getButtons = function (canvas) {
						var buttons = {};
						$.each(container.streetview.buttons, function (k, b) {
							buttons[b.label] = function () {
								b.callback(canvas);
							}
						});

						return buttons;
					};

					container.streetview.addButton('Cancel', function (canvas) {
						$(canvas).dialog('close');
					});

					container.streetViewToggle = $('<a/>')
						.css('display', 'block')
						.attr('href', '')
						.click(function () {
							if (container.modeManager.activeMode && container.modeManager.activeMode.name == 'StreetView') {
								container.modeManager.switchTo('Default');
								$(this).text(tr('Enable StreetView'));
							} else {
								container.modeManager.switchTo('StreetView');
								$(this).text(tr('Disable StreetView'));
							}
							return false;
						})
						.text(tr('Enable StreetView'));

					if (-1 !== $.inArray('streetview', desiredControls)) {
						$(container).after(container.streetViewToggle);
					}
				}

				var searchboxes = $(container)
					.closest('.tab, #appframe, #tiki-center')
					.find('form.search-box')
					.filter(function () {
						return $(this).closest('.map-container').size() === 0;
					});

				searchboxes = searchboxes.add($('form.search-box', container));

				searchboxes
					.off('submit')
					.submit(function () {
						$(container).trigger("start.map.search");
						var form = this;
						$.post('tiki-searchindex.php?filter~geo_located=y', $(this).serialize(), function (data) {

							if (! form.autoLayers) {
								form.autoLayers = [];
							}

							$(form.autoLayers).each(function (k, name) {
								container.clearLayer(name);
							});

							$.each(data.result, function (k, i) {
								var layerName = $(form).data('result-layer'), suffix = $(form).data('result-suffix');

								if (! layerName) {
									layerName = '';
								}

								if (suffix && i[suffix]) {
									layerName = layerName + i[suffix];
								}

								if (-1 === $.inArray(layerName, form.autoLayers)) {
									form.autoLayers.push(layerName);
								}

								var icon;
								$(i.link).each(function () {	// if the object has an img with it (tracker status for instance) then we need to find the <a>
									if ($(this).is("a")) {	// and just using $(i.link).find("a") doesn't work for some reason
										icon = $(this).data('icon-src');
									}
								});

								if (i.geo_location) {
									$(container).addMapMarker({
										coordinates: i.geo_location,
										content: i.title,
										type: i.object_type,
										object: i.object_id,
										icon: icon ? icon : null,
										layer: layerName,
										dataSource: i,
										form: form
									});
								} else if (i.geo_feature) {
									var  wkt = new OpenLayers.Format.WKT
										, features
										, layer = container.getLayer(layerName)
										;

									format = new OpenLayers.Format.GeoJSON;

									try {
										features = format.read(i.geo_feature);
									} catch (e) {
										features = null;
									}

									if (! features) {
										// Corrupted feature - display plain marker
										$(container).addMapMarker({
											coordinates: $(container).getMapCenter(),
											content: i.title,
											type: i.object_type,
											object: i.object_id,
											icon: null,
											layer: layerName,
											dataSource: i
										});
										return;
									}

									$.each(features, function (k, feature) {
										var initial;
										feature.attributes.itemId = i.object_id;
										feature.attributes.content = i.title;
										if (! feature.attributes.color) {
											feature.attributes.color = '#6699cc';
										}
										if (! feature.attributes.intent) {
											feature.attributes.intent = "vectors";
										}
										if (! feature.attributes.popup_config) {
											feature.attributes.popup_config = $(form).data("popup-config");
										}

										initial = wkt.write(feature) + feature.attributes.color;

										feature.executor = delayedExecutor(5000, function () {
											var fields = {}, current = wkt.write(feature) + feature.attributes.color;
											fields[i.geo_feature_field] = format.write(feature);

											if (current === initial || layer !== container.vectors) {
												return;
											}

											$.post($.service('tracker', 'update_item'), {
												trackerId: i.tracker_id,
												itemId: i.object_id,
												fields: fields
											}, function () {
												initial = current;
											}, 'json')
												.error(function () {
													$(container).trigger('changed');
												});
										});
									});
									layer.addFeatures(features);

									$.each(features, function (k, feature) {
										$(container).trigger('add', [i, feature]);
									});

								} else if (i.geo_file) {	// load a file containing geometry, set using tracker Files indexGeometry option

									var format,
										files = i.geo_file.split(","),
										proj4326 = new OpenLayers.Projection("EPSG:4326"),
										proj900913 = new OpenLayers.Projection("EPSG:900913");

									layer = container.getLayer(layerName);

									if (i.geo_file_format == "geojson") {
										format = new OpenLayers.Format.GeoJSON;
									} else if (i.geo_file_format == "gpx") {
										format = new OpenLayers.Format.GPX;
									}
									for (var f = 0; f < files.length; f++) {

										OpenLayers.Request.GET({
											url: files[f],
											callback: function (request) {

												try {
													features = format.read(request.responseText);
												} catch (e) {
													// Corrupted feature - display plain marker
													$(container).addMapMarker({
														coordinates: $(container).getMapCenter(),
														content: i.title,
														type: i.object_type,
														object: i.object_id,
														icon: null,
														layer: layerName,
														dataSource: i
													});
													return;
												}
												$.each(features, function (k, feature) {

													feature.attributes.itemId = i.object_id;
													feature.attributes.content = i.title;
													if (! feature.attributes.color) {
														feature.attributes.color = '#ffa500';
													}
													if (! feature.attributes.intent) {
														feature.attributes.intent = "vectors";
													}
													if (! feature.attributes.popup_config) {
														feature.attributes.popup_config = $(form).data("popup-config");
													}
													// for some reason geometry needs to be in 900913 projection to correctly appear
													// in the "Editable" vector layer, even though layer.projection === "EPSG:4326"
													feature.geometry.transform(proj4326, proj900913);

												});
												layer.addFeatures(features);

												$.each(features, function (k, feature) {
													$(container).trigger('add', [i, feature]);
												});
											}
										});
									}
								}
							});
						}, 'json').complete(function () {
							$(container).trigger("complete.map.search");
						});
						return false;
					})
					.each(function () {
						if ($(this).hasClass('onload')) {
							var fm = this, layerLoadDelay = parseInt($(fm).data("load-delay"), 10);

							if (layerLoadDelay) {
								setTimeout(function () { $(fm).submit(); }, layerLoadDelay * 1000);
							} else {
								$(fm).submit();
							}
						}

						var skip = false;
						if ($(this).data('result-refresh')) {
							var form = this, refresh = parseInt($(this).data('result-refresh'), 10) * 1000, interval;
							interval = setInterval(function () {
								if (skip) {
									skip = false;
								} else {
									$(form).submit();
								}
							}, refresh);

							$(container).on('unregister', function () {
								clearInterval(interval);
							});
						}

						$(container).on('changed', function () {
							$(form).submit();
							skip = true;
						});
					});
				$(container).on('search', function (e, data) {
					function markLocation (lat, lon, bounds) {
						var lonlat = new OpenLayers.LonLat(lon, lat).transform(
							new OpenLayers.Projection("EPSG:4326"),
							map.getProjectionObject()
						), toViewport;

						toViewport = function () {
							if (bounds) {
								map.zoomToExtent(bounds);
							} else {
								map.setCenter(lonlat);
								map.zoomToScale(500 * OpenLayers.INCHES_PER_UNIT.m);
							}
						};

						$(container).addMapMarker({
							lat: lat,
							lon: lon,
							unique: 'selection',
							click: toViewport
						});

						if (typeof zoomToFoundLocation != 'undefined') {
							// Center map to the new location and zoom
							var zoomFactor = -1;
							switch (zoomToFoundLocation) {
								default:
								case 'street':
									zoomFactor = 250;
									break;
								case 'town':
									zoomFactor = 2500;
									break;
								case 'region':
									zoomFactor = 25000;
									break;
								case 'country':
									zoomFactor = 250000;
									break;
								case 'continent':
									zoomFactor = 1500000;
									break;
								case 'world':
									zoomFactor = -1;
									break;
							}
							if (zoomFactor < 0) {
								toViewport();
							} else {
								map.setCenter(lonlat);
								map.zoomToScale(zoomFactor * OpenLayers.INCHES_PER_UNIT.m);
							}
						} else {
							if (!container.map.getExtent().containsLonLat(lonlat)) {
								// Show marker on world map
								toViewport();
							}
						} 
					}

					function markGoogleLocation(result)
					{
						var loc = result.geometry.location
							, sw = result.geometry.viewport.getSouthWest()
							, ne = result.geometry.viewport.getNorthEast()
							, osw, one
							, left, bottom, right, top
							;

						osw = new OpenLayers.LonLat(sw.lng(), sw.lat()).transform(
							new OpenLayers.Projection("EPSG:4326"),
							map.getProjectionObject()
						);
						one = new OpenLayers.LonLat(ne.lng(), ne.lat()).transform(
							new OpenLayers.Projection("EPSG:4326"),
							map.getProjectionObject()
						);

						left = osw.lon;
						bottom = osw.lat;
						right = one.lon;
						top = one.lat;

						markLocation(loc.lat(), loc.lng(), new OpenLayers.Bounds(left, bottom, right, top));
					}

					function getBounds(bounds)
					{
						var osw, one
							;

						osw = new OpenLayers.LonLat(bounds.left, bounds.bottom).transform(
							map.getProjectionObject(),
							new OpenLayers.Projection("EPSG:4326")
						);
						one = new OpenLayers.LonLat(bounds.right, bounds.top).transform(
							map.getProjectionObject(),
							new OpenLayers.Projection("EPSG:4326")
						);

						return new google.maps.LatLngBounds(new google.maps.LatLng(osw.lat, osw.lon), new google.maps.LatLng(one.lat, one.lon));
					}

					if (data.address) {
						if (window.google && google.maps && google.maps.Geocoder) {
							var geocoder = new google.maps.Geocoder()
								, loc = $(container).getMapCenter().split(',');

							geocoder.geocode({
								bounds: getBounds(map.getExtent()),
								address: data.address
							}, function(results, status) {
								var $list = $('<ul/>');

								if (status == google.maps.GeocoderStatus.OK) {
									if (results.length === 1) {
										markGoogleLocation(results[0]);
										return;
									} else if (results.length > 0) {
										$.each(results, function (k, result) {
											var $link = $('<a href="#"/>');
											$link.text(result.formatted_address);
											$link.click(function () {
												markGoogleLocation(result);
												return false;
											});
											$('<li/>').append($link).appendTo($list);
										});
									}
								}

								$('<div/>')
									.append($list)
									.dialog({title: data.address});
							});
						} else {
							$.getJSON('tiki-ajax_services.php', {geocode: data.address}, function (data) {
								if (data && data.status === "OK") {
									markLocation(data.lat, data.lon, 500);
								} else {
									var msg;
									if (data && data.error) {
										msg = data.status + ": " + data.error;
									} else {
										msg = tr("Location service unnavailable");
									}
									$(container).parent().showError(msg);
								}
							});
						}
					}
				});

				$(container).trigger('initialized');
			}, 250);
		});

		return this;
	};

	$.fn.addMapMarker = function (options) {
		this.each(function () {
			var container = this,
				lonlat,
				iconModel = "default";

			if (options.unique) {
				iconModel = options.unique;
			}

			if (options.icon) {
				iconModel = options.icon;
			}

			if (options.coordinates) {
				var parts = options.coordinates.split(',');
				if (parts.length >= 2) {
					options.lon = parts[0];
					options.lat = parts[1];
				}
			}

			if (options.lat && options.lon) {
				lonlat = new OpenLayers.LonLat(options.lon, options.lat).transform(
					new OpenLayers.Projection("EPSG:4326"),
					container.map.getProjectionObject()
				);
			}

			container.markerIcons.createMarker(iconModel, lonlat, function (feature) {
				if (options.type && options.object) {
					feature.attributes.type = options.type;
					feature.attributes.object = options.object;
				}
				if (! feature.attributes.popup_config && options.form) {
					feature.attributes.popup_config = $(options.form).data("popup-config");
				}

				var markerLayer = container.getLayer(options.layer), initial = writeCoordinates(lonlat.clone(), container.map, true);
				markerLayer.addFeatures([feature]);

				if (options.unique) {
					if (container.uniqueMarkers[options.unique]) {
						markerLayer.removeFeatures([container.uniqueMarkers[options.unique]]);
					}

					container.uniqueMarkers[options.unique] = feature;
					$(container).trigger(options.unique + 'Change', options);
				}

				if (options.type === 'trackeritem' && options.object && markerLayer === container.vectors) {
					feature.executor = delayedExecutor(5000, function () {
						var current = writeCoordinates(feature.geometry.getBounds().getCenterLonLat().clone(), container.map, true);

						if (current === initial) {
							return;
						}

						$.post($.service('tracker', 'set_location'), {
							itemId: options.object,
							location: current
						}, function () {
							initial = current;
						}, 'json')
							.error(function () {
								$(container).trigger('changed');
							});
					});
				}

				if (options.content) {
					feature.attributes.content = options.content;
				}

				if (options.click) {
					feature.clickHandler = options.click;
				}

				if (options.dataSource) {
					$(container).trigger('add', [options.dataSource, feature]);
				}
			});
		});

		return this;
	};

	$.fn.setupMapSelection = function (options) {
		var control;
		this.each(function () {
			var container = this, field = options.field, map = this.map;

			if (! field.attr('disabled')) {
				$(container).on('selectionChange', function (e, lonlat) {
					if (lonlat) {
						field.val(writeCoordinates(lonlat, map)).change();
					} else {
						field.val('').change();
					}
				});
				map.events.register('zoomend', map, function (e, lonlat) {
					var coords = field.val().split(","), lon = 0, lat = 0;
					if (coords.length > 1) {
						lon = coords[0];
						lat = coords[1];
					}
					field.val(formatLocation(lat, lon, map.getZoom())).change();
				});

				var ClickHandler = OpenLayers.Class(OpenLayers.Control, {
					defaultHandlerOptions: {
						'single': true,
						'double': false,
						'pixelTolerance': 0,
						'stopSingle': false,
						'stopDouble': false
					},
					initialize: function(options) {
						this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
						OpenLayers.Control.prototype.initialize.apply(this, arguments);
						this.handler = new OpenLayers.Handler.Click(
							this,
							{
								'click': this.trigger
							},
							this.handlerOptions
						);
					},
					trigger: function(e) {
						var lonlat = map.getLonLatFromViewPortPx(e.xy).transform(
							map.getProjectionObject(),
							new OpenLayers.Projection("EPSG:4326")
						);
						$(container).addMapMarker({
							lat: lonlat.lat,
							lon: lonlat.lon,
							unique: 'selection'
						});

						if (options.click) {
							options.click();
						}
					}
				});

				control = new ClickHandler();
				map.addControl(control);
				control.activate();
			}
		});

		return control;
	};

	$.fn.removeMapSelection = function () {
		this.each(function () {
			var container = this;

			if (container.uniqueMarkers['selection']) {
				container.vectors.removeFeatures([container.uniqueMarkers['selection']]);
			}

			$(container).trigger('selectionChange', {});
		});

		return this;
	};

	$.fn.getMapCenter = function () {
		var val;

		this.each(function () {
			var coordinates = this.map.getCenter();
			val = writeCoordinates(coordinates, this.map, true);
		});

		return val;
	};

	$.fn.setMapPopup = function (popup, old) {
		this.each(function () {
			var handler = $(this).getMapPopupHandler();

			// Replacement attempt, if not the same one, skip the operation
			if (old && old !== this.activePopup) {
				return;
			}

			if (this.activePopup) {
				if (this.activePopup.myclose) {
					var f = this.activePopup.myclose;
					this.activePopup.myclose = null;
					f();
				} else {
					try {
						handler.remove(this.activePopup);
					} catch (e) {}	// catch error when dialog not initialised
				}

				this.activePopup = null;
			}

			if (popup) {
				this.activePopup = popup;

				handler.add(popup);
			}
		});
	};

	$.fn.loadInfoboxPopup = function (options) {
		if (options.type && options.object && $.inArray(options.type,  jqueryTiki.infoboxTypes) !== -1) {

			if (! options.content) {
				options.content = '';
			}

			this.each(function () {
				var container = this, popup;
				popup = new OpenLayers.Popup('marker', options.lonlat, null, options.content + '<img src="img/spinner.gif"/>');
				popup.autoSize = true;
				$(container).setMapPopup(popup);

				$.get($.service('object', 'infobox', {
					type: options.type,
					object: options.object
				}), function (data) {
					var newPopup
						, close = function () {
							$(container).setMapPopup(null);

							if (options.close) {
								options.close.apply([], container);
							}
						}
						, injectionId = ('popupInjection' + Math.random()).replace('.', '')
						, content
						, handler = $(container).getMapPopupHandler()
						;

					content = '<div id="' + injectionId + '"></div>';

					newPopup = handler.create(options.lonlat, content, options.hook, close, options.feature);

					newPopup.myclose = close;
					$(container).setMapPopup(newPopup, popup);

					content = $('#' + injectionId);
					content.html(data);

					handler.resize(newPopup);

					content.find('.svgImage')
						.css('text-align', 'center')
						.css('margin', 'auto');

					content.find('.service-dialog').click(function () {
						$(container).setMapPopup(null);

						$(this).serviceDialog({
							title: $(this).attr('title').replace(/^.*\:/, ''),	// trim off leading text up to a : which is the tooltip title
							success: function () {
								$(container).trigger('changed');
							}
						});
						return false;
					});

					// re-colorbox *box images
					$("a[rel*='box'][rel*='type=img'], a[rel*='box'][rel!='type=']", content).colorbox({
						photo: true
					});

				}, 'html');
			});

			return true;
		} else {
			return false;
		}
	};

	$.fn.getMapPopupHandler = function () {
		var handler;

		this.each(function () {
			var map = this.map;

			switch ($(this).data('popup-style')) {
			case 'dialog':
				handler = {
					type: 'dialog',
					add: function (popup) {
					},
					create: function (lonlat, content, hook, close, feature) {
						var dialog = $(content), w = '80%', h = 600;
						this.feature = feature;
						if (this.feature.attributes.popup_config) {
							w = this.feature.attributes.popup_config.width;
							h = this.feature.attributes.popup_config.height;
						}

						dialog.dialog({
							modal: true,
							width: w,
							height: h,
							close: close
						});

						return dialog[0];
					},
					remove: function (popup) {
						$(popup).dialog('destroy');
					},
					resize: function (popup) {
						$(popup).find('h1, h2, h3, h4, h5').first().each(function () {
							$(this).hide();
							$(popup).dialog('option', 'title', $(this).text());
						});
					}
				};
				break;
			case 'popup':
			default:
				handler = {
					type: 'popup',
					add: function (popup) {
						map.addPopup(popup);
					},
					create: function (lonlat, content, hook, close, feature) {
						this.feature = feature;
						return new OpenLayers.Popup.FramedCloud('marker', lonlat, null, content, hook, true, close);
					},
					remove: function (popup) {
						map.removePopup(popup);
					},
					resize: function (popup) {
						var w = 300, h = 260;
						if (this.feature.attributes.popup_config) {
							w = this.feature.attributes.popup_config.width;
							h = this.feature.attributes.popup_config.height;
						}
						popup.setSize(new OpenLayers.Size(w, h));
					}
				};
				break;
			}
		});

		return handler;
	};

	$.fn.finalMapRefresh = function (collector) {

		this.each(function () {
			var container = this;

			$(container).trigger('unregister');
			$(container).on('add', function (e, data, feature) {
				collector(data, $.extend({}, feature));
			});
			$(container).trigger('changed');
		});

		return this;
	};

	$('body').on("DOMNodeInserted", function (event) {
		var $target = $(event.target);
		if ($target.is(".popover")) {
			$target.find(".map-container:not(.done)").addClass("done").createMap();
		}
	})
})();

