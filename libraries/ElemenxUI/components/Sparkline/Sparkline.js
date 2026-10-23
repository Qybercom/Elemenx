/*
 * A small chart without axes, for a line of text or a cell: Values (numbers) as a line, an area or bars (Type),
 * Width by Height pixels. Min and Max fix the scale (by default the values set it). The last value gets a dot
 * (Dot: false for none). Color is any CSS color (the accent by default). Label names it for screen readers.
 */
Elemenx.Component('Sparkline', {
	$TemplateURL: 'Sparkline.html',
	$StyleURL: 'Sparkline.css',
	$Meta: {
		Group: 'data',
		Icon: 'chart',
		Description: 'A small chart without axes, for a line of text or a cell: Values (numbers) as a line, an area or bars (Type), Width by Height pixels.',
		Props: {
			Values: 'The numbers.',
			Type: {Options: ['line', 'area', 'bar'], Description: 'line, area or bar.'},
			Width: 'The width in pixels.',
			Height: 'The height in pixels.',
			Min: 'Fixes the bottom of the scale.',
			Max: 'Fixes the top of the scale.',
			Dot: 'Puts a dot on the last value.',
			Color: 'A CSS color (the accent by default).',
			Label: 'The name of the chart for screen readers.'
		},
		Sample: {Height: 28}
	},
	Values: [],
	Type: 'line',
	Width: 120,
	Height: 32,
	Min: null,
	Max: null,
	Dot: true,
	Color: '',
	Label: '',

	$OnCreate: function () {
		var self = this;

		/* The points of the values: [{X, Y}] inside the box, with a pixel of room for the stroke. */
		this.Points = function (values, width, height, min, max) {
			var list = (values || []).map(Number);
			var low = min != null && min !== '' ? Number(min) : Math.min.apply(Math, list.concat(self.Type === 'bar' ? [0] : []));
			var high = max != null && max !== '' ? Number(max) : Math.max.apply(Math, list);
			var span = high - low || 1;
			var w = Number(width);
			var h = Number(height) - 4;
			var step = list.length > 1 ? (w - 4) / (list.length - 1) : 0;

			return list.map(function (value, index) {
				return {X: 2 + index * step, Y: 2 + h - (value - low) / span * h, Value: value, Index: index};
			});
		};

		this.Line = function (points) {
			return points.map(function (point, index) {
				return (index ? 'L' : 'M') + point.X.toFixed(1) + ' ' + point.Y.toFixed(1);
			}).join(' ');
		};

		this.Area = function (points, height) {
			if (!points.length) return '';

			return self.Line(points) + ' L' + points[points.length - 1].X.toFixed(1) + ' ' + height + ' L' + points[0].X.toFixed(1) + ' ' + height + ' Z';
		};

		/* The bars: as wide as their share of the width, a pixel apart. */
		this.Bars = function (points, width, height) {
			var count = points.length || 1;
			var bar = Math.max(1, Number(width) / count - 1);

			return points.map(function (point, index) {
				return {Key: index, X: index * (bar + 1), Y: point.Y, Width: bar, Height: Math.max(1, Number(height) - point.Y)};
			});
		};

		this.Summary = function (label, values) {
			return label + ': ' + (values || []).join(', ');
		};
	}
});
