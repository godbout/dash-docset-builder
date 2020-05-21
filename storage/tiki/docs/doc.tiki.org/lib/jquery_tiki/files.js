
(function ($) {
	var handleFiles, ProgressBar, FileList, FileListInline;

	$.fileTypeIcon = function (fileId, file) {
		if (typeof file.type == 'undefined') {
			return $('<img height="16" width="16" title="'+ file.type +'" alt="'+ file.type +'" src="img/icons/mime/default.png">');
		} else if(file.type.substring(0,6) == 'image/') {
			return $('<img src="tiki-download_file.php?fileId=' + fileId + '&display&y=24" height="24">');
		} else if(file.type == 'application/pdf') {
			return $('<img height="16" width="16" title="application/pdf" alt="application/pdf" src="img/icons/mime/pdf.png">');
		} else if(file.type.indexOf("sheet") != -1) {
			return $('<img height="16" width="16" title="'+ file.type +'" alt="'+ file.type +'" src="img/icons/mime/xls.png">');
		} else if(file.type.indexOf("zip") != -1) {
			return $('<img height="16" width="16" title="'+ file.type +'" alt="'+ file.type +'" src="img/icons/mime/zip.png">');
		} else if (file.type.substring(0,6) == 'video/') {
			return $('<img height="16" width="16" title="'+ file.type +'" alt="'+ file.type +'" src="img/icons/mime/flv.png">');
		} else if (file.type.indexOf("word") != -1) {
			return $('<img height="16" width="16" title="'+ file.type +'" alt="'+ file.type +'" src="img/icons/mime/doc.png">');
		} else {
			return $('<img height="16" width="16" title="'+ file.type +'" alt="'+ file.type +'" src="img/icons/mime/default.png">');
		}
	};

	ProgressBar = function (options) {
		var bar = this;
		this.segments = [];
		this.updateSegment = function (number, current, total) {
			bar.segments[number] = [current, total];
			bar.update();
		};
		this.update = function () {
			var total = 0, current = 0;
			$.each(bar.segments, function (k, item) {
				current += item[0];
				total += item[1];
			});

			options.progress(current, total);

			if (current === total) {
				options.done();
			}
		};
	};

	FileList = function (options) {
		var $list = $(options.list);
		this.clearErrors = function () {
			$list.find('.text-danger').remove();
		};
		this.addError = function (file, message) {
			var $li = $('<li>').appendTo($list);

			$li.text(file.name);
			$li.addClass('text-danger');
			$li.append(' (' + (message ? message : tr('uploading failed')) + ')');
		};
		this.addFile = function (fileId, file, title) {
			// called for "upload in modal" tracker Files fields when file dropped or picked from the file dialog
			var $li = $('<li>').addClass("row mb-4").appendTo($list);

			var label = file.name;
			if (title) {
				label = title;
			}
			$("<div>").addClass("col-sm-12").text(label)
				.prepend($.fileTypeIcon(fileId, file).css("margin-right", "1em"))
				.appendTo($li);


			if ($list.parents(".inline").length) {
				var $fileInput = $list.parents(".files-field").find("> input");
				var val = $fileInput.val();
				val = val ? val + "," + fileId : fileId;
				$fileInput.val(val);
			} else {
				$('<input type="hidden" name="file[]">')
					.attr('value', fileId)
					.appendTo($li);

				if ($list.data("adddescription")) {
					$("<label>")
						.addClass("col-form-label col-sm-4")
						.text(tr("Description"))
						.appendTo($li);
					$("<div>").addClass("col-sm-12")
						.append($('<textarea name="description[]">')
							.addClass("form-control col-sm-8")
						)
						.appendTo($li);
				}
			}

		};
	};

	handleFiles = function (input) {
				
		var files = input.files,
			accept = input.accept,
			title = input.title,
			galleryId = input.galleryId,
			image_max_size_x = input.image_max_size_x,
			image_max_size_y = input.image_max_size_y,
			progressBar = input.progress,
			ticket = input.ticket,
			fileList = input.list,
			$modal = input.form.parents(".modal-dialog:first");

		if (! $modal.length) {
			$modal = input.form;
		}

		var uploadUrl = $.service('file', 'upload');

		var restoreExif = function(sourceImageData, newImageData){
			if (sourceImageData.indexOf('data:image/jpeg;base64,') !== 0){
				return newImageData;
			}
			var sourceImageSegments = MinifyJpeg.slice2Segments(MinifyJpeg.decode64(sourceImageData.replace("data:image/jpeg;base64,", "")));
			var exifInfo = MinifyJpeg.getExif(sourceImageSegments);
			var newImageBinArray = MinifyJpeg.insertExif(newImageData, exifInfo);
			return "data:image/jpeg;base64," + MinifyJpeg.encode64(newImageBinArray);
		};

		$.each(files, function (k, file) {
			var reader = new FileReader();
	
			progressBar.updateSegment(k, 0, file.size);
			window.lastFile = file;

			$(window).queue('process-upload', function () {
				reader.onloadend = function (e) {
					var xhr, provider, sendData, data, valid = true;

					$modal.tikiModal(tr("Uploading file..."));

					xhr = jQuery.ajaxSettings.xhr();
					if (xhr.upload) {
						xhr.upload.addEventListener('progress', function (e) {
							if (e.lengthComputable) {
								progressBar.updateSegment(k, e.loaded, e.total);
							}
						}, false);
					}
					provider = function () {
						return xhr;
					};

					sendData = {
						
						type: 'POST',
						url: uploadUrl,
						xhr: provider,
						dataType: 'json',
						global: false, 	// prevent ajaxError in tiki-jquery.js from closing the dialogs, leading to lost edits
						success: function (data) {
							fileList.addFile(data.fileId, file, title);
						},
						error: function (jqXHR, textStatus, errorThrown) {
							progressBar.updateSegment(k, 0, 0);
							fileList.addError(file, errorThrown);
						},
						complete: function (data) {
							$(window).dequeue('process-upload');
							ticket = data.responseJSON.ticket;
							// for modal
							$('form.file-uploader-result input[name=ticket]').val(ticket);
							// for both (form when in modal, div when inline)
							$('.file-uploader').data('ticket', ticket);

							$modal.tikiModal();
						}
					};

					if (window.FormData) {
						sendData.processData = false;
						sendData.contentType = false;
						sendData.cache = false;

						sendData.data = new FormData;
						sendData.data.append('galleryId', galleryId);
						sendData.data.append('image_max_size_x', image_max_size_x);
						sendData.data.append('image_max_size_y', image_max_size_y);
						sendData.data.append('ticket', ticket);
						sendData.data.append('name', file.name);
						sendData.data.append('title', title);

						var waiting = false;

						//checking if image is uploaded to call resize function and resizing options are set by tracker
						// field creator
						if (file.type.substring(0, 6) == 'image/' && (image_max_size_x || image_max_size_y)) {
							waiting = true;
							var imageData;

							var picFile = e.target;
							imageData = picFile.result;

							var img = new Image();
							var blobImage = null;
							img.src = imageData;
							img.onload = function () {
								var width = parseInt(image_max_size_x);
								var height = parseInt(image_max_size_y);
								var image_x = parseInt(image_max_size_x);
								var image_y = parseInt(image_max_size_y);
								var ratio;
								if (img.width > image_x || img.height > image_y) {

									if (img.width > image_x) {
										width = image_x;
										ratio = image_x / img.width;
										height = Math.round(img.height * ratio);
									}

									if (height > image_y) {
										height = image_y;
										ratio = image_y / img.height;
										width = Math.round(img.width * ratio);
									}
								} else {
									width = img.width;
									height = img.height;
								}
								var canvas = $("<canvas/>").get(0);
								canvas.width = width;
								canvas.height = height;
								var context = canvas.getContext('2d');
								context.drawImage(img, 0, 0, width, height);
								var resizedImage = restoreExif(imageData, canvas.toDataURL('image/jpeg'));
								blobImage = dataURItoBlob(resizedImage);
								sendData.data.append('data', blobImage, file.name);
								$.ajax(sendData);
							}

						} else {
							sendData.data.append('data', file);
						}
					} else {
						data = e.target.result;
						sendData.data = {
							name: file.name,
							size: file.size,
							type: file.type,
							title: title,
							data: data.substr(data.indexOf('base64') + 7),
							galleryId: galleryId,
							image_max_size_x: image_max_size_x,
							image_max_size_y: image_max_size_y
						};
					}

					if (accept) {
						valid = file.type.match(new RegExp(".?(" + accept.replace('*', '.*') + ")$", "i"));
					}

					if (valid && !waiting) {
						$.ajax(sendData);
					} else {
						if (!valid) {
							sendData.error(null);
						}
					}
				};
				reader.readAsDataURL(file);
			});
		});
		$(window).dequeue('process-upload');
	};

	$(document).on('submit', 'form.file-uploader', function (e) {
		e.preventDefault();
	});

	function doUpload($form, files) {
		var progress, list;
		
		progress = new ProgressBar({
			progress: function (current, total) {
				var percentage = Math.round(current / total * 100);

				$form.find('.progress').removeClass("invisible");
				$form.find('.progress-bar')
					.attr('aria-valuenow', percentage)
					.width(percentage + '%');
				$form.find('.progress-bar .sr-only .count')
					.text(percentage);
			},
			done: function () {
				$form.find('.progress').addClass("invisible");
				$form.find('.progress-bar')
					.attr('aria-valuenow', 0)
					.width('0%');
				$form.find('.progress-bar .sr-only .count')
					.text('0%');
				// Clear required title in preparation for next file
				$('.custom-file-title-input', $form).val('');
			}
		});

		list = new FileList({
			list: $form.parent().find('.file-uploader-result ul')[0]
		});

		list.clearErrors();

		handleFiles({
			accept: $form.find(':file').attr('accept'),
			galleryId: $form.data('gallery-id'),
			title: $form.find('.custom-file-title-input').val(),
			ticket: $form.data('ticket'),
			image_max_size_x:$form.data('image_max_size_x'),
			image_max_size_y:$form.data('image_max_size_y'),
			files: files,
			progress: progress,
			list: list,
			form: $form
		});
	}

	function validateTitleProvided(form) {
		if ($('.custom-file-title', form).is(':visible')) {
			if (!$('.custom-file-title-input', form).val()) {
				$('.custom-file-title .feedback-required-title', form).show();
				$('.custom-file-label', form).text('Choose file');
				form.trigger('reset');
				return false;
			} else {
				$('.custom-file-title .feedback-required-title', form).hide();
				return true;
			}
		}
		return true;
	}

	function validateOneAtTime(form, files) {
		if ($('.custom-file-title', form).is(':visible')) {
			if (files.length > 1) {
				$('.custom-file-title .feedback-one-at-time', form).show();
				$('.custom-file-label', form).text('Choose file');
				form.trigger('reset');
				return false;
			} else {
				$('.custom-file-title .feedback-one-at-time', form).hide();
				return true;
			}
		}
		return true;
	}

	$(document).on('change', '.file-uploader input[type=file]', function () {
		  
		var $clone, $form = $(this).closest("form"), progress, list;
		if (this.files) {
			if (!validateTitleProvided($form)) {
				return false;
			}
			if (!validateOneAtTime($form, this.files)) {
				return false;
			}

			doUpload($form, this.files);

			$(this).val('');
			$clone = $(this).clone(true);
			$(this).replaceWith($clone);
		}
	});

	if (window.FileReader) {
		$(document).ready(function () {
			$('.drop-message').show();
		});
		$(document).on('dragenter', '.file-uploader', function (e) {
			e.preventDefault();
			e.stopPropagation();
			$(this).addClass("active");
			return false;
		});
		$(document).on('dragexit dragleave', '.file-uploader', function (e) {
			e.preventDefault();
			e.stopPropagation();
			$(this).removeClass("active");
			return false;
		});
		$(document).on('dragover', '.file-uploader', function (e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		$(document).on('drop', '.file-uploader', function (e) {
			var $form = $(this);

			if (!validateTitleProvided($form)) {
				return false;
			}

			e.preventDefault();
			e.stopPropagation();
			$(this).removeClass("active");

			var dataTransfer = e.dataTransfer;
			if (! dataTransfer) {
				dataTransfer = e.originalEvent.dataTransfer;
			}

			if (dataTransfer && dataTransfer.files) {
				if (!validateOneAtTime($form, dataTransfer.files)) {
					return false;
				}
				doUpload($form, dataTransfer.files);
			}
			return false;
		});
	}

	function browserRemoveFile(link)
	{
		var list = $(link).closest('ul');
		$(link).closest('li').remove();

		list.closest('.file-browser').trigger('selection-update');
	}

	function browserAddFile(link)
	{
		var content = $(link).closest('.media-body').clone(true),
			icon = $(link).closest('.media, .panel').find('.media-object, .panel-body a').children('img').clone(true).width('16px'),
			nav = $(link).closest('.file-browser').find('.selection ul'),
			item = $('<li>'),
			a = $('<a>').text($(link).text()),
			id = $(link).data('object'),
			limit = nav.closest('form').data('limit'),
			current = nav.find('input[type=hidden]').filter(function () {
				return parseInt($(this).val(), 10) === id;
			});

		if (current.length > 0) {
			// Already in the list
			browserRemoveFile(current[0]);
			return;
		}

		if (limit === 1) {
			nav.empty();
		} else if (limit && nav.children('li').length >= limit) {
			alert(nav.closest('form').data('limit-reached-message'));
			return;
		}

		a
			.prepend(' ')
			.prepend(icon);
		item.append(a);
		nav.append(item);

		item.append($('<input type="hidden" name="file[]">')
			.attr('value', id));

		nav.closest('.file-browser').trigger('selection-update');
	}

	$(document).on('selection-update', '.file-browser', function (e) {
		var selection = $('.selection input[type=hidden]', this).map(function () {
			return parseInt($(this).val(), 10);
		});

		$('.gallery-list .media-heading a, .gallery-list .panel-body a', this).each(function () {
			var id = $(this).data('object');
			$(this).closest('.media').toggleClass('bg-info', -1 !== $.inArray(id, selection));
			$(this).closest('.panel').toggleClass('panel-info', -1 !== $.inArray(id, selection));
		});
		$('.selection', this).toggleClass("invisible", selection.length === 0);
	});

	$(document).on('click', '.file-browser .gallery-list .pagination a', function (e) {
		e.preventDefault();
		$(this).closest('.modal').animate({ scrollTop: 0 }, 'slow');
		$(this).closest('.gallery-list')
			.tikiModal(tr('Loading...'))
			.load($(this).attr('href'), function () {
				$(this).tikiModal('');
				$(this).closest('.file-browser').trigger('selection-update');
			});
	});

	$(document).on('click', '.file-browser .gallery-list .media-heading a, .file-browser .gallery-list .panel-body a', function (e) {
		e.preventDefault();
		e.stopPropagation();
		browserAddFile(this);
	});
	$(document).on('click', '.file-browser .gallery-list .media, .file-browser .gallery-list .panel', function (e) {
		e.preventDefault();
		$('.media-heading a, .panel-body a', this).click();
	});

	$(document).on('click', '.file-browser .selection a', function (e) {
		e.preventDefault();
		browserRemoveFile(this);
	});

	$(document).on('submit', '.file-browser .form-inline', function (e) {
		e.preventDefault();
		$(this).closest('.file-browser').find('.gallery-list')
			.tikiModal(tr('Loading...'))
			.load($(this).attr('action'), $(this).serialize(), function () {
				$(this).tikiModal('');
				$(this).closest('.file-browser').trigger('selection-update');
			});
	});

	$(document).on('click', '.file-browser .submit .upload-files', function (e) {
		var $list = $(this).closest('.file-browser').find('.selection ul'),
			handler = $.clickModal({
				success: function (data) {
					$.each(data.files, function (k, file) {
						$('<li>')
							.append($('<a href="#">')
								.data('object', file.fileId)
								.data('type', 'file')
								.text(file.label))
							.append($('<input type="hidden" name="file[]">')
								.attr('value', file.fileId))
							.appendTo($list);

						$list.closest('.file-browser').trigger('selection-update');
					});
					$.closeModal();
				}
			});

		handler.apply(this, arguments);
	});

	// File selector component
	$(document).on('click', '.file-selector a', function () {
		if (! $(this).data('initial-href')) {
			$(this).data('initial-href', $(this).attr('href'));
		}

		// Before the dialog handler triggers, replace the href with one including current files
		$(this).attr('href', $(this).data('initial-href') + '&file=' + $(this).parent().children('input').val());
	});
	$(document).on('click', '.file-selector a', $.clickModal({
		size: 'modal-lg',
		success: function (data) {
			var files = [];
			$.each(data.files, function (k, f) {
				files.push(f.fileId);
			});
			$(this).parent().children('input').val(files.join(','));
			$(this).text($(this).text().replace(/\d+/, files.length));
			$.closeModal();
		}
	}));
})(jQuery);

function dataURItoBlob(dataURI) {
	
	
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    	byteString = atob(dataURI.split(',')[1]);
	} else {
    	byteString = unescape(dataURI.split(',')[1]);
	}

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia],{ type:'image/jpeg' });
}

/* To minify a jpeg image without loosing EXIF.
 * TESTED(24/01/2013): FireFox, GoogleChrome, IE10, Opera
 * Copyright (c) 2013 hMatoba
 * Released under the MIT license : https://github.com/hMatoba/MinifyJpegAsync/blob/master/LICENSE.txt
 *
 * To minify jpeg image:
 *     minified = MinifyJpeg.minify(image, length);
 *     xhr.send(minified.buffer);
 *     enc = "data:image/jpeg;base64," + MinifyJpeg.encode64(minified);
 *     html = '<img src="' + enc + '">';
 * MinifyJpeg.minify() - return Uint8Array
 * image - image base64encoded, it can be obtained "FileReader().readAsDataURL(f)"
 * length - the long side length of the rectangle
 * MinifyJpeg.encode64() - convert array to base64encoded string
 */
var MinifyJpeg = (function () {

	var that = {};

	that.KEY_STR = "ABCDEFGHIJKLMNOP" +
		"QRSTUVWXYZabcdef" +
		"ghijklmnopqrstuv" +
		"wxyz0123456789+/" +
		"=";

	that.SOF = [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207];

	that.minify = function (image, new_size) {
		var newImage, rawImage;

		if (image instanceof ArrayBuffer) {
			if (image[0] == 255 && image[1] == 216) {
				rawImage = [];
				for (var i = 0; i < image.byteLength; i++) {
					rawImage[i] = image[i];
				}
			}
			else {
				throw "MinifyJpeg.minify got a not JPEG data";
			}
		}
		else {
			if (typeof(image) === "string") {
				if (!image.match("data:image/jpeg;base64,")) {
					throw "MinifyJpeg.minify got a not JPEG data";
				}
				else {
					rawImage = that.decode64(image.replace("data:image/jpeg;base64,", ""));
				}
			}
			else {
				throw "First argument must be 'DataURL string' or ArrayBuffer.";
			}
		}

		var segments = that.slice2Segments(rawImage);
		var NEW_SIZE = parseInt(new_size);
		var size = that.imageSizeFromSegments(segments);
		var chouhen = (size[0] >= size[1]) ? size[0] : size[1];
		if (chouhen < NEW_SIZE) {
			return new Uint8Array(rawImage);
		}

		var exif = that.getExif(segments);
		var resized = that.resizeImage(rawImage, segments, NEW_SIZE);

		if (exif.length) {
			newImage = that.insertExif(resized, exif);
		}
		else {
			newImage = new Uint8Array(that.decode64(resized.replace("data:image/jpeg;base64,", "")));
		}

		return newImage;
	};

	that.getImageSize = function (imageArray) {
		var segments = that.slice2Segments(imageArray);
		return that.imageSizeFromSegments(segments);
	};

	that.slice2Segments = function (rawImageArray) {
		var head = 0,
			segments = [];

		while (1) {
			if (rawImageArray[head] == 255 & rawImageArray[head + 1] == 218) {
				break;
			}
			if (rawImageArray[head] == 255 & rawImageArray[head + 1] == 216) {
				head += 2;
			}
			else {
				var length = rawImageArray[head + 2] * 256 + rawImageArray[head + 3],
					endPoint = head + length + 2,
					seg = rawImageArray.slice(head, endPoint);
				segments.push(seg);
				head = endPoint;
			}
			if (head > rawImageArray.length) {
				break;
			}
		}

		return segments;
	};

	that.imageSizeFromSegments = function (segments) {
		for (var x = 0; x < segments.length; x++) {
			var seg = segments[x];
			if (that.SOF.indexOf(seg[1]) >= 0) {
				var height = seg[5] * 256 + seg[6],
					width = seg[7] * 256 + seg[8];
				break;
			}
		}
		return [width, height];
	};

	that.encode64 = function (input) {
		var output = "",
			chr1, chr2, chr3 = "",
			enc1, enc2, enc3, enc4 = "",
			i = 0;

		do {
			chr1 = input[i++];
			chr2 = input[i++];
			chr3 = input[i++];

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else {
				if (isNaN(chr3)) {
					enc4 = 64;
				}
			}

			output += that.KEY_STR.charAt(enc1) +
				that.KEY_STR.charAt(enc2) +
				that.KEY_STR.charAt(enc3) +
				that.KEY_STR.charAt(enc4);
			chr1 = chr2 = chr3 = "";
			enc1 = enc2 = enc3 = enc4 = "";
		} while (i < input.length);
		return output;
	};

	that.decode64 = function (input) {
		var chr1, chr2, chr3 = "",
			enc1, enc2, enc3, enc4 = "",
			i = 0,
			buf = [];

		// remove all characters that are not A-Z, a-z, 0-9, +, /, or =
		var base64test = /[^A-Za-z0-9\+\/\=]/g;
		if (base64test.exec(input)) {
			alert("There were invalid base64 characters in the input text.\n" +
				"Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
				"Expect errors in decoding.");
		}
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		do {
			enc1 = that.KEY_STR.indexOf(input.charAt(i++));
			enc2 = that.KEY_STR.indexOf(input.charAt(i++));
			enc3 = that.KEY_STR.indexOf(input.charAt(i++));
			enc4 = that.KEY_STR.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			buf.push(chr1);

			if (enc3 != 64) {
				buf.push(chr2);
			}
			if (enc4 != 64) {
				buf.push(chr3);
			}

			chr1 = chr2 = chr3 = "";
			enc1 = enc2 = enc3 = enc4 = "";

		} while (i < input.length);

		return buf;
	};

	that.resizeImage = function (rawImage, segments, NEW_SIZE) {
		var jpe, ctx, srcImg;
		var size = that.imageSizeFromSegments(segments),
			width = size[0],
			height = size[1],
			chouhen = (width >= height) ? width : height,
			newSize = NEW_SIZE,
			resizing = 1,
			scale = parseFloat(newSize) / chouhen,
			newWidth = parseInt(parseFloat(newSize) / chouhen * width),
			newHeight = parseInt(parseFloat(newSize) / chouhen * height);

		if (resizing == 1) // bilinear
		{
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			jpe = new JpegImage();
			ctx = canvas.getContext("2d");
			srcImg = ctx.getImageData(0, 0, width, height);
			jpe.parse(new Uint8Array(rawImage));
			jpe.copyToImageData(srcImg);

			var newCanvas = document.createElement('canvas');
			newCanvas.width = newWidth;
			newCanvas.height = newHeight;
			var newCtx = newCanvas.getContext("2d");
			var destImg = newCtx.createImageData(newWidth, newHeight);
			that.bilinear(srcImg, destImg, scale);

			newCtx.putImageData(destImg, 0, 0);
			var resizedImage = newCanvas.toDataURL("image/jpeg");
		}
		else // nearest neighbor?
		{
			canvas = document.createElement('canvas');
			canvas.width = newWidth;
			canvas.height = newHeight;

			jpe = new JpegImage();
			ctx = canvas.getContext("2d");
			d = ctx.getImageData(0, 0, newWidth, newHeight);
			jpe.parse(new Uint8Array(rawImage));
			jpe.copyToImageData(d);
			ctx.putImageData(d, 0, 0);

			resizedImage = canvas.toDataURL("image/jpeg");
		}

		return resizedImage;
	};

	that.getExif = function (segments) {
		var seg;
		for (var x = 0; x < segments.length; x++) {
			seg = segments[x];
			if (seg[0] == 255 & seg[1] == 225) //(ff e1)
			{
				return seg;
			}
		}
		return [];
	};

	that.insertExif = function (imageStr, exifArray) {
		var buf = that.decode64(imageStr.replace("data:image/jpeg;base64,", "")),
			separatePoint = buf.indexOf(255, 3),
			mae = buf.slice(0, separatePoint),
			ato = buf.slice(separatePoint),
			array = mae.concat(exifArray, ato);

		aBuffer = new Uint8Array(array);

		return aBuffer;
	};

	// compute vector index from matrix one
	that.ivect = function (ix, iy, w) {
		// byte array, r,g,b,a
		return ((ix + w * iy) * 4);
	};

	that.bilinear = function (srcImg, destImg, scale) {
		// c.f.: wikipedia english article on bilinear interpolation
		//log.debug("in bilinear");
		// taking the unit square
		function inner(f00, f10, f01, f11, x, y)
		{
			var un_x = 1.0 - x;
			var un_y = 1.0 - y;
			return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
		}

		var srcWidth = srcImg.width;
		var srcHeight = srcImg.height;
		var srcData = srcImg.data;
		var dstData = destImg.data;
		var i, j;
		var iyv, iy0, iy1, ixv, ix0, ix1;
		var idxD, idxS00, idxS10, idxS01, idxS11;
		var dx, dy;
		for (i = 0; i < destImg.height; ++i) {
			iyv = (i + 0.5) / scale - 0.5;
			iy0 = Math.floor(iyv);
			iy1 = (Math.ceil(iyv) > (srcHeight - 1) ? (srcHeight - 1) : Math.ceil(iyv));
			for (j = 0; j < destImg.width; ++j) {
				ixv = (j + 0.5) / scale - 0.5;
				ix0 = Math.floor(ixv);
				ix1 = (Math.ceil(ixv) > (srcWidth - 1) ? (srcWidth - 1) : Math.ceil(ixv));
				idxD = that.ivect(j, i, destImg.width);
				idxS00 = that.ivect(ix0, iy0, srcWidth);
				idxS10 = that.ivect(ix1, iy0, srcWidth);
				idxS01 = that.ivect(ix0, iy1, srcWidth);
				idxS11 = that.ivect(ix1, iy1, srcWidth);
				// log.debug(sprintf("bilinear: idx: D: %d, S00: %d, S10: %d, S01: %d, S11: %d", idxD, idxS00, idxS10,
				// idxS01, idxS11));
				dx = ixv - ix0;
				dy = iyv - iy0;

				//r
				dstData[idxD] = inner(srcData[idxS00], srcData[idxS10],
					srcData[idxS01], srcData[idxS11], dx, dy
				);

				//g
				dstData[idxD + 1] = inner(srcData[idxS00 + 1], srcData[idxS10 + 1],
					srcData[idxS01 + 1], srcData[idxS11 + 1], dx, dy
				);

				//b
				dstData[idxD + 2] = inner(srcData[idxS00 + 2], srcData[idxS10 + 2],
					srcData[idxS01 + 2], srcData[idxS11 + 2], dx, dy
				);

				//a
				dstData[idxD + 3] = inner(srcData[idxS00 + 3], srcData[idxS10 + 3],
					srcData[idxS01 + 3], srcData[idxS11 + 3], dx, dy
				);
			}
		}
	};
	return that;
})();

function processFgalSyntax(fileInfo, theSyntax) {
	var key, part, syntax = "";
	if (typeof fileInfo === "string") {
		fileInfo = JSON.parse(fileInfo);
	}
	syntax = syntax ? decodeURIComponent(syntax[1]) : (theSyntax || fileInfo.syntax || fileInfo.wiki_syntax);
	for (key in fileInfo) {
		if (fileInfo.hasOwnProperty(key)) {
			part = "{" + key + "}";
			if (syntax.indexOf(part) > -1) {
				syntax = syntax.replace(part, fileInfo[key]);
			}
		}
	}
	return syntax;
}
