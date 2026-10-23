/*
 * A color field with its own picker. Value is '#rrggbb', or '#rrggbbaa' with Alpha.
 * The picker has a saturation and brightness area, a hue slider, an alpha slider (Alpha), the Swatches
 * and an eyedropper where the browser supports it. Dragging emits input; releasing emits change.
 */
Elemenx.Component('ColorInput', {
	$TemplateURL: 'ColorInput.html',
	$StyleURL: 'ColorInput.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'color',
		Description: 'A color field with its own picker.',
		Events: ['input', 'change'],
		Props: {
			Value: 'The color: #rrggbb, or #rrggbbaa with Alpha.',
			Alpha: 'Adds the slider of the opacity.',
			Swatches: 'Colors offered in the picker.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		}
	},
	Value: '#000000',
	Alpha: false,
	Swatches: [
		'#000000', '#5f5a54', '#a39d95', '#ffffff', '#b4483f', '#d9822b', '#e3b341', '#3d7a54',
		'#2f9e8f', '#3f6c9e', '#5b5fc7', '#8a4fb0', '#c2477f', '#4b443d', '#1d2025', '#eef0f3'
	],
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Open: false,
	Text: null,
	H: 0,
	S: 0,
	V: 0,
	A: 1,
	Drag: '',

	$OnCreate: function () {
		this.Dropper = typeof window.EyeDropper === 'function';
	},

	/* '#rgb', '#rgba', '#rrggbb' or '#rrggbbaa' into {R, G, B, A} (0-255, 0-1), or null. */
	Read: function (value) {
		var hex = String(value || '').replace(/^#/, '').toLowerCase();
		if (hex.length === 3 || hex.length === 4)
			hex = hex.replace(/(.)/g, '$1$1');

		if (!/^([0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return null;

		return {
			R: parseInt(hex.substring(0, 2), 16),
			G: parseInt(hex.substring(2, 4), 16),
			B: parseInt(hex.substring(4, 6), 16),
			A: hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1
		};
	},

	Hex: function (value) {
		var text = Math.round(Math.max(0, Math.min(255, value))).toString(16);

		return text.length === 1 ? '0' + text : text;
	},

	/* The Value of the current H, S, V and A. */
	Compose: function () {
		var h = this.H / 60;
		var c = this.V * this.S;
		var x = c * (1 - Math.abs(h % 2 - 1));
		var m = this.V - c;
		var rgb = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];

		return '#' + this.Hex((rgb[0] + m) * 255) + this.Hex((rgb[1] + m) * 255) + this.Hex((rgb[2] + m) * 255) + (this.Alpha ? this.Hex(this.A * 255) : '');
	},

	/* Takes H, S, V and A from a color; the hue is kept when the color has none (grey). */
	Decompose: function (value) {
		var color = this.Read(value);
		var r;
		var g;
		var b;
		var max;
		var min;
		var delta;
		var h = this.H;

		if (!color) return;

		r = color.R / 255;
		g = color.G / 255;
		b = color.B / 255;
		max = Math.max(r, g, b);
		min = Math.min(r, g, b);
		delta = max - min;

		if (delta) {
			if (max === r) h = 60 * (((g - b) / delta + 6) % 6);
			else if (max === g) h = 60 * ((b - r) / delta + 2);
			else h = 60 * ((r - g) / delta + 4);
		}

		this.H = h;
		this.S = max ? delta / max : 0;
		this.V = max;
		this.A = this.Alpha ? color.A : 1;
	},

	Set: function (value, commit) {
		this.Text = null;

		if (value !== this.Value) {
			this.Value = value;

			this.$Emit('input', value);
		}

		if (commit)
			this.$Emit('change', this.Value);
	},

	Toggle: function () {
		if (this.Disabled) return;

		this.Open = !this.Open;

		if (this.Open)
			this.Decompose(this.Value);
	},

	Typed: function (event, node) {
		var length = this.Alpha ? 8 : 6;
		var digits = node.value.replace(/[^0-9a-fA-F]/g, '').substring(0, length).toLowerCase();
		var text = '#' + digits;
		if (node.value !== text)
			node.value = text;

		this.Text = text;

		if (digits.length === 6 || digits.length === length) {
			this.Value = text + (this.Alpha && digits.length === 6 ? 'ff' : '');
			this.Text = text;

			this.Decompose(this.Value);

			this.$Emit('input', this.Value);
		}
	},

	Committed: function () {
		this.Text = null;

		this.$Emit('change', this.Value);
	},

	Point: function (event, node) {
		var rect = node.getBoundingClientRect();

		return {
			X: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
			Y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
		};
	},

	Move: function (event, node) {
		var point = this.Point(event, node);

		if (this.Drag === 'area') {
			this.S = point.X;
			this.V = 1 - point.Y;
		}
		else if (this.Drag === 'hue') {
			this.H = Math.min(359.9, point.X * 360);
		}
		else if (this.Drag === 'alpha') {
			this.A = Math.round(point.X * 100) / 100;
		}

		this.Set(this.Compose(), false);
	},

	Down: function (event, node) {
		if (event.button !== 0) return;

		event.preventDefault();

		node.setPointerCapture(event.pointerId);
		node.focus();

		this.Drag = node.getAttribute('data-part');

		this.Move(event, node);
	},

	Drift: function (event, node) {
		if (this.Drag)
			this.Move(event, node);
	},

	Up: function (event, node) {
		if (!this.Drag) return;

		if (node.hasPointerCapture(event.pointerId))
			node.releasePointerCapture(event.pointerId);

		this.Drag = '';

		this.$Emit('change', this.Value);
	},

	Key: function (event, node) {
		var part = node.getAttribute('data-part');
		var step = event.shiftKey ? 0.1 : 0.01;
		var x = {ArrowLeft: -1, ArrowRight: 1}[event.key] || 0;
		var y = {ArrowUp: 1, ArrowDown: -1}[event.key] || 0;
		if (!x && !y) return;

		event.preventDefault();

		if (part === 'area') {
			this.S = Math.max(0, Math.min(1, this.S + x * step));
			this.V = Math.max(0, Math.min(1, this.V + y * step));
		}
		else if (part === 'hue') {
			this.H = Math.max(0, Math.min(359.9, this.H + (x || y) * step * 360));
		}
		else {
			this.A = Math.max(0, Math.min(1, Math.round((this.A + (x || y) * step) * 100) / 100));
		}

		this.Set(this.Compose(), true);
	},

	Swatch: function (event, node) {
		var value = node.getAttribute('data-color') + (this.Alpha ? 'ff' : '');

		this.Decompose(value);

		this.Set(value, true);
	},

	Pick: function () {
		var self = this;

		if (!this.Dropper) return;

		/* EyeDropper only offers a Promise; it stays inside this method. */
		new window.EyeDropper().open().then(function (result) {
			var value = result.sRGBHex.toLowerCase() + (self.Alpha ? 'ff' : '');

			self.Decompose(value);

			self.Set(value, true);
		}, function () {
			/* Cancelled by the user. */
		});
	},

	Dismissed: function (event) {
		this.Open = false;

		if (event.detail.Reason === 'escape')
			this.$Element().querySelector('.elemenx-color-swatch').focus();
	}
});