/*
 * The spectrum of a sound as it plays: the levels of its bands, live (the Audio Service: an AnalyserNode). Source is
 * what it hears: an <audio> or a <video>, a MediaStream of a microphone or an AudioNode; or Values, the levels of the
 * bands from 0 to 1, given by the application (no Web Audio then). Bands is their count, Scale log (as an ear hears)
 * or linear between MinFrequency and MaxFrequency in Hz, Smoothing (0 to 1) how slowly they move, MinDb and MaxDb the
 * range of the analysis.
 * Mode: bars (the default), mirror (the bars both ways from the middle), line (a filled curve) or radial (the bars
 * around a circle). Colors are the colors of the levels from low to high ([] the accent), Gap the space between the
 * bars in pixels, Peaks the marks of the highest levels, held then falling. Paused stops it. Levels() is what it shows
 * now; error tells a Source it cannot hear, ready gives the component itself.
 */
Elemenx.Component('Spectrum', {
	$TemplateURL: 'Spectrum.html',
	$StyleURL: 'Spectrum.css',
	$Meta: {
		Group: 'music',
		Icon: 'chart',
		Description: 'The spectrum of a sound as it plays, live: bars, mirrored bars, a curve or a circle.',
		Events: {
			error: 'The Source cannot be heard: the error.',
			ready: 'It is made: the component itself, to call Levels.'
		},
		Methods: ['Levels()'],
		Props: {
			Source: 'What it hears: an audio or video element, a MediaStream or an AudioNode.',
			Values: 'The levels of the bands from 0 to 1, given instead of a Source.',
			Bands: 'The count of the bands (48).',
			Mode: {Options: ['bars', 'mirror', 'line', 'radial'], Description: 'How the levels are drawn.'},
			Scale: {Options: ['log', 'linear'], Description: 'The frequencies of the bands: log as an ear hears, or linear.'},
			MinFrequency: 'The lowest frequency in Hz (30).',
			MaxFrequency: 'The highest frequency in Hz (16000).',
			Smoothing: 'How slowly the levels move, from 0 to 1 (0.8).',
			MinDb: 'The quietest level of the analysis in decibels (-100).',
			MaxDb: 'The loudest level of the analysis in decibels (-20).',
			Colors: 'The colors of the levels from low to high ([]: the accent).',
			Gap: 'The space between the bars in pixels (2).',
			Peaks: 'Marks the highest levels, held, then falling.',
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
	Height: 120,
	Paused: false,
	Label: '',

	$OnCreate: function () {
		/* What renders nothing: the analyser of the Source, the levels and their peaks, the frame asked for. */
		var own = {Analyser: null, Heard: null, Key: '', Levels: [], Marks: [], Frame: 0, Observer: null};

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

			self.Update(self.$Service('Audio').Bands(own.Analyser, Math.max(1, Number(self.Bands) || 48), {Scale: self.Scale, MinFrequency: self.MinFrequency, MaxFrequency: self.MaxFrequency}));

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

	/* New levels: the peaks go up with them, wait about half a second, then fall. */
	Update: function (levels) {
		var own = this.Own();

		own.Levels = levels.map(function (level) {
			return Math.max(0, Math.min(1, Number(level) || 0));
		});

		own.Marks = own.Levels.map(function (level, index) {
			var mark = own.Marks[index] || {Value: 0, Hold: 0};
			if (level >= mark.Value)
				return {Value: level, Hold: 30};

			if (mark.Hold > 0)
				return {Value: mark.Value, Hold: mark.Hold - 1};

			return {Value: Math.max(level, mark.Value - 0.015), Hold: 0};
		});

		this.Draw();
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

	Draw: function () {
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

		if (!count) return;

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
