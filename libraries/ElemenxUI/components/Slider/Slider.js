/*
 * A slider. Value is a number, or [low, high] with Range. Min, Max and Step bound it; Marks shows ticks at
 * every Marks units (or at the listed values). ShowValue: always, active (while dragged or focused) or never.
 * The thumbs follow the pointer and the keys: arrows (Step), Page Up/Down (ten steps), Home and End.
 * Events: input while moving, change on release.
 */
Elemenx.Component('Slider', {
	$TemplateURL: 'Slider.html',
	$StyleURL: 'Slider.css',
	Value: 0,
	Range: false,
	Min: 0,
	Max: 100,
	Step: 1,
	Marks: null,
	ShowValue: 'active',
	Unit: '',
	Size: 'medium',
	Label: '',
	Disabled: false,
	Active: -1,

	$OnCreate: function () {
		var self = this;

		this.Values = function (value, range) {
			if (range)
				return Array.isArray(value) ? [Number(value[0]), Number(value[1])] : [Number(self.Min), Number(self.Max)];

			return [Number(Array.isArray(value) ? value[0] : value) || 0];
		};

		this.Percent = function (value) {
			var min = Number(self.Min);
			var max = Number(self.Max);

			return max === min ? 0 : (Math.max(min, Math.min(max, value)) - min) / (max - min) * 100;
		};

		this.Ticks = function (marks, min, max) {
			var ticks = [];
			var value;

			if (Array.isArray(marks))
				return marks.map(Number);

			if (!marks)
				return ticks;

			value = Number(min);

			while (value <= Number(max) && ticks.length < 200) {
				ticks.push(value);

				value += Number(marks);
			}

			return ticks;
		};
	},

	Snap: function (value) {
		var min = Number(this.Min);
		var step = Number(this.Step) || 1;
		var decimals = (String(step).split('.')[1] || '').length;

		value = Math.round((value - min) / step) * step + min;

		return Number(Math.max(min, Math.min(Number(this.Max), value)).toFixed(decimals));
	},

	Set: function (index, value, final) {
		var values = this.Values(this.Value, this.Range);

		value = this.Snap(value);

		if (this.Range) {
			if (index === 0) value = Math.min(value, values[1]);
			else value = Math.max(value, values[0]);
		}

		values[index] = value;

		this.Value = this.Range ? values : values[0];

		this.$Emit('input', this.Value);

		if (final)
			this.$Emit('change', this.Value);
	},

	At: function (event, track) {
		var rect = track.getBoundingClientRect();
		var ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

		return Number(this.Min) + ratio * (Number(this.Max) - Number(this.Min));
	},

	Down: function (event, node) {
		var track = node.closest('.elemenx-slider').querySelector('.elemenx-slider-track');
		var value;
		var values;
		var thumb;

		if (this.Disabled || event.button !== 0) return;

		event.preventDefault();

		value = this.At(event, track);
		values = this.Values(this.Value, this.Range);
		thumb = this.Range && Math.abs(value - values[1]) < Math.abs(value - values[0]) ? 1 : 0;

		if (this.Range && values[0] === values[1])
			thumb = value > values[0] ? 1 : 0;

		this.Active = thumb;

		node.setPointerCapture(event.pointerId);

		this.Set(thumb, value, false);

		node.closest('.elemenx-slider').querySelectorAll('.elemenx-slider-thumb')[thumb].focus();
	},

	Move: function (event, node) {
		if (this.Active === -1 || !node.hasPointerCapture(event.pointerId)) return;

		this.Set(this.Active, this.At(event, node.closest('.elemenx-slider').querySelector('.elemenx-slider-track')), false);
	},

	Up: function (event, node) {
		if (this.Active === -1) return;

		if (node.hasPointerCapture(event.pointerId))
			node.releasePointerCapture(event.pointerId);

		this.$Emit('change', this.Value);
	},

	Focus: function (event, node) {
		this.Active = Number(node.getAttribute('data-thumb'));
	},

	Blur: function () {
		this.Active = -1;
	},

	Key: function (event, node) {
		var index = Number(node.getAttribute('data-thumb'));
		var value = this.Values(this.Value, this.Range)[index];
		var step = Number(this.Step) || 1;
		var next = {
			ArrowLeft: value - step,
			ArrowDown: value - step,
			ArrowRight: value + step,
			ArrowUp: value + step,
			PageDown: value - step * 10,
			PageUp: value + step * 10,
			Home: Number(this.Min),
			End: Number(this.Max)
		}[event.key];
		if (next === undefined || this.Disabled) return;

		event.preventDefault();

		this.Set(index, next, true);
	}
});