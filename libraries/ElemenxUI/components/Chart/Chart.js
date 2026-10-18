/*
 * A chart in SVG, as wide as its container. Type: line, area, bar, pie or donut. Labels name the points of the
 * x axis (or the slices of a pie); Series: [{Name, Values, Color}] (a pie shows the first series). Stacked piles the
 * bars and areas of the series. The y axis takes round steps from the values (Min and Max fix it). The pointer shows
 * the values at a label in a tooltip; the legend turns a series (or a slice) off and on (Hidden holds their names).
 * Format(value) writes a value (by default in the locale, with Unit). Height is the height in pixels. A table of the
 * data stays in the page for screen readers. Events: hover ({Index, Label}), toggle (Hidden).
 */
Elemenx.Component('Chart', {
	$TemplateURL: 'Chart.html',
	$StyleURL: 'Chart.css',
	Type: 'line',
	Labels: [],
	Series: [],
	Height: 240,
	Stacked: false,
	Legend: true,
	Min: null,
	Max: null,
	Unit: '',
	Format: null,
	Label: '',
	Hidden: [],
	Hover: -1,
	Width: 600,
	Palette: ['#3f6c9e', '#c2477f', '#2f8f83', '#d99a1e', '#7a4fb0', '#d25f3a', '#5f7d2e', '#0f8fae'],

	$OnCreate: function () {
		var self = this;
		var memo = {Key: null, Value: null};

		this.ColorOf = function (series, index) {
			return series && series.Color || self.Palette[index % self.Palette.length];
		};

		this.Text = function (value) {
			if (value == null || isNaN(value)) return '—';
			if (typeof self.Format === 'function') return self.Format(value);

			return Number(value).toLocaleString() + (self.Unit ? ' ' + self.Unit : '');
		};

		this.IsHidden = function (hidden, name) {
			return (hidden || []).indexOf(name) !== -1;
		};

		/* Everything drawn, worked out once for the same input. */
		this.Geometry = function (type, labels, series, hidden, width, height, stacked) {
			var key = JSON.stringify([type, labels, series, hidden, width, height, stacked, self.Min, self.Max]);

			if (key !== memo.Key) {
				memo.Key = key;
				memo.Value = type === 'pie' || type === 'donut' ? self.Round(type, labels, series, hidden, width, height) : self.Axes(type, labels, series, hidden, width, height, stacked);
			}

			return memo.Value;
		};

		/* The geometry of the props now: the template calls it, and reads the props through it. */
		this.G = function () {
			return self.Geometry(self.Type, self.Labels, self.Series, self.Hidden, self.Width, self.Height, self.Stacked);
		};

		/* Where the tooltip stands: beside the point, on the side with room. */
		this.TipX = function (hover) {
			var geometry = self.G();
			var x;

			if (geometry.Round)
				return geometry.Center.X;

			x = geometry.Plot.X + (geometry.Banded ? geometry.Band * hover + geometry.Band / 2 : geometry.Step * hover);

			return x;
		};

		this.TipSide = function (hover) {
			return self.TipX(hover) > Number(self.Width) / 2 ? 'left' : 'right';
		};

		this.Percent = function (value) {
			var geometry = self.G();

			return geometry.Round ? Math.round(value / geometry.Total * 100) + '%' : '';
		};

		/* The values at a label, for the tooltip: [{Name, Color, Value}]. */
		this.At = function (index, series, hidden) {
			return (series || []).map(function (entry, position) {
				return {Name: entry.Name, Color: self.ColorOf(entry, position), Value: (entry.Values || [])[index]};
			}).filter(function (entry) {
				return !self.IsHidden(hidden, entry.Name);
			});
		};

		this.Legend = function (type, labels, series) {
			if (type === 'pie' || type === 'donut')
				return (labels || []).map(function (label, index) {
					return {Name: String(label), Color: self.Palette[index % self.Palette.length]};
				});

			return (series || []).map(function (entry, index) {
				return {Name: entry.Name, Color: self.ColorOf(entry, index)};
			});
		};
	},

	$OnReady: function () {
		var self = this;
		var root = this.$Element();

		this.Measure = function () {
			var width = Math.max(120, Math.floor(root.clientWidth));
			if (width !== self.Width)
				self.Width = width;
		};

		this.Measure();

		if (typeof ResizeObserver === 'function') {
			this.Observer = new ResizeObserver(this.Measure);

			this.Observer.observe(root);
		}
	},

	$OnDestroy: function () {
		if (this.Observer)
			this.Observer.disconnect();
	},

	/* Round steps from low to high, about count of them. */
	Ticks: function (low, high, count) {
		var span;
		var step;
		var error;
		var ticks = [];
		var value;

		if (low === high) {
			high = low + 1;
			low = Math.min(0, low);
		}

		span = high - low;
		step = Math.pow(10, Math.floor(Math.log(span / count) / Math.LN10));
		error = span / count / step;

		if (error >= 7.5) step *= 10;
		else if (error >= 3.5) step *= 5;
		else if (error >= 1.5) step *= 2;

		value = Math.floor(low / step) * step;

		while (value <= Math.ceil(high / step) * step + step / 2) {
			ticks.push(Number(value.toFixed(10)));

			value += step;
		}

		return ticks;
	},

	/* Line, area and bar charts: the plot box, the ticks of both axes, the lines and the bars. */
	Axes: function (type, labels, series, hidden, width, height, stacked) {
		var self = this;
		var shown = [];
		var plot = {X: 48, Y: 8, W: Math.max(40, Number(width) - 56), H: Math.max(40, Number(height) - 36)};
		var count = Math.max(1, (labels || []).length);
		var bars = type === 'bar';
		var band = plot.W / count;
		var step = bars ? band : count > 1 ? plot.W / (count - 1) : 0;
		var totals = [];
		var values = [0];
		var ticks;
		var low;
		var high;
		var result = {Plot: plot, Ticks: [], Labels: [], Lines: [], Bars: [], Band: band, Step: step, Banded: bars};

		(series || []).forEach(function (entry, index) {
			if (!self.IsHidden(hidden, entry.Name))
				shown.push({Series: entry, Index: index, Color: self.ColorOf(entry, index)});
		});

		shown.forEach(function (entry) {
			(entry.Series.Values || []).forEach(function (value, index) {
				totals[index] = (totals[index] || 0) + (Number(value) || 0);

				values.push(Number(value) || 0);
			});
		});

		if (stacked)
			values = values.concat(totals);

		ticks = this.Ticks(this.Min != null && this.Min !== '' ? Number(this.Min) : Math.min.apply(Math, values), this.Max != null && this.Max !== '' ? Number(this.Max) : Math.max.apply(Math, values), 5);
		low = ticks[0];
		high = ticks[ticks.length - 1];

		function y (value) {
			return plot.Y + plot.H - (value - low) / (high - low || 1) * plot.H;
		}

		function x (index) {
			return plot.X + (bars ? band * index + band / 2 : step * index);
		}

		result.Ticks = ticks.map(function (value) {
			return {Key: String(value), Y: y(value), Label: self.Text(value)};
		});

		/* Labels of the x axis: as many as fit, about one per 64 pixels. */
		(labels || []).forEach(function (label, index) {
			var every = Math.max(1, Math.ceil(count * 64 / plot.W));
			if (index % every === 0)
				result.Labels.push({Key: String(index), X: x(index), Label: String(label)});
		});

		if (bars) {
			(function () {
				var groups = stacked ? 1 : Math.max(1, shown.length);
				var inner = band * 0.72;
				var width1 = inner / groups;
				var base = [];

				shown.forEach(function (entry, position) {
					(entry.Series.Values || []).forEach(function (value, index) {
						var bottom = stacked ? base[index] || 0 : 0;
						var top = bottom + (Number(value) || 0);
						var left = plot.X + band * index + (band - inner) / 2 + (stacked ? 0 : width1 * position);

						base[index] = top;

						result.Bars.push({Key: entry.Index + ':' + index, X: left, Y: Math.min(y(top), y(bottom)), Width: Math.max(1, width1 - (groups > 1 ? 2 : 0)), Height: Math.max(1, Math.abs(y(bottom) - y(top))), Color: entry.Color, Index: index});
					});
				});
			})();

			return result;
		}

		(function () {
			var base = [];

			shown.forEach(function (entry) {
				var points = (entry.Series.Values || []).map(function (value, index) {
					var bottom = stacked ? base[index] || 0 : 0;
					var top = bottom + (Number(value) || 0);

					base[index] = top;

					return {X: x(index), Y: y(stacked ? top : Number(value) || 0), Bottom: y(bottom), Index: index};
				});
				var line = points.map(function (point, index) {
					return (index ? 'L' : 'M') + point.X.toFixed(1) + ' ' + point.Y.toFixed(1);
				}).join(' ');
				var floor = points.slice().reverse().map(function (point) {
					return 'L' + point.X.toFixed(1) + ' ' + point.Bottom.toFixed(1);
				}).join(' ');

				result.Lines.push({Key: String(entry.Index), D: line, Area: points.length ? line + ' ' + floor + ' Z' : '', Color: entry.Color, Points: points});
			});
		})();

		return result;
	},

	/* Pie and donut charts: the slices of the first series. */
	Round: function (type, labels, series, hidden, width, height) {
		var self = this;
		var values = (series && series[0] && series[0].Values || []).map(function (value, index) {
			return self.IsHidden(hidden, String((labels || [])[index])) ? 0 : Math.max(0, Number(value) || 0);
		});
		var total = values.reduce(function (sum, value) {
			return sum + value;
		}, 0) || 1;
		var radius = Math.max(16, Math.min(Number(width), Number(height)) / 2 - 8);
		var inner = type === 'donut' ? radius * 0.6 : 0;
		var cx = Number(width) / 2;
		var cy = Number(height) / 2;
		var angle = -Math.PI / 2;
		var slices = [];

		function point (r, a) {
			return (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2);
		}

		values.forEach(function (value, index) {
			var sweep = value / total * Math.PI * 2;
			var end = angle + Math.min(sweep, Math.PI * 2 - 0.0001);
			var large = sweep > Math.PI ? 1 : 0;
			var d;

			if (value > 0) {
				d = 'M' + point(radius, angle) + ' A' + radius + ' ' + radius + ' 0 ' + large + ' 1 ' + point(radius, end);
				d += inner ? ' L' + point(inner, end) + ' A' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + point(inner, angle) + ' Z' : ' L' + cx + ' ' + cy + ' Z';

				slices.push({Key: String(index), D: d, Color: self.Palette[index % self.Palette.length], Index: index, Label: String((labels || [])[index]), Value: value, Percent: Math.round(value / total * 100)});
			}

			angle += sweep;
		});

		return {Slices: slices, Center: {X: cx, Y: cy}, Total: total, Round: true};
	},

	/* The label under the pointer: the nearest point, or the band of a bar. */
	/* Pie and donut charts have no axis: their slices tell the hover themselves (Slice). */
	Track: function (event, node) {
		var geometry = this.G();
		var count = (this.Labels || []).length;
		var x;
		var index;

		if (!count || geometry.Round) return;

		x = event.clientX - node.getBoundingClientRect().left - geometry.Plot.X;
		index = geometry.Banded ? Math.floor(x / geometry.Band) : Math.round(x / (geometry.Step || 1));
		index = Math.max(0, Math.min(count - 1, index));

		if (index !== this.Hover) {
			this.Hover = index;

			this.$Emit('hover', {Index: index, Label: this.Labels[index]});
		}
	},

	Slice: function (event, node) {
		this.Hover = Number(node.getAttribute('data-index'));
	},

	Leave: function () {
		this.Hover = -1;
	},

	Toggle: function (event, node) {
		var name = node.getAttribute('data-name');
		var hidden = (this.Hidden || []).slice();
		var index = hidden.indexOf(name);

		if (index === -1) hidden.push(name);
		else hidden.splice(index, 1);

		this.Hidden = hidden;

		this.$Emit('toggle', hidden.slice());
	}
});
