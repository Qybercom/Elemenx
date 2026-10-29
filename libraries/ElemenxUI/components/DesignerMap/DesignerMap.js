/*
 * The map of the pages of an application of the Designer Service: each page a frame on a Board (Bounds content), as
 * it runs (its template as the canvas shows it in a preview; the pointer does not reach it), in the order of the routes,
 * at the width of a desktop, a tablet or a phone (Width). Over the board each frame is named with its paths, and an
 * arrow goes from every element whose Href a route of another page matches (a link, a button) to that page: the ways
 * through the application. A press on a frame or on its name opens the page (open, its ID). Controls shows the buttons
 * of the zoom. The map follows the project as it changes; it starts with all of it in view.
 */
Elemenx.Component('DesignerMap', {
	$TemplateURL: 'DesignerMap.html',
	$StyleURL: 'DesignerMap.css',
	$Meta: {
		Group: 'tools',
		Icon: 'map',
		Description: 'The map of the pages of an application of the Designer: a frame each on a board, the links between them as arrows.',
		Events: {
			open: 'A frame or its name was pressed: the ID of its page.'
		},
		Props: {
			Width: {Options: ['desktop', 'tablet', 'phone'], Description: 'The width of the frames: desktop (1280 pixels), tablet (768) or phone (390).'},
			Controls: 'Shows the buttons of the zoom and its percent.'
		}
	},
	Width: 'desktop',
	Controls: true,
	Version: 0,
	Pages: [],
	Labels: [],
	Arrows: [],

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');
		var own = {Instances: {}, Sources: {}, Frame: 0, Fitted: '', Changed: null, Observer: null};
		var sizes = {desktop: [1280, 800], tablet: [768, 1024], phone: [390, 844]};

		own.Changed = function () {
			self.Version++;
		};

		/* The made pages, their sources and what follows them: not state, so they render nothing. */
		this.Own = function () {
			return own;
		};

		/* The pages are read again when the project changes, the language does or the width does. */
		this.Draw = function (version, width) {
			return {
				Render: function () {
					if (version >= 0 && width)
						self.Read();
				}
			};
		};

		this.Size = function (width) {
			var size = sizes[width] || sizes.desktop;

			return {Width: size[0] + 'px', Height: size[1] + 'px'};
		};

		/* The frames side by side, a gap of a fifth of a frame between them. */
		this.Place = function (index, width) {
			var size = sizes[width] || sizes.desktop;

			return index * Math.round(size[0] * 1.2) + 'px';
		};

		designer.OnChange(own.Changed);

		Elemenx.Locale.OnChange(own.Changed);

		designer.Load();
	},

	$OnReady: function () {
		var self = this;

		this.Own().Observer = new ResizeObserver(function () {
			self.Layout();
		});

		this.Own().Observer.observe(this.$Element());
	},

	$OnDestroy: function () {
		var own = this.Own();

		this.$Service('Designer').OffChange(own.Changed);

		Elemenx.Locale.OffChange(own.Changed);

		window.cancelAnimationFrame(own.Frame);

		if (own.Observer)
			own.Observer.disconnect();

		Object.keys(own.Instances).forEach(function (id) {
			own.Instances[id].$Destroy();
		});
	},

	/* The pages of the project, then, once their frames are there, each made again when its template changed. */
	Read: function () {
		var self = this;
		var designer = this.$Service('Designer');
		var pages = designer.Ready() && designer.Project().Mode === 'application' ? designer.Map() : [];

		this.Pages = pages.map(function (page, index) {
			return {ID: page.ID, Name: page.Name, Paths: page.Paths, Links: page.Links, Template: page.Template, Index: index};
		});

		this.Later(function () {
			self.Paint();
		});
	},

	/* On the next frame: the frames of the pages are drawn by then. */
	Later: function (run) {
		var own = this.Own();

		window.cancelAnimationFrame(own.Frame);

		own.Frame = window.requestAnimationFrame(run);
	},

	Paint: function () {
		var self = this;
		var own = this.Own();
		var page = Elemenx.Component('DesignerMapPage');
		var ids = this.Pages.map(function (item) {
			return item.ID;
		});

		/* The pages taken away go. */
		Object.keys(own.Instances).forEach(function (id) {
			if (ids.indexOf(id) !== -1) return;

			own.Instances[id].$Destroy();

			delete own.Instances[id];
			delete own.Sources[id];
		});

		this.Pages.forEach(function (item) {
			var host = self.$Element().querySelector('.elemenx-designer-map-frame[data-page="' + item.ID + '"] .elemenx-designer-map-host');
			if (!host || (own.Instances[item.ID] && own.Sources[item.ID] === item.Template && host.firstChild === own.Instances[item.ID].$Element())) return;

			if (own.Instances[item.ID])
				own.Instances[item.ID].$Destroy();

			page.Source = item.Template;

			/* The components of the Library the page names load as in any template. */
			own.Instances[item.ID] = page({}, null, {Application: self.$Application()});
			own.Sources[item.ID] = item.Template;

			host.textContent = '';

			host.appendChild(own.Instances[item.ID].$Element());

			if (own.Observer)
				own.Observer.observe(host);
		});

		this.Later(function () {
			self.Fit();
			self.Layout();
		});
	},

	Board: function () {
		var element = this.$Element().querySelector('.elemenx-board-host');

		return element ? Elemenx.Instance(element) : null;
	},

	/* All of the map in view, the first time it has pages and when the width of its frames changes. */
	Fit: function () {
		var own = this.Own();
		var board = this.Board();
		var key = this.Width + ':' + this.Pages.length;
		if (!board || !this.Pages.length || own.Fitted === key) return;

		own.Fitted = key;

		board.FitContent(48);
	},

	Viewed: function () {
		this.Layout();
	},

	/*
	 * The names of the frames and the arrows of the links, over the board in pixels of the screen (they keep their size
	 * at any zoom): an arrow from the side of the element that faces the page it goes to, to the side of that frame.
	 */
	Layout: function () {
		var self = this;
		var root = this.$Element().getBoundingClientRect();
		var frames = {};
		var places = {};
		var arrows = [];
		var top = Infinity;

		this.Pages.forEach(function (item) {
			var frame = self.$Element().querySelector('.elemenx-designer-map-frame[data-page="' + item.ID + '"]');
			if (!frame) return;

			frames[item.ID] = frame.getBoundingClientRect();
			places[item.ID] = item.Index;
			top = Math.min(top, frames[item.ID].top - root.top);
		});

		this.Pages.forEach(function (item) {
			var frame = self.$Element().querySelector('.elemenx-designer-map-frame[data-page="' + item.ID + '"]');

			item.Links.forEach(function (link, index) {
				var wrapper = frame ? frame.querySelector('[data-designer-id="' + link.Node + '"]') : null;
				var to = frames[link.Page];
				var from = wrapper ? self.Bounds(wrapper) : null;
				var right;
				var x1;
				var y1;
				var x2;
				var y2;
				var bend;
				var side;
				var lift;

				if (!from || !to) return;

				right = to.left >= from.right;
				x1 = (right ? from.right : from.left) - root.left;
				y1 = from.top + from.height / 2 - root.top;
				x2 = (right ? to.left : to.right) - root.left;
				y2 = Math.min(to.bottom, to.top + Math.max(24, to.height / 6)) - root.top;
				side = right ? 1 : -1;
				bend = Math.max(40, Math.abs(x2 - x1) / 2) * side;

				/* To a page further than the next one: over the row of the frames (and their names), not across those between. */
				lift = Math.abs(places[link.Page] - item.Index) > 1 ? top - 56 - 12 * (index % 4) : null;

				arrows.push({
					Key: item.ID + ':' + link.Node + ':' + index,
					X1: x1,
					Y1: y1,
					Path: lift === null ? 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + bend) + ' ' + y1 + ', ' + (x2 - bend) + ' ' + y2 + ', ' + (x2 - 8 * side) + ' ' + y2 : 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + 40 * side) + ' ' + y1 + ', ' + (x1 + 40 * side) + ' ' + lift + ', ' + ((x1 + x2) / 2) + ' ' + lift + ' S ' + (x2 - 40 * side) + ' ' + y2 + ', ' + (x2 - 8 * side) + ' ' + y2,
					Head: 'M ' + x2 + ' ' + y2 + ' L ' + (x2 - 10 * side) + ' ' + (y2 - 6) + ' L ' + (x2 - 10 * side) + ' ' + (y2 + 6) + ' Z'
				});
			});
		});

		this.Labels = this.Pages.filter(function (item) {
			return !!frames[item.ID];
		}).map(function (item) {
			return {ID: item.ID, Name: item.Name, Paths: item.Paths, Left: Math.round(frames[item.ID].left - root.left), Top: Math.round(frames[item.ID].top - root.top)};
		});

		this.Arrows = arrows;
	},

	/* The box of the element of a node: its own wrapper takes no room (the boxes of what is in it, as one). */
	Bounds: function (wrapper) {
		var range = document.createRange();
		var box;

		range.selectNodeContents(wrapper);

		box = range.getBoundingClientRect();

		return box.width || box.height ? box : null;
	},

	Opened: function (event) {
		var id = event.currentTarget.getAttribute('data-page');
		if (id)
			this.$Emit('open', id);
	}
});

/* A page of the map: its template is the one the map sets (Source) right before it makes it. */
Elemenx.Component('DesignerMapPage', {
	$Template: function () {
		return '<div class="elemenx-designer-page">' + (Elemenx.Component('DesignerMapPage').Source || '') + '</div>';
	}
});
