/*
 * A window over the page or over its container: a header with its Title (and an Overline above it, an Icon), the
 * body (the default slot) and a footer (slot footer); the slot header puts controls into the header.
 * - The header moves it (Draggable), the edges and the corners resize it (Resizable; MinWidth, MinHeight, MaxWidth,
 *   MaxHeight). The focus on the header takes the arrows: they move it, Shift with them resizes it.
 * - Minimize folds it to its header (Minimizable; again unfolds it), Maximize fills its bounds (Maximizable; a double
 *   press on the header too), Close hides it (Closable; the close event, Open false).
 * - X, Y, Width and Height place it (pixels); without X and Y it goes into a cascade of the new windows. Bounds:
 *   'parent' (the positioned element it is in; the default) or 'viewport' (fixed to the window of the browser).
 *   Persist names a window whose place, size and state are remembered.
 * - A press or the focus puts it over the other windows (the Windows Service) and makes it active (class active).
 * - Variant: 'default', or 'game' for the look of the game theme (the --elemenx-game-* tokens). Level: 'primary'
 *   (the main windows), 'secondary' (the smaller ones) or 'plain' (a dialog, a message): a theme draws each its way.
 * - HeaderShape 'trapezoid' makes the window a folder: the Icon and the titles on a tab as wide as the title, its end
 *   sloping down to the body; the slot header and the buttons stand beyond the slope, and the header still moves it.
 * - PopOut adds a button that moves the body into a window of its own over the other windows of the system
 *   (Document Picture-in-Picture: Chrome and Edge; the PictureInPicture Service), and back; Popped tells it is there.
 * - Events: move ({X, Y}), resize ({Width, Height}), minimize, maximize, restore, close, front, popout, popin.
 * - Methods: Front(), Minimize(), Maximize(), Restore(), Close(), Center().
 */
