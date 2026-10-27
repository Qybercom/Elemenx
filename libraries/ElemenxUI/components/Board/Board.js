/*
 * An infinite canvas, as the one of Figma: its content (the default slot) lives in coordinates of its own (the world,
 * in pixels at zoom 1: place the elements in it with position absolute, left and top) and the board shows a part of
 * it, moved and scaled. The wheel moves it (a trackpad with two fingers too), Ctrl with the wheel or a pinch zooms at
 * the pointer, a drag with the middle button, with Space held or on an empty place (Drag) moves it; when it has the
 * focus, the arrows move it, + and - zoom, 0 gives zoom 1 and Shift+1 fits the content. X and Y are the point of the
 * world at the top left corner of the view, Zoom its scale (MinZoom to MaxZoom); Grid dots, lines or none, of
 * GridSize pixels of the world. Controls shows the buttons of the zoom and its percent. The view event tells
 * {X, Y, Zoom} as it changes. Methods: ZoomTo(zoom, point), Pan(dx, dy), FitContent(margin), CenterOn(x, y),
 * ToWorld(clientX, clientY), ToScreen(x, y).
 */
Elemenx.Component('Board', {
	$TemplateURL: 'Board.html',
	$StyleURL: 'Board.css',
	$Meta: {
		Group: 'layout',
		Icon: 'grid',
		Description: 'An infinite canvas: its content in coordinates of its own, moved and zoomed as on the canvas of Figma.',
		Container: true,
		Events: {
			view: 'The view moved or zoomed: {X, Y, Zoom}.'
		},
		Props: {
			X: 'The point of the world at the left of the view.',
			Y: 'The point of the world at the top of the view.',
			Zoom: 'The scale of the view: 1 is a pixel of the world for a pixel of the screen.',
			MinZoom: 'The smallest zoom.',
			MaxZoom: 'The largest zoom.',
			Grid: {Options: ['dots', 'lines', 'none'], Description: 'The grid under the content: dots, lines or none.'},
			GridSize: 'The step of the grid, in pixels of the world.',
			Drag: 'A drag on an empty place moves the view (true by default).',
			Controls: 'Shows the buttons of the zoom and its percent.'
		},
		Sample: {Grid: 'dots', Controls: true}
	},
	X: 0,
	Y: 0,
	Zoom: 1,
	MinZoom: 0.1,
	MaxZoom: 8,
	Grid: 'dots',
	GridSize: 24,
	Drag: true,
	Controls: true,

	$OnCreate: function () {
		var self = this;

		/* The transform of the world, and the place and the size of the grid: they follow the view. */
		this.World = function (x, y, zoom) {
			return 'translate(' + (-x * zoom) + 'px, ' + (-y * zoom) + 'px) scale(' + zoom + ')';
		};

		this.GridStyle = function (x, y, zoom, size) {
			var step = Math.max(2, size * zoom);

			return {Size: step + 'px ' + step + 'px', Position: (-x * zoom % step) + 'px ' + (-y * zoom % step) + 'px'};
		};

		this.Percent = function (zoom) {
			return Math.round(zoom * 100) + '%';
		};

		this.Own = function () {
			return self.State || (self.State = {Pointers: {}, Space: false, Pan: null, Pinch: null});
		};
	},

	/* The view of the world: X, Y and Zoom within its bounds, told by the view event. */
	View: function (x, y, zoom) {
		zoom = Math.max(Number(this.MinZoom) || 0.1, Math.min(Number(this.MaxZoom) || 8, zoom));

		if (x === this.X && y === this.Y && zoom === this.Zoom) return;

		this.X = x;
		this.Y = y;
		this.Zoom = zoom;

		this.$Emit('view', {X: x, Y: y, Zoom: zoom});
	},

	Viewport: function () {
		return this.$Element().querySelector('.elemenx-board');
	},

	/* The point of the world under a point of the screen, and back. */
	ToWorld: function (clientX, clientY) {
		var box = this.Viewport().getBoundingClientRect();

		return {X: this.X + (clientX - box.left) / this.Zoom, Y: this.Y + (clientY - box.top) / this.Zoom};
	},

	ToScreen: function (x, y) {
		var box = this.Viewport().getBoundingClientRect();

		return {X: box.left + (x - this.X) * this.Zoom, Y: box.top + (y - this.Y) * this.Zoom};
	},

	/* Zooms to zoom keeping point ({X, Y} of the screen; the center of the view by default) where it is. */
	ZoomTo: function (zoom, point) {
		var box = this.Viewport().getBoundingClientRect();
		var at = point || {X: box.left + box.width / 2, Y: box.top + box.height / 2};
		var world = this.ToWorld(at.X, at.Y);
		var next = Math.max(Number(this.MinZoom) || 0.1, Math.min(Number(this.MaxZoom) || 8, zoom));

		this.View(world.X - (at.X - box.left) / next, world.Y - (at.Y - box.top) / next, next);
	},

	/* Moves the view by dx and dy pixels of the screen. */
	Pan: function (dx, dy) {
		this.View(this.X + dx / this.Zoom, this.Y + dy / this.Zoom, this.Zoom);
	},

	/* The point x, y of the world in the middle of the view. */
	CenterOn: function (x, y) {
		var box = this.Viewport().getBoundingClientRect();

		this.View(x - box.width / 2 / this.Zoom, y - box.height / 2 / this.Zoom, this.Zoom);
	},

	/* The view of all the content, with margin pixels of the screen around (40), no larger than zoom 1. */
	FitContent: function (margin) {
		var box = this.Viewport().getBoundingClientRect();
		var content = this.$Element().querySelector('.elemenx-board-content');
		var pad = margin === undefined ? 40 : Number(margin) || 0;
		var left = Infinity;
		var top = Infinity;
		var right = -Infinity;
		var bottom = -Infinity;
		var zoom;

		/* The elements placed in the world (the content is their offset parent; a slot wraps them in elements of its own). */
		Array.prototype.forEach.call(content.querySelectorAll('*'), function (node) {
			var x = node.offsetLeft;

			if (node.offsetParent !== content) return;

			var y = node.offsetTop;

			left = Math.min(left, x);
			top = Math.min(top, y);
			right = Math.max(right, x + node.offsetWidth);
			bottom = Math.max(bottom, y + node.offsetHeight);
		});

		if (left === Infinity) return;

		zoom = Math.min(1, (box.width - pad * 2) / Math.max(1, right - left), (box.height - pad * 2) / Math.max(1, bottom - top));
		zoom = Math.max(Number(this.MinZoom) || 0.1, zoom);

		this.View(left - (box.width / zoom - (right - left)) / 2, top - (box.height / zoom - (bottom - top)) / 2, zoom);
	},

	Wheeled: function (event) {
		event.preventDefault();

		if (event.ctrlKey || event.metaKey) {
			this.ZoomTo(this.Zoom * Math.pow(2, -event.deltaY / 300), {X: event.clientX, Y: event.clientY});

			return;
		}

		this.Pan(event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX, event.shiftKey && !event.deltaX ? 0 : event.deltaY);
	},

	/* A pointer down: the middle button, Space, or an empty place (Drag) moves the view; two fingers pinch. */
	Pressed: function (event) {
		var own = this.Own();
		var empty = event.target === event.currentTarget || event.target.classList.contains('elemenx-board-world') || event.target.classList.contains('elemenx-board-content');
		var ids;

		own.Pointers[event.pointerId] = {X: event.clientX, Y: event.clientY};
		ids = Object.keys(own.Pointers);

		if (ids.length === 2) {
			own.Pan = null;
			own.Pinch = {Distance: this.Distance(own), Zoom: this.Zoom};

			return;
		}

		if (event.button === 1 || own.Space || (empty && this.Drag !== false && event.button === 0)) {
			event.preventDefault();

			own.Pan = {X: event.clientX, Y: event.clientY};

			if (event.currentTarget.setPointerCapture)
				event.currentTarget.setPointerCapture(event.pointerId);

			event.currentTarget.classList.add('panning');
		}
	},

	Distance: function (own) {
		var points = Object.keys(own.Pointers).map(function (id) {
			return own.Pointers[id];
		});

		return Math.max(1, Math.hypot(points[0].X - points[1].X, points[0].Y - points[1].Y));
	},

	Moved: function (event) {
		var own = this.Own();
		var points;

		if (!own.Pointers[event.pointerId]) return;

		own.Pointers[event.pointerId] = {X: event.clientX, Y: event.clientY};

		if (own.Pinch && Object.keys(own.Pointers).length === 2) {
			points = Object.keys(own.Pointers).map(function (id) {
				return own.Pointers[id];
			});

			this.ZoomTo(own.Pinch.Zoom * this.Distance(own) / own.Pinch.Distance, {X: (points[0].X + points[1].X) / 2, Y: (points[0].Y + points[1].Y) / 2});

			return;
		}

		if (!own.Pan) return;

		this.Pan(own.Pan.X - event.clientX, own.Pan.Y - event.clientY);

		own.Pan = {X: event.clientX, Y: event.clientY};
	},

	Released: function (event) {
		var own = this.Own();

		delete own.Pointers[event.pointerId];

		if (Object.keys(own.Pointers).length < 2)
			own.Pinch = null;

		own.Pan = null;

		event.currentTarget.classList.remove('panning');
	},

	Key: function (event) {
		var own = this.Own();
		var step = event.shiftKey ? 200 : 40;

		if (event.target !== event.currentTarget) return;

		if (event.type === 'keyup') {
			if (event.key === ' ')
				own.Space = false;

			return;
		}

		if (event.key === ' ') own.Space = true;
		else if (event.key === 'ArrowLeft') this.Pan(-step, 0);
		else if (event.key === 'ArrowRight') this.Pan(step, 0);
		else if (event.key === 'ArrowUp') this.Pan(0, -step);
		else if (event.key === 'ArrowDown') this.Pan(0, step);
		else if (event.key === '+' || event.key === '=') this.ZoomTo(this.Zoom * 1.25);
		else if (event.key === '-' || event.key === '_') this.ZoomTo(this.Zoom / 1.25);
		else if (event.key === '0') this.ZoomTo(1);
		else if (event.key === '!' || (event.key === '1' && event.shiftKey)) this.FitContent();
		else return;

		event.preventDefault();
	},

	ZoomIn: function () {
		this.ZoomTo(this.Zoom * 1.25);
	},

	ZoomOut: function () {
		this.ZoomTo(this.Zoom / 1.25);
	},

	Fitted: function () {
		this.FitContent();
	}
});
