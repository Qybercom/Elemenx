/*
 * A ruler, as the rulers of an editor of pages or pictures: Orientation horizontal (along the top) or vertical (along
 * the side), ticks every Step pixels and a longer one with its number every Major (both in the units of the ruler,
 * shown at Scale: 2 draws them twice as far apart). Start is the value at its start (a page scrolled by 120 starts at
 * 120). Marker marks a value (the pointer), Range a span {From, To} (the selected element), Guides the values of the
 * guides. A press on the ruler pulls a guide out of it: pull ({Value, ClientX, ClientY}) asks the owner to follow the
 * pointer with one.
 */
Elemenx.Component('Ruler', {
	$TemplateURL: 'Ruler.html',
	$StyleURL: 'Ruler.css',
	$Meta: {
		Group: 'display',
		Icon: 'columns',
		Description: 'A ruler, as the rulers of an editor of pages or pictures: ticks, numbers, a marker, a range and guides.',
		Events: {
			pull: 'A guide is pulled out of the ruler: {Value, ClientX, ClientY}.'
		},
		Props: {
			Orientation: {Options: ['horizontal', 'vertical'], Description: 'horizontal (along the top) or vertical (along the side).'},
			Start: 'The value at the start of the ruler.',
			Scale: 'The pixels of the screen for one unit of the ruler.',
			Step: 'The units between two ticks.',
			Major: 'The units between two numbered ticks.',
			Marker: 'A value marked on the ruler (the pointer), or null.',
			Range: 'A span marked on the ruler, {From, To}, or null.',
			Guides: 'The values of the guides, marked on the ruler.'
		},
		Sample: {Start: 0, Marker: 120, Range: {From: 40, To: 200}, Guides: [300]}
	},
	Orientation: 'horizontal',
	Start: 0,
	Scale: 1,
	Step: 10,
	Major: 100,
	Marker: null,
	Range: null,
	Guides: [],
	Length: 0,

	$OnCreate: function () {
		var self = this;

		/* The place of a value along the ruler, in pixels from its start. */
		function at (value) {
			return (Number(value) - Number(self.Start || 0)) * Number(self.Scale || 1);
		}

		this.Vertical = function (orientation) {
			return orientation === 'vertical';
		};

		/* The numbered ticks in view: [{Value, Style}]. */
		this.Labels = function (length, start, scale, major) {
			var labels = [];
			var unit = Math.max(1, Number(major) || 100);
			var value = Math.ceil(Number(start || 0) / unit) * unit;
			var end = Number(start || 0) + length / (Number(scale) || 1);

			while (value <= end && labels.length < 500) {
				labels.push({Value: value, Style: (self.Vertical(self.Orientation) ? 'top: ' : 'left: ') + at(value) + 'px;'});

				value += unit;
			}

			return labels;
		};

		/* The ticks drawn by the background, as far apart as Step and Major at Scale, shifted by Start. */
		this.Ticks = function (start, scale, step, major) {
			var minor = Math.max(1, Number(step) || 10) * (Number(scale) || 1);
			var long = Math.max(1, Number(major) || 100) * (Number(scale) || 1);
			var shift = -Number(start || 0) * (Number(scale) || 1);

			return '--elemenx-ruler-minor: ' + minor + 'px; --elemenx-ruler-major: ' + long + 'px; --elemenx-ruler-minor-shift: ' + (shift % minor) + 'px; --elemenx-ruler-major-shift: ' + (shift % long) + 'px;';
		};

		this.Point = function (value, start, scale, orientation) {
			return (self.Vertical(orientation) ? 'top: ' : 'left: ') + at(value) + 'px;';
		};

		this.Span = function (range, start, scale, orientation) {
			var from = at(Math.min(range.From, range.To));
			var size = Math.abs(range.To - range.From) * (Number(scale) || 1);

			return self.Vertical(orientation) ? 'top: ' + from + 'px; height: ' + size + 'px;' : 'left: ' + from + 'px; width: ' + size + 'px;';
		};
	},

	$OnReady: function () {
		var self = this;
		var element = this.$Element();

		/* The length of the ruler, measured as it changes: the numbers in view follow it. */
		this.Sizer = new ResizeObserver(function () {
			var length = Math.round(self.Orientation === 'vertical' ? element.clientHeight : element.clientWidth);
			if (self.Length !== length)
				self.Length = length;
		});

		this.Sizer.observe(element);
	},

	$OnDestroy: function () {
		if (this.Sizer)
			this.Sizer.disconnect();
	},

	/* A press pulls a guide: the value under the pointer, for the owner to follow. */
	Pulled: function (event) {
		var box = this.$Element().getBoundingClientRect();
		var offset = this.Orientation === 'vertical' ? event.clientY - box.top : event.clientX - box.left;

		if (event.button !== 0) return;

		event.preventDefault();

		this.$Emit('pull', {Value: Math.round(Number(this.Start || 0) + offset / (Number(this.Scale) || 1)), ClientX: event.clientX, ClientY: event.clientY});
	}
});
