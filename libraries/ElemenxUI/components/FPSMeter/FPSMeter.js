/*
 * FPSMeter: how smoothly the page draws, by the FPS Service: the frames a second, the median time of a frame, its
 * 95th percentile and the longest, how many were slow (over 25 ms) or long (over 50 ms), a graph of the last frames
 * (Graph), and the numbers what draws tells of its own frames (Sources: a Scene its CPU and GPU milliseconds). Corner
 * puts it over the corner of the nearest positioned element (top-left, top-right, bottom-left, bottom-right); empty, it
 * stands in the page. Every is how often it changes, ms. It times nothing while it is not shown on a page.
 */
Elemenx.Component('FPSMeter', {
	$TemplateURL: 'FPSMeter.html',
	$StyleURL: 'FPSMeter.css',
	$Meta: {
		Group: 'display',
		Icon: 'chart',
		Description: 'How smoothly the page draws: frames a second, the times of frames, a graph and the numbers of what draws.',
		Props: {
			Corner: {Options: ['', 'top-left', 'top-right', 'bottom-left', 'bottom-right'], Description: 'Over a corner of the nearest positioned element; empty: in the page.'},
			Graph: 'Draws the times of the last frames.',
			Sources: 'Shows the numbers what draws tells (a Scene: its CPU and GPU milliseconds).',
			Every: 'How often it changes, ms.'
		},
		Sample: {Graph: true}
	},
	Corner: '',
	Graph: true,
	Sources: true,
	Every: 500,
	Stats: null,

	$OnCreate: function () {
		var self = this;
		var own = {Watch: null};

		this.Own = function () {
			return own;
		};

		this.Round = function (value) {
			return Math.round(Number(value) * 10) / 10;
		};

		/* The numbers of the sources, as lines: Scene CPU 6.1 ms, GPU 9.4 ms... */
		this.Lines = function (stats) {
			var lines = [];

			if (!stats)
				return lines;

			Object.keys(stats.Sources).forEach(function (source) {
				var values = stats.Sources[source];

				lines.push({Source: source, Values: Object.keys(values).map(function (key) {
					return key + ' ' + self.Round(values[key].Mean) + ' / ' + self.Round(values[key].Max);
				}).join(' · ')});
			});

			return lines;
		};

		/* The level of a time of a frame: good up to 17 ms, slow up to 34, bad beyond. */
		this.Level = function (stats) {
			if (!stats || !stats.Frames) return 'good';

			return stats.P95 > 34 ? 'bad' : stats.P95 > 17.5 ? 'slow' : 'good';
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();

		own.Watch = this.$Service('FPS').Watch(function (stats) {
			if (!self.$Element().isConnected) return;

			self.Stats = stats;

			if (self.Graph && self.Graph !== 'false')
				self.Draw(self.$Service('FPS').History());
		}, this.Every);
	},

	/* The graph: a bar for each frame, as high as it was long, up to 50 ms; the lines of 16.7 and 33.3 ms across. */
	Draw: function (history) {
		var canvas = this.$Element().querySelector('.elemenx-fps-meter-graph');
		var context = canvas ? canvas.getContext('2d') : null;
		var width;
		var height;
		var step;
		var style;
		var colors;
		var tall;
		var i = 0;

		if (!context) return;

		width = canvas.width;
		height = canvas.height;
		step = width / Math.max(1, history.length);
		style = window.getComputedStyle(canvas);
		colors = {Good: style.getPropertyValue('--elemenx-fps-meter-good').trim() || '#3fb950', Slow: style.getPropertyValue('--elemenx-fps-meter-slow').trim() || '#d29922', Bad: style.getPropertyValue('--elemenx-fps-meter-bad').trim() || '#f85149', Line: style.getPropertyValue('--elemenx-fps-meter-line').trim() || 'rgba(255, 255, 255, 0.35)'};

		context.clearRect(0, 0, width, height);

		while (i < history.length) {
			tall = Math.min(1, history[i] / 50) * height;
			context.fillStyle = history[i] > 33.4 ? colors.Bad : history[i] > 17.5 ? colors.Slow : colors.Good;

			context.fillRect(i * step, height - tall, Math.max(1, step - 0.5), tall);

			i++;
		}

		context.fillStyle = colors.Line;

		context.fillRect(0, height - height * 16.7 / 50, width, 1);
		context.fillRect(0, height - height * 33.3 / 50, width, 1);
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Watch)
			own.Watch.Stop();

		own.Watch = null;
	}
});
