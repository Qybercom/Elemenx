/*
 * A knob: a rotary input with the look of the dial Meter, an open ring of three quarters around a cap with a pointer.
 * Value between Min and Max, in steps of Step. The ring fills from Origin (Min when null; the middle of a range from
 * -100 to 100 for a pan, say) to the value. Ticks puts that many ticks along the ring; ShowValue shows the value and
 * Unit under the cap. Dragging up or to the right turns it up (Sensitivity pixels for the whole range); the arrows
 * (Step), Page Up/Down (ten steps), Home and End turn it from the keyboard, and so does the wheel while it has the
 * focus. A double click sets it back to Default, when there is one. Events: input while turning, change on release.
 */
Elemenx.Component('Knob', {
	$TemplateURL: 'Knob.html',
	$StyleURL: 'Knob.css',
	Value: 0,
	Min: 0,
	Max: 100,
	Step: 1,
	Origin: null,
	Default: null,
	Ticks: 0,
	Label: '',
	Unit: '',
	ShowValue: true,
	Size: 'medium',
	Sensitivity: 200,
	Disabled: false,
	Active: false,

	$OnCreate: function () {
		var self = this;

		this.Grip = null;

		/* The share of the range a value takes, from 0 to 1. */
		this.Share = function (value) {
			var min = Number(self.Min);
			var max = Number(self.Max);

			return max === min ? 0 : (Math.max(min, Math.min(max, Number(value) || 0)) - min) / (max - min);
		};

		/* The filled part of the ring, from Origin to the value, as the dashes of a path 100 long. */
		this.Dash = function (value, origin) {
			var from = self.Share(origin === null || origin === '' ? self.Min : origin);
			var to = self.Share(value);

			return '0 ' + Math.min(from, to) * 100 + ' ' + Math.abs(to - from) * 100 + ' 100';
		};

		/* The turn of the pointer: from the start of the ring at the bottom left, three quarters at most. */
		this.Turn = function (value) {
			return 'rotate(' + Math.round(self.Share(value) * 2700) / 10 + ' 60 60)';
		};

		/* The ticks of the ring: count of them, evenly from its start to its end. */
		this.Ticked = function (count) {
			var list = [];
			var i = 0;
			var angle;
			var round = function (number) {
				return Math.round(number * 100) / 100;
			};

			count = Math.floor(Number(count) || 0);

			while (i < count) {
				angle = (135 + 270 * (count === 1 ? 0 : i / (count - 1))) * Math.PI / 180;

				list.push({X1: round(60 + 54 * Math.cos(angle)), Y1: round(60 + 54 * Math.sin(angle)), X2: round(60 + 58 * Math.cos(angle)), Y2: round(60 + 58 * Math.sin(angle))});

				i++;
			}

			return list;
		};
	},

	Snap: function (value) {
		var min = Number(this.Min);
		var step = Number(this.Step) || 1;
		var decimals = (String(step).split('.')[1] || '').length;

		value = Math.round((value - min) / step) * step + min;

		return Number(Math.max(min, Math.min(Number(this.Max), value)).toFixed(decimals));
	},

	Set: function (value, final) {
		value = this.Snap(value);

		if (value !== Number(this.Value)) {
			this.Value = value;

			this.$Emit('input', value);
		}

		if (final)
			this.$Emit('change', this.Value);
	},

	Down: function (event, node) {
		if (this.Disabled || event.button !== 0) return;

		event.preventDefault();

		node.focus();
		node.setPointerCapture(event.pointerId);

		this.Grip = {X: event.clientX, Y: event.clientY, Value: Number(this.Value) || 0};
		this.Active = true;
	},

	Move: function (event, node) {
		var grip = this.Grip;
		var range = Number(this.Max) - Number(this.Min);

		if (!grip || !node.hasPointerCapture(event.pointerId)) return;

		this.Set(grip.Value + (grip.Y - event.clientY + event.clientX - grip.X) / (Number(this.Sensitivity) || 200) * range, false);
	},

	Up: function (event, node) {
		if (!this.Grip) return;

		if (node.hasPointerCapture(event.pointerId))
			node.releasePointerCapture(event.pointerId);

		this.Grip = null;
		this.Active = false;

		this.$Emit('change', this.Value);
	},

	Key: function (event) {
		var value = Number(this.Value) || 0;
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

		this.Set(next, true);
	},

	/* The wheel turns the knob only while it has the focus, so it never takes the scrolling of the page. */
	Wheel: function (event, node) {
		if (this.Disabled || document.activeElement !== node || !event.deltaY) return;

		event.preventDefault();

		this.Set((Number(this.Value) || 0) + (event.deltaY < 0 ? 1 : -1) * (Number(this.Step) || 1), true);
	},

	Reset: function () {
		if (this.Disabled || this.Default === null || this.Default === '') return;

		this.Set(Number(this.Default), true);
	}
});
