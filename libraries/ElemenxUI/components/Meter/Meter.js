/*
 * A measurement within a known range, like <meter>: Value between Min and Max. Low and High split the range into
 * zones; Optimum tells which zone is good. The good zone shows success, the next one warning, the far one danger.
 * Shape 'bar' draws a bar, across or upwards (Orientation 'vertical'); Shape 'dial' an open ring of three quarters,
 * with a Needle, Ticks along it, and its middle the default slot (or the value when the slot is empty). Marks shows
 * the marks of Low and High (not the Ticks), ShowRange the Min and the Max at the ends, ValuePlacement puts the
 * value on a plate below the meter or in its corner (over the end of a bar; a dial gives the corner up: its ring is
 * shorter, of five eighths).
 */
Elemenx.Component('Meter', {
	$TemplateURL: 'Meter.html',
	$StyleURL: 'Meter.css',
	Value: 0,
	Min: 0,
	Max: 100,
	Low: null,
	High: null,
	Optimum: null,
	Label: '',
	Unit: '',
	Size: 'medium',
	ShowValue: true,
	Orientation: 'horizontal',
	Shape: 'bar',
	Needle: false,
	Ticks: 0,
	Marks: true,
	ShowRange: false,
	ValuePlacement: 'auto',

	$OnCreate: function () {
		var self = this;

		this.Percent = function (value) {
			var min = Number(self.Min);
			var max = Number(self.Max);

			return max === min ? 0 : (Math.max(min, Math.min(max, Number(value))) - min) / (max - min) * 100;
		};

		this.Zone = function (value) {
			var low = self.Low === null || self.Low === '' ? Number(self.Min) : Number(self.Low);
			var high = self.High === null || self.High === '' ? Number(self.Max) : Number(self.High);
			var optimum = self.Optimum === null || self.Optimum === '' ? (Number(self.Min) + Number(self.Max)) / 2 : Number(self.Optimum);
			var zone = function (number) {
				return number < low ? 0 : number > high ? 2 : 1;
			};
			var distance;

			value = Number(value);
			distance = Math.abs(zone(value) - zone(optimum));

			return distance === 0 ? 'success' : distance === 1 ? 'warning' : 'danger';
		};

		/* Where the value is: 'auto' (in the head of a bar, in the middle of a dial), 'below' or 'corner'. */
		this.Placement = function (placement) {
			return placement === 'below' || placement === 'corner' ? placement : 'auto';
		};

		/* The places of the marks of Low and High on a bar, in percents, when Marks is on. */
		this.Bounds = function (low, high, marks) {
			var list = [];

			if (!marks || marks === 'false') return list;

			if (low !== null && low !== '')
				list.push(self.Percent(low));

			if (high !== null && high !== '')
				list.push(self.Percent(high));

			return list;
		};

		/* The form of the meter: a dial, or a bar across or upwards. */
		this.Form = function (shape, orientation) {
			if (shape === 'dial') return 'dial';

			return orientation === 'vertical' ? 'vertical' : 'horizontal';
		};

		/* The angle of the ring of the dial: three quarters, or five eighths when the value takes its corner. */
		this.Span = function (placement) {
			return self.Placement(placement) === 'corner' ? 225 : 270;
		};

		/* The ring of the dial, from its start at the bottom left to its end. */
		this.Ring = function (placement) {
			return self.Span(placement) === 225 ? 'M24.64 95.36A50 50 0 1 1 110 60' : 'M24.64 95.36A50 50 0 1 1 95.36 95.36';
		};

		/* The custom properties of the meter: the share of the range and the angle of the ring of a dial. */
		this.Style = function (value, placement) {
			return '--elemenx-meter-share: ' + self.Percent(value) / 100 + '; --elemenx-meter-span: ' + self.Span(placement) + 'deg;';
		};

		/* A line across the ring of the dial at a share of the range, from the radius inner to the radius outer. */
		this.Radial = function (share, inner, outer, span) {
			var angle = (135 + (span || 270) * share) * Math.PI / 180;
			var round = function (number) {
				return Math.round(number * 100) / 100;
			};

			return {
				X1: round(60 + inner * Math.cos(angle)),
				Y1: round(60 + inner * Math.sin(angle)),
				X2: round(60 + outer * Math.cos(angle)),
				Y2: round(60 + outer * Math.sin(angle))
			};
		};

		/* The ticks of the dial: count of them, evenly from its start to its end. */
		this.Ticked = function (count, placement) {
			var list = [];
			var i = 0;

			count = Math.floor(Number(count) || 0);

			while (i < count) {
				list.push(self.Radial(count === 1 ? 0 : i / (count - 1), 39, 44, self.Span(placement)));

				i++;
			}

			return list;
		};

		/* The marks of Low and High on the ring of the dial, when Marks is on. */
		this.Marked = function (low, high, marks, placement) {
			return self.Bounds(low, high, marks).map(function (percent) {
				return self.Radial(percent / 100, 45, 55, self.Span(placement));
			});
		};
	}
});