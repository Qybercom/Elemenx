/*
 * The QR code of a text (the QR Service): an address, a contact, the details of a payment. Level of error correction:
 * L, M (the default), Q or H (a code with a logo over it needs H). Size in pixels, Margin in modules (4, the quiet zone
 * a reader needs), Dark and Light its colors (black on white reads best; Light transparent for none).
 * - Its style: Modules (square, dots, rounded or diamond), Eyes (the three corners: square, rounded, circle or leaf)
 *   and EyeColor, Gradient ({From, To, Angle}), Logo (a picture in the middle, LogoSize of its width: 0.22) or Text
 *   (a word there); with them the level is H, so the code still reads.
 * - SVG() returns it as the text of an SVG; Image(size) as a data URL of a PNG at once (the modules square, no logo);
 *   Png(size, callback) as a data URL of a PNG of its whole style, callback(error, url); Download(name, format) saves it
 *   as name.png (format png, the default) or name.svg (svg): a download on the web, the dialog of the system in a
 *   program; ready gives the component itself, to call them. A text too long for a code shows nothing and emits error.
 */
Elemenx.Component('QRCode', {
	$TemplateURL: 'QRCode.html',
	$StyleURL: 'QRCode.css',
	$Meta: {
		Group: 'media',
		Icon: 'grid',
		Description: 'The QR code of a text: an address, a contact, the details of a payment; styled, and saved as a picture.',
		Events: {
			error: 'The text is too long for a code: the error.',
			ready: 'It is made: the component itself, to call Download, Png or SVG.'
		},
		Methods: ['SVG()', 'Image(size)', 'Png(size, callback)', 'Download(name, format)'],
		Props: {
			Value: 'The text of the code.',
			Level: {Options: ['L', 'M', 'Q', 'H'], Description: 'The error correction: L, M, Q or H (7, 15, 25 or 30% of the code may be damaged).'},
			Size: 'Its width and height in pixels.',
			Margin: 'The quiet zone around it, in modules (4).',
			Dark: 'The color of the dark modules.',
			Light: 'The color of the light ones (transparent for none).',
			Modules: {Options: ['square', 'dots', 'rounded', 'diamond'], Description: 'The shape of the modules.'},
			Eyes: {Options: ['square', 'rounded', 'circle', 'leaf'], Description: 'The shape of the three corners (by the modules by default).'},
			EyeColor: 'The color of the three corners.',
			Gradient: 'A gradient over the dark modules: {From, To, Angle}.',
			Logo: 'A logo in the middle (a URL); the level goes to H.',
			LogoSize: 'The width of the logo, a part of the width of the code (0.22).',
			Text: 'A word in the middle instead of a logo.',
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
	Modules: 'square',
	Eyes: null,
	EyeColor: null,
	Gradient: null,
	Logo: null,
	LogoSize: 0.22,
	Text: '',
	Label: '',

	$OnCreate: function () {
		var self = this;
		var failed = null;
		var id = 'elemenx-qr-' + Math.random().toString(36).slice(2, 9);

		/* The options of the drawing, of the props. */
		this.Options = function () {
			return {Level: self.Level, Margin: self.Margin, Dark: self.Dark, Light: self.Light, Modules: self.Modules, Eyes: self.Eyes, EyeColor: self.EyeColor, Gradient: self.Gradient, Logo: self.Logo, LogoSize: self.LogoSize, Text: self.Text, Id: id};
		};

		/* The drawing of the code, or nothing for a text too long (told once for that text). */
		this.Drawing = function (value, level, margin, dark, light, modules, eyes, eyeColor, gradient, logo, logoSize, text) {
			var drawing;

			try {
				drawing = self.$Service('QR').SVG(value, {Level: level, Margin: margin, Dark: dark, Light: light, Modules: modules, Eyes: eyes, EyeColor: eyeColor, Gradient: gradient, Logo: logo, LogoSize: logoSize, Text: text, Id: id});
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

	/* ready: the component itself, for the owner to call its methods (it hears the events of the tag before this hook runs). */
	$OnReady: function () {
		this.$Emit('ready', this);
	},

	SVG: function () {
		return this.$Service('QR').SVG(this.Value, this.Options());
	},

	/* The code as a data URL of a PNG of size pixels (its Size by default), at once: its modules square, without a logo. */
	Image: function (size) {
		var code = this.$Service('QR').Encode(this.Value, this.$Service('QR').LevelFor(this.Options()));
		var margin = Number(this.Margin);
		var total = code.Size + margin * 2;
		var pixels = Number(size || this.Size);
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		var scale = pixels / total;

		canvas.width = pixels;
		canvas.height = pixels;

		if (this.Light !== 'transparent') {
			context.fillStyle = this.Light;

			context.fillRect(0, 0, pixels, pixels);
		}

		context.fillStyle = this.Dark;

		code.Modules.forEach(function (row, y) {
			row.forEach(function (module, x) {
				if (module)
					context.fillRect(Math.floor((x + margin) * scale), Math.floor((y + margin) * scale), Math.ceil(scale), Math.ceil(scale));
			});
		});

		return canvas.toDataURL('image/png');
	},

	/* The code with its whole style as a data URL of a PNG of size pixels (Size, twice for a sharp print, by default): callback(error, url). */
	Png: function (size, callback) {
		var pixels = Number(size) || Number(this.Size) * 2;

		this.$Service('QR').Raster(this.SVG(), pixels, pixels, callback);
	},

	/* Saves the code as name.png (format png) or name.svg (svg): callback(error) after. */
	Download: function (name, format, callback) {
		var native = this.$Service('Native');
		var file = String(name || 'qr-code').replace(/\.(png|svg)$/i, '');
		var done = callback || function () {};

		if (format === 'svg') {
			native.Save({Name: file + '.svg', Text: this.SVG(), Accept: ['.svg']}, done);

			return;
		}

		this.Png(null, function (error, url) {
			if (error) {
				done(error);

				return;
			}

			native.Save({Name: file + '.png', Data: url.substring(url.indexOf(',') + 1), Accept: ['.png']}, done);
		});
	}
});
