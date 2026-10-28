/*
 * The spectrum of a sound as it plays: the levels of its bands, live (the Audio Service: an AnalyserNode). Source is
 * what it hears: an <audio> or a <video>, a MediaStream of a microphone or an AudioNode; or Values, the levels of the
 * bands from 0 to 1, given by the application (no Web Audio then). Bands is their count, Scale log (as an ear hears)
 * or linear between MinFrequency and MaxFrequency in Hz, Smoothing (0 to 1) how slowly they move, MinDb and MaxDb the
 * range of the analysis.
 * Mode: bars (the default), mirror (the bars both ways from the middle), line (a filled curve of the bands), radial
 * (the bars around a circle), curve (the analyser of a studio: a point every two pixels, read from the bins of the
 * analysis on a log scale of frequency, a linear one of dB, with Tilt in dB by octave raising the highs, the lines of
 * the Grid and the Fill under it; Peaks a line of the highest levels) or spectrogram (the spectrum in time: a column
 * of colors each frame, the low frequencies at the bottom, scrolling to the left). Colors are the colors of the levels
 * from low to high ([] the accent; for a spectrogram from the quiet to the loudest, over a clear silence: [] the
 * accent, danger, warning, white), Gap the space between the bars in pixels, Peaks the marks of the highest levels, held then falling.
 * Paused stops it. Levels() is what it shows now; error tells a Source it cannot hear, ready gives the component
 * itself.
 */
