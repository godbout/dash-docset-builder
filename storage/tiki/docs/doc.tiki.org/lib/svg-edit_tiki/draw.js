$.fn.drawFullscreen = function() {
	var win = $(window);
	var me = $(this);
	me.trigger('saveDraw');
	
	var fullscreen = $('#svg-fullscreen');
	
	if (fullscreen.length == 0) {
		me.data('origParent', me.parent());
		
		var menuHeight = $('#drawMenu').height();
		$('body').addClass('full_screen_body');
		$('body,html').scrollTop(0);
		
		fullscreen = $('<div id="svg-fullscreen" />')
			.html(me)
			.prependTo('body');
		
		var fullscreenIframe = fullscreen.find('iframe');
		
		win
			.resize(function() {
				fullscreen
					.height(win.height())
					.width(win.width());
					
				fullscreenIframe.height((fullscreen.height() - menuHeight));
			})
			.resize() //we do it double here to make sure it is all resized right
			.resize();
			
	} else {
		me.data('origParent').append(me);
		win.off('resize');
		fullscreen.remove();
		$('body').removeClass('full_screen_body');
	}
	
	return this;
};

$.fn.replaceDraw = function(o) {
	var me = $(this);
	if (o.error) {
		alert('error ' + o.error);
	} else {
		$.tikiModal(tr("Saving..."));
		$.post('tiki-edit_draw.php', {
			galleryId: o.galleryId,
			fileId: o.fileId,
			imgParams: o.imgParams,
			name: o.name,
			data: o.data
		}, function(fileId) {
			fileId = (fileId ? fileId : o.fileId);
			o.fileId = fileId;

			me.data('fileId', o.fileId);
			me.data('galleryId', o.galleryId);
			me.data('imgParams', o.imgParams);
			me.data('name', o.name);

			$.tikiModal(tr("Saved file id") + o.fileId + '!');
			
			if ($.wikiTrackingDraw) {
				$.wikiTrackingDraw.params.id = o.fileId;
				$.tikiModal(tr("Updating Wiki Page"));
				$.post('tiki-wikiplugin_edit.php', $.wikiTrackingDraw, function() {
					me.trigger('savedDraw', o);
					$.tikiModal();
				});
			} else {
				me.trigger('savedDraw', o);
				$.tikiModal();
			}
		});
	}
	
	return this;
};

$.fn.saveDraw = function() {
	var me = $(this);
	me.data('canvas').getSvgString()(function(data, error) {
		me.replaceDraw({
			data: data,
			error: error,
			fileId: me.data('fileId'),
			galleryId: me.data('galleryId'),
			imgParams: me.data('imgParams'),
			name: me.data('name')
		})
	});

	try {
		me.data('window').svgCanvas.undoMgr.resetUndoStack();
	} catch(e) {}

	return this;
};

$.fn.saveAndBackDraw = function() {
	$(this)
		.saveDraw()
		.one('savedDraw', function() {
			window.history.back();
		});
};

$.fn.renameDraw = function() {
	var me = $(this);
	var name = me.data('name');
	var newName = prompt(tr("Enter new name"), name);
	if (newName) {
		if (newName != name) {
			name = newName;
			me.data('name', name);
			me.trigger('renamedDraw', name);
			
			me.saveDraw();
		}
	}
	
	return this;
};

$.drawInstance = 0;

$.fn.loadDraw = function(o) {
	var me = $(this);

	//prevent from happeneing over and over again
	if (me.data('drawLoaded')) return me;

	me.data('drawLoaded', true);

	var options = [
		'canvas_expansion=2'
	];


	if ($.lang) {
		options.push('lang=' + $.lang);
	}

	var drawFrame = $('<iframe src="vendor_bundled/vendor/svg-edit/svg-edit/svg-editor.html?' + options.join('&') + '" id="svgedit"></iframe>')
		.appendTo(me)
		.load(function() {
			me
				.data('drawInstance', $.drawInstance)
				.data('fileId', (o.fileId ? o.fileId : 0))
				.data('galleryId', (o.galleryId ? o.galleryId : 0))
				.data('imgParams', (o.imgParams ? o.imgParams : {}))
				.data('name', (o.name ? o.name : ''))
				.data('doc', $(drawFrame[0].contentDocument ? drawFrame[0].contentDocument : drawFrame[0].contentWindow.document))
				.data('canvas', new embedded_svg_edit(drawFrame[0]))
				.data('window', drawFrame[0].contentWindow);
			
			// Hide un-needed buttons
			var doc = me.data('doc');
			doc.find('body').append(
				'<style>' +
					'#tool_clear,#tool_open,#tool_save,#tool_imagelib {' +
						'display: none;' +
					'}' +
					'#sidepanel_handle {' +
						'top: 0% ! important;' +
						'width: auto ! important;' +
					'}' +
				'</style>'
			);

			o.data = $.trim(o.data);
			if (o.data && o.fileId) {
				me.data('canvas').setSvgString(o.data);
			}
			
			me.data('window').onbeforeunload = function() {};

			window.onbeforeunload = function() {
				try {
					if ( me.data('window') && me.data('window').svgCanvas.undoMgr.getUndoStackSize() > 1 ) {
						return tr("There are unsaved changes, leave page?");
					}
				} catch (e) {}
			};

			drawFrame.height($(window).height() * 0.9);
			
			$.drawInstance++;
			
			me.trigger('loadedDraw');

			$.getJSON('tiki-ajax_services.php', {
				controller: 'draw',
				action: 'removeButtons'
			}, function(data) {
				if (data.removeButtons) {
					if (!$.isArray(data.removeButtons)) data.removeButtons = data.removeButtons.split(',');
					for(var id in data.removeButtons) {
						me.data('doc').find('#' + $.trim(data.removeButtons[id])).wrap('<div style="display:none;"/>');
					}
				}
			});
		});
	return me;
};
