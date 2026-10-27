/*
 * The part of a picture to keep: a frame over Src that the pointer moves (inside it) and resizes (by its corners and
 * sides), and the arrows move (with Shift, resize). Aspect keeps the shape of the frame (1 for a square, 16 / 9, 0
 * free); Round shows it as a circle (an avatar). Value is the frame in pixels of the picture, {X, Y, Width, Height}
 * (by default the largest of its shape in the middle, MinSize at least); change emits it after each move. Image(type,
 * quality, width) returns the part as a data URL of a picture (image/png, and width to scale it); a picture of another
 * site needs CORS for it. Height is the height of the field; the picture fits in it.
 */
Elemenx.Component('ImageCropper', {
	$TemplateURL: 'ImageCropper.html',
	$StyleURL: 'ImageCropper.css',
	$Meta: {
		Group: 'media',
		Icon: 'image',
		Description: 'The part of a picture to keep: a frame over Src that the pointer moves and resizes.',
		Events: {
			change: 'The frame moved or changed its size: Value.',
			load: 'The picture loaded: {Width, Height}.'
		},
		Props: {
			Src: 'The address of the picture.',
			Value: 'The frame in pixels of the picture: {X, Y, Width, Height}.',
			Aspect: 'The shape of the frame: width / height (1, 16 / 9), 0 for free.',
			Round: 'Shows the frame as a circle (an avatar).',
			MinSize: 'The least width and height of the frame in pixels of the picture.',
			Height: 'The height of the field in pixels.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Label: 'The name of the frame for screen readers.'
		}
	},
	Src: '',
	Value: null,
	Aspect: 0,
	Round: false,
	MinSize: 32,
	Height: 320,
	Disabled: false,
	Label: '',
	Natural: null,
	Scale: 1,
	Shown: null,

	$OnCreate: function () {
		var self = this;
		var own = {Drag: null, Observer: null};

		this.Own = function () {
			return own;
		};

		/* The frame on the screen: its style from the frame in the picture. */
		this.Box = function (value, scale, shown) {
			if (!value || !shown)
				return 'display: none;';

			return 'left: ' + (shown.Left + value.X * scale) + 'px; top: ' + (shown.Top + value.Y * scale) + 'px; width: ' + value.Width * scale + 'px; height: ' + value.Height * scale + 'px;';
		};

		this.Picture = function (shown) {
			return shown ? 'left: ' + shown.Left + 'px; top: ' + shown.Top + 'px; width: ' + shown.Width + 'px; height: ' + shown.Height + 'px;' : 'visibility: hidden;';
		};

		this.Edges = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];

		this.Text = function (value) {
			return value ? Math.round(value.Width) + ' × ' + Math.round(value.Height) : '';
		};

		this.Ratio = function () {
			var aspect = Number(self.Aspect);

			return isFinite(aspect) && aspect > 0 ? aspect : 0;
		};
	},

	$OnReady: function () {
		var self = this;

		this.Own().Observer = typeof ResizeObserver === 'function' ? new ResizeObserver(function () {
			self.Fit();
		}) : null;

		if (this.Own().Observer)
			this.Own().Observer.observe(this.$Element());
	},

	$OnProps: function (changed) {
		if (changed.Aspect !== undefined && this.Natural)
			this.Commit(this.Shape(this.Value || this.Initial()), true);

		if (changed.Height !== undefined)
			this.Fit();
	},

	$OnDestroy: function () {
		if (this.Own().Observer)
			this.Own().Observer.disconnect();
	},

	/* The picture loaded: its size, its place, and a frame of the shape when none is given. */
	Loaded: function (event, node) {
		this.Natural = {Width: node.naturalWidth, Height: node.naturalHeight};

		this.Fit();

		if (!this.Value)
			this.Commit(this.Initial(), false);

		this.$Emit('load', {Width: this.Natural.Width, Height: this.Natural.Height});
	},

	/* The picture fit into the field: its scale and its place in it. */
	Fit: function () {
		var field = this.$Element() && this.$Element().querySelector('.elemenx-cropper-field');
		var scale;

		if (!field || !this.Natural || !field.clientWidth) return;

		scale = Math.min(field.clientWidth / this.Natural.Width, field.clientHeight / this.Natural.Height, 1);

		this.Scale = scale;
		this.Shown = {
			Width: this.Natural.Width * scale,
			Height: this.Natural.Height * scale,
			Left: (field.clientWidth - this.Natural.Width * scale) / 2,
			Top: (field.clientHeight - this.Natural.Height * scale) / 2
		};
	},

	/* The largest frame of the shape in the middle of the picture, nine tenths of it. */
	Initial: function () {
		var natural = this.Natural;
		var ratio = this.Ratio();
		var width = natural.Width * 0.9;
		var height = natural.Height * 0.9;

		if (ratio && width / height > ratio) width = height * ratio;
		else if (ratio) height = width / ratio;

		return {X: (natural.Width - width) / 2, Y: (natural.Height - height) / 2, Width: width, Height: height};
	},

	/* A frame given the shape of Aspect, around its middle. */
	Shape: function (value) {
		var ratio = this.Ratio();
		var middle = {X: value.X + value.Width / 2, Y: value.Y + value.Height / 2};
		var width = value.Width;
		var height = value.Height;

		if (!ratio)
			return value;

		if (width / height > ratio) width = height * ratio;
		else height = width / ratio;

		return {X: middle.X - width / 2, Y: middle.Y - height / 2, Width: width, Height: height};
	},

	/* A frame kept inside the picture and over MinSize, in whole pixels. */
	Bound: function (value) {
		var natural = this.Natural;
		var least = Math.min(Number(this.MinSize) || 1, natural.Width, natural.Height);
		var width = Math.min(Math.max(value.Width, least), natural.Width);
		var height = Math.min(Math.max(value.Height, least), natural.Height);
		var ratio = this.Ratio();

		if (ratio && width / height > ratio) width = height * ratio;
		else if (ratio) height = width / ratio;

		return {
			X: Math.round(Math.min(Math.max(value.X, 0), natural.Width - width)),
			Y: Math.round(Math.min(Math.max(value.Y, 0), natural.Height - height)),
			Width: Math.round(width),
			Height: Math.round(height)
		};
	},

	Commit: function (value, emit) {
		this.Value = this.Bound(value);

		if (emit)
			this.$Emit('change', this.Value);
	},

	Down: function (event, node) {
		if (this.Disabled && this.Disabled !== 'false') return;
		if (!this.Value || (event.button !== undefined && event.button > 0)) return;

		event.preventDefault();
		event.stopPropagation();

		if (event.pointerId !== undefined && node.setPointerCapture)
			node.setPointerCapture(event.pointerId);

		node.closest('.elemenx-cropper-box').focus();

		this.Own().Drag = {Edge: node.getAttribute('data-edge') || 'move', X: event.clientX, Y: event.clientY, Start: Object.assign({}, this.Value), Node: node};
	},

	Move: function (event) {
		var drag = this.Own().Drag;
		if (!drag) return;

		this.Commit(this.Dragged(drag.Edge, drag.Start, (event.clientX - drag.X) / this.Scale, (event.clientY - drag.Y) / this.Scale), false);
	},

	Up: function () {
		if (!this.Own().Drag) return;

		this.Own().Drag = null;

		this.$Emit('change', this.Value);
	},

	/* The frame moved by dx, dy (in pixels of the picture) from start, by its middle or by an edge or a corner. */
	Dragged: function (edge, start, dx, dy) {
		var value = Object.assign({}, start);
		var ratio = this.Ratio();
		var right = start.X + start.Width;
		var bottom = start.Y + start.Height;

		if (edge === 'move') {
			value.X += dx;
			value.Y += dy;

			return value;
		}

		if (edge.indexOf('e') !== -1)
			value.Width = start.Width + dx;

		if (edge.indexOf('s') !== -1)
			value.Height = start.Height + dy;

		if (edge.indexOf('w') !== -1) {
			value.X = start.X + dx;
			value.Width = start.Width - dx;
		}

		if (edge.indexOf('n') !== -1) {
			value.Y = start.Y + dy;
			value.Height = start.Height - dy;
		}

		/* With a shape, the side dragged leads, and the other follows; a corner keeps its opposite corner. */
		if (ratio) {
			if (edge === 'n' || edge === 's') value.Width = value.Height * ratio;
			else value.Height = value.Width / ratio;

			if (edge.indexOf('w') !== -1)
				value.X = right - value.Width;

			if (edge.indexOf('n') !== -1)
				value.Y = bottom - value.Height;

			if (edge === 'n' || edge === 's')
				value.X = start.X + (start.Width - value.Width) / 2;

			if (edge === 'e' || edge === 'w')
				value.Y = start.Y + (start.Height - value.Height) / 2;
		}

		return value;
	},

	/* Arrows move the frame by a pixel of the screen (ten with Alt); with Shift they resize it. */
	Key: function (event) {
		var steps = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
		var step = steps[event.key];
		var size;
		var dx;
		var dy;

		if (!step || !this.Value || (this.Disabled && this.Disabled !== 'false')) return;

		event.preventDefault();

		size = (event.altKey ? 10 : 1) / this.Scale;
		dx = step[0] * size;
		dy = step[1] * size;

		this.Commit(event.shiftKey ? this.Dragged(step[0] ? 'e' : 's', this.Value, dx, dy) : this.Dragged('move', this.Value, dx, dy), true);
	},

	/* The part in the frame as a data URL of a picture, at its size or scaled to width. */
	Image: function (type, quality, width) {
		var image = this.$Element().querySelector('.elemenx-cropper-image');
		var value = this.Value;
		var canvas = document.createElement('canvas');
		var scale;

		if (!value || !this.Natural) return '';

		scale = width ? Number(width) / value.Width : 1;
		canvas.width = Math.round(value.Width * scale);
		canvas.height = Math.round(value.Height * scale);

		canvas.getContext('2d').drawImage(image, value.X, value.Y, value.Width, value.Height, 0, 0, canvas.width, canvas.height);

		return canvas.toDataURL(type || 'image/png', quality);
	}
});