Elemenx.Component('Spectrum', {
	$TemplateURL: 'Spectrum.html',
	$StyleURL: 'Spectrum.css',
	$Meta: {
		Group: 'music',
		Icon: 'chart',
		Description: 'The spectrum of a sound as it plays, live: bars, mirrored bars, a curve, a circle, the curve of an analyser or a spectrogram.',
		Events: {
			error: 'The Source cannot be heard: the error.',
			ready: 'It is made: the component itself, to call Levels.'
		},
		Methods: ['Levels()'],
		Props: {
			Source: 'What it hears: an audio or video element, a MediaStream or an AudioNode.',
			Values: 'The levels of the bands from 0 to 1, given instead of a Source.',
			Bands: 'The count of the bands (48).',
			Mode: {Options: ['bars', 'mirror', 'line', 'radial', 'curve', 'spectrogram'], Description: 'How the levels are drawn.'},
			Scale: {Options: ['log', 'linear'], Description: 'The frequencies of the bands: log as an ear hears, or linear.'},
			MinFrequency: 'The lowest frequency in Hz (30).',
			MaxFrequency: 'The highest frequency in Hz (16000).',
			Smoothing: 'How slowly the levels move, from 0 to 1 (0.8).',
			MinDb: 'The quietest level of the analysis in decibels (-100).',
			MaxDb: 'The loudest level of the analysis in decibels (-20).',
			Colors: 'The colors of the levels from low to high ([]: the accent).',
			Gap: 'The space between the bars in pixels (2).',
			Peaks: 'Marks the highest levels, held, then falling (a line of them in curve).',
			Tilt: 'In curve and spectrogram, the dB by octave around 1 kHz that raise the highs (3).',
			Grid: 'In curve, the lines of the frequencies and of the dB.',
			Fill: 'In curve, the area under it filled.',
			Height: 'The height in pixels (120).',
			Paused: 'Stops it where it is.',
			Label: 'What it shows, for screen readers.'
		},
		Sample: {Values: [0.2, 0.45, 0.8, 0.95, 0.7, 0.6, 0.75, 0.5, 0.42, 0.55, 0.38, 0.3, 0.33, 0.24, 0.18, 0.12], Bands: 16}
	},
	Source: null,
	Values: null,
	Bands: 48,
	Mode: 'bars',
	Scale: 'log',
	MinFrequency: 30,
	MaxFrequency: 16000,
	Smoothing: 0.8,
	MinDb: -100,
	MaxDb: -20,
	Colors: [],
	Gap: 2,
	Peaks: true,
	Tilt: 3,
	Grid: true,
	Fill: true,
	Height: 120,
	Paused: false,
	Label: '',

	$OnCreate: function () {
		/* What renders nothing: the analyser of the Source, the levels and their peaks, the frame asked for. */
		var own = {Analyser: null, Heard: null, Key: '', Levels: [], Marks: [], Frame: 0, Observer: null, History: null, Palette: null};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();

		own.Observer = typeof ResizeObserver === 'function' ? new ResizeObserver(function () {
			self.Draw();
		}) : null;

		if (own.Observer)
			own.Observer.observe(this.Canvas());

		this.Connect();

		if (!own.Analyser)
			this.Update(this.Values || []);

		this.$Emit('ready', this);
	},

	$OnProps: function () {
		this.Connect();

		if (!this.Own().Analyser)
			this.Update(this.Values || []);
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Observer)
			own.Observer.disconnect();

		this.Stop();

		this.$Service('Audio').Release(own.Analyser);

		own.Analyser = null;
	},

	Canvas: function () {
		return this.$Element().querySelector('.elemenx-spectrum-canvas');
	},

	/* The analyser of the Source, made again when the Source or the settings of the analysis change; the frames run. */
	Connect: function () {
		var own = this.Own();
		var audio = this.$Service('Audio');
		var key = this.Source ? [this.MinDb, this.MaxDb, this.Smoothing].join('|') : '';

		if (own.Heard === this.Source && own.Key === key) {
			this.Run();

			return;
		}

		audio.Release(own.Analyser);

		own.Analyser = null;
		own.Heard = this.Source;
		own.Key = key;

		if (this.Source) {
			try {
				own.Analyser = audio.Analyser(this.Source, {Size: 4096, Smoothing: this.Smoothing, MinDb: this.MinDb, MaxDb: this.MaxDb});
			}
			catch (error) {
				this.$Emit('error', error);
			}
		}

		this.Run();
	},

	/* The frames while there is an analyser to read and it is not Paused. */
	Run: function () {
		var self = this;
		var own = this.Own();

		if (!own.Analyser || this.Paused === true || this.Paused === 'true') {
			this.Stop();

			return;
		}

		if (own.Frame) return;

		function frame () {
			own.Frame = 0;

			if (!own.Analyser || self.Paused === true || self.Paused === 'true') return;

			self.Update(self.Heard(own.Analyser));

			own.Frame = window.requestAnimationFrame(frame);
		}

		own.Frame = window.requestAnimationFrame(frame);
	},

	Stop: function () {
		var own = this.Own();
		if (own.Frame)
			window.cancelAnimationFrame(own.Frame);

		own.Frame = 0;
	},

	/*
	 * What the analyser hears now, as the Mode draws it: the bands, or for a curve a point every two pixels of the
	 * width, and for a spectrogram one every pixel of the height.
	 */
	Heard: function (analyser) {
		var audio = this.$Service('Audio');
		var canvas = this.Canvas();
		var options = {Scale: this.Scale, MinFrequency: this.MinFrequency, MaxFrequency: this.MaxFrequency, Tilt: this.Tilt};

		if (this.Mode === 'curve')
			return audio.Curve(analyser, Math.max(2, Math.ceil((canvas ? canvas.clientWidth : 0) / 2) + 1), options);

		if (this.Mode === 'spectrogram')
			return audio.Curve(analyser, Math.max(2, canvas ? canvas.clientHeight : 0), options);

		return audio.Bands(analyser, Math.max(1, Number(this.Bands) || 48), options);
	},

	/* New levels: the peaks go up with them, wait about half a second, then fall. */
	Update: function (levels) {
		var own = this.Own();

		own.Levels = levels.map(function (level) {
			return Math.max(0, Math.min(1, Number(level) || 0));
		});

		/* Another count of levels (a curve of another width) starts its peaks again. */
		if (own.Marks.length !== own.Levels.length)
			own.Marks = [];

		own.Marks = own.Levels.map(function (level, index) {
			var mark = own.Marks[index] || {Value: 0, Hold: 0};
			if (level >= mark.Value)
				return {Value: level, Hold: 30};

			if (mark.Hold > 0)
				return {Value: mark.Value, Hold: mark.Hold - 1};

			return {Value: Math.max(level, mark.Value - 0.015), Hold: 0};
		});

		this.Draw(true);
	},

	Levels: function () {
		return this.Own().Levels.slice();
	},

	/* A color as the canvas takes it: a var(--token) of the theme is read from the element. */
	Resolve: function (color) {
		var match = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/.exec(String(color).trim());
		var value;

		if (!match)
			return color;

		value = getComputedStyle(this.$Element()).getPropertyValue(match[1]).trim();

		return value || match[2] || '#3f6c9e';
	},

	/* The paint of the levels: one color, or a gradient from low to high along from-to. */
	Paint: function (context, x0, y0, x1, y1) {
		var self = this;
		var colors = (this.Colors || []).length ? this.Colors : [getComputedStyle(this.$Element()).color];
		var gradient;

		if (colors.length === 1)
			return this.Resolve(colors[0]);

		gradient = context.createLinearGradient(x0, y0, x1, y1);

		colors.forEach(function (color, index) {
			gradient.addColorStop(index / (colors.length - 1), self.Resolve(color));
		});

		return gradient;
	},

	/* With fresh, new levels came (a spectrogram moves on by a column); without, it is drawn again as it is (a new size). */
	Draw: function (fresh) {
		var own = this.Own();
		var canvas = this.Canvas();
		var ratio = window.devicePixelRatio || 1;
		var width = canvas ? canvas.clientWidth : 0;
		var height = canvas ? canvas.clientHeight : 0;
		var levels = own.Levels;
		var marks = this.Peaks !== false && this.Peaks !== 'false' ? own.Marks : [];
		var count = levels.length;
		var gap = Math.max(0, Number(this.Gap) || 0);
		var context;

		if (!width || !height) return;

		if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
			canvas.width = Math.round(width * ratio);
			canvas.height = Math.round(height * ratio);
		}

		context = canvas.getContext('2d');

		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		context.clearRect(0, 0, width, height);

		if (this.Mode === 'spectrogram') {
			this.Spectrogram(context, canvas, count ? levels : [], fresh === true);

			return;
		}

		if (!count) return;

		if (this.Mode === 'curve') {
			this.Curve(context, width, height, levels, marks);

			return;
		}

		if (this.Mode === 'radial') {
			this.Radial(context, width, height, levels, marks);

			return;
		}

		if (this.Mode === 'line') {
			this.Line(context, width, height, levels);

			return;
		}

		var bar = Math.max(1, (width - gap * (count - 1)) / count);
		var mirror = this.Mode === 'mirror';
		var middle = height / 2;
		var k;

		context.fillStyle = mirror ? this.Paint(context, 0, middle, 0, 0) : this.Paint(context, 0, height, 0, 0);

		for (k = 0; k < count; k++) {
			var x = k * (bar + gap);
			var size = Math.max(1, levels[k] * (mirror ? middle : height));

			if (mirror) context.fillRect(x, middle - size, bar, size * 2);
			else context.fillRect(x, height - size, bar, size);
		}

		context.fillStyle = this.Resolve('var(--elemenx-text, #1f2328)');

		for (k = 0; k < marks.length && k < count; k++) {
			var top = marks[k].Value * (mirror ? middle : height);
			if (top < 2) continue;

			if (mirror) {
				context.fillRect(k * (bar + gap), middle - top - 2, bar, 2);
				context.fillRect(k * (bar + gap), middle + top, bar, 2);
			}
			else {
				context.fillRect(k * (bar + gap), height - top - 2, bar, 2);
			}
		}
	},

	/* The levels as a curve through the middles of the bands, filled under it. */
	Line: function (context, width, height, levels) {
		var count = levels.length;
		var step = width / count;
		var points = levels.map(function (level, index) {
			return {X: (index + 0.5) * step, Y: height - level * (height - 2) - 1};
		});
		var k;

		context.beginPath();
		context.moveTo(0, points[0].Y);

		for (k = 0; k < points.length - 1; k++) {
			context.quadraticCurveTo(points[k].X, points[k].Y, (points[k].X + points[k + 1].X) / 2, (points[k].Y + points[k + 1].Y) / 2);
		}

		context.lineTo(width, points[points.length - 1].Y);

		context.lineWidth = 2;
		context.strokeStyle = this.Paint(context, 0, height, 0, 0);

		context.stroke();

		context.lineTo(width, height);
		context.lineTo(0, height);
		context.closePath();

		context.globalAlpha = 0.25;
		context.fillStyle = this.Paint(context, 0, height, 0, 0);

		context.fill();

		context.globalAlpha = 1;
	},

	/* Levels spread over count points, read between the two they fall between. */
	Resample: function (levels, count) {
		var points = [];
		var k;

		for (k = 0; k < count; k++) {
			var at = levels.length > 1 ? k / (count - 1) * (levels.length - 1) : 0;
			var below = Math.floor(at);
			var above = Math.min(levels.length - 1, below + 1);

			points.push(levels[below] + (levels[above] - levels[below]) * (at - below));
		}

		return points;
	},

	/* The place of a frequency across the width, from 0 to 1, on the Scale between MinFrequency and MaxFrequency. */
	Across: function (frequency) {
		var low = Math.max(1, Number(this.MinFrequency) || 30);
		var high = Math.max(low + 1, Number(this.MaxFrequency) || 16000);

		if (this.Scale === 'linear')
			return (frequency - low) / (high - low);

		return Math.log(frequency / low) / Math.log(high / low);
	},

	/* The lines of the frequencies (1, 2, 5 of each decade; the decades named) and of the dB (every 12). */
	Rules: function (context, width, height) {
		var low = Number(this.MinFrequency) || 30;
		var high = Number(this.MaxFrequency) || 16000;
		var min = Number(this.MinDb);
		var max = Number(this.MaxDb);
		var decade;
		var step;
		var db;

		context.lineWidth = 1;
		context.strokeStyle = this.Resolve('var(--elemenx-border, #d0d7de)');
		context.fillStyle = this.Resolve('var(--elemenx-text-muted, #656d76)');
		context.font = '10px sans-serif';
		context.textBaseline = 'bottom';

		for (decade = 10; decade <= high; decade *= 10) {
			[1, 2, 5].forEach(function (factor) {
				var frequency = decade * factor;
				var x = Math.round(this.Across(frequency) * width) + 0.5;

				if (frequency < low || frequency > high) return;

				context.globalAlpha = factor === 1 ? 0.9 : 0.45;

				context.beginPath();
				context.moveTo(x, 0);
				context.lineTo(x, height);
				context.stroke();

				if (factor === 1) {
					context.globalAlpha = 1;

					context.fillText(frequency >= 1000 ? frequency / 1000 + 'k' : String(frequency), x + 3, height - 2);
				}
			}, this);
		}

		step = isFinite(min) && isFinite(max) && max > min ? (height - 2) * 12 / (max - min) : 0;

		context.globalAlpha = 0.45;

		for (db = 1; step && db * step < height - 2; db++) {
			var y = Math.round(height - 1 - db * step) + 0.5;

			context.beginPath();
			context.moveTo(0, y);
			context.lineTo(width, y);
			context.stroke();
		}

		context.globalAlpha = 1;
	},

	/* The analyser of a studio: the levels as a curve over the width, the Grid under it, the Fill, and the line of the Peaks. */
	Curve: function (context, width, height, levels, marks) {
		var points = this.Resample(levels, Math.max(2, Math.ceil(width / 2) + 1));
		var peaks = marks.length ? this.Resample(marks.map(function (mark) {
			return mark.Value;
		}), points.length) : [];
		var fill;

		function trace (values) {
			var k;

			function x (index) {
				return index / (values.length - 1) * width;
			}

			function y (value) {
				return height - 1 - value * (height - 2);
			}

			context.beginPath();
			context.moveTo(0, y(values[0]));

			for (k = 0; k < values.length - 1; k++)
				context.quadraticCurveTo(x(k), y(values[k]), (x(k) + x(k + 1)) / 2, (y(values[k]) + y(values[k + 1])) / 2);

			context.lineTo(width, y(values[values.length - 1]));
		}

		if (this.Grid !== false && this.Grid !== 'false')
			this.Rules(context, width, height);

		if (this.Fill !== false && this.Fill !== 'false') {
			trace(points);

			context.lineTo(width, height);
			context.lineTo(0, height);
			context.closePath();

			fill = this.Paint(context, 0, height, 0, 0);

			context.globalAlpha = 0.3;
			context.fillStyle = fill;

			context.fill();

			context.globalAlpha = 1;
		}

		trace(points);

		context.lineWidth = 1.5;
		context.lineJoin = 'round';
		context.strokeStyle = this.Paint(context, 0, height, 0, 0);

		context.stroke();

		if (peaks.length) {
			trace(peaks);

			context.lineWidth = 1;
			context.globalAlpha = 0.55;
			context.strokeStyle = this.Resolve('var(--elemenx-text, #1f2328)');

			context.stroke();

			context.globalAlpha = 1;
		}
	},

	/*
	 * The colors of a spectrogram from silence (clear, the background under it) to the loudest, 256 of them as [r, g, b,
	 * a]; kept while Colors stay.
	 */
	Palette: function () {
		var own = this.Own();
		var colors = ['rgba(0, 0, 0, 0)'].concat((this.Colors || []).length ? this.Colors : ['var(--elemenx-accent, #3f6c9e)', 'var(--elemenx-danger, #cf222e)', 'var(--elemenx-warning, #d4a72c)', '#ffffff']);
		var resolved = colors.map(this.Resolve, this);
		var key = resolved.join('|');
		var canvas;
		var context;
		var gradient;
		var data;

		if (own.Palette && own.Palette.Key === key) return own.Palette.Colors;

		canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 1;
		context = canvas.getContext('2d');
		gradient = context.createLinearGradient(0, 0, 256, 0);

		resolved.forEach(function (color, index) {
			gradient.addColorStop(index / (resolved.length - 1), color);
		});

		context.fillStyle = gradient;

		context.fillRect(0, 0, 256, 1);

		data = context.getImageData(0, 0, 256, 1).data;

		own.Palette = {Key: key, Colors: data};

		return data;
	},

	/*
	 * The spectrum in time: its history kept on a canvas of its own the size of the one shown. Fresh levels move it to
	 * the left by a pixel and paint the new column at the right, the low frequencies at the bottom.
	 */
	Spectrogram: function (context, canvas, levels, fresh) {
		var own = this.Own();
		var width = canvas.width;
		var height = canvas.height;
		var step = Math.max(1, Math.round(window.devicePixelRatio || 1));
		var history = own.History;
		var drawing;
		var column;
		var palette;
		var rows;
		var y;

		if (!history || history.width !== width || history.height !== height) {
			history = document.createElement('canvas');
			history.width = width;
			history.height = height;

			/* A new size keeps what was drawn, stretched to it. */
			if (own.History)
				history.getContext('2d').drawImage(own.History, 0, 0, width, height);

			own.History = history;
		}

		drawing = history.getContext('2d');

		if (fresh && levels.length && width > step) {
			drawing.putImageData(drawing.getImageData(step, 0, width - step, height), 0, 0);

			palette = this.Palette();
			column = drawing.createImageData(step, height);
			rows = this.Resample(levels, height);

			for (y = 0; y < height; y++) {
				var tone = Math.max(0, Math.min(255, Math.round(rows[height - 1 - y] * 255))) * 4;
				var x;

				for (x = 0; x < step; x++) {
					var at = (y * step + x) * 4;

					column.data[at] = palette[tone];
					column.data[at + 1] = palette[tone + 1];
					column.data[at + 2] = palette[tone + 2];
					column.data[at + 3] = palette[tone + 3];
				}
			}

			drawing.putImageData(column, width - step, 0);
		}

		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, width, height);

		context.drawImage(history, 0, 0);
	},

	/* The bars around a circle, the low bands at the top going clockwise. */
	Radial: function (context, width, height, levels, marks) {
		var count = levels.length;
		var x = width / 2;
		var y = height / 2;
		var outer = Math.min(width, height) / 2 - 2;
		var inner = outer * 0.42;
		var k;

		context.lineCap = 'round';
		context.lineWidth = Math.max(1.5, Math.min(8, inner * 2 * Math.PI / count * 0.6));
		context.strokeStyle = this.Paint(context, x, y - inner, x, y - outer);

		/* A radial gradient follows each bar: the levels go out from the circle. */
		if ((this.Colors || []).length > 1) {
			var gradient = context.createRadialGradient(x, y, inner, x, y, outer);
			var self = this;

			this.Colors.forEach(function (color, index) {
				gradient.addColorStop(index / (self.Colors.length - 1), self.Resolve(color));
			});

			context.strokeStyle = gradient;
		}

		for (k = 0; k < count; k++) {
			var angle = k / count * Math.PI * 2 - Math.PI / 2;
			var length = Math.max(1, levels[k] * (outer - inner));

			context.beginPath();
			context.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
			context.lineTo(x + Math.cos(angle) * (inner + length), y + Math.sin(angle) * (inner + length));
			context.stroke();
		}

		context.fillStyle = this.Resolve('var(--elemenx-text, #1f2328)');

		for (k = 0; k < marks.length && k < count; k++) {
			var at = k / count * Math.PI * 2 - Math.PI / 2;
			var reach = inner + marks[k].Value * (outer - inner) + 3;

			if (marks[k].Value < 0.02) continue;

			context.beginPath();
			context.arc(x + Math.cos(at) * reach, y + Math.sin(at) * reach, 1.5, 0, Math.PI * 2);
			context.fill();
		}
	}
});
