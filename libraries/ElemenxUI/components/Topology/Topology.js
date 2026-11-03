/*
 * A graph shown, not edited: a network (hosts, routers, services) or what depends on what (modules, packages, tasks), its
 * nodes as the blocks of a blueprint on a Board, laid out by itself (Layouts.Graph). Nodes [{ID, Label, Icon, Kind (a class
 * of its own: kind-<Kind>), Status (ok, warning, error, off), Details ({name: value}: rows under its name)}], Links [{From,
 * To, Label, Status, Kind}]; Layout auto (by the shape of the graph), layers, tree, star, circle, grid or force; Direction
 * right or down; Center (the middle of a star, the root of a tree); Directed (true: arrows to where the links go; false,
 * the cables of a network, auto lays it out in no layers).
 * A press selects a node or a link (select {Node, Link}, their IDs or null) and lights what it is linked to; a double press
 * or Enter on a node emits open {Node}; a node dragged by its head stays where it is let go (until the graph changes or
 * Arrange). The arrows go from node to node, Escape lets the selection go.
 * Methods: Arrange(layout) (laid out again, by another layout when it is given), Fit(), Select(id), Selected(), Places()
 * ({ID: {X, Y, Width, Height}}).
 */
Elemenx.Component('Topology', {
	$TemplateURL: 'Topology.html',
	$StyleURL: 'Topology.css',
	$Meta: {
		Group: 'codes',
		Icon: 'share',
		Description: 'A graph shown as the blocks of a blueprint, laid out by itself: a network or what depends on what, in layers, a tree, a star, a circle or by force.',
		Events: {
			select: 'The selection changed: {Node, Link}, their IDs or null.',
			open: 'A node was opened (a double press or Enter): {Node}.'
		},
		Methods: ['Arrange(layout)', 'Fit()', 'Select(id)', 'Selected()', 'Places()'],
		Props: {
			Nodes: 'The nodes: [{ID, Label, Icon, Kind, Status (ok, warning, error, off), Details}].',
			Links: 'The links: [{From, To, Label, Status, Kind}].',
			Layout: {Options: ['auto', 'layers', 'tree', 'star', 'circle', 'grid', 'force'], Description: 'How the nodes are laid out: auto by the shape of the graph.'},
			Direction: {Options: ['right', 'down'], Description: 'Where layers and a tree go.'},
			Center: 'The node in the middle of a star, at the root of a tree.',
			Directed: 'Arrows to where the links go (true).',
			Gap: 'The room between nodes, in pixels (48).',
			Label: 'What it shows, for screen readers.'
		},
		Sample: {Nodes: [{ID: 'web', Label: 'Web', Icon: 'globe', Status: 'ok'}, {ID: 'api', Label: 'API', Icon: 'server', Status: 'warning', Details: {Latency: '120 ms'}}, {ID: 'db', Label: 'Database', Icon: 'database'}], Links: [{From: 'web', To: 'api'}, {From: 'api', To: 'db', Label: 'SQL'}]}
	},
	Nodes: [],
	Links: [],
	Layout: 'auto',
	Direction: 'right',
	Center: '',
	Directed: true,
	Gap: 48,
	Label: '',

	$OnCreate: function () {
		var own = {Canvas: null, Svg: null, Places: {}, Moved: {}, Selected: null, Drag: null, Used: '', Waiting: null, Fitted: false, Fitting: false};

		this.Own = function () {
			return own;
		};
	},

	/* The canvas is in the content of the Board: a Board whose template comes later brings it later. */
	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var root = this.$Element();

		if (root.querySelector('.elemenx-topology-canvas')) {
			this.Attach(root.querySelector('.elemenx-topology-canvas'));

			return;
		}

		own.Waiting = new MutationObserver(function () {
			var canvas = root.querySelector('.elemenx-topology-canvas');
			if (!canvas) return;

			own.Waiting.disconnect();
			own.Waiting = null;

			self.Attach(canvas);
		});

		own.Waiting.observe(root, {childList: true, subtree: true});
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Waiting)
			own.Waiting.disconnect();
	},

	/* A new graph or another layout: laid out again; where nodes were dragged is let go. */
	$OnProps: function (changed) {
		var own = this.Own();
		if (!own.Canvas) return;

		if ('Nodes' in changed || 'Links' in changed || 'Layout' in changed || 'Direction' in changed || 'Center' in changed || 'Gap' in changed) {
			own.Moved = {};

			this.Draw();
		}
		else if ('Directed' in changed) {
			this.Arrange();
		}
	},

	Attach: function (canvas) {
		var self = this;
		var own = this.Own();
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		svg.setAttribute('class', 'elemenx-topology-links');

		canvas.appendChild(svg);

		own.Canvas = canvas;
		own.Svg = svg;

		canvas.addEventListener('pointerdown', function (event) {
			self.Down(event);
		});

		canvas.addEventListener('pointermove', function (event) {
			self.Move(event);
		});

		canvas.addEventListener('pointerup', function (event) {
			self.Up(event);
		});

		canvas.addEventListener('pointercancel', function (event) {
			self.Up(event);
		});

		canvas.addEventListener('dblclick', function (event) {
			var node = event.target.closest && event.target.closest('.elemenx-topology-node');
			if (node)
				self.$Emit('open', {Node: node.getAttribute('data-node')});
		});

		canvas.addEventListener('keydown', function (event) {
			self.Key(event);
		});

		this.Draw();
	},

	List: function () {
		return Array.isArray(this.Nodes) ? this.Nodes : [];
	},

	Edges: function () {
		var ids = {};

		this.List().forEach(function (node) {
			ids[String(node.ID)] = true;
		});

		return (Array.isArray(this.Links) ? this.Links : []).filter(function (link) {
			return ids[String(link.From)] && ids[String(link.To)] && String(link.From) !== String(link.To);
		});
	},

	/* The nodes made anew, measured as they are drawn, laid out, then their links. */
	Draw: function () {
		var self = this;
		var own = this.Own();
		var canvas = own.Canvas;
		if (!canvas) return;

		Array.prototype.slice.call(canvas.querySelectorAll('.elemenx-topology-node')).forEach(function (node) {
			canvas.removeChild(node);
		});

		this.List().forEach(function (node) {
			canvas.appendChild(self.Block(node));
		});

		/* A graph drawn anew is fitted into the view again. */
		own.Fitted = false;

		this.Arrange();
	},

	/* A node as a block: its head (icon, name, status), its details under it. */
	Block: function (node) {
		var block = document.createElement('div');
		var head = document.createElement('div');
		var title = document.createElement('span');
		var details = node.Details && typeof node.Details === 'object' ? node.Details : null;
		var icon;
		var mark;
		var body;

		block.className = 'elemenx-topology-node' + (node.Kind ? ' kind-' + String(node.Kind).replace(/[^\w-]/g, '') : '') + (node.Status ? ' status-' + String(node.Status).replace(/[^\w-]/g, '') : '');

		block.setAttribute('data-node', String(node.ID));
		block.setAttribute('tabindex', '0');
		block.setAttribute('role', 'button');
		block.setAttribute('aria-label', String(node.Label || node.ID) + (node.Status ? ', ' + node.Status : ''));

		head.className = 'elemenx-topology-head';
		title.className = 'elemenx-topology-title';
		title.textContent = String(node.Label || node.ID);

		if (node.Icon) {
			icon = document.createElement('span');
			icon.className = 'elemenx-topology-icon';
			icon.innerHTML = '<svg class="elemenx-icon" width="14" height="14" aria-hidden="true"><use href="' + this.Escape(this.$Service('Icons').Href(String(node.Icon))) + '"></use></svg>';

			head.appendChild(icon);
		}

		head.appendChild(title);

		if (node.Status) {
			mark = document.createElement('span');
			mark.className = 'elemenx-topology-status';

			mark.setAttribute('aria-hidden', 'true');

			head.appendChild(mark);
		}

		block.appendChild(head);

		if (details && Object.keys(details).length) {
			body = document.createElement('dl');
			body.className = 'elemenx-topology-details';

			Object.keys(details).forEach(function (key) {
				var name = document.createElement('dt');
				var value = document.createElement('dd');

				name.textContent = key;
				value.textContent = details[key] === null || details[key] === undefined ? '' : String(details[key]);

				body.appendChild(name);
				body.appendChild(value);
			});

			block.appendChild(body);
		}

		return block;
	},

	/* Laid out again, by a layout of its own when given: where nodes were dragged is let go. */
	Arrange: function (layout) {
		var own = this.Own();
		var canvas = own.Canvas;
		var sizes = {};
		var made;

		if (!canvas)
			return null;

		if (layout)
			own.Moved = {};

		Array.prototype.slice.call(canvas.querySelectorAll('.elemenx-topology-node')).forEach(function (node) {
			sizes[node.getAttribute('data-node')] = [node.offsetWidth || 120, node.offsetHeight || 40];
		});

		made = this.$Service('Layouts').Graph(this.List().map(function (node) {
			var size = sizes[String(node.ID)] || [120, 40];

			return {ID: node.ID, Width: size[0], Height: size[1]};
		}), this.Edges(), {Layout: layout || this.Layout, Direction: this.Direction, Center: this.Center === '' ? undefined : this.Center, Gap: this.Gap, Directed: this.Directed !== false && this.Directed !== 'false'});

		own.Used = made.Layout;
		own.Places = {};

		made.Items.forEach(function (item) {
			own.Places[item.ID] = own.Moved[item.ID] || {X: item.X, Y: item.Y, Width: item.Width, Height: item.Height};
		});

		this.Placed();

		if (!own.Fitted && !own.Fitting && made.Items.length) {
			own.Fitting = true;

			this.FitShown(0);
		}

		return made.Layout;
	},

	/* The blocks where their places are, and the lines between them. */
	Placed: function () {
		var own = this.Own();
		var right = 1;
		var bottom = 1;

		Array.prototype.slice.call(own.Canvas.querySelectorAll('.elemenx-topology-node')).forEach(function (node) {
			var place = own.Places[node.getAttribute('data-node')];
			if (!place) return;

			node.style.left = place.X + 'px';
			node.style.top = place.Y + 'px';
			right = Math.max(right, place.X + place.Width);
			bottom = Math.max(bottom, place.Y + place.Height);
		});

		/* The canvas as large as the graph: the Board fits what is placed in its content, and the canvas is what is placed. */
		own.Canvas.style.width = Math.ceil(right) + 'px';
		own.Canvas.style.height = Math.ceil(bottom) + 'px';

		this.Lines();
	},

	/* The point of the edge of a place on the way to another point. */
	Edge: function (place, to) {
		var cx = place.X + place.Width / 2;
		var cy = place.Y + place.Height / 2;
		var dx = to[0] - cx;
		var dy = to[1] - cy;
		var scale = Math.min(dx ? place.Width / 2 / Math.abs(dx) : Infinity, dy ? place.Height / 2 / Math.abs(dy) : Infinity, 1);

		return [cx + dx * scale, cy + dy * scale];
	},

	/* The links: from edge to edge; in layers going right or down, a curve that leaves and comes in along the way. */
	Lines: function () {
		var self = this;
		var own = this.Own();
		var svg = own.Svg;
		var parts = [];
		var curved = own.Used === 'layers' || own.Used === 'tree';
		var down = this.Direction === 'down';
		var arrows = this.Directed !== false && this.Directed !== 'false';
		var lit = this.Lit();

		if (!svg) return;

		if (arrows)
			parts.push('<defs><marker id="' + this.Marker() + '" class="elemenx-topology-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"></path></marker></defs>');

		this.Edges().forEach(function (link, index) {
			var a = own.Places[String(link.From)];
			var b = own.Places[String(link.To)];
			var from;
			var to;
			var path;
			var bend;
			var classes = 'elemenx-topology-link' + (link.Status ? ' status-' + String(link.Status).replace(/[^\w-]/g, '') : '') + (link.Kind ? ' kind-' + String(link.Kind).replace(/[^\w-]/g, '') : '') + (own.Selected === 'link:' + index ? ' selected' : '') + (lit && !lit.Links[index] ? ' far' : '');

			if (!a || !b) return;

			if (curved && (down ? b.Y >= a.Y + a.Height : b.X >= a.X + a.Width)) {
				from = down ? [a.X + a.Width / 2, a.Y + a.Height] : [a.X + a.Width, a.Y + a.Height / 2];
				to = down ? [b.X + b.Width / 2, b.Y] : [b.X, b.Y + b.Height / 2];
				bend = Math.max(24, (down ? to[1] - from[1] : to[0] - from[0]) / 2);
				path = 'M' + from[0].toFixed(1) + ',' + from[1].toFixed(1) + ' C' + (down ? from[0] : from[0] + bend).toFixed(1) + ',' + (down ? from[1] + bend : from[1]).toFixed(1) + ' ' + (down ? to[0] : to[0] - bend).toFixed(1) + ',' + (down ? to[1] - bend : to[1]).toFixed(1) + ' ' + to[0].toFixed(1) + ',' + to[1].toFixed(1);
			}
			else {
				from = self.Edge(a, [b.X + b.Width / 2, b.Y + b.Height / 2]);
				to = self.Edge(b, [a.X + a.Width / 2, a.Y + a.Height / 2]);
				path = 'M' + from[0].toFixed(1) + ',' + from[1].toFixed(1) + ' L' + to[0].toFixed(1) + ',' + to[1].toFixed(1);
			}

			parts.push('<path class="' + classes + '" data-link="' + index + '" data-from="' + self.Escape(link.From) + '" data-to="' + self.Escape(link.To) + '" d="' + path + '"' + (arrows ? ' marker-end="url(#' + self.Marker() + ')"' : '') + '></path>');

			if (link.Label)
				parts.push('<text class="elemenx-topology-label" x="' + ((from[0] + to[0]) / 2).toFixed(1) + '" y="' + ((from[1] + to[1]) / 2 - 4).toFixed(1) + '">' + self.Escape(link.Label) + '</text>');
		});

		svg.innerHTML = parts.join('');

		Array.prototype.slice.call(own.Canvas.querySelectorAll('.elemenx-topology-node')).forEach(function (node) {
			var id = node.getAttribute('data-node');

			node.classList.toggle('selected', own.Selected === 'node:' + id);
			node.classList.toggle('far', !!lit && !lit.Nodes[id]);
		});
	},

	/* What a selection lights: the node and its neighbours, or the link and its two ends; null with none. */
	Lit: function () {
		var selected = this.Own().Selected;
		var lit = {Nodes: {}, Links: {}};
		var id;

		if (!selected) return null;

		id = selected.slice(5);

		this.Edges().forEach(function (link, index) {
			var from = String(link.From);
			var to = String(link.To);

			if (selected === 'link:' + index || selected === 'node:' + from || selected === 'node:' + to) {
				lit.Links[index] = true;
				lit.Nodes[from] = true;
				lit.Nodes[to] = true;
			}
		});

		if (selected.indexOf('node:') === 0)
			lit.Nodes[id] = true;

		return lit;
	},

	Marker: function () {
		var own = this.Own();

		own.MarkerID = own.MarkerID || 'elemenx-topology-arrow-' + Math.random().toString(36).slice(2, 8);

		return own.MarkerID;
	},

	Escape: function (text) {
		return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	},

	/* A node by its ID, or a link by link:<index>; nothing with an empty one. */
	Select: function (id) {
		var own = this.Own();
		var text = id === null || id === undefined ? '' : String(id);
		var before = own.Selected;
		var node;

		own.Selected = !text ? null : text.indexOf('link:') === 0 ? text : 'node:' + text;

		if (own.Selected === before) return;

		this.Lines();

		node = own.Selected && own.Selected.indexOf('node:') === 0 ? own.Canvas.querySelector('[data-node="' + this.Escape(own.Selected.slice(5)) + '"]') : null;

		if (node && document.activeElement !== node)
			node.focus({preventScroll: true});

		this.$Emit('select', this.Selected());
	},

	Selected: function () {
		var selected = this.Own().Selected;

		return {Node: selected && selected.indexOf('node:') === 0 ? selected.slice(5) : null, Link: selected && selected.indexOf('link:') === 0 ? Number(selected.slice(5)) : null};
	},

	Places: function () {
		return JSON.parse(JSON.stringify(this.Own().Places));
	},

	Fit: function () {
		var board = this.$Ref('Board', true);
		if (board)
			board.FitContent(40);
	},

	/* Fitted once the Board has a size (a frame or a few after it is shown): fitted into nothing, the graph would stand aside. */
	FitShown: function (tries) {
		var self = this;
		var board = this.$Element().querySelector('.elemenx-board');
		var box = board ? board.getBoundingClientRect() : null;

		if (box && box.width > 0 && box.height > 0 && this.$Ref('Board', true)) {
			this.Own().Fitting = false;
			this.Own().Fitted = true;

			this.Fit();

			return;
		}

		if (tries < 120) {
			window.requestAnimationFrame(function () {
				self.FitShown(tries + 1);
			});
		}
		else {
			this.Own().Fitting = false;
		}
	},

	/* A press on a node selects it, its head drags it; on a link it selects the link; on nothing it lets the selection go. */
	Down: function (event) {
		var own = this.Own();
		var node = event.target.closest && event.target.closest('.elemenx-topology-node');
		var link = event.target.getAttribute && event.target.getAttribute('data-link');
		var board = this.$Ref('Board', true);
		var at;

		if (event.button !== 0) return;

		if (link !== null && link !== undefined && link !== '') {
			event.stopPropagation();

			this.Select('link:' + link);

			return;
		}

		if (!node) {
			this.Select('');

			return;
		}

		event.stopPropagation();

		this.Select(node.getAttribute('data-node'));

		if (!event.target.closest('.elemenx-topology-head') || !board) return;

		at = board.ToWorld(event.clientX, event.clientY);
		own.Drag = {ID: node.getAttribute('data-node'), From: at, Place: Object.assign({}, own.Places[node.getAttribute('data-node')])};

		/* The pointer held while it drags; a pointer that is not down (sent by code) has nothing to hold. */
		try {
			node.setPointerCapture(event.pointerId);
		}
		catch (error) {
			own.Captured = false;
		}
	},

	Move: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var board = this.$Ref('Board', true);
		var at;

		if (!drag || !board) return;

		at = board.ToWorld(event.clientX, event.clientY);
		own.Places[drag.ID] = Object.assign({}, drag.Place, {X: drag.Place.X + at.X - drag.From.X, Y: drag.Place.Y + at.Y - drag.From.Y});
		own.Moved[drag.ID] = own.Places[drag.ID];

		this.Placed();
	},

	Up: function () {
		this.Own().Drag = null;
	},

	/* The arrows go to the nearest node that way, Enter opens the selected one, Escape lets it go. */
	Key: function (event) {
		var own = this.Own();
		var selected = this.Selected().Node;
		var place = selected ? own.Places[selected] : null;
		var ways = {ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1]};
		var way = ways[event.key];
		var best = null;
		var nearest = Infinity;

		if (event.key === 'Escape') {
			this.Select('');

			return;
		}

		if (event.key === 'Enter' && selected) {
			event.preventDefault();

			this.$Emit('open', {Node: selected});

			return;
		}

		if (!way) return;

		event.preventDefault();

		if (!place) {
			this.Select(this.List().length ? this.List()[0].ID : '');

			return;
		}

		Object.keys(own.Places).forEach(function (id) {
			var other = own.Places[id];
			var dx = other.X + other.Width / 2 - place.X - place.Width / 2;
			var dy = other.Y + other.Height / 2 - place.Y - place.Height / 2;
			var ahead = dx * way[0] + dy * way[1];
			var aside = Math.abs(dx * way[1] - dy * way[0]);

			if (id === selected || ahead <= 0) return;

			if (ahead + aside * 2 < nearest) {
				nearest = ahead + aside * 2;
				best = id;
			}
		});

		if (best)
			this.Select(best);
	}
});
