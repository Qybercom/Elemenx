/*
 * A barcode of a text (the Barcodes Service): Format code128 (the default), ean13, ean8, upca, code39, itf14,
 * datamatrix, pdf417, or one of its own (Barcodes.Register). Module is the width of a module in pixels (2: a code as
 * wide as its modules twice), Height the height of the bars in pixels (80), ShowText writes the human text under them
 * (FontSize in pixels), Dark and Light its colors (Light transparent for none). Its style: Round (0 to 1: the ends of
 * the bars round), Shape of the modules of a matrix (square, dots, rounded or diamond). Check adds the check digit of
 * Code 39, Bearer false leaves out the frame of ITF-14, Columns and Level shape a PDF417.
 * SVG() returns it as the text of an SVG, Png(scale, callback) as a data URL of a PNG (scale times its size: 2),
 * Download(name, format) saves it as name.png or name.svg; ready gives the component itself, to call them. A text the
 * format cannot write shows nothing and emits error (the reason, as its message).
 */
Elemenx.Component('Barcode', {
	$TemplateURL: 'Barcode.html',
	$StyleURL: 'Barcode.css',
	$Meta: {
		Group: 'media',
		Icon: 'tag',
		Description: 'A barcode of a text: Code 128, EAN, UPC, Code 39, ITF-14, DataMatrix, PDF417 or a format of its own.',
		Events: {
			error: 'The format cannot write the text: the error.',
			ready: 'It is made: the component itself, to call Download, Png or SVG.'
		},
		Methods: ['SVG()', 'Png(scale, callback)', 'Download(name, format)'],
		Props: {
			Value: 'The text of the code.',
			Format: {Options: ['code128', 'ean13', 'ean8', 'upca', 'code39', 'itf14', 'datamatrix', 'pdf417'], Description: 'The format (or one of Barcodes.Register).'},
			Module: 'The width of a module in pixels (2).',
			Height: 'The height of the bars in pixels (80).',
			ShowText: 'Writes the human text under the bars.',
			FontSize: 'The size of the text in pixels (14).',
			Dark: 'The color of the bars.',
			Light: 'The color of the background (transparent for none).',
			Round: 'The ends of the bars round, from 0 to 1.',
			Shape: {Options: ['square', 'dots', 'rounded', 'diamond'], Description: 'The shape of the modules of a matrix (DataMatrix).'},
			Check: 'Code 39: adds its check digit.',
			Bearer: 'ITF-14: its frame (true).',
			Columns: 'PDF417: the codewords of a row (1 to 30).',
			Level: 'PDF417: the error correction (0 to 8).',
			Label: 'What the code holds, for screen readers (the text by default).'
		},
		Sample: {Value: 'ELEMENX-2026', Format: 'code128'}
	},
	Value: '',
	Format: 'code128',
	Module: 2,
	Height: 80,
	ShowText: true,
	FontSize: 14,
	Dark: '#000000',
	Light: '#ffffff',
	Round: 0,
	Shape: 'square',
	Check: false,
	Bearer: true,
	Columns: null,
	Level: null,
	Label: '',

	$OnCreate: function () {
		var self = this;
		var failed = null;

		/* The options of the Service, of the props: its sizes in modules. */
		this.Options = function (module, height, show, font, dark, light, round, shape, check, bearer, columns, level) {
			var unit = Math.max(0.5, Number(module) || 2);

			return {Height: (Number(height) || 80) / unit, ShowText: show !== false && show !== 'false', FontSize: (Number(font) || 14) / unit, Dark: dark, Light: light, Round: Number(round) || 0, Shape: shape, Check: check === true || check === 'true', Bearer: bearer !== false && bearer !== 'false', Columns: columns === null || columns === undefined || columns === '' ? undefined : Number(columns), Level: level === null || level === undefined || level === '' ? undefined : Number(level)};
		};

		/* The drawing, its size the one of its modules times Module, or nothing for a text it cannot write (told once). */
		this.Drawing = function (value, format, module, height, show, font, dark, light, round, shape, check, bearer, columns, level) {
			var unit = Math.max(0.5, Number(module) || 2);
			var svg;

			try {
				svg = self.$Service('Barcodes').SVG(format, value, self.Options(module, height, show, font, dark, light, round, shape, check, bearer, columns, level));
				failed = null;

				return svg.replace(/ width="([\d.]+)" height="([\d.]+)"/, function (all, width, high) {
					return ' width="' + Number(width) * unit + '" height="' + Number(high) * unit + '"';
				});
			}
			catch (error) {
				if (failed !== format + '|' + value) {
					failed = format + '|' + value;

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
		return this.Drawing(this.Value, this.Format, this.Module, this.Height, this.ShowText, this.FontSize, this.Dark, this.Light, this.Round, this.Shape, this.Check, this.Bearer, this.Columns, this.Level);
	},

	/* The code as a data URL of a PNG, scale times its size (2: sharp in a print): callback(error, url). */
	Png: function (scale, callback) {
		var svg = this.SVG();
		var size = /width="([\d.]+)" height="([\d.]+)"/.exec(svg);
		var times = Number(scale) || 2;

		if (!size) {
			callback(new Error('Elemenx Barcode has no code to draw'));

			return;
		}

		this.$Service('QR').Raster(svg, Math.round(Number(size[1]) * times), Math.round(Number(size[2]) * times), callback);
	},

	/* Saves the code as name.png (format png) or name.svg (svg): callback(error) after. */
	Download: function (name, format, callback) {
		var native = this.$Service('Native');
		var file = String(name || 'barcode').replace(/\.(png|svg)$/i, '');
		var done = callback || function () {};

		if (format === 'svg') {
			native.Save({Name: file + '.svg', Text: this.SVG(), Accept: ['.svg']}, done);

			return;
		}

		this.Png(2, function (error, url) {
			if (error) {
				done(error);

				return;
			}

			native.Save({Name: file + '.png', Data: url.substring(url.indexOf(',') + 1), Accept: ['.png']}, done);
		});
	}
});
