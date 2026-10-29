/*
 * A diagram written as text (the Diagrams Service, a subset of the language of Mermaid): a flowchart, a sequence, the
 * states, the entities (ER), a Gantt chart, the classes or a mind map, by its first line. Without Value the text is
 * the body of the element (<Diagram>flowchart LR ...</Diagram>), without the indentation its lines share. A text it
 * cannot read shows the reason and emits error (its Line is the number of the line). In a page it takes the colors of
 * the theme; SVG() returns it as the text of an SVG (its own colors, out of a page), Png(scale, callback) as a data URL
 * of a PNG, Download(name, format) saves it as name.png or name.svg; ready gives the component itself, to call them.
 */
Elemenx.Component('Diagram', {
	$TemplateURL: 'Diagram.html',
	$StyleURL: 'Diagram.css',
	$Meta: {
		Group: 'codes',
		Icon: 'share-2',
		Description: 'A diagram written as text (a subset of Mermaid): a flowchart, a sequence, states, ER, Gantt, classes or a mind map.',
		Events: {
			error: 'The text cannot be read: the error, its Line the number of the line.',
			ready: 'It is made: the component itself, to call Download, Png or SVG.'
		},
		Methods: ['SVG()', 'Png(scale, callback)', 'Download(name, format)'],
		Props: {
			Value: {Body: true, Description: 'The text of the diagram; without it, the body of the element.'},
			FontSize: 'The size of its text in pixels (14).',
			Label: 'What the diagram shows, for screen readers.'
		},
		Sample: {Value: 'flowchart LR\n  A[Start] --> B{Ready?}\n  B -->|yes| C[Go]\n  B -->|no| A'}
	},
	Value: '',
	FontSize: 14,
	Label: '',
	Body: '',

	$OnCreate: function () {
		var self = this;
		var failed = null;
		var id = 'elemenx-diagram-' + Math.random().toString(36).slice(2, 10);
		var helpers = this.$Service('ElemenxHelpers');

		/* The text of the body without the indentation its lines share and the blank lines around them. */
		function bodyText (node) {
			return helpers.BodyText(node);
		}

		/* What renders nothing: the place of the body and the id of the drawing, kept out of state. */
		this.Own = function () {
			return {Text: bodyText, Id: id};
		};

		/* The drawing, or the reason a text cannot be drawn (told once by error). */
		this.Drawing = function (text, size) {
			try {
				if (!String(text || '').trim()) return '';

				failed = null;

				return self.$Service('Diagrams').SVG(text, {Id: id, FontSize: size});
			}
			catch (error) {
				if (failed !== text) {
					failed = text;

					window.setTimeout(function () {
						self.$Emit('error', error);
					}, 0);
				}

				return '<div class="elemenx-diagram-error">' + String(error.message).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>';
			}
		};
	},

	/* The body read once it is there, and again as it changes; ready gives the component itself. */
	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var source = this.$Element().querySelector('.elemenx-diagram-source');

		if (source) {
			this.Body = own.Text(source);

			this.Watcher = new MutationObserver(function () {
				var text = own.Text(source);
				if (text !== self.Body)
					self.Body = text;
			});

			this.Watcher.observe(source, {childList: true, characterData: true, subtree: true});
		}

		this.$Emit('ready', this);
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();
	},

	/* The diagram as the text of an SVG, or '' when its text cannot be drawn. */
	SVG: function () {
		try {
			return this.$Service('Diagrams').SVG(this.Value || this.Body, {Id: this.Own().Id + '-file', FontSize: this.FontSize});
		}
		catch (error) {
			return '';
		}
	},

	/* The diagram as a data URL of a PNG, scale times its size (2: sharp in a print): callback(error, url). */
	Png: function (scale, callback) {
		var svg = this.SVG();
		var size = /width="([\d.]+)" height="([\d.]+)"/.exec(svg);
		var times = Number(scale) || 2;

		if (!size) {
			callback(new Error('Elemenx Diagram has no diagram to draw'));

			return;
		}

		this.$Service('QR').Raster(svg, Math.round(Number(size[1]) * times), Math.round(Number(size[2]) * times), callback);
	},

	/* Saves the diagram as name.png (format png) or name.svg (svg): callback(error) after. */
	Download: function (name, format, callback) {
		var native = this.$Service('Platform');
		var file = String(name || 'diagram').replace(/\.(png|svg)$/i, '');
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
