/*
 * A field to sign with a pen, a finger or the mouse: the strokes are smoothed, thinner where the pen moves fast or
 * presses less. Value is the strokes ([[{X, Y, P}]] in pixels of the field, P the pressure), which redraw it at any
 * size; change emits them after each stroke. Color and Width draw them; Clear() and Undo() (the buttons under it, unless
 * Controls is false) take them away. Image(type) returns the signature as a data URL of a picture (image/png by
 * default), SVG() as the text of an SVG; both are empty for no signature. ReadOnly shows a signature that cannot change.
 */
Elemenx.Component('SignaturePad', {
	$TemplateURL: 'SignaturePad.html',
	$StyleURL: 'SignaturePad.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'A field to sign with a pen, a finger or the mouse.',
		Events: {
			change: 'A stroke was drawn, or strokes were taken away: Value.'
		},
		Props: {
			Value: 'The strokes: [[{X, Y, P}]].',
			Color: 'The color of the ink (the color of the text by default).',
			Width: 'The width of a stroke at a usual speed, in pixels.',
			Height: 'The height of the field in pixels.',
			Placeholder: 'The text on the line while it is empty.',
			Controls: 'Shows Undo and Clear under it.',
			ReadOnly: 'Shows the signature without letting it change.',
			Label: 'The name of the field for screen readers.'
		}
	},
	Value: [],
	Color: '',
	Width: 2.5,
	Height: 180,
	Placeholder: '',
	Controls: true,
	ReadOnly: false,
	Label: '',

	$OnCreate: function () {
		var own = {Stroke: null, Observer: null};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		var self = this;

		this.Own().Observer = typeof ResizeObserver === 'function' ? new ResizeObserver(function () {
			self.Draw();
		}) : null;

		if (this.Own().Observer)
			this.Own().Observer.observe(this.Canvas());

		this.Draw();
	},

	$OnProps: function () {
		this.Draw();
	},

	$OnDestroy: function () {
		if (this.Own().Observer)
			this.Own().Observer.disconnect();
	},

	Canvas: function () {
		return this.$Element().querySelector('.elemenx-signature-canvas');
	},

	Empty: function () {
		return !(this.Value || []).length;
	},

	Ink: function () {
		return this.Color || getComputedStyle(this.$Element()).color;
	},

	/* The width of a segment: thinner where the pen moves fast or presses less. */
	Thickness: function (from, to) {
		var distance = Math.sqrt(Math.pow(to.X - from.X, 2) + Math.pow(to.Y - from.Y, 2));
		var pressure = to.P > 0 ? to.P : 0.5;

		return Math.max(0.6, Number(this.Width) * (0.6 + pressure * 0.8) * Math.max(0.45, 1 - distance / 60));
	},

	/* Every stroke again, at the size of the field on the screen and of its pixels. */
	Draw: function () {
		var self = this;
		var canvas = this.Canvas();
		var ratio = window.devicePixelRatio || 1;
		var width = canvas.clientWidth;
		var height = canvas.clientHeight;
		var context;

		if (!width || !height) return;

		canvas.width = Math.round(width * ratio);
		canvas.height = Math.round(height * ratio);
		context = canvas.getContext('2d');

		context.setTransform(ratio, 0, 0, ratio, 0, 0);

		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.strokeStyle = this.Ink();
		context.fillStyle = this.Ink();

		(this.Value || []).forEach(function (stroke) {
			self.Stroke(context, stroke);
		});
	},

	/* A stroke as quadratic curves through the middles of its points; a single point is a dot. */
	Stroke: function (context, points) {
		var i;
		var from;
		var to;
		var middle;
		var previous;

		if (!points.length) return;

		if (points.length === 1) {
			context.beginPath();
			context.arc(points[0].X, points[0].Y, this.Thickness(points[0], points[0]) / 2, 0, Math.PI * 2);
			context.fill();

			return;
		}

		previous = points[0];

		for (i = 1; i < points.length; i++) {
			from = points[i - 1];
			to = points[i];
			middle = {X: (from.X + to.X) / 2, Y: (from.Y + to.Y) / 2};

			context.beginPath();

			context.lineWidth = this.Thickness(from, to);

			context.moveTo(previous.X, previous.Y);
			context.quadraticCurveTo(from.X, from.Y, middle.X, middle.Y);
			context.stroke();

			previous = middle;
		}

		context.beginPath();
		context.moveTo(previous.X, previous.Y);
		context.lineTo(points[points.length - 1].X, points[points.length - 1].Y);
		context.stroke();
	},

	Point: function (event) {
		var rect = this.Canvas().getBoundingClientRect();

		return {X: Math.round((event.clientX - rect.left) * 10) / 10, Y: Math.round((event.clientY - rect.top) * 10) / 10, P: event.pointerType === 'pen' ? Math.round((event.pressure || 0.5) * 100) / 100 : 0.5};
	},

	Down: function (event) {
		if (this.ReadOnly && this.ReadOnly !== 'false') return;
		if (event.button !== undefined && event.button > 0) return;

		event.preventDefault();

		if (event.pointerId !== undefined && this.Canvas().setPointerCapture)
			this.Canvas().setPointerCapture(event.pointerId);

		this.Own().Stroke = [this.Point(event)];
		this.Value = (this.Value || []).concat([this.Own().Stroke]);

		this.Draw();
	},

	Move: function (event) {
		var stroke = this.Own().Stroke;
		var point;
		var last;

		if (!stroke) return;

		point = this.Point(event);
		last = stroke[stroke.length - 1];

		/* Points closer than a pixel add nothing. */
		if (Math.abs(point.X - last.X) + Math.abs(point.Y - last.Y) < 1) return;

		stroke.push(point);

		this.Draw();
	},

	Up: function () {
		if (!this.Own().Stroke) return;

		this.Own().Stroke = null;
		this.Value = this.Value.slice();

		this.$Emit('change', this.Value);
	},

	Undo: function () {
		if (this.Empty()) return this;

		this.Value = this.Value.slice(0, -1);

		this.Draw();
		this.$Emit('change', this.Value);

		return this;
	},

	Clear: function () {
		if (this.Empty()) return this;

		this.Value = [];

		this.Draw();
		this.$Emit('change', this.Value);

		return this;
	},

	/* The signature as a data URL of a picture of the field, without a background; '' with no signature. */
	Image: function (type) {
		return this.Empty() ? '' : this.Canvas().toDataURL(type || 'image/png');
	},

	/* The signature as the text of an SVG of the size of the field: a path for each segment, with its width. */
	SVG: function () {
		var self = this;
		var canvas = this.Canvas();
		var color = this.Ink();
		var parts = [];

		if (this.Empty()) return '';

		(this.Value || []).forEach(function (stroke) {
			var i;

			if (stroke.length === 1) {
				parts.push('<circle cx="' + stroke[0].X + '" cy="' + stroke[0].Y + '" r="' + Math.round(self.Thickness(stroke[0], stroke[0]) * 50) / 100 + '" fill="' + color + '"/>');

				return;
			}

			for (i = 1; i < stroke.length; i++)
				parts.push('<path d="M' + stroke[i - 1].X + ' ' + stroke[i - 1].Y + 'L' + stroke[i].X + ' ' + stroke[i].Y + '" stroke-width="' + Math.round(self.Thickness(stroke[i - 1], stroke[i]) * 100) / 100 + '"/>');
		});

		return '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvas.clientWidth + '" height="' + canvas.clientHeight + '" viewBox="0 0 ' + canvas.clientWidth + ' ' + canvas.clientHeight + '"><g fill="none" stroke="' + color + '" stroke-linecap="round" stroke-linejoin="round">' + parts.join('') + '</g></svg>';
	}
});
