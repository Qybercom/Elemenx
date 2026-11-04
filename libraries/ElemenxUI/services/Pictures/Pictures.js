/*
 * Pictures drawn by the page. Raster(svg, width, height, callback): an SVG drawn into a PNG of width by height pixels,
 * callback(error, data URL); a picture in it from another place (the Logo of a QR code) is read first and put in as
 * data, as an SVG drawn as a picture loads nothing. QRCode, Barcode and Diagram save their pictures through it.
 */
Elemenx.Service('Pictures', {
	$Meta: {
		Description: 'Pictures drawn by the page: an SVG drawn into a PNG.',
		Methods: ['Raster(svg, width, height, callback)']
	},

	Raster: function (svg, width, height, callback) {
		var urls = [];
		var pending;

		svg.replace(/<image href="([^"]+)"/g, function (all, url) {
			if (!/^data:/.test(url))
				urls.push(url.replace(/&amp;/g, '&'));

			return all;
		});

		function draw (source) {
			var picture = new Image();

			picture.onload = function () {
				var canvas = document.createElement('canvas');
				var context;

				canvas.width = width;
				canvas.height = height;
				context = canvas.getContext('2d');

				context.drawImage(picture, 0, 0, width, height);

				try {
					callback(null, canvas.toDataURL('image/png'));
				}
				catch (error) {
					callback(error);
				}
			};

			picture.onerror = function () {
				callback(new Error('Elemenx Pictures could not draw the picture'));
			};

			picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
		}

		if (!urls.length) {
			draw(svg);

			return;
		}

		pending = urls.length;

		urls.forEach(function (url) {
			var request = new XMLHttpRequest();

			request.open('GET', url, true);

			request.responseType = 'blob';

			request.onload = function () {
				var reader = new FileReader();

				reader.onload = function () {
					svg = svg.split('href="' + url.replace(/&/g, '&amp;') + '"').join('href="' + reader.result + '"');

					if (!--pending)
						draw(svg);
				};

				reader.readAsDataURL(request.response);
			};

			request.onerror = function () {
				if (!--pending)
					draw(svg);
			};

			request.send();
		});
	}
});
