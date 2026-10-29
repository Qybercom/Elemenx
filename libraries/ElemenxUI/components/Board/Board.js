/*
 * An infinite canvas, as the one of Figma: its content (the default slot) lives in coordinates of its own (the world,
 * in pixels at zoom 1: place the elements in it with position absolute, left and top) and the board shows a part of
 * it, moved and scaled. The wheel moves it (a trackpad with two fingers too; over an element of the content that
 * scrolls that way, a list, it scrolls that element), Ctrl with the wheel or a pinch zooms at
 * the pointer, a drag with the middle button, with Space held or on an empty place (Drag) moves it; when it has the
 * focus, the arrows move it, + and - zoom, 0 gives zoom 1 and Shift+1 fits the content. X and Y are the point of the
 * world at the top left corner of the view, Zoom its scale (MinZoom to MaxZoom); Grid dots, lines or none, of
 * GridSize pixels of the world. Controls shows the buttons of the zoom and its percent. The view event tells
 * {X, Y, Zoom} as it changes. Bounds keeps the view to a part of the world: none (anywhere, by default), content (the
 * content with BoundsMargin pixels of the world around) or frame (the element of the content with data-frame="Frame",
 * the first one without a Frame, BoundsMargin around it); a part smaller than the view stays in its middle, and the
 * view follows the part as it changes. Methods: ZoomTo(zoom, point), Pan(dx, dy), FitContent(margin) (the frame alone
 * with Bounds frame), CenterOn(x, y), ToWorld(clientX, clientY), ToScreen(x, y), Limits() (the part of the world the
 * view is kept to, {Left, Top, Right, Bottom}, or null).
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
			Controls: 'Shows the buttons of the zoom and its percent.',
			Bounds: {Options: ['none', 'content', 'frame'], Description: 'Keeps the view to a part of the world: none (anywhere), content (the content with BoundsMargin around), frame (the element of the content of Frame).'},
			BoundsMargin: 'The room around the content or the frame the view goes to, in pixels of the world.',
			Frame: 'The frame Bounds frame keeps the view to: the element of the content with data-frame of this name (the first one without a name).'
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
	Bounds: 'none',
	BoundsMargin: 40,
	Frame: '',

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
			return self.State || (self.State = {Pointers: {}, Space: false, Pan: null, Pinch: null, Observers: []});
		};
	},

	/* The view follows its part of the world as the part and the view change size: the elements placed in it are watched. */
	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var content = this.$Element().querySelector('.elemenx-board-content');
		var watched = [];
		var sizes = new ResizeObserver(watch);
		var nodes = new MutationObserver(watch);

		/* The elements placed now, those not watched yet added (a board out of the page has none placed until it is in). */
		function watch () {
			var placed = self.Placed();

			watched.forEach(function (node) {
				if (placed.indexOf(node) === -1)
					sizes.unobserve(node);
			});

			placed.forEach(function (node) {
				if (watched.indexOf(node) === -1)
					sizes.observe(node);
			});

			watched = placed;

			self.Bound();
		}

		sizes.observe(this.Viewport());

		nodes.observe(content, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-frame']});

		own.Observers = [sizes, nodes];

		watch();
	},

	$OnProps: function (changed) {
		if ('Bounds' in changed || 'BoundsMargin' in changed || 'Frame' in changed)
			this.Bound();
	},

	$OnDestroy: function () {
		this.Own().Observers.forEach(function (observer) {
			observer.disconnect();
		});
	},

	/* The view of the world: X, Y and Zoom within their bounds (the part of the world of Bounds), told by the view event. */
	View: function (x, y, zoom) {
		var limits = this.Limits();
		var box = limits ? this.Viewport().getBoundingClientRect() : null;

		/* Along one side: a part smaller than the view in its middle, a larger one never short of the view. */
		function within (value, from, to, size) {
			return to - from <= size ? from - (size - (to - from)) / 2 : Math.max(from, Math.min(to - size, value));
		}

		zoom = Math.max(Number(this.MinZoom) || 0.1, Math.min(Number(this.MaxZoom) || 8, zoom));

		if (box && box.width && box.height) {
			x = within(x, limits.Left, limits.Right, box.width / zoom);
			y = within(y, limits.Top, limits.Bottom, box.height / zoom);
		}

		if (x === this.X && y === this.Y && zoom === this.Zoom) return;

		this.X = x;
		this.Y = y;
		this.Zoom = zoom;

		this.$Emit('view', {X: x, Y: y, Zoom: zoom});
	},

	Viewport: function () {
		return this.$Element().querySelector('.elemenx-board');
	},

	/* The elements placed in the world: the content is their offset parent (a slot wraps them in elements of its own). */
	Placed: function () {
		var content = this.$Element().querySelector('.elemenx-board-content');
		var result = [];

		/* Not into a placed element: what is inside it is placed in it, not in the world. */
		function walk (node) {
			Array.prototype.forEach.call(node.children, function (child) {
				if (child.offsetParent === content) result.push(child);
				else walk(child);
			});
		}

		walk(content);

		return result;
	},

	/*
	 * The box of elements in the world, {Left, Top, Right, Bottom}, by their offsets up to the content (the scale of the
	 * view, drawn or not yet, does not change them); null for none or none of a size.
	 */
	Extent: function (nodes) {
		var content = this.$Element().querySelector('.elemenx-board-content');
		var result = null;

		nodes.forEach(function (node) {
			var left = 0;
			var top = 0;
			var at = node;
			var right;
			var bottom;

			while (at && at !== content) {
				left += at.offsetLeft;
				top += at.offsetTop;
				at = at.offsetParent;
			}

			if (at !== content || (!node.offsetWidth && !node.offsetHeight)) return;

			right = left + node.offsetWidth;
			bottom = top + node.offsetHeight;

			result = result ? {Left: Math.min(result.Left, left), Top: Math.min(result.Top, top), Right: Math.max(result.Right, right), Bottom: Math.max(result.Bottom, bottom)} : {Left: left, Top: top, Right: right, Bottom: bottom};
		});

		return result;
	},

	/* The frame of Bounds frame: the element of the content with data-frame of the name of Frame (the first one without it). */
	Framed: function () {
		var content = this.$Element().querySelector('.elemenx-board-content');
		var name = String(this.Frame || '');

		return Array.prototype.filter.call(content.querySelectorAll('[data-frame]'), function (node) {
			return !name || node.getAttribute('data-frame') === name;
		})[0] || null;
	},

	/* The part of the world the view is kept to, its margin around: null with Bounds none, or with nothing to keep it to. */
	Limits: function () {
		var margin = Number(this.BoundsMargin) || 0;
		var frame = this.Bounds === 'frame' ? this.Framed() : null;
		var extent = this.Bounds === 'content' ? this.Extent(this.Placed()) : frame ? this.Extent([frame]) : null;
		if (!extent)
			return null;

		return {Left: extent.Left - margin, Top: extent.Top - margin, Right: extent.Right + margin, Bottom: extent.Bottom + margin};
	},

	/* The view within its bounds again: the part of the world or the view changed. */
	Bound: function () {
		this.View(this.X, this.Y, this.Zoom);
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

	/*
	 * The view of all the content (of the frame alone with Bounds frame), with margin pixels of the screen around (40),
	 * no larger than zoom 1.
	 */
	FitContent: function (margin) {
		var box = this.Viewport().getBoundingClientRect();
		var pad = margin === undefined ? 40 : Number(margin) || 0;
		var frame = this.Bounds === 'frame' ? this.Framed() : null;
		var extent = this.Extent(frame ? [frame] : this.Placed());
		var width;
		var height;
		var zoom;

		if (!extent) return;

		width = extent.Right - extent.Left;
		height = extent.Bottom - extent.Top;
		zoom = Math.min(1, (box.width - pad * 2) / Math.max(1, width), (box.height - pad * 2) / Math.max(1, height));
		zoom = Math.max(Number(this.MinZoom) || 0.1, zoom);

		this.View(extent.Left - (box.width / zoom - width) / 2, extent.Top - (box.height / zoom - height) / 2, zoom);
	},

	/* Whether an element of the content under the pointer scrolls further that way itself (a list in the content). */
	Scrolls: function (target, dx, dy) {
		var content = this.$Element().querySelector('.elemenx-board-content');
		var node;
		var style;

		if (!content.contains(target)) return false;

		for (node = target; node && node !== content; node = node.parentElement) {
			style = window.getComputedStyle(node);

			if (dy && /auto|scroll/.test(style.overflowY) && (dy < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1)) return true;
			if (dx && /auto|scroll/.test(style.overflowX) && (dx < 0 ? node.scrollLeft > 0 : node.scrollLeft + node.clientWidth < node.scrollWidth - 1)) return true;
		}

		return false;
	},

	/* The wheel moves the view, Ctrl with it zooms; over an element of the content that scrolls that way, it scrolls it. */
	Wheeled: function (event) {
		if (!event.ctrlKey && !event.metaKey && this.Scrolls(event.target, event.deltaX, event.deltaY)) return;

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
