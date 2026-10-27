/*
 * The QR code of a text (the QR Service): an address, a contact, the details of a payment. Level of error correction:
 * L, M (the default), Q or H (a code with a logo over it needs H). Size in pixels, Margin in modules (4, the quiet zone
 * a reader needs), Dark and Light its colors (black on white reads best). Image(size) returns it as a data URL of a
 * PNG, SVG() as the text of an SVG, to download or print. A text too long for a code shows nothing and emits error.
 */
Elemenx.Component('QRCode', {
	$TemplateURL: 'QRCode.html',
	$StyleURL: 'QRCode.css',
	$Meta: {
		Group: 'media',
		Icon: 'grid',
		Description: 'The QR code of a text: an address, a contact, the details of a payment.',
		Events: {
			error: 'The text is too long for a code: the error.'
		},
		Props: {
			Value: 'The text of the code.',
			Level: {Options: ['L', 'M', 'Q', 'H'], Description: 'The error correction: L, M, Q or H (7, 15, 25 or 30% of the code may be damaged).'},
			Size: 'Its width and height in pixels.',
			Margin: 'The quiet zone around it, in modules (4).',
			Dark: 'The color of the dark modules.',
			Light: 'The color of the light ones.',
			Label: 'What the code holds, for screen readers (the text by default).'
		},
		Sample: {Value: 'https://example.com', Size: 160}
	},
	Value: '',
	Level: 'M',
	Size: 160,
	Margin: 4,
	Dark: '#000000',
	Light: '#ffffff',
	Label: '',

	$OnCreate: function () {
		var self = this;
		var failed = null;

		/* The drawing of the code, or nothing for a text too long (told once for that text). */
		this.Drawing = function (value, level, margin, dark, light) {
			var drawing;

			try {
				drawing = self.$Service('QR').SVG(value, {Level: level, Margin: margin, Dark: dark, Light: light});
				failed = null;

				return drawing;
			}
			catch (error) {
				if (failed !== value + '|' + level) {
					failed = value + '|' + level;

					window.setTimeout(function () {
						self.$Emit('error', error);
					}, 0);
				}

				return '';
			}
		};
	},

	SVG: function () {
		return this.Drawing(this.Value, this.Level, this.Margin, this.Dark, this.Light);
	},

	/* The code as a data URL of a PNG of size pixels (its Size by default). */
	Image: function (size) {
		var code = this.$Service('QR').Encode(this.Value, this.Level);
		var margin = Number(this.Margin);
		var total = code.Size + margin * 2;
		var pixels = Number(size || this.Size);
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		var scale = pixels / total;

		canvas.width = pixels;
		canvas.height = pixels;
		context.fillStyle = this.Light;

		context.fillRect(0, 0, pixels, pixels);

		context.fillStyle = this.Dark;

		code.Modules.forEach(function (row, y) {
			row.forEach(function (module, x) {
				if (module)
					context.fillRect(Math.floor((x + margin) * scale), Math.floor((y + margin) * scale), Math.ceil(scale), Math.ceil(scale));
			});
		});

		return canvas.toDataURL('image/png');
	}
});