Elemenx.Component('Window', {
	$TemplateURL: 'Window.html',
	$StyleURL: 'Window.css',
	Title: '',
	Overline: '',
	Icon: '',
	Open: true,
	X: null,
	Y: null,
	Width: 360,
	Height: null,
	MinWidth: 200,
	MinHeight: 120,
	MaxWidth: null,
	MaxHeight: null,
	Bounds: 'parent',
	Draggable: true,
	Resizable: true,
	Minimizable: true,
	Maximizable: true,
	Closable: true,
	Minimized: false,
	Maximized: false,
	Persist: '',
	Variant: 'default',
	Level: 'primary',
	PopOut: false,
	Popped: false,
	HeaderShape: 'default',
	Z: 100,
	Active: false,
	Moving: false,

	$OnCreate: function () {
		var self = this;
		var own = {Pointer: null, Listener: null};
		var stored;

		/* Whether the browser can put the body into a window of its own. */
		this.CanPopOut = function () {
			return self.$Service('PictureInPicture').Supported('document');
		};

		this.WindowID = 'elemenx-window-' + Math.random().toString(36).slice(2, 10);

		this.Own = function () {
			return own;
		};

		/* The style of the place of the window. */
		this.Geometry = function (x, y, width, height, z, maximized) {
			if (maximized)
				return 'z-index: ' + z + ';';

			return 'left: ' + (Number(x) || 0) + 'px; top: ' + (Number(y) || 0) + 'px; width: ' + (Number(width) ? Number(width) + 'px' : 'auto') + '; height: ' + (Number(height) && !self.Minimized ? Number(height) + 'px' : 'auto') + '; z-index: ' + z + ';';
		};

		stored = this.Persist ? this.Windows().Load(this.Persist) : null;

		if (stored) {
			['X', 'Y', 'Width', 'Height', 'Minimized', 'Maximized'].forEach(function (key) {
				if (stored[key] !== undefined)
					self[key] = stored[key];
			});
		}

		if (this.X == null || this.Y == null) {
			stored = this.Windows().Place();

			if (this.X == null)
				this.X = stored.X;

			if (this.Y == null)
				this.Y = stored.Y;
		}

		this.Z = this.Windows().Register(this);
	},

	$OnReady: function () {
		var self = this;
		var windows = this.Windows();

		this.Own().Listener = function () {
			self.Active = windows.Active() === self;
		};

		windows.OnChange(this.Own().Listener);

		/* The body in a window of its own, or back: Popped follows, and the events tell. */
		this.Own().Pip = function (state) {
			var popped = !!(state && state.Element === self.Own().Body);
			if (popped === self.Popped) return;

			self.Popped = popped;

			self.$Emit(popped ? 'popout' : 'popin');
		};

		this.$Service('PictureInPicture').OnChange(this.Own().Pip);

		/* The width of the tab of a folder (HeaderShape trapezoid), where the top of the body begins. */
		this.Own().Measure = typeof ResizeObserver === 'function' ? new ResizeObserver(function () {
			var header = self.$Element() && self.$Element().querySelector('.elemenx-window-header');
			var tab = header && header.querySelector('.elemenx-window-tab');
			if (tab)
				header.style.setProperty('--elemenx-tab-width', tab.offsetWidth + 'px');
		}) : null;

		if (this.Own().Measure)
			this.Own().Measure.observe(this.$Element().querySelector('.elemenx-window-tab'));

		if (this.Open)
			this.Front();
	},

	$OnDestroy: function () {
		var windows = this.Windows();

		windows.OffChange(this.Own().Listener);
		windows.Unregister(this);

		this.$Service('PictureInPicture').OffChange(this.Own().Pip);

		if (this.Own().Measure)
			this.Own().Measure.disconnect();

		if (this.Popped)
			this.$Service('PictureInPicture').Close();
	},

	Windows: function () {
		return this.$Service('Windows');
	},

	/* The box the window keeps to: {Width, Height} of its container or of the viewport. */
	Area: function () {
		var root = this.$Element();
		var parent = root && root.offsetParent;
		if (this.Bounds === 'viewport' || !parent)
			return {Width: window.innerWidth, Height: window.innerHeight};

		return {Width: parent.clientWidth, Height: parent.clientHeight};
	},

	Clamp: function (value, low, high) {
		return Math.max(low, Math.min(high, value));
	},

	Save: function () {
		if (this.Persist)
			this.Windows().Save(this.Persist, {X: this.X, Y: this.Y, Width: this.Width, Height: this.Height, Minimized: this.Minimized, Maximized: this.Maximized});
	},

	Front: function () {
		var before = this.Active;

		this.Windows().Front(this);

		this.Active = true;

		if (!before)
			this.$Emit('front');

		return this;
	},

	Pressed: function () {
		this.Front();
	},

	Minimize: function () {
		if (!this.Minimizable) return this;

		this.Minimized = !this.Minimized;

		this.$Emit(this.Minimized ? 'minimize' : 'restore');

		this.Save();

		return this;
	},

	Maximize: function () {
		if (!this.Maximizable) return this;

		this.Maximized = !this.Maximized;
		this.Minimized = false;

		this.$Emit(this.Maximized ? 'maximize' : 'restore');

		this.Save();

		return this;
	},

	Restore: function () {
		if (!this.Minimized && !this.Maximized) return this;

		this.Minimized = false;
		this.Maximized = false;

		this.$Emit('restore');

		this.Save();

		return this;
	},

	Close: function () {
		if (!this.Closable) return this;

		this.Open = false;

		this.$Emit('close');

		return this;
	},

	Center: function () {
		var root = this.$Element();
		var area = this.Area();

		this.X = Math.max(0, Math.round((area.Width - (root ? root.offsetWidth : Number(this.Width) || 0)) / 2));
		this.Y = Math.max(0, Math.round((area.Height - (root ? root.offsetHeight : Number(this.Height) || 0)) / 2));

		this.Save();

		return this;
	},

	Toggled: function (event) {
		if (event.target.closest('.elemenx-window-control')) return;

		this.Maximize();
	},

	/* The size of the window now, in pixels. */
	Size: function () {
		var root = this.$Element();

		return {Width: root.offsetWidth, Height: root.offsetHeight};
	},

	/* Moves the window to x, y inside its bounds (its header always stays in reach). */
	MoveTo: function (x, y) {
		var area = this.Area();
		var size = this.Size();

		this.X = Math.round(this.Clamp(x, Math.min(0, area.Width - size.Width), Math.max(0, area.Width - Math.min(size.Width, 64))));
		this.Y = Math.round(this.Clamp(y, 0, Math.max(0, area.Height - 32)));
	},

	ResizeTo: function (width, height) {
		var area = this.Area();
		var maxWidth = Math.min(Number(this.MaxWidth) || Infinity, area.Width - this.X);
		var maxHeight = Math.min(Number(this.MaxHeight) || Infinity, area.Height - this.Y);

		this.Width = Math.round(this.Clamp(width, Number(this.MinWidth) || 0, Math.max(Number(this.MinWidth) || 0, maxWidth)));
		this.Height = Math.round(this.Clamp(height, Number(this.MinHeight) || 0, Math.max(Number(this.MinHeight) || 0, maxHeight)));
	},

	/* A press on the header (not on its buttons) starts a move; a press on an edge, a resize. */
	PointerDown: function (event, node) {
		var edge = node.getAttribute('data-edge') || '';
		var size;

		if (event.button !== 0 || this.Maximized) return;
		if (!edge && (!this.Draggable || event.target.closest('.elemenx-window-control, .elemenx-window-extra'))) return;
		if (edge && (!this.Resizable || this.Minimized)) return;

		event.preventDefault();

		size = this.Size();

		this.Front();

		this.Own().Pointer = {ID: event.pointerId, Edge: edge, StartX: event.clientX, StartY: event.clientY, X: Number(this.X) || 0, Y: Number(this.Y) || 0, Width: size.Width, Height: size.Height};
		this.Moving = true;

		if (node.setPointerCapture)
			node.setPointerCapture(event.pointerId);
	},

	PointerMove: function (event) {
		var pointer = this.Own().Pointer;
		var dx;
		var dy;
		var width;
		var height;
		var x;
		var y;

		if (!pointer || pointer.ID !== event.pointerId) return;

		dx = event.clientX - pointer.StartX;
		dy = event.clientY - pointer.StartY;

		if (!pointer.Edge) {
			this.MoveTo(pointer.X + dx, pointer.Y + dy);

			return;
		}

		width = pointer.Width;
		height = pointer.Height;
		x = pointer.X;
		y = pointer.Y;

		if (pointer.Edge.indexOf('e') !== -1)
			width += dx;

		if (pointer.Edge.indexOf('s') !== -1)
			height += dy;

		if (pointer.Edge.indexOf('w') !== -1) {
			width = this.Clamp(width - dx, Number(this.MinWidth) || 0, Math.min(Number(this.MaxWidth) || Infinity, pointer.X + pointer.Width));
			x = pointer.X + pointer.Width - width;
		}

		if (pointer.Edge.indexOf('n') !== -1) {
			height = this.Clamp(height - dy, Number(this.MinHeight) || 0, Math.min(Number(this.MaxHeight) || Infinity, pointer.Y + pointer.Height));
			y = pointer.Y + pointer.Height - height;
		}

		this.X = Math.round(Math.max(0, x));
		this.Y = Math.round(Math.max(0, y));

		this.ResizeTo(width, height);
	},

	PointerUp: function (event) {
		var pointer = this.Own().Pointer;
		if (!pointer || pointer.ID !== event.pointerId) return;

		this.Own().Pointer = null;
		this.Moving = false;

		if (pointer.Edge) this.$Emit('resize', {Width: this.Width, Height: this.Height});
		else this.$Emit('move', {X: this.X, Y: this.Y});

		this.Save();
	},

	/* The arrows on the header move the window; with Shift they resize it. */
	Key: function (event) {
		var step = event.altKey ? 1 : 16;
		var dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
		var dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
		var size;

		if (event.target !== event.currentTarget || !dx && !dy || this.Maximized) return;

		event.preventDefault();

		if (event.shiftKey) {
			if (!this.Resizable || this.Minimized) return;

			size = this.Size();

			this.ResizeTo(size.Width + dx, size.Height + dy);

			this.$Emit('resize', {Width: this.Width, Height: this.Height});
		}
		else {
			if (!this.Draggable) return;

			this.MoveTo((Number(this.X) || 0) + dx, (Number(this.Y) || 0) + dy);

			this.$Emit('move', {X: this.X, Y: this.Y});
		}

		this.Save();
	},

	MinimizePressed: function () {
		this.Minimize();
	},

	MaximizePressed: function () {
		this.Maximize();
	},

	ClosePressed: function () {
		this.Close();
	},

	PopPressed: function () {
		var pip = this.$Service('PictureInPicture');
		var body;

		if (this.Popped) {
			pip.Close();

			return;
		}

		body = this.$Element().querySelector('.elemenx-window-body');

		this.Own().Body = body;

		pip.Document(body, {Width: body.offsetWidth, Height: body.offsetHeight, Title: this.Title});
	}
});
