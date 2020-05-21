(function () {
	var mapNumber = 0,
		currentProtocol = document.location.protocol,
		errorLayers = [];

	if (currentProtocol !== 'http:' && currentProtocol !== 'https:') {
		currentProtocol = 'https:';
	}

	function getBaseLayers(tiles)
	{
		var layers = [], factories = {
			openstreetmap: function () {
				return new ol.layer.Tile({
					source: new ol.source.OSM(),
					title: 'OpenStreetMap'
				});
			},
			bing_road: function () {
				return new ol.layer.Tile({
					source: new ol.source.BingMaps({ key: jqueryTiki.bingMapsAPIKey, imagerySet: 'Road' }),
					title: 'BingRoad'
				});
			},
			bing_road_on_demand: function () {
				return new ol.layer.Tile({
					source: new ol.source.BingMaps({ key: jqueryTiki.bingMapsAPIKey, imagerySet: 'RoadOnDemand' }),
					title: 'BingRoadOnDemand'
				});
			},
			bing_aerial: function () {
				return new ol.layer.Tile({
					source: new ol.source.BingMaps({ key: jqueryTiki.bingMapsAPIKey, imagerySet: 'Aerial' }),
					title: 'BingAerial'
				});
			},
			bing_aerial_with_labels: function () {
				return new ol.layer.Tile({
					source: new ol.source.BingMaps({ key: jqueryTiki.bingMapsAPIKey, imagerySet: 'AerialWithLabels' }),
					title: 'BingAerialWithLabels'
				});
			},
			bing_ordnance_survey: function () {
				return new ol.layer.Tile({
					source: new ol.source.BingMaps({ key: jqueryTiki.bingMapsAPIKey, imagerySet: 'ordnanceSurvey' }),
					title: 'BingOrdnanceSurvey'
				});
			},
			bing_collins_bart: function () {	// doesn't seem to work?
				return new ol.layer.Tile({
					source: new ol.source.BingMaps({ key: jqueryTiki.bingMapsAPIKey, imagerySet: 'collinsBart' }),
					title: 'BingCollinsBart'
				});
			},
			nextzen: function () {
				var nextzenRoadStyleCache = {},
					nextzenStyle = function (feature, resolution) {
						switch (feature.get('layer')) {
							case 'water':
								return new ol.style.Style({
									fill: new ol.style.Fill({
										color: '#9db9e8'
									})
								});
							case 'buildings':
								return (resolution < 10) ? new ol.style.Style({
									fill: new ol.style.Fill({
										color: '#bbb',
										opacity: 0.4
									}),
									stroke: new ol.style.Stroke({
										color: '#999',
										width: 1
									})
								}) : null;
							case 'roads':
								var kind = feature.get('kind');
								var railway = feature.get('railway');
								var sort_key = feature.get('sort_key');
								var styleKey = kind + '/' + railway + '/' + sort_key;
								var style = nextzenRoadStyleCache[styleKey];
								if (!style) {
									var color, width = 1;
									if (railway || kind === "rail") {
										color = "#7a5";
									} else if (kind === "major_road"){
										color = "#aaa";
									} else if (kind === "minor_road"){
										color = "#ccb";
									} else if (kind === "path"){
										color = "#ddd";
									} else if (kind === "highway"){
										color = "#f39";
										width = 2;
									} else if (kind === "ferry"){
										color = "#448cff";
										width = 2;
									} else if (kind === "aeroway"){
										color = "#999";
										width = 3;
									} else {
										color = "#aaa";
										console.log("Unknown road kind: " + kind);
									}
									style = new ol.style.Style({
										stroke: new ol.style.Stroke({
											color: color,
											width: width
										}),
										zIndex: sort_key
									});
									nextzenRoadStyleCache[styleKey] = style;
								}
								return style;
							default:
								return null;
						}

					};

				return new ol.layer.VectorTile({
					source: new ol.source.VectorTile({
						attributions: '&copy; OpenStreetMap contributors, Who’s On First, ' +
							'Natural Earth, and openstreetmapdata.com',
						format: new ol.format.MVT({
							layertitle: 'layer',
							layers: ['water', 'roads', 'buildings']
						}),
						maxZoom: 19,
						url: 'https://tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.mvt?api_key=' + jqueryTiki.nextzenAPIKey
					}),
					style: function (feature, resolution) {
						return typeof window.nextzenStyle === "function" ?  window.nextzenStyle(feature, resolution) : nextzenStyle(feature, resolution);
					}
				})
			}

		};

		if (tiles.length === 0) {
			tiles.push('openstreetmap');
		}

		var visible = true;

		$.each(tiles, function (k, name) {
			var getLayer = function (name) {
				var f = factories[name], layer;
				if (f) {
					layer = f();
				} else {
					if (name.match(/stamen_/)) {
						var flavor = name.substring(7);

						layer = new ol.layer.Tile({
							source: new ol.source.Stamen({
								layer: flavor
							}),
							title: 'Stamen' + flavor
						});
					}
				}
				return layer;
			};

			if (typeof name === "object") {
				var sublayers = [], names = [];
				for (i = 0; i < name.length; i++) {
					sublayers.push(getLayer(name[i]));
					names.push(name[i]);
				}
				layers.push(new ol.layer.Group({
						title: k,
						combine: true,
						visible: visible,
						type: "base",
						layers: sublayers
					})
				);

			} else {
				var lyr = getLayer(name);
				if (lyr) {
					lyr.set("visible", visible);
					lyr.set("type", "base");
					lyr.set("title", k);
					layers.push(lyr);
				} else {
					errorLayers.push(name);
					console.log(tr("Cannot create map layer: " + name));
				}
			}
			visible = false;
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
				map.getView().getProjection(),
				new ol.proj.Projection({ code: "EPSG:4326" })
			);

			if (! lonlat) {
				lonlat = original;
			}
		}

		return formatLocation(lonlat.lat, lonlat.lon, map.getView().getZoom());
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

			container.getLayer = function (name) {
				var vectors;

				if (name) {
					if (! container.layers[name]) {
						// basic feature clustering
						if ($(container).data("cluster")) {
							var distance = $(container).data("cluster"),
								clusterSource = new ol.source.Cluster({
									distance: distance,
									source: new ol.source.Vector({wrapX: false})
								}),
								clusterFillColor = $(container).data("clusterfillcolor"),
								clusterTextColor = $(container).data("clustertextcolor");

							if (clusterFillColor) {
								clusterFillColor = clusterFillColor.split(",");
							} else {
								clusterFillColor = [86, 134, 200];
							}
							if (clusterTextColor) {
								clusterTextColor = clusterTextColor.split(",");
							} else {
								clusterTextColor = [255, 255, 255];
							}
							var styleCache = {},
								maxFeatureCount,
								/**
								 * Calculate size of cluster depending on zoom extent
								 * based on https://openlayers.org/en/latest/examples/earthquake-clusters.html
								 * @param resolution
								 */
								calculateClusterInfo = function (resolution) {
									maxFeatureCount = 0;
									var features = vectors.getSource().getFeatures();
									var feature, radius;
									for (var i = features.length - 1; i >= 0; --i) {
										feature = features[i];
										var originalFeatures = feature.get('features');
										var extent = ol.extent.createEmpty();
										var j = (void 0), jj = (void 0);
										for (j = 0, jj = originalFeatures.length; j < jj; ++j) {
											ol.extent.extend(extent, originalFeatures[j].getGeometry().getExtent());
										}
										maxFeatureCount = Math.max(maxFeatureCount, jj);
										radius = .4 * (ol.extent.getWidth(extent) + ol.extent.getHeight(extent)) / resolution;
										feature.set('radius', radius);
									}
								},
								createMarkerStyle = function (feature) {
									if (feature.get("intent") === "marker") {
										return new ol.style.Style({
											geometry: feature.getGeometry(),
											image: new ol.style.Icon({
												anchor: [feature.get("offsetx"), feature.get("offsety")],
												anchorXUnits: "pixels",
												anchorYUnits: "pixels",
												src: feature.get("url")
											})
										});
									}
								}, invisibleFill = new ol.style.Fill({
									color: 'rgba(255, 255, 255, 0.01)'
								}),
								selectClusterFeaturesStyle = function (feature) {
									var styles = [],
										features = feature.get('features');

									if (! features && feature) {
										return createMarkerStyle(feature);
									}

									if (features.length > 1) {
										styles.push(new ol.style.Style({
												image: new ol.style.Circle({
													radius: feature.get('radius'),
													fill: invisibleFill
												})
											})
										);
									}
									for (var i = features.length - 1; i >= 0; --i) {
										styles.push(createMarkerStyle(features[i]));
									}
									return styles;
								};


							vectors = container.layers[name] = new ol.layer.Vector({
								source: clusterSource,
								title: name,
								style: function (feature, resolution) {

									var features = feature.get("features");
									if (features && features.length > 1) {
										calculateClusterInfo(resolution);

										var size = features.length,
											style = styleCache[size + " " + maxFeatureCount];

										if (!style) {
											style = new ol.style.Style({
												image: new ol.style.Circle({
													radius: Math.max(feature.get('radius'), 20),
													stroke: new ol.style.Stroke({
														color: clusterTextColor
													}),
													fill: new ol.style.Fill({
														color: [
															clusterFillColor[0],
															clusterFillColor[1],
															clusterFillColor[2],
															Math.min(0.8, 0.4 + (size / maxFeatureCount))
														]
													})
												}),
												text: new ol.style.Text({
													text: features.length.toString(),
													font: "14px sans-serif",
													fill: new ol.style.Fill({
														color: clusterTextColor
													})
												})
											});
											styleCache[size + " " + maxFeatureCount] = style;
										}
									} else if (features) {

										feature = features[0];

										if (feature.get("intent") === "marker") {
											style = createMarkerStyle(feature);
										}
									}
									return style;
								}
							});

							if ($(container).data("clusterhover") === "features") {
								container.map.interactions = container.map.getInteractions().extend(
									[new ol.interaction.Select({
										condition: function (evt) {
											return evt.type === 'pointermove' ||
												evt.type === 'singleclick';
										},
										style: selectClusterFeaturesStyle,
										layers: [vectors]
									})]);
							}

							if ($(container).data("popup-style")) {
								var selectionInteraction = new ol.interaction.Select({
									style: createMarkerStyle,
									layers: [vectors]
								});

								container.map.addInteraction(selectionInteraction);

								// use select to make popup
								selectionInteraction.on('select', container.showPopup);
							}


						} else {

							vectors = container.layers[name] = new ol.layer.Vector({
								source: new ol.source.Vector({wrapX: false}),
								title: name
								//styleMap: container.defaultStyleMap,
								//rendererOptions: {zIndexing: true}
							});

						}

						container.overlays.getLayers().push(vectors);

/*							container.map.setLayerZIndex(vectors, vectorLayerList.length * 1000);
						setupLayerEvents(vectors);

						if (highlightControl && highlightControl.active) {
							highlightControl.deactivate();
							highlightControl.activate();
						}
						if (selectControl.active) {
							selectControl.deactivate();
							selectControl.activate();
						}*/
					}

					return container.layers[name];
				}

				return container.vectors;
			};

			container.clearLayer = function (name) {
				var vectors = container.getLayer(name);

				var toRemove = [];
				$.each(vectors.features, function (k, f) {
					if (f && f.get("itemId")) {
						toRemove.push(f);
					} else if (f && f.get("type") && f.get("object")) {
						toRemove.push(f);
					}
				});
				vectors.removeFeatures(toRemove);
			};




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
				ol.ImgPath = "lib/openlayers/theme/dark/";

				var controls = ol.control.defaults({
					// zoom control is added by default, so remove it if not needed
					zoom: $.inArray('controls', desiredControls) !== -1
				});

				if ($.inArray('coordinates', desiredControls) !== -1) {
					controls.push(new ol.control.MousePosition({
							projection: "EPSG:4326",
							coordinateFormat: function (coordinate) {
								return ol.coordinate.format(coordinate, '{y}, {x}', 4);
							}
						})
					);
				}

				if ($.inArray('scale', desiredControls) !== -1) {
					controls.push(new ol.control.ScaleLine());
				}

				if ($.inArray('levels', desiredControls) !== -1) {
					controls.push(new ol.control.ZoomSlider());
				}

				if (-1 !== $.inArray('layers', desiredControls)) {
					controls.push(new ol.control.LayerSwitcher());
				}

/* no navbar, pan or layer switcher anymore?
				if (layers.length > 0 && -1 !== $.inArray('navigation', desiredControls)) {
					defaultMode.controls.push(new ol.control.NavToolbar());
				}
*/

				// Set up initial layers
				container.layers = {};

				var tilesets = {}, key = "", pos = -1, ts = $(container).data("tilesets") || jqueryTiki.mapTileSets;
				if (ts) {
					if (typeof ts === "string") {
						ts = ts.replace(/\s*/g, "").split(",");
					}
					if (typeof ts === "string") {
						ts = [ts];
					}
				}
				for (var i = 0; i < ts.length; i++) {
					pos = ts[i].indexOf("=");
					if (pos !== -1) {
						key = ts[i].substr(0, pos);
						ts[i] = ts[i].substr(pos + 1);
					} else {
						var m = ts[i].match(/\W/);
						if (m) {
							key = ts[i].substr(0, ts[i].indexOf(m[0]));
						} else {
							key = ts[i];
						}
					}
					if (ts[i].indexOf("~") !== -1) {
						tilesets[key] = ts[i].split("~");
					} else {
						tilesets[key] = ts[i];
					}
				}

				errorLayers = [];

				var layers = [
					new ol.layer.Group({
						title: tr("Base Maps"),
						layers: getBaseLayers(tilesets)
					}),
					new ol.layer.Group({
						title: tr("Overlays")
					})
				];

				var map = container.map = new ol.Map({
					target: id,
					controls: controls,
					view: new ol.View({
						center: [0, 0],
						zoom: 2
					}),
					layers: layers
				});

				if (errorLayers.length) {
					$("#tikifeedback").showError(tr("Cannot create map layer/s: " + errorLayers.join(", ")));
					errorLayers = [];
				}

				map.getLayerGroup().getLayers().forEach(function (layer) {
					if (layer.get("title") === tr("Overlays")) {
						container.overlays = layer;
					}
				});

				container.vectors = container.getLayer(tr("Editable"));

				container.uniqueMarkers = {};

				container.resetPosition = function (center) {

					center = center || [0, 0, 3];

					var view = map.getView();
					view.setCenter(ol.proj.fromLonLat([center.lon, center.lat]));
					view.setZoom(center.zoom);
				};

				container.resetPosition();

				container.modeManager = {
					modes: [],
					activeMode: null,
					addMode: function (options) {
						var mode = $.extend({
							title: tr('Default'),
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

				var $mapBootstrapDummy = $("<div>")
						.attr("id", "map-tooltip")
						.css("position", "absolute")
						.appendTo($(".ol-viewport", container));

				/* tooltips */

				if ($(container).data("tooltips")) {
					// based on https://gis.stackexchange.com/a/166745/25953


					container.displayFeatureInfo = function (pixel, evt) {
						$mapBootstrapDummy.tooltip("hide");
						var feature, layer, both = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
							return [feature, layer];
						});
						if (! both) {
							return;
						}
						feature = both[0];
						layer = both[1];

						if (! feature) {
							return;
						}
						if (layer && layer.getType() === "VECTOR_TILE") {
							return;
						}
						$mapBootstrapDummy.css({
							left: pixel[0] + "px",
							top: (pixel[1] - 15) + "px"
						});
						var clusterFeatures = feature.get("features");

						if (clusterFeatures) {
							if ($(container).data("clusterhover") === "none") {
								feature.set("content", "");
								for (var i = 0; i < clusterFeatures.length; i++) {
									feature.set("content", feature.get("content") + clusterFeatures[i].get("content") + "<br>");
								}
							} else if (clusterFeatures.length === 1) {
								feature = clusterFeatures[0];
							} else if (layer) {
								var f = layer.getSource().getSource().getClosestFeatureToCoordinate(evt.coordinate);
								if (f) {
									feature = f;
								}
							}
						}
						if (feature && feature.get("content")) {
							$mapBootstrapDummy
								.tooltip("dispose")
								.tooltip({
									animation: false,
									trigger: "manual",
									html: true,
									title: feature.get("content"),
									container: "body"
								})
								.tooltip("show");
						}
					};

					map.on('pointermove', function (evt) {
						if (evt.dragging) {
							$mapBootstrapDummy.tooltip('hide');
							return true;
						}
						container.displayFeatureInfo(map.getEventPixel(evt.originalEvent), evt);
						return true;
					});
				}

				if ($(container).data("popup-style")) {

					container.showPopup = function (e) {
						var pixel, feature, features = e.target.getFeatures();

						if (features.getLength()) {
							feature = features.getArray()[0];
							var clusterFeatures = feature.get("features");
							if (clusterFeatures && clusterFeatures.length === 1) {
								feature = clusterFeatures[0];
							} else {
								selectionInteraction.getFeatures().clear();
								var extent = ol.extent.createEmpty();
								for (var i = 0; i < clusterFeatures.length; ++i) {
									ol.extent.extend(extent, clusterFeatures[i].getGeometry().getExtent());
								}
								container.map.getView().fit(
									extent,
									{
										duration: 2000,
										padding: [10,5,10,5]
									}
								);
								return;
							}
						} else {
							return;
						}

						pixel = map.getEventPixel(e.mapBrowserEvent.originalEvent);

						$mapBootstrapDummy.tooltip("dispose").css({
							left: pixel[0] + "px",
							top: pixel[1] + "px"
						});

						var type = feature.get("type"), object = feature.get("object");

						switch ($(container).data('popup-style')) {
							case 'dialog':

								var $modal = $('.modal.fade:not(.show):first')
									.modal({})
									.one('shown.bs.modal', function (event) {
										if (type && object) {
											$(container).loadInfoboxPopup({
												type: type,
												object: object,
												feature: feature,
												event: event,
												element: this,
												callback: function (event, $html) {
													var title = $html.find("h1").remove().text() || feature.get(
														"content"),
														$header = $(".modal-header", $modal);

													$html.find("a.service-dialog").clickModal({});

													if ($header.length === 0) {
														$(".modal-content", $modal).append(
															$("<div class='modal-header'>").append(
																$("<h4 class='modal-title'>").text(title)
															)
														);
													} else {
														$(".modal-title", $modal).text(title)
													}

													$(".modal-content", $modal).append(
														$("<div class='modal-body'>").append($html),
														$("<div class='modal-footer'>").append(
															$('<button type="button" class="btn btn-secondary" data-dismiss="modal">'
																+ tr('Close') + '</button>')
														)
													);
												}
											});
										}
									})
									.one('hidden.bs.modal', function () {
										selectionInteraction.getFeatures().clear();
									})
									.modal("show");

								break;
							case 'popup':
							default:
								$mapBootstrapDummy.popover("dispose").popover({
									trigger: "manual",
									html: true,
									content: tr("Loading..."),
									container: "body",
									placement: "auto"
								}).popover("show").on('shown.bs.popover', function (event) {
									if (type && object) {
										$(container).loadInfoboxPopup({
											type: type,
											object: object,
											feature: feature,
											event: event,
											element: this,
											callback: function (event, $html) {
												var $popover = $(".popover.show:first");
												$html.find("a.service-dialog").remove();
												var title = $html.find("h1").remove().text() || feature.get("content");
												$(".popover-header", $popover).text(title);
												$(".popover-body", $popover).empty().append($html.children());
												$popover.mouseleave(function () {
													$popover.popover("dispose");
													selectionInteraction.getFeatures().clear();
												});
											}
										});
									}
								});
								break;
						}
					};

					var selectionInteraction = new ol.interaction.Select({});

					map.addInteraction(selectionInteraction);

					// use select to make popup
					selectionInteraction.on('select', container.showPopup);

				}

				if (layers.length > 0 && -1 !== $.inArray('overview', desiredControls)) {
					var overview = new ol.control.OverviewMap({minRatio: 128, maxRatio: 256, maximized: true});
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
								offsetx: width / 2,
								offsety: height
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
							var properties = $.extend(this.loadedMarker[name] || this.loadedMarker.default, {
								geometry: lonlat
							}), marker;

							marker = new ol.Feature(
								properties
							);
							callback(marker);
						}
					}
				};

				container.markerIcons.loadMarker('default', 'lib/openlayers/img/marker.svg');
				container.markerIcons.loadMarker('selection', 'lib/openlayers/img/marker-gold.svg');

				if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
					container.toMyLocation = $('<a class="btn btn-sm btn-info">')
						.attr('href', '')
						.click(function () {
							navigator.geolocation.getCurrentPosition(function (position) {

								var view = map.getView();
								view.setCenter(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]));
								view.setZoom(view.getZoomForResolution(position.coords.accuracy));

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

				container.searchLocation = $('<a class="btn btn-sm btn-info">')
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
							var graphic = new ol.layer.Image(
								$(this).attr('alt'),
								$(this).attr('src'),
								ol.Bounds.fromString(extent),
								new ol.Size($(this).width(), $(this).height())
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
					container.resetPosition(central);

					if (useMarker) {
						$(container).addMapMarker({
							lon: central.lon,
							lat: central.lat,
							unique: 'selection'
						});
					}
				}

				container.modeManager.addMode(defaultMode);

				if (jqueryTiki.googleStreetView) {
					container.streetview = {
						buttons: []
					};

					if (jqueryTiki.googleStreetViewOverlay) {
						container.streetview.overlay = new ol.layer.XYZ(
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

					var StreetViewHandler = ol.Class(ol.control, {
						defaultHandlerOptions: {
							'single': true,
							'double': false,
							'pixelTolerance': 0,
							'stopSingle': false,
							'stopDouble': false
						},
						initialize: function(options) {
							this.handlerOptions = ol.Util.extend({}, this.defaultHandlerOptions);
							ol.control.prototype.initialize.apply(this, arguments);
							this.handler = new ol.Handler.Click(
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
								new ol.proj.Projection("EPSG:4326")
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
						title: 'StreetView',
						controls: [ new StreetViewHandler(), new ol.control.NavToolbar() ],
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
									var  wkt = new ol.Format.WKT
										, features
										, layer = container.getLayer(layerName)
										;

									format = new ol.Format.GeoJSON;

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
										feature.set("itemId", i.object_id);
										feature.set("content", i.title);
										if (! feature.get("color")) {
											feature.set("color", '#6699cc');
										}
										if (! feature.get("intent")) {
											feature.set("intent", "vectors");
										}
										if (! feature.get("popup_config")) {
											feature.set("popup_config", $(form).data("popup-config"));
										}

										initial = wkt.write(feature) + feature.get("color");

										feature.executor = delayedExecutor(5000, function () {
											var fields = {}, current = wkt.write(feature) + feature.get("color");
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
									layer.getSource().addFeatures(features);

									$.each(features, function (k, feature) {
										$(container).trigger('add', [i, feature]);
									});

								} else if (i.geo_file) {	// load a file containing geometry, set using tracker Files indexGeometry option

									var format,
										files = i.geo_file.split(","),
										proj4326 = new ol.proj.Projection("EPSG:4326"),
										proj900913 = new ol.proj.Projection("EPSG:900913");

									layer = container.getLayer(layerName);

									if (i.geo_file_format == "geojson") {
										format = new ol.Format.GeoJSON;
									} else if (i.geo_file_format == "gpx") {
										format = new ol.Format.GPX;
									}
									for (var f = 0; f < files.length; f++) {

										ol.Request.GET({
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

													feature.set("itemId", i.object_id);
													feature.set("content", i.title);
													if (! feature.get("color")) {
														feature.set("color", '#ffa500');
													}
													if (! feature.get("intent")) {
														feature.set("intent", "vectors");
													}
													if (! feature.get("popup_config")) {
														feature.set("popup_config", $(form).data("popup-config"));
													}
													// for some reason geometry needs to be in 900913 projection to correctly appear
													// in the "Editable" vector layer, even though layer.projection === "EPSG:4326"
													feature.geometry.transform(proj4326, proj900913);

												});
												layer.getSource().addFeatures(features);

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
						var lonlat = ol.proj.fromLonLat([lon, lat]),
							toViewport = function () {
								if (bounds) {
									map.getView().zoomToExtent(bounds);
								} else {
									map.getView().setCenter(lonlat);
									map.zoomToScale(500 * ol.INCHES_PER_UNIT.m);
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
									zoomFactor = 1;	// these are now metres per pixel
									break;
								case 'town':
									zoomFactor = 10;
									break;
								case 'region':
									zoomFactor = 100;
									break;
								case 'country':
									zoomFactor = 500;
									break;
								case 'continent':
									zoomFactor = 20000;
									break;
								case 'world':
									zoomFactor = -1;
									break;
							}
							var view = map.getView();
							if (zoomFactor < 0) {
								view.setZoom(2);	// whole world, more or less
							} else {
								view.setCenter(lonlat);
								view.setZoom(view.getZoomForResolution(zoomFactor * ol.proj.Units.METERS_PER_UNIT.m));
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

						osw = new ol.proj.fromLonLat([sw.lng(), sw.lat()]);
						one = new ol.proj.fromLonLat([ne.lng(), ne.lat()])

						left = osw[0];
						bottom = osw[1];
						right = one[0];
						top = one[0];

						markLocation(loc.lat(), loc.lng(), [left, bottom, right, top]);
					}

					function getBounds(bounds)
					{
						var osw, one
							;

						osw = new ol.LonLat(bounds.left, bounds.bottom).transform(
							map.getProjectionObject(),
							new ol.proj.Projection("EPSG:4326")
						);
						one = new ol.LonLat(bounds.right, bounds.top).transform(
							map.getProjectionObject(),
							new ol.proj.Projection("EPSG:4326")
						);

						return new google.maps.LatLngBounds(new google.maps.LatLng(osw.lat, osw.lon), new google.maps.LatLng(one.lat, one.lon));
					}

					if (data.address) {
						if (window.google && google.maps && google.maps.Geocoder) {
							var geocoder = new google.maps.Geocoder()
								, loc = $(container).getMapCenter().split(',');

							geocoder.geocode({
								//bounds: getBounds(map.getExtent()),
								address: data.address
							}, function(results, status) {
								var $list = $('<ul/>');

								if (status === google.maps.GeocoderStatus.OK) {
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
				lonlat = new ol.geom.Point(
					ol.proj.fromLonLat([parseFloat(options.lon), parseFloat(options.lat)])
				);
			}

			container.markerIcons.createMarker(iconModel, lonlat, function (feature) {
				if (options.type && options.object) {
					feature.set("type", options.type);
					feature.set("object", options.object);
				}
				if (! feature.get("popup_config") && options.form) {
					feature.set("popup_config", $(options.form).data("popup-config"));
				}

/*				feature.setStyle(new ol.style.Style({
					image: new ol.style.Icon({
						anchor: [feature.get("offsetx"), feature.get("offsety")],
						anchorXUnits: "pixels",
          				anchorYUnits: "pixels",
          				src: feature.get("url")
					})
				}));*/

				var markerLayer = container.getLayer(options.layer), markerLayerSource,
					initial = writeCoordinates(lonlat.clone(), container.map, true);

				markerLayerSource = markerLayer.getSource();

				if (typeof markerLayerSource.getSource === "function") {
					markerLayerSource = markerLayerSource.getSource();	// Cluster layer source
				}

				if (options.unique) {
					if (container.uniqueMarkers[options.unique]) {
						markerLayerSource.removeFeature(container.uniqueMarkers[options.unique]);
						delete container.uniqueMarkers[options.unique];
					}
				}
				markerLayerSource.addFeatures([feature]);

				if (options.unique) {
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
					feature.set("content", options.content);
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
				map.on('zoomend', function (e, lonlat) {
					var coords = field.val().split(","), lon = 0, lat = 0;
					if (coords.length > 1) {
						lon = coords[0];
						lat = coords[1];
					}
					field.val(formatLocation(lat, lon, map.getView().getZoom())).change();
				});

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
			var coordinates = this.map.getView().getCenter();
			val = ol.proj.fromLonLat(coordinates);
		});

		return val.join(",");
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

			this.each(function () {

				$.get($.service('object', 'infobox', {
					type: options.type,
					object: options.object
				}), function (data) {

					var content = $("<body>").append(data);

					content.find('.svgImage')
						.css('text-align', 'center')
						.css('margin', 'auto');

					// re-colorbox *box images
					$("a[rel*='box'][rel*='type=img'], a[rel*='box'][rel!='type=']", content).colorbox({
						photo: true
					});

					if (options.callback) {
						options.callback.call(options.element, options.event, content);
					}

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
						if (this.feature.get("popup_config")) {
							w = this.feature.get("popup_config").width;
							h = this.feature.get("popup_config").height;
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
						return new ol.Popup.FramedCloud('marker', lonlat, null, content, hook, true, close);
					},
					remove: function (popup) {
						map.removePopup(popup);
					},
					resize: function (popup) {
						var w = 300, h = 260;
						if (this.feature.get("popup_config")) {
							w = this.feature.get("popup_config").width;
							h = this.feature.get("popup_config").height;
						}
						popup.setSize(new ol.Size(w, h));
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

})();

// TODO from OpenLayers2 tiki-maps.js still to be updated
/* style stuff later
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

				container.defaultStyleMap = new ol.StyleMap({
					"default": new ol.Style(ol.Util.applyDefaults({
						cursor: "pointer"
					}, ol.Feature.Vector.style['default']), {
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
					"select": new ol.Style(ol.Util.applyDefaults({
						cursor: "pointer"
					}, ol.Feature.Vector.style['select']), {
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
					"temporary": new ol.Style(ol.Util.applyDefaults({
						cursor: "pointer"
					}, ol.Feature.Vector.style['temporary']), {
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
					"vertex": new ol.Style(ol.Util.applyDefaults({
						fillColor: "#6699cc",
						strokeColor: "#6699cc",
						pointRadius: 5,
						fillOpacity: ".7",
						strokeDashstyle: "solid"
					}, ol.Feature.Vector.style['temporary']))
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
*/
/* event TODO
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
							if (! event.feature.get("color")) {
								event.feature.set("color", '#6699cc');
							}
							if (! event.feature.get("intent")) {
								event.feature.set("intent", "vectors");
							}
						}
					});
				}

				setupLayerEvents(container.vectors);
*/
/*
				var ClickHandler = ol.Class(ol.control, {
					defaultHandlerOptions: {
						'single': true,
						'double': false,
						'pixelTolerance': 0,
						'stopSingle': false,
						'stopDouble': false
					},
					initialize: function(options) {
						this.handlerOptions = ol.Util.extend({}, this.defaultHandlerOptions);
						ol.control.prototype.initialize.apply(this, arguments);
						this.handler = new ol.Handler.Click(
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
							new ol.proj.Projection("EPSG:4326")
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
*/

