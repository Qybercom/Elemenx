/*
 * A Topology seen in 3D (the View isometric of Topology, or alone): its nodes as shapes standing on a floor of cells, seen
 * from above at an angle that turns. Drawn on a canvas, so thousands of nodes stay fluid; a list of them, out of sight, is
 * there for the keys and for screen readers.
 *
 * Nodes [{ID, Label, Kind (of TopologyKinds: its shape, its color, its size, its icon and how it shows its load), Shape,
 * Color, Size, Icon (over its kind), Status (ok, warning, error, off: the color of its pad), Active (a glow round its foot;
 * without it the node is dimmed a little), Load (0 to 1, as its kind shows it), X and Y (its cell; else laid out), Comment
 * (Markdown)}]; Links [{From, To, Label, Status, Kind (dashed: a dashed line), Load (0 to 1: how fast its dashes run, how
 * thick and how warm it is), Comment}]; Groups [{ID, Title, Color, Members (IDs of nodes and groups), Collapsed (one node of
 * them all), Comment}]: zones on the floor round their members, nested.
 *
 * Angle (degrees round, 45) and Tilt (degrees down, 35) set the view; a drag with the right button (or Alt) turns it, Q
 * and E turn it a quarter, the wheel zooms by the pointer, a drag of the floor moves it. A press selects a node, a link or
 * a group (by its title) and lights what is linked to it; a node dragged goes to the cell it is let go on (move {Node, X,
 * Y}), a group dragged by its title takes its members along; a double press (or Enter) opens a node (open {Node}) or folds
 * and unfolds a group. Comments show as Comments says: caption (a muted line of Markdown under the name), icon (a mark,
 * the text when the pointer is over it) or hidden.
 * A group is laid out in one piece, its groups inside it, so its zone holds its own and no other.
 *
 * Search lights the nodes whose name, ID, kind or comment has its text (Find(text) gives their IDs, Show(id) brings the view
 * over one); Legend shows the kinds of the nodes, a press on one lights its nodes; Minimap shows the floor from above in a
 * corner, the view a frame on it that a press or a drag there moves. Shift with a press on a node, one chosen, lights the
 * shortest way between them (Path(from, to); path {From, To, Nodes, Links}); Escape lets it go. ReadOnly keeps all where it
 * is; EditCheck (action, target), false for what may not be done: move {Node}, group {Group} (dragged by its title),
 * toggle {Group}; a refusal is told in denied {Action, Node or Group}. Snapshot() keeps the view, the nodes dragged and the
 * groups folded, Restore(snapshot) brings them back.
 * Methods: Arrange(layout), Fit(), Select(id) (a node, link:<index> or group:<id>), Selected(), Places() ({ID: {X, Y}}
 * in cells), Rotate(degrees), Update(id, changes) (what a node shows, as it changes, with no new layout; link:<index> for
 * a link), Toggle(group), ToScreen(id) ({X, Y} of the page), Picture() (a PNG data URL), Find(text), Show(id),
 * Path(from, to), Snapshot(), Restore(snapshot).
 */
Elemenx.Component('TopologyIso', {
	$TemplateURL: 'TopologyIso.html',
	$StyleURL: 'TopologyIso.css',
	$Meta: {
		Group: 'codes',
		Icon: 'box',
		Description: 'A Topology seen in 3D: nodes as shapes on a floor of cells, turned and tilted, with their status, activity, load, groups and comments.',
		Events: {
			select: 'The selection changed: {Node, Link, Group}, their IDs or null.',
			open: 'A node was opened (a double press or Enter): {Node}.',
			move: 'A node was dragged to a cell: {Node, X, Y}.',
			toggle: 'A group was folded or unfolded: {Group, Collapsed}.',
			view: 'The view turned, tilted or zoomed: {Angle, Tilt, Zoom}.',
			path: 'The shortest way between two nodes was lit: {From, To, Nodes, Links} (Nodes empty: there is none).',
			denied: 'ReadOnly or EditCheck refused what was done: {Action (move, group, toggle), Node or Group}.'
		},
		Methods: ['Arrange(layout)', 'Fit()', 'Select(id)', 'Selected()', 'Places()', 'Rotate(degrees)', 'Update(id, changes)', 'Toggle(group)', 'ToScreen(id)', 'Picture()', 'Find(text)', 'Show(id)', 'Path(from, to)', 'Snapshot()', 'Restore(snapshot)'],
		Props: {
			Nodes: 'The nodes: [{ID, Label, Kind, Shape, Color, Size, Icon, Status, Active, Load, X, Y, Comment}].',
			Links: 'The links: [{From, To, Label, Status, Kind, Load, Comment}].',
			Groups: 'The groups: [{ID, Title, Color, Members, Collapsed, Comment}].',
			Layout: {Options: ['auto', 'layers', 'tree', 'star', 'circle', 'grid', 'force'], Description: 'How the nodes with no cell of their own are laid out.'},
			Direction: {Options: ['right', 'down'], Description: 'Where layers and a tree go.'},
			Center: 'The node in the middle of a star, at the root of a tree.',
			Directed: 'Links run from where they come to where they go (their dashes and an arrow).',
			Gap: 'The room between nodes, in cells (1).',
			Angle: 'The turn of the view, in degrees (45).',
			Tilt: 'How far it looks down, in degrees (35).',
			Grid: 'The cells of the floor drawn.',
			Comments: {Options: ['caption', 'icon', 'hidden'], Description: 'How comments show: a muted line under the name, a mark, or not at all.'},
			Search: 'A text: the nodes that have it are lit, the others dimmed.',
			Legend: 'The kinds of the nodes shown in a corner; a press on one lights its nodes.',
			Minimap: 'The floor from above in a corner, the view a frame that a press moves.',
			ReadOnly: 'Nothing is dragged, no group folded by a press.',
			EditCheck: 'A function (action, target): false refuses it (move {Node}, group {Group}, toggle {Group}).',
			Label: 'What it shows, for screen readers.'
		},
		Sample: {Nodes: [{ID: 'core', Label: 'Core Switch', Kind: 'switch', Active: true, Status: 'ok'}, {ID: 'app', Label: 'App', Kind: 'server', Active: true, Load: 0.6}, {ID: 'db', Label: 'DB', Kind: 'database', Load: 0.4, Active: true}, {ID: 'storage', Label: 'Storage', Kind: 'storage', Load: 0.8}], Links: [{From: 'core', To: 'app', Load: 0.5}, {From: 'core', To: 'db', Kind: 'dashed'}, {From: 'app', To: 'storage', Load: 0.2}]}
	},
	Nodes: [],
	Links: [],
	Groups: [],
	Layout: 'auto',
	Direction: 'right',
	Center: '',
	Directed: true,
	Gap: 1,
	Angle: 45,
	Tilt: 35,
	Grid: true,
	Comments: 'caption',
	Search: '',
	Legend: false,
	Minimap: false,
	ReadOnly: false,
	EditCheck: null,
	Label: '',

	/* The kind picked in the legend (its nodes lit), and the kinds in it. */
	LegendKind: '',
	LegendItems: [],

	/* The nodes for the list out of sight (keys, screen readers). */
	Items: [],

	$OnCreate: function () {
		var own = {Canvas: null, Context: null, Overlay: null, Places: {}, Moved: {}, Live: {}, Folded: {}, Selected: null, Hover: null, Drag: null, Hits: [], Camera: {Yaw: 45 * Math.PI / 180, Pitch: 35 * Math.PI / 180, Zoom: 40, X: 0, Y: 0}, Turn: null, Colors: null, ColorsAt: 0, Frame: 0, Seen: true, Fitted: false, Notes: {}, Width: 0, Height: 0, Shown: null, Index: null, Font: ''};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		var self = this;
		var own = this.Own();
		var root = this.$Element();

		own.Canvas = root.querySelector('.elemenx-topology-iso-canvas');
		own.Overlay = root.querySelector('.elemenx-topology-iso-notes');
		own.Context = own.Canvas.getContext('2d');
		own.Camera.Yaw = this.Number(this.Angle, 45) * Math.PI / 180;
		own.Camera.Pitch = this.Pitch(this.Tilt);

		own.Canvas.addEventListener('pointerdown', function (event) {
			self.Down(event);
		});

		own.Canvas.addEventListener('pointermove', function (event) {
			self.Move(event);
		});

		own.Canvas.addEventListener('pointerup', function (event) {
			self.Up(event);
		});

		own.Canvas.addEventListener('pointercancel', function (event) {
			self.Up(event);
		});

		own.Canvas.addEventListener('wheel', function (event) {
			self.Wheel(event);
		}, {passive: false});

		own.Canvas.addEventListener('dblclick', function (event) {
			self.Double(event);
		});

		own.Canvas.addEventListener('contextmenu', function (event) {
			event.preventDefault();
		});

		/* The canvas as large as its place, in the pixels of the screen. */
		own.Sizes = new ResizeObserver(function () {
			self.Resize();
		});

		own.Sizes.observe(own.Canvas.parentNode);

		/* Out of sight it draws nothing. */
		if (typeof IntersectionObserver === 'function') {
			own.Sight = new IntersectionObserver(function (entries) {
				own.Seen = entries[entries.length - 1].isIntersecting;

				if (own.Seen)
					self.Dirty();
			});

			own.Sight.observe(own.Canvas);
		}

		this.Arrange();
		this.Resize();
	},

	$OnDestroy: function () {
		var own = this.Own();

		own.Gone = true;

		if (own.Sizes)
			own.Sizes.disconnect();

		if (own.Sight)
			own.Sight.disconnect();

		window.cancelAnimationFrame(own.Frame);
	},

	$OnProps: function (changed) {
		var own = this.Own();
		if (!own.Canvas) return;

		if ('Angle' in changed) {
			own.Camera.Yaw = this.Number(this.Angle, 45) * Math.PI / 180;
			own.Turn = null;
		}

		if ('Tilt' in changed)
			own.Camera.Pitch = this.Pitch(this.Tilt);

		if ('Nodes' in changed || 'Links' in changed || 'Groups' in changed || 'Layout' in changed || 'Direction' in changed || 'Center' in changed || 'Gap' in changed) {
			if ('Groups' in changed)
				own.Folded = {};

			this.Arrange();
		}

		this.Dirty();
	},

	/* A switch of the markup: true, or "true" as an attribute. */
	On: function (value) {
		return value === true || value === 'true';
	},

	Number: function (value, fallback) {
		return value === null || value === undefined || value === '' || isNaN(Number(value)) ? fallback : Number(value);
	},

	Pitch: function (tilt) {
		return Math.max(12, Math.min(85, this.Number(tilt, 35))) * Math.PI / 180;
	},

	/* The data */

	List: function () {
		return Array.isArray(this.Nodes) ? this.Nodes : [];
	},

	GroupList: function () {
		return Array.isArray(this.Groups) ? this.Groups : [];
	},

	/*
	 * What the groups are, made once for each Groups given: each by its ID, the group it is in, the nodes in it (of the
	 * groups in it too), how deep it is, how many levels it holds.
	 */
	Index: function () {
		var own = this.Own();
		var groups = {};
		var parent = {};
		var members = {};
		var depth = {};
		var nested = {};

		if (own.Index)
			return own.Index;

		this.GroupList().forEach(function (group) {
			groups[String(group.ID)] = group;
		});

		this.GroupList().forEach(function (group) {
			(group.Members || []).forEach(function (member) {
				if (parent[String(member)] === undefined && String(member) !== String(group.ID))
					parent[String(member)] = String(group.ID);
			});
		});

		function flat (id, seen) {
			var found = [];

			if (seen[id])
				return found;

			seen[id] = true;

			(groups[id].Members || []).forEach(function (member) {
				if (groups[String(member)]) found = found.concat(flat(String(member), seen));
				else found.push(String(member));
			});

			return found;
		}

		Object.keys(groups).forEach(function (id) {
			var current = id;
			var level = 0;

			members[id] = flat(id, {});
			nested[id] = nested[id] || 0;

			while (parent[current] !== undefined && level < 50) {
				current = parent[current];
				level++;
				nested[current] = Math.max(nested[current] || 0, level);
			}

			depth[id] = level;
		});

		own.Index = {Groups: groups, Parent: parent, Members: members, Depth: depth, Nested: nested};

		return own.Index;
	},

	GroupOf: function (id) {
		return this.Index().Groups[String(id)] || null;
	},

	/* The nodes of a group, of the groups in it too. */
	MembersOf: function (id) {
		return this.Index().Members[String(id)] || [];
	},

	/* A group folded, or in a folded one: its zone is not drawn. */
	Hidden: function (group) {
		var index = this.Index();
		var current = String(group.ID);
		var guard = 0;

		if (this.Folded(group)) return true;

		while (index.Parent[current] !== undefined && guard < 50) {
			current = index.Parent[current];
			guard++;

			if (this.Folded(index.Groups[current])) return true;
		}

		return false;
	},

	Folded: function (group) {
		var own = this.Own();

		return own.Folded[group.ID] !== undefined ? own.Folded[group.ID] : group.Collapsed === true;
	},

	/*
	 * What is drawn: each node with what it carries now (Update), its kind made whole; a folded group one node of all its
	 * members (its status the worst, active if one is, its load their mean), the links of its members its own, one a pair.
	 * Made again only when the data, what a node carries or a fold changes.
	 */
	Shown: function () {
		var self = this;
		var own = this.Own();
		var kinds = this.$Service('TopologyKinds');
		var index = this.Index();
		var owner = {};
		var folds = {};
		var order = [];
		var nodes = [];
		var links = [];
		var pairs = {};
		var worst = {error: 3, warning: 2, ok: 1, off: 0};

		if (own.Shown)
			return own.Shown;

		/* The outermost folded group takes a node in it. */
		this.GroupList().forEach(function (group) {
			var id = String(group.ID);

			if (!self.Folded(group)) return;

			index.Members[id].forEach(function (member) {
				if (owner[member] === undefined || index.Depth[id] < index.Depth[owner[member]])
					owner[member] = id;
			});
		});

		this.List().forEach(function (node) {
			var id = String(node.ID);
			var live = own.Live[id] ? Object.assign({}, node, own.Live[id]) : node;
			var fold;
			var kind;

			if (owner[id] !== undefined) {
				fold = folds[owner[id]];

				if (!fold) {
					fold = folds[owner[id]] = {Status: '', Load: 0, Active: false, Count: 0};

					order.push(owner[id]);
				}

				if ((worst[live.Status] || 0) > (worst[fold.Status] || 0))
					fold.Status = live.Status;

				fold.Load += Math.max(0, Math.min(1, self.Number(live.Load, 0)));
				fold.Active = fold.Active || live.Active === true || live.Active === 'true';
				fold.Count++;

				return;
			}

			kind = kinds.Kind(live.Kind);

			nodes.push({ID: id, Node: live, Label: String(live.Label || live.ID), Kind: kind, Shape: live.Shape || kind.Shape, Color: live.Color || kind.Color, Size: self.Number(live.Size, kind.Size), Icon: live.Icon || kind.Icon, Status: live.Status || '', Active: live.Active === true || live.Active === 'true', Load: Math.max(0, Math.min(1, self.Number(live.Load, 0))), Comment: live.Comment || ''});
		});

		order.forEach(function (id) {
			var group = index.Groups[id];
			var fold = folds[id];

			nodes.push({ID: 'group:' + id, Node: {}, Group: id, Label: String(group.Title || id) + ' (' + fold.Count + ')', Kind: kinds.Kind('cluster'), Shape: 'stack', Color: group.Color || 'accent', Size: 1.5, Icon: '', Status: fold.Status, Active: fold.Active, Load: fold.Load / fold.Count, Comment: group.Comment || '', Count: fold.Count});
		});

		(Array.isArray(this.Links) ? this.Links : []).forEach(function (link, at) {
			var live = own.Live['link:' + at] ? Object.assign({}, link, own.Live['link:' + at]) : link;
			var from = owner[String(link.From)] !== undefined ? 'group:' + owner[String(link.From)] : String(link.From);
			var to = owner[String(link.To)] !== undefined ? 'group:' + owner[String(link.To)] : String(link.To);
			var key;

			if (from === to) return;

			key = from + '>' + to;

			/* Links folded into one: their loads added. */
			if (pairs[key]) {
				pairs[key].Load = Math.min(1, pairs[key].Load + self.Number(live.Load, 0));

				pairs[key].Indexes.push(at);

				return;
			}

			pairs[key] = {Index: at, Indexes: [at], From: from, To: to, Label: live.Label || '', Status: live.Status || '', Kind: live.Kind || '', Load: Math.max(0, Math.min(1, self.Number(live.Load, 0))), Comment: live.Comment || ''};

			links.push(pairs[key]);
		});

		own.Shown = {Nodes: nodes, Links: links, Owner: owner};

		return own.Shown;
	},

	/*
	 * The cells of the nodes: their own (X, Y), dragged, or laid out; a folded group in the middle of its members. A group
	 * is laid out in one piece (Block), so its zone holds its own and no other.
	 */
	Arrange: function (layout) {
		var self = this;
		var own = this.Own();
		var nodes = this.List();
		var byId = {};
		var made;

		own.Index = null;
		own.Shown = null;

		if (layout)
			own.Moved = {};

		nodes.forEach(function (node) {
			byId[String(node.ID)] = node;
		});

		made = this.Block(null, {
			Nodes: byId,
			Links: (Array.isArray(this.Links) ? this.Links : []).filter(function (link) {
				return String(link.From) !== String(link.To);
			}),
			Layout: layout || this.Layout,
			Direction: this.Direction,
			Center: this.Center === '' || this.Center === null || this.Center === undefined ? '' : String(this.Center),
			Gap: Math.max(0.2, this.Number(this.Gap, 1)),
			Directed: this.Directed !== false && this.Directed !== 'false'
		}, {});

		own.Places = {};

		nodes.forEach(function (node) {
			var id = String(node.ID);
			var laid = made.Places[id] || {X: 0, Y: 0};

			if (own.Moved[id]) own.Places[id] = own.Moved[id];
			else if (node.X !== undefined && node.Y !== undefined) own.Places[id] = {X: self.Number(node.X, 0), Y: self.Number(node.Y, 0)};
			else own.Places[id] = {X: Math.round(laid.X), Y: Math.round(laid.Y)};
		});

		this.LegendItems = this.KindList();
		this.Items = nodes.map(function (node) {
			return {ID: String(node.ID), Label: String(node.Label || node.ID) + (node.Status ? ', ' + node.Status : '') + (node.Active === true || node.Active === 'true' ? ', active' : '')};
		});

		if (!own.Fitted && own.Width > 60 && own.Height > 60) {
			own.Fitted = true;

			this.Fit();
		}

		this.Dirty();

		return made.Layout;
	},

	/* What a node or a group is part of right in a group (null: of what is in no group): itself, or the group of it in there. */
	ChildOf: function (id, group) {
		var index = this.Index();
		var up = group === null ? undefined : group;
		var current = id;
		var guard = 0;

		while (index.Parent[current] !== up && guard < 50) {
			if (index.Parent[current] === undefined) return null;

			current = index.Parent[current];

			guard++;
		}

		return guard < 50 ? current : null;
	},

	/*
	 * What is right in a group (null: in no group) laid out together, by the links between them: its nodes, and its groups as
	 * boxes, each laid out the same way inside with room round it for its zone. {Places ({ID: {X, Y}} of the middles of its
	 * nodes, from its corner), Width, Height, Layout}, in cells.
	 */
	Block: function (group, settings, seen) {
		var self = this;
		var index = this.Index();
		var kinds = this.$Service('TopologyKinds');
		var children = [];
		var inside = {};
		var boxes = {};
		var items = [];
		var places = {};
		var width = 1;
		var height = 1;
		var minX = Infinity;
		var minY = Infinity;
		var made;

		seen[group === null ? '' : group] = true;

		if (group === null) {
			Object.keys(settings.Nodes).forEach(function (id) {
				if (index.Parent[id] === undefined)
					children.push(id);
			});

			Object.keys(index.Groups).forEach(function (id) {
				if (index.Parent[id] === undefined)
					children.push(id);
			});
		}
		else {
			(index.Groups[group].Members || []).forEach(function (member) {
				var id = String(member);
				if (index.Parent[id] === group && (settings.Nodes[id] || index.Groups[id]) && children.indexOf(id) === -1)
					children.push(id);
			});
		}

		children.forEach(function (id) {
			var box;
			var margin;
			var size;

			if (index.Groups[id]) {
				if (seen[id] || !index.Members[id].some(function (member) {
					return settings.Nodes[member];
				})) return;

				box = self.Block(id, settings, seen);
				margin = Math.ceil(1.2 + (index.Nested[id] || 0) * 0.6) + 1;
				boxes[id] = {Box: box, Margin: margin};

				items.push({ID: id, Width: box.Width + margin * 2, Height: box.Height + margin * 2});
			}
			else {
				/* With a cell round it for its name. */
				size = Math.max(1, Math.ceil(self.Number(settings.Nodes[id].Size, kinds.Kind(settings.Nodes[id].Kind).Size))) + 1;

				items.push({ID: id, Width: size, Height: size});
			}

			inside[id] = true;
		});

		if (!items.length)
			return {Places: {}, Width: 1, Height: 1, Layout: settings.Layout};

		made = this.$Service('Layouts').Graph(items, settings.Links.map(function (link) {
			return {From: self.ChildOf(String(link.From), group), To: self.ChildOf(String(link.To), group)};
		}).filter(function (link) {
			return link.From !== null && link.To !== null && link.From !== link.To && inside[link.From] && inside[link.To];
		}), {Layout: settings.Layout, Direction: settings.Direction, Center: settings.Center && inside[settings.Center] ? settings.Center : undefined, Gap: settings.Gap, Directed: settings.Directed});

		made.Items.forEach(function (item) {
			minX = Math.min(minX, item.X);
			minY = Math.min(minY, item.Y);
		});

		made.Items.forEach(function (item) {
			var x = item.X - minX;
			var y = item.Y - minY;
			var box = boxes[item.ID];

			if (box) {
				Object.keys(box.Box.Places).forEach(function (id) {
					places[id] = {X: x + box.Margin + box.Box.Places[id].X, Y: y + box.Margin + box.Box.Places[id].Y};
				});
			}
			else {
				places[item.ID] = {X: x + item.Width / 2, Y: y + item.Height / 2};
			}

			width = Math.max(width, x + item.Width);
			height = Math.max(height, y + item.Height);
		});

		return {Places: places, Width: Math.ceil(width), Height: Math.ceil(height), Layout: made.Layout};
	},

	/* The place of a node drawn: its own, or of a folded group the middle of its members. */
	PlaceOf: function (shown) {
		var own = this.Own();
		var members;
		var x = 0;
		var y = 0;

		if (!shown.Group)
			return own.Places[shown.ID] || {X: 0, Y: 0};

		members = this.MembersOf(shown.Group).filter(function (id) {
			return own.Places[id];
		});

		members.forEach(function (id) {
			x += own.Places[id].X;
			y += own.Places[id].Y;
		});

		return members.length ? {X: Math.round(x / members.length), Y: Math.round(y / members.length)} : {X: 0, Y: 0};
	},

	/* Drawing */

	Resize: function () {
		var own = this.Own();
		var box = own.Canvas.parentNode.getBoundingClientRect();
		var ratio = window.devicePixelRatio || 1;

		own.Width = Math.max(1, Math.round(box.width));
		own.Height = Math.max(1, Math.round(box.height));
		own.Canvas.width = Math.round(own.Width * ratio);
		own.Canvas.height = Math.round(own.Height * ratio);
		own.Ratio = ratio;

		/* A bug: hidden at first (0 wide), it fitted all into nothing; it fits once its place has a size. */
		if (!own.Fitted && this.List().length && box.width > 60 && box.height > 60) {
			own.Fitted = true;

			this.Fit();
		}

		this.Dirty();
	},

	/* A frame to draw, once the browser is ready for one; while things move it draws on. */
	Dirty: function () {
		var self = this;
		var own = this.Own();
		if (own.Frame || own.Gone) return;

		own.Frame = window.requestAnimationFrame(function (time) {
			own.Frame = 0;

			if (own.Gone) return;

			if (own.Seen !== false)
				self.Draw(time);
		});
	},

	/* The colors of the theme the canvas paints with, read again now and then (a theme changed). */
	Colors: function () {
		var own = this.Own();
		var style;
		var read;

		if (own.Colors && performance.now() - own.ColorsAt < 1000) return own.Colors;

		style = getComputedStyle(this.$Element());
		own.Font = style.fontFamily || 'sans-serif';
		read = function (name, fallback) {
			var value = style.getPropertyValue(name).trim();
			var hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
			var rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(value);

			if (hex) {
				value = hex[1].length === 3 ? hex[1].replace(/(.)/g, '$1$1') : hex[1];

				return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
			}

			return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : fallback;
		};

		own.Colors = {
			accent: read('--elemenx-accent', [72, 132, 238]),
			info: read('--elemenx-info', [72, 140, 245]),
			success: read('--elemenx-success', [64, 190, 120]),
			warning: read('--elemenx-warning', [245, 185, 40]),
			danger: read('--elemenx-danger', [220, 80, 70]),
			muted: read('--elemenx-text-muted', [140, 146, 160]),
			text: read('--elemenx-text', [230, 232, 238]),
			border: read('--elemenx-border', [60, 66, 80]),
			floor: read('--elemenx-topology-floor', read('--elemenx-surface', [18, 20, 26])),
			link: read('--elemenx-topology-link', [64, 220, 190])
		};
		own.ColorsAt = performance.now();

		return own.Colors;
	},

	/* A color of a node: #rrggbb, or a token of the theme. */
	Paint: function (value) {
		var colors = this.Colors();
		var hex = /^#([0-9a-f]{6})$/i.exec(String(value || ''));
		if (hex)
			return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16)];

		return colors[value] || colors.info;
	},

	/* From a cell of the world ([x, height, y]) to the pixels of the canvas, as the view sees it. */
	Project: function (point) {
		var own = this.Own();
		var camera = own.Camera;
		var c = Math.cos(camera.Yaw);
		var s = Math.sin(camera.Yaw);
		var rx = point[0] * c - point[2] * s;
		var rz = point[0] * s + point[2] * c;

		return [rx * camera.Zoom + camera.X + own.Width / 2, (rz * Math.sin(camera.Pitch) - point[1] * Math.cos(camera.Pitch)) * camera.Zoom + camera.Y + own.Height / 2, rz];
	},

	/* From a point of the canvas back to the floor: [x, y] of its cells. */
	Floor: function (sx, sy) {
		var own = this.Own();
		var camera = own.Camera;
		var c = Math.cos(camera.Yaw);
		var s = Math.sin(camera.Yaw);
		var rx = (sx - own.Width / 2 - camera.X) / camera.Zoom;
		var rz = (sy - own.Height / 2 - camera.Y) / (camera.Zoom * Math.sin(camera.Pitch));

		return [rx * c + rz * s, -rx * s + rz * c];
	},

	Draw: function (time) {
		var self = this;
		var own = this.Own();
		var context = own.Context;
		var colors = this.Colors();
		var camera = own.Camera;
		var shown = this.Shown();
		var now = (time || performance.now()) / 1000;
		var animated = false;
		var lit = this.Lit(shown);
		var byId = {};
		var order;
		var labels = [];
		var box;

		/*
		 * Regression (load): made before its place had a size, it was 1 by 1, and the watch of its size had not told it yet
		 * when the first frame came: a frame of nothing. While it is 1 wide, it reads the size of its place itself (not later:
		 * a size read in the middle of a turn fitted the view again under it).
		 */
		if (context && own.Width <= 1 && own.Canvas.parentNode) {
			box = own.Canvas.parentNode.getBoundingClientRect();

			if (box.width > 1)
				this.Resize();
		}

		if (!context || !own.Width) return;

		/* A turn asked for (Q, E, Rotate): a step of it each frame. */
		if (own.Turn) {
			var left = own.Turn.To - camera.Yaw;

			camera.Yaw += Math.abs(left) < 0.01 ? left : left * 0.2;

			if (Math.abs(left) < 0.01)
				own.Turn = null;

			animated = true;
		}

		context.setTransform(own.Ratio, 0, 0, own.Ratio, 0, 0);
		context.clearRect(0, 0, own.Width, own.Height);

		context.fillStyle = 'rgb(' + colors.floor.join(',') + ')';

		context.fillRect(0, 0, own.Width, own.Height);

		own.Hits = [];

		shown.Nodes.forEach(function (node) {
			byId[node.ID] = node;
			node.Place = self.PlaceOf(node);
			node.Deep = self.Project([node.Place.X, 0, node.Place.Y])[2];
		});

		if (this.Grid !== false && this.Grid !== 'false')
			this.DrawGrid(context, colors, shown);

		this.DrawGroups(context, colors);

		/* Too small to see dashes run: still lines, drawn at once. */
		if (camera.Zoom < 8) {
			this.DrawLinksFlat(context, colors, shown.Links, byId, lit);
		}
		else {
			shown.Links.forEach(function (link) {
				if (self.DrawLink(context, colors, link, byId, now, lit))
					animated = true;
			});
		}

		/* The far ones first: each covers what is behind it. */
		order = shown.Nodes.slice().sort(function (a, b) {
			return a.Deep - b.Deep;
		});

		order.forEach(function (node) {
			var label = self.DrawNode(context, colors, node, now, lit);
			if (label)
				labels.push(label);

			/* A pulse runs on; too small to be seen it does not. */
			if (node.Active && node.Kind.Load === 'pulse' && node.Load > 0 && camera.Zoom * node.Size >= 12)
				animated = true;
		});

		context.textAlign = 'center';
		context.textBaseline = 'top';

		labels.forEach(function (label) {
			context.font = (label.Selected ? '600 ' : '') + '12px ' + own.Font;
			context.fillStyle = 'rgba(' + colors.text.join(',') + ',' + (label.Far ? 0.35 : 0.95) + ')';

			context.fillText(label.Text, label.X, label.Y);

			if (label.Mark) {
				context.fillStyle = 'rgb(' + colors.accent.join(',') + ')';

				context.beginPath();
				context.arc(label.X + context.measureText(label.Text).width / 2 + 7, label.Y + 6, 3.5, 0, Math.PI * 2);
				context.fill();
			}
		});

		this.Notes(labels);

		if (this.On(this.Minimap))
			this.DrawMinimap(shown);

		if (animated && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches))
			this.Dirty();
	},

	/* The cells of the floor round what stands on it; none where they would be too fine to see. */
	DrawGrid: function (context, colors, shown) {
		var own = this.Own();
		var minX = Infinity;
		var maxX = -Infinity;
		var minY = Infinity;
		var maxY = -Infinity;
		var step = 1;
		var i;

		if (own.Camera.Zoom < 4) return;

		if (own.Camera.Zoom < 10)
			step = 5;

		shown.Nodes.forEach(function (node) {
			minX = Math.min(minX, node.Place.X);
			maxX = Math.max(maxX, node.Place.X);
			minY = Math.min(minY, node.Place.Y);
			maxY = Math.max(maxY, node.Place.Y);
		});

		if (!isFinite(minX)) {
			minX = -5;
			maxX = 5;
			minY = -5;
			maxY = 5;
		}

		minX = Math.floor((minX - 8) / step) * step;
		maxX = Math.ceil((maxX + 8) / step) * step;
		minY = Math.floor((minY - 8) / step) * step;
		maxY = Math.ceil((maxY + 8) / step) * step;

		context.lineWidth = 1;
		context.strokeStyle = 'rgba(' + colors.border.join(',') + ',0.55)';

		context.beginPath();

		for (i = minX; i <= maxX; i += step) {
			var a = this.Project([i - 0.5, 0, minY - 0.5]);
			var b = this.Project([i - 0.5, 0, maxY - 0.5]);

			context.moveTo(a[0], a[1]);
			context.lineTo(b[0], b[1]);
		}

		for (i = minY; i <= maxY; i += step) {
			var c = this.Project([minX - 0.5, 0, i - 0.5]);
			var d = this.Project([maxX - 0.5, 0, i - 0.5]);

			context.moveTo(c[0], c[1]);
			context.lineTo(d[0], d[1]);
		}

		context.stroke();
	},

	/* How deep a group is: the groups it is in. */
	Depth: function (id) {
		return this.Index().Depth[String(id)] || 0;
	},

	/* The zones of the groups on the floor, the outer ones under the inner ones; a folded group shows no zone. */
	DrawGroups: function (context, colors) {
		var self = this;
		var own = this.Own();
		var index = this.Index();
		var groups = this.GroupList().filter(function (group) {
			return !self.Hidden(group);
		}).sort(function (a, b) {
			return self.Depth(a.ID) - self.Depth(b.ID);
		});
		var titled = own.Camera.Zoom >= 8 || groups.length <= 12;
		var titles = [];

		context.font = '600 12px ' + own.Font;

		groups.forEach(function (group) {
			var members = self.MembersOf(group.ID).filter(function (id) {
				return own.Places[id];
			});
			/* The deeper ones it holds, the wider it is round them. */
			var nested = index.Nested[String(group.ID)] || 0;
			var color = self.Paint(group.Color || 'accent');
			var corners;
			var top;
			var wide;
			var minX = Infinity;
			var maxX = -Infinity;
			var minY = Infinity;
			var maxY = -Infinity;

			if (!members.length) return;

			members.forEach(function (id) {
				minX = Math.min(minX, own.Places[id].X);
				maxX = Math.max(maxX, own.Places[id].X);
				minY = Math.min(minY, own.Places[id].Y);
				maxY = Math.max(maxY, own.Places[id].Y);
			});

			minX -= 1.2 + nested * 0.6;
			maxX += 1.2 + nested * 0.6;
			minY -= 1.2 + nested * 0.6;
			maxY += 1.2 + nested * 0.6;

			corners = [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]].map(function (corner) {
				return self.Project([corner[0], 0, corner[1]]);
			});

			context.beginPath();

			corners.forEach(function (point, index) {
				if (index) context.lineTo(point[0], point[1]);
				else context.moveTo(point[0], point[1]);
			});

			context.closePath();

			context.fillStyle = 'rgba(' + color.join(',') + ',' + (own.Selected === 'group:' + group.ID ? 0.16 : 0.07) + ')';

			context.fill();

			context.lineWidth = own.Selected === 'group:' + group.ID ? 2 : 1;

			context.setLineDash([6, 4]);

			context.strokeStyle = 'rgba(' + color.join(',') + ',0.75)';

			context.stroke();
			context.setLineDash([]);

			/* Its title at its top corner on the screen, and the press of it; many of them far off would only cover each other. */
			if (!titled && own.Selected !== 'group:' + group.ID) return;

			top = corners.slice().sort(function (a, b) {
				return a[1] - b[1];
			})[0].slice();
			wide = context.measureText(String(group.Title || group.ID)).width + 12;

			/* A title over another (a group at the top of the one it is in) goes a line lower. */
			while (titles.some(function (other) {
				return Math.abs(other[1] - top[1]) < 15 && top[0] < other[0] + other[2] && other[0] < top[0] + wide;
			}))
				top[1] += 15;

			titles.push([top[0], top[1], wide]);

			context.textAlign = 'left';
			context.textBaseline = 'bottom';
			context.fillStyle = 'rgb(' + color.join(',') + ')';

			context.fillText(String(group.Title || group.ID), top[0] + 6, top[1] - 4);

			own.Hits.push({Type: 'group', ID: String(group.ID), Box: [top[0], top[1] - 20, top[0] + wide, top[1]], Title: top});
		});
	},

	/* What a selection lights: the node and its neighbours, or the link and its two ends, or a group and its members. */
	Lit: function (shown) {
		var own = this.Own();
		var lit = {Nodes: {}, Links: {}};
		var id;

		if (own.Path)
			return this.PathLit(shown);

		if (!own.Selected)
			return this.Found(shown);

		id = own.Selected.slice(own.Selected.indexOf(':') + 1);

		if (own.Selected.indexOf('group:') === 0 && !shown.Nodes.some(function (node) {
			return node.ID === own.Selected;
		})) {
			this.MembersOf(id).forEach(function (member) {
				lit.Nodes[member] = true;
			});

			shown.Links.forEach(function (link) {
				if (lit.Nodes[link.From] && lit.Nodes[link.To])
					lit.Links[link.Index] = true;
			});

			return lit;
		}

		shown.Links.forEach(function (link) {
			if (own.Selected === 'link:' + link.Index || own.Selected === 'node:' + link.From || own.Selected === 'node:' + link.To || own.Selected === link.From || own.Selected === link.To) {
				lit.Links[link.Index] = true;
				lit.Nodes[link.From] = true;
				lit.Nodes[link.To] = true;
			}
		});

		lit.Nodes[own.Selected.indexOf('node:') === 0 ? id : own.Selected] = true;

		return lit;
	},

	/* A link on the floor: its color by its status or its load, its dashes running from where it comes as fast as it carries. */
	DrawLink: function (context, colors, link, byId, now, lit) {
		var own = this.Own();
		var a = byId[link.From];
		var b = byId[link.To];
		var color;
		var directed = this.Directed !== false && this.Directed !== 'false';
		var moving;
		var from;
		var to;
		var dx;
		var dy;
		var length;
		var far;
		var head;

		if (!a || !b)
			return false;

		from = this.Project([a.Place.X, 0.02, a.Place.Y]);
		to = this.Project([b.Place.X, 0.02, b.Place.Y]);
		dx = to[0] - from[0];
		dy = to[1] - from[1];
		length = Math.sqrt(dx * dx + dy * dy) || 1;
		far = !!lit && !lit.Links[link.Index];

		color = this.LinkColor(colors, link);

		moving = link.Load > 0 && link.Status !== 'off';

		context.lineWidth = (1.5 + link.Load * 3) * (own.Selected === 'link:' + link.Index ? 1.8 : 1);
		context.strokeStyle = 'rgba(' + color.join(',') + ',' + (far ? 0.18 : 0.9) + ')';

		context.setLineDash(link.Kind === 'dashed' || moving ? [7, 6] : []);

		context.lineDashOffset = moving ? -(now * (12 + link.Load * 70)) % 13 * (directed ? 1 : 0) : 0;

		context.beginPath();
		context.moveTo(from[0], from[1]);
		context.lineTo(to[0], to[1]);
		context.stroke();
		context.setLineDash([]);

		/* An arrow at the end, short of the foot of the node it goes to. */
		if (directed && !far && length > 40) {
			head = [to[0] - dx / length * b.Size * this.Own().Camera.Zoom * 0.55, to[1] - dy / length * b.Size * this.Own().Camera.Zoom * 0.55];

			context.fillStyle = 'rgba(' + color.join(',') + ',0.9)';

			context.beginPath();
			context.moveTo(head[0], head[1]);
			context.lineTo(head[0] - dx / length * 9 - dy / length * 4.5, head[1] - dy / length * 9 + dx / length * 4.5);
			context.lineTo(head[0] - dx / length * 9 + dy / length * 4.5, head[1] - dy / length * 9 - dx / length * 4.5);
			context.closePath();
			context.fill();
		}

		if (link.Label && own.Camera.Zoom > 18 && !far) {
			context.font = '11px ' + own.Font;
			context.textAlign = 'center';
			context.textBaseline = 'bottom';
			context.fillStyle = 'rgba(' + colors.text.join(',') + ',0.75)';

			context.fillText(String(link.Label), (from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - 3);
		}

		own.Hits.push({Type: 'link', ID: 'link:' + link.Index, From: from, To: to});

		return moving;
	},

	/* The color of a link: of its status, or of its load. */
	LinkColor: function (colors, link) {
		if (link.Status === 'error') return colors.danger;

		if (link.Status === 'warning') return colors.warning;

		if (link.Status === 'off') return colors.muted;

		if (link.Load > 0.85)
			return colors.danger;

		if (link.Load > 0.6)
			return colors.warning;

		return colors.link;
	},

	/* Links too small for their dashes to be seen running: still lines, one path for each look of them. */
	DrawLinksFlat: function (context, colors, links, byId, lit) {
		var self = this;
		var own = this.Own();
		var paths = {};

		links.forEach(function (link) {
			var a = byId[link.From];
			var b = byId[link.To];
			var far = !!lit && !lit.Links[link.Index];
			var from;
			var to;
			var look;

			if (!a || !b) return;

			from = self.Project([a.Place.X, 0.02, a.Place.Y]);
			to = self.Project([b.Place.X, 0.02, b.Place.Y]);
			look = 'rgba(' + self.LinkColor(colors, link).join(',') + ',' + (far ? 0.18 : 0.75) + ')|' + (link.Load > 0.5 || own.Selected === 'link:' + link.Index ? 2 : 1);

			(paths[look] = paths[look] || []).push(from, to);

			own.Hits.push({Type: 'link', ID: 'link:' + link.Index, From: from, To: to});
		});

		Object.keys(paths).forEach(function (look) {
			var points = paths[look];
			var i;

			context.strokeStyle = look.split('|')[0];
			context.lineWidth = Number(look.split('|')[1]);

			context.beginPath();

			for (i = 0; i < points.length; i += 2) {
				context.moveTo(points[i][0], points[i][1]);
				context.lineTo(points[i + 1][0], points[i + 1][1]);
			}

			context.stroke();
		});
	},

	/* A node too small for its shape to be seen: a block of its color (of its status when it is in trouble), its glow a wider pad under it. */
	DrawSmall: function (context, node, base, color, status, far) {
		var own = this.Own();
		var place = node.Place;
		var foot = this.Project([place.X, 0, place.Y]);
		var top = this.Project([place.X, node.Size * 0.85, place.Y]);
		var w = node.Size * 0.56 * Math.SQRT2 * own.Camera.Zoom;
		var h = w * Math.sin(own.Camera.Pitch);
		var fill = node.Status === 'error' || node.Status === 'warning' ? status : color;

		if (node.Active && !far) {
			context.beginPath();
			context.moveTo(foot[0] - w * 1.7, foot[1]);
			context.lineTo(foot[0], foot[1] - h * 1.7);
			context.lineTo(foot[0] + w * 1.7, foot[1]);
			context.lineTo(foot[0], foot[1] + h * 1.7);
			context.closePath();

			context.fillStyle = 'rgba(' + base.join(',') + ',0.3)';

			context.fill();
		}

		context.beginPath();
		context.moveTo(top[0] - w, top[1]);
		context.lineTo(top[0], top[1] - h);
		context.lineTo(top[0] + w, top[1]);
		context.lineTo(foot[0] + w, foot[1]);
		context.lineTo(foot[0], foot[1] + h);
		context.lineTo(foot[0] - w, foot[1]);
		context.closePath();

		context.fillStyle = 'rgba(' + fill.join(',') + ',' + (far ? 0.3 : 1) + ')';

		context.fill();

		own.Hits.push({Type: 'node', ID: node.ID, Box: [foot[0] - w, top[1] - h, foot[0] + w, foot[1] + h]});

		return null;
	},

	/* A color made lighter (k over 1) or darker. */
	Shade: function (color, k) {
		return color.map(function (part) {
			return Math.max(0, Math.min(255, Math.round(k > 1 ? part + (255 - part) * (k - 1) : part * k)));
		});
	},

	/*
	 * A node: its pad (the color of its status), its glow when it is active, its shape lit as the view sees it, its load
	 * as its kind shows it. The place of its name, or null when it is too small for one.
	 */
	DrawNode: function (context, colors, node, now, lit) {
		var self = this;
		var own = this.Own();
		var zoom = own.Camera.Zoom;
		var place = node.Place;
		var far = !!lit && !lit.Nodes[node.ID];
		var selected = own.Selected === node.ID;
		var hover = own.Hover === node.ID;
		var base = this.Paint(node.Color);
		var color = node.Active ? base : this.Shade(base.map(function (part) {
			return part * 0.78 + 128 * 0.22;
		}), 0.9);
		var alpha = far ? 0.3 : 1;
		var size = node.Size;
		var height = size * 0.85;
		var pad = size * 0.56;
		var status = {ok: colors.success, warning: colors.warning, error: colors.danger, off: colors.muted}[node.Status] || base;
		var corners;
		var shape = this.$Service('TopologyKinds').ShapeOf(node.Shape);
		var load = node.Kind.Load;
		var box = [Infinity, Infinity, -Infinity, -Infinity];
		var lowest = -Infinity;
		var pulse = 1;
		var context2;

		if (zoom * size < 12 && !selected && !hover)
			return this.DrawSmall(context, node, base, color, status, far);

		if (load === 'height')
			height *= 0.35 + 0.65 * node.Load;

		if (load === 'pulse' && node.Load > 0)
			pulse = 0.55 + 0.45 * Math.sin(now * (1.5 + node.Load * 7) + place.X * 0.7);

		corners = [[-pad, -pad], [pad, -pad], [pad, pad], [-pad, pad]].map(function (corner) {
			return self.Project([place.X + corner[0], 0.01, place.Y + corner[1]]);
		});

		/* The glow round its foot: it is active. */
		if (node.Active && !far) {
			context.save();

			context.shadowColor = 'rgba(' + base.join(',') + ',' + (0.55 + 0.45 * pulse * (node.Load > 0 ? 1 : 0.6)) + ')';
			context.shadowBlur = zoom > 8 ? Math.min(28, zoom * 0.45) * (load === 'pulse' && node.Load > 0 ? 0.6 + pulse * 0.8 : 1) : 0;

			this.Outline(context, corners);

			context.fillStyle = 'rgba(' + base.join(',') + ',0.22)';

			context.fill();
			context.restore();
		}

		this.Outline(context, corners);

		context.lineWidth = selected ? 3 : hover ? 2.5 : 2;
		context.strokeStyle = 'rgba(' + (selected ? colors.text : status).join(',') + ',' + alpha + ')';

		context.stroke();

		corners.forEach(function (point) {
			box = [Math.min(box[0], point[0]), Math.min(box[1], point[1]), Math.max(box[2], point[0]), Math.max(box[3], point[1])];
			lowest = Math.max(lowest, point[1]);
		});

		context2 = {
			Canvas: context,
			Project: function (point) {
				return self.Project(point);
			},
			Center: [place.X, place.Y],
			Size: size,
			Height: height,
			Color: color,
			Alpha: alpha,
			Node: node,
			Zoom: zoom,
			Prism: function (points, bottom, top, tint, opacity, topScale) {
				var drawn = self.Prism(context, points, bottom, top, tint, opacity === undefined ? alpha : opacity, topScale);

				box = [Math.min(box[0], drawn[0]), Math.min(box[1], drawn[1]), Math.max(box[2], drawn[2]), Math.max(box[3], drawn[3])];
			},
			Disc: function (x, z, y, radius, tint, opacity) {
				var drawn = self.Disc(context, x, z, y, radius, tint, opacity === undefined ? alpha : opacity);

				box = [Math.min(box[0], drawn[0]), Math.min(box[1], drawn[1]), Math.max(box[2], drawn[2]), Math.max(box[3], drawn[3])];
			}
		};

		/* A store fills up: its shape of glass, the level of what it holds inside it. */
		if (load === 'fill') {
			if (node.Load > 0)
				shape.Draw(Object.assign({}, context2, {Size: size * 0.9, Height: height * node.Load, Color: this.Shade(color, 1.08), Alpha: alpha}));

			shape.Draw(Object.assign({}, context2, {Alpha: alpha * 0.4}));
		}
		else if (typeof load === 'function') {
			load(context2, node);
		}
		else {
			shape.Draw(context2);
		}

		/* A ring round its foot: its load as an arc, warmer as it fills. */
		if (load === 'ring' && node.Load > 0) {
			context.beginPath();

			for (var i = 0; i <= 40; i++) {
				var angle = -Math.PI / 2 + node.Load * Math.PI * 2 * i / 40;
				var point = this.Project([place.X + Math.cos(angle) * pad * 1.25, 0.02, place.Y + Math.sin(angle) * pad * 1.25]);

				if (i) context.lineTo(point[0], point[1]);
				else context.moveTo(point[0], point[1]);
			}

			context.lineWidth = 3;
			context.strokeStyle = 'rgba(' + (node.Load > 0.85 ? colors.danger : node.Load > 0.6 ? colors.warning : colors.success).join(',') + ',' + alpha + ')';

			context.stroke();
		}

		/* Its icon on its top, when it is large enough to see. */
		if (node.Icon && zoom * size > 46 && !far)
			this.Icon(context, node.Icon, this.Project([place.X, height, place.Y]), Math.min(22, zoom * size * 0.28));

		own.Hits.push({Type: 'node', ID: node.ID, Box: box});

		if (zoom * Math.max(1, size) < 14 && !selected && !hover) return null;

		return {Text: node.Label, X: (box[0] + box[2]) / 2, Y: lowest + 6, Far: far, Selected: selected, Mark: !!node.Comment && (this.Comments === 'icon'), ID: node.ID, Comment: node.Comment};
	},

	Outline: function (context, points) {
		context.beginPath();

		points.forEach(function (point, index) {
			if (index) context.lineTo(point[0], point[1]);
			else context.moveTo(point[0], point[1]);
		});

		context.closePath();
	},

	/*
	 * A prism of a base ([x, y] of the floor) from bottom to top (topScale: its top drawn in toward its middle, a pyramid):
	 * the sides that face the view, the farther first, each lit by how it faces the light of the view; its top lightest.
	 * Its box on the screen.
	 */
	Prism: function (context, base, bottom, top, color, alpha, topScale) {
		var self = this;
		var camera = this.Own().Camera;
		var c = Math.cos(camera.Yaw);
		var s = Math.sin(camera.Yaw);
		var middle = [0, 0];
		var scale = topScale === undefined ? 1 : topScale;
		var sides = [];
		var box = [Infinity, Infinity, -Infinity, -Infinity];
		var lower;
		var upper;

		base.forEach(function (point) {
			middle[0] += point[0] / base.length;
			middle[1] += point[1] / base.length;
		});

		lower = base.map(function (point) {
			return self.Project([point[0], bottom, point[1]]);
		});

		upper = base.map(function (point) {
			return self.Project([middle[0] + (point[0] - middle[0]) * scale, top, middle[1] + (point[1] - middle[1]) * scale]);
		});

		base.forEach(function (point, index) {
			var next = base[(index + 1) % base.length];
			var nx = next[1] - point[1];
			var nz = -(next[0] - point[0]);
			var length = Math.sqrt(nx * nx + nz * nz) || 1;
			var out = (point[0] + next[0]) / 2 - middle[0];
			var outz = (point[1] + next[1]) / 2 - middle[1];
			var rz;
			var rx;

			nx /= length;
			nz /= length;

			/* Outward, whichever way the points go round. */
			if (nx * out + nz * outz < 0) {
				nx = -nx;
				nz = -nz;
			}

			rx = nx * c - nz * s;
			rz = nx * s + nz * c;

			if (rz <= 0.001) return;

			sides.push({Points: [lower[index], lower[(index + 1) % base.length], upper[(index + 1) % base.length], upper[index]], Depth: (lower[index][2] + lower[(index + 1) % base.length][2]) / 2, Light: 0.72 - rx * 0.16 - (1 - rz) * 0.05});
		});

		sides.sort(function (a, b) {
			return a.Depth - b.Depth;
		}).forEach(function (side) {
			self.Outline(context, side.Points);

			context.fillStyle = 'rgba(' + self.Shade(color, side.Light).join(',') + ',' + alpha + ')';

			context.fill();
		});

		if (scale > 0.05) {
			this.Outline(context, upper);

			context.fillStyle = 'rgba(' + this.Shade(color, 1.12).join(',') + ',' + alpha + ')';

			context.fill();
		}

		lower.concat(upper).forEach(function (point) {
			box = [Math.min(box[0], point[0]), Math.min(box[1], point[1]), Math.max(box[2], point[0]), Math.max(box[3], point[1])];
		});

		return box;
	},

	/* A ball at a height over a point of the floor, lit from above and the left of the view. Its box on the screen. */
	Disc: function (context, x, z, y, radius, color, alpha) {
		var center = this.Project([x, y, z]);
		var r = radius * this.Own().Camera.Zoom;
		var light = this.Shade(color, 1.25);
		var dark = this.Shade(color, 0.55);
		var gradient = context.createRadialGradient(center[0] - r * 0.35, center[1] - r * 0.4, r * 0.1, center[0], center[1], r);

		gradient.addColorStop(0, 'rgba(' + light.join(',') + ',' + alpha + ')');
		gradient.addColorStop(0.65, 'rgba(' + color.join(',') + ',' + alpha + ')');
		gradient.addColorStop(1, 'rgba(' + dark.join(',') + ',' + alpha + ')');

		context.beginPath();
		context.arc(center[0], center[1], r, 0, Math.PI * 2);

		context.fillStyle = gradient;

		context.fill();

		return [center[0] - r, center[1] - r, center[0] + r, center[1] + r];
	},

	/* The markup of an icon of the page (its symbol in the sprite the Icons Service keeps there), as an SVG of its own, white. */
	SymbolMarkup: function (name) {
		var href = this.$Service('Icons').Href(String(name));
		var symbol = href && href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
		if (!symbol) return '';

		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (symbol.getAttribute('viewBox') || '0 0 24 24') + '" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + symbol.innerHTML + '</svg>';
	},

	/* An icon of the Icons Service, drawn as a picture of its SVG (made once each), over a point. */
	Icon: function (context, name, at, size) {
		var self = this;
		var own = this.Own();
		var icons = own.IconImages = own.IconImages || {};
		var image = icons[name];
		var markup;

		if (!image) {
			markup = this.SymbolMarkup(name);

			if (!markup) return;

			image = icons[name] = new Image();
			image.onload = function () {
				self.Dirty();
			};
			image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup.replace(/currentColor/g, '#ffffff'));
		}

		if (image.complete && image.naturalWidth)
			context.drawImage(image, at[0] - size / 2, at[1] - size * 0.75, size, size);
	},

	/*
	 * The comments as captions: a muted line of Markdown under each name drawn (a few hundred at most, the nearest to the
	 * middle first), kept in place as the view moves; the others hidden.
	 */
	Notes: function (labels) {
		var own = this.Own();
		var self = this;
		var overlay = own.Overlay;
		var wanted = {};

		if (!overlay) return;

		if (this.Comments === 'caption') {
			labels.filter(function (label) {
				return label.Comment && !label.Far;
			}).slice(0, 300).forEach(function (label) {
				var note = own.Notes[label.ID];

				if (!note || note.Text !== label.Comment) {
					if (note)
						note.Element.remove();

					note = own.Notes[label.ID] = {Text: label.Comment, Element: document.createElement('div')};
					note.Element.className = 'elemenx-topology-iso-note';
					note.Element.innerHTML = self.$Service('RichText').FromMarkdown(String(label.Comment));

					overlay.appendChild(note.Element);
				}

				note.Element.style.transform = 'translate(' + Math.round(label.X) + 'px, ' + Math.round(label.Y + 16) + 'px) translateX(-50%)';
				wanted[label.ID] = true;
			});
		}

		Object.keys(own.Notes).forEach(function (id) {
			if (wanted[id]) return;

			own.Notes[id].Element.remove();
			delete own.Notes[id];
		});

	},

	/* Search, path, legend, minimap, rights */

	/* A node of the data matching a text: in its name, ID, kind or comment, whatever the case; any with an empty one. */
	Matches: function (node, text) {
		var words = String(text || '').toLowerCase().trim();
		if (!words)
			return true;

		return [node.Label, node.ID, node.Kind, node.Comment].some(function (value) {
			return value !== undefined && value !== null && String(value).toLowerCase().indexOf(words) !== -1;
		});
	},

	/* The IDs of the nodes a text finds (Matches), in their order. */
	Find: function (text) {
		var self = this;

		if (!String(text || '').trim()) return [];

		return this.List().filter(function (node) {
			return self.Matches(node, text);
		}).map(function (node) {
			return String(node.ID);
		});
	},

	/*
	 * What Search and the kind picked in the legend light, the others dimmed: the nodes found (a folded group when one of
	 * its own is), the links between two of them. null when there is nothing to look for.
	 */
	Found: function (shown) {
		var self = this;
		var text = String(this.Search || '').trim();
		var kind = this.LegendKind || '';
		var lit = {Nodes: {}, Links: {}};
		var data = {};

		if (!text && !kind) return null;

		this.List().forEach(function (node) {
			data[String(node.ID)] = node;
		});

		function hit (node) {
			return !!node && self.Matches(node, text) && (!kind || String(node.Kind || 'server') === kind);
		}

		shown.Nodes.forEach(function (node) {
			var found = node.Group ? self.MembersOf(node.Group).some(function (id) {
				return hit(data[id]);
			}) : hit(data[node.ID]);
			if (found)
				lit.Nodes[node.ID] = true;
		});

		shown.Links.forEach(function (link) {
			if (lit.Nodes[link.From] && lit.Nodes[link.To])
				lit.Links[link.Index] = true;
		});

		return lit;
	},

	/*
	 * The shortest way from a node to another along the links (where they go when Directed, else either way; either way when
	 * there is none where they go): {From, To, Nodes (their IDs in order), Links (their indexes)}, lit on the floor until
	 * another is asked for or Path() with nothing lets it go; null when there is no way. Told in path.
	 */
	Path: function (from, to) {
		var own = this.Own();
		var links = Array.isArray(this.Links) ? this.Links : [];
		var directed = this.Directed !== false && this.Directed !== 'false';
		var found;

		if (from === undefined || from === null || from === '' || to === undefined || to === null || to === '') {
			if (own.Path) {
				own.Path = null;

				this.Dirty();
			}

			return null;
		}

		function search (oneWay) {
			var before = {};
			var queue = [String(from)];
			var nodes = [];
			var steps = [];
			var current;
			var at;

			before[String(from)] = {From: null, Link: -1};

			while (queue.length) {
				current = queue.shift();

				if (current === String(to)) break;

				for (at = 0; at < links.length; at++) {
					var a = String(links[at].From);
					var b = String(links[at].To);
					var next = a === current ? b : !oneWay && b === current ? a : null;

					if (next !== null && !before[next]) {
						before[next] = {From: current, Link: at};

						queue.push(next);
					}
				}
			}

			if (!before[String(to)]) return null;

			for (current = String(to); current !== null; current = before[current].From) {
				nodes.unshift(current);

				if (before[current].Link !== -1)
					steps.unshift(before[current].Link);
			}

			return {From: String(from), To: String(to), Nodes: nodes, Links: steps};
		}

		found = directed ? search(true) || search(false) : search(false);
		own.Path = found;

		this.Dirty();
		this.$Emit('path', found ? {From: found.From, To: found.To, Nodes: found.Nodes.slice(), Links: found.Links.slice()} : {From: String(from), To: String(to), Nodes: [], Links: []});

		return found ? {From: found.From, To: found.To, Nodes: found.Nodes.slice(), Links: found.Links.slice()} : null;
	},

	/* The way of Path on the floor: its nodes (or the folded groups they are in) and its links. */
	PathLit: function (shown) {
		var path = this.Own().Path;
		var owner = shown.Owner || {};
		var lit = {Nodes: {}, Links: {}};
		var steps = {};

		path.Nodes.forEach(function (id) {
			lit.Nodes[owner[id] !== undefined ? 'group:' + owner[id] : id] = true;
		});

		path.Links.forEach(function (at) {
			steps[at] = true;
		});

		shown.Links.forEach(function (link) {
			var on = link.Indexes.some(function (at) {
				return steps[at];
			});
			if (on)
				lit.Links[link.Index] = true;
		});

		return lit;
	},

	/* The camera over a node (or the folded group it is in), near enough to see it. */
	Show: function (id) {
		var own = this.Own();
		var shown = this.Shown();
		var key = shown.Owner[String(id)] !== undefined ? 'group:' + shown.Owner[String(id)] : String(id);
		var node = shown.Nodes.filter(function (one) {
			return one.ID === key;
		})[0];
		var place;
		var point;

		if (!node)
			return false;

		/*
		 * Its size as it is now: under load the watch of its size had not told it yet, and the node came to the middle of a
		 * view of the size it had before (Regression: half its width aside).
		 */
		var box = own.Canvas.parentNode ? own.Canvas.parentNode.getBoundingClientRect() : null;
		if (box && (Math.round(box.width) !== own.Width || Math.round(box.height) !== own.Height) && box.width > 0)
			this.Resize();

		place = this.PlaceOf(node);
		own.Camera.Zoom = Math.max(own.Camera.Zoom, 28);
		point = this.Project([place.X, 0, place.Y]);
		own.Camera.X += own.Width / 2 - point[0];
		own.Camera.Y += own.Height / 2 - point[1];

		this.Dirty();
		this.Told();

		return true;
	},

	/* The kinds of the nodes for the legend: each with its color, its shape and how many there are. */
	KindList: function () {
		var self = this;
		var kinds = this.$Service('TopologyKinds');
		var counts = {};
		var order = [];

		this.List().forEach(function (node) {
			var kind = String(node.Kind || 'server');

			if (!counts[kind]) {
				counts[kind] = 0;

				order.push(kind);
			}

			counts[kind]++;
		});

		return order.map(function (kind) {
			var made = kinds.Kind(kind);

			return {Kind: kind, Shape: made.Shape, Color: 'rgb(' + self.Paint(made.Color).join(',') + ')', Count: counts[kind]};
		});
	},

	/* A kind of the legend pressed: its nodes lit, the others dimmed; pressed again, all as they were. */
	Pick: function (kind) {
		this.LegendKind = this.LegendKind === String(kind) ? '' : String(kind || '');

		this.Dirty();
	},

	/* The floor seen from above, small, in a corner: the nodes as dots, the view as a frame; a press there moves the view. */
	DrawMinimap: function (shown) {
		var self = this;
		var own = this.Own();
		var mini = this.$Element().querySelector('.elemenx-topology-iso-minimap');
		var c = Math.cos(own.Camera.Yaw);
		var s = Math.sin(own.Camera.Yaw);
		var box = [Infinity, Infinity, -Infinity, -Infinity];
		var context;
		var width;
		var height;
		var scale;
		var map;
		var view;

		if (!mini) return;

		if (mini !== own.Mini) {
			own.Mini = mini;

			['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(function (type) {
				mini.addEventListener(type, function (event) {
					self.MinimapPress(event);
				});
			});
		}

		width = mini.clientWidth || 160;
		height = mini.clientHeight || 110;

		if (mini.width !== Math.round(width * own.Ratio)) {
			mini.width = Math.round(width * own.Ratio);
			mini.height = Math.round(height * own.Ratio);
		}

		context = mini.getContext('2d');

		context.setTransform(own.Ratio, 0, 0, own.Ratio, 0, 0);
		context.clearRect(0, 0, width, height);

		shown.Nodes.forEach(function (node) {
			var rx = node.Place.X * c - node.Place.Y * s;
			var rz = node.Place.X * s + node.Place.Y * c;

			box = [Math.min(box[0], rx), Math.min(box[1], rz), Math.max(box[2], rx), Math.max(box[3], rz)];
		});

		if (!isFinite(box[0])) return;

		/* The view: the corners of the canvas on the floor, seen whole with what stands there. */
		view = [[0, 0], [own.Width, 0], [own.Width, own.Height], [0, own.Height]].map(function (corner) {
			var floor = self.Floor(corner[0], corner[1]);
			var rx = floor[0] * c - floor[1] * s;
			var rz = floor[0] * s + floor[1] * c;

			box = [Math.min(box[0], rx), Math.min(box[1], rz), Math.max(box[2], rx), Math.max(box[3], rz)];

			return [rx, rz];
		});

		scale = Math.min((width - 16) / Math.max(1, box[2] - box[0]), (height - 16) / Math.max(1, box[3] - box[1]));
		map = own.MinimapAt = {MinX: box[0], MinZ: box[1], Scale: scale, Left: (width - (box[2] - box[0]) * scale) / 2, Top: (height - (box[3] - box[1]) * scale) / 2, Cos: c, Sin: s};

		shown.Nodes.forEach(function (node) {
			var rx = node.Place.X * c - node.Place.Y * s;
			var rz = node.Place.X * s + node.Place.Y * c;
			var color = node.Status === 'error' ? self.Colors().danger : node.Status === 'warning' ? self.Colors().warning : self.Paint(node.Color);

			context.fillStyle = 'rgba(' + color.join(',') + ',' + (node.Active ? 1 : 0.55) + ')';

			context.fillRect(map.Left + (rx - map.MinX) * scale - 1.5, map.Top + (rz - map.MinZ) * scale - 1.5, 3, 3);
		});

		this.Outline(context, view.map(function (point) {
			return [map.Left + (point[0] - map.MinX) * scale, map.Top + (point[1] - map.MinZ) * scale];
		}));

		context.lineWidth = 1.5;
		context.strokeStyle = 'rgb(' + this.Colors().accent.join(',') + ')';

		context.stroke();
	},

	/* A press or a drag on the minimap: the view goes over that point of the floor. */
	MinimapPress: function (event) {
		var own = this.Own();
		var map = own.MinimapAt;
		var box;
		var rx;
		var rz;
		var point;

		if (event.type === 'pointerup' || event.type === 'pointercancel') {
			own.MinimapDrag = false;

			return;
		}

		if (event.type === 'pointerdown') {
			own.MinimapDrag = true;

			try {
				event.target.setPointerCapture(event.pointerId);
			}
			catch (error) {
				own.MinimapDrag = true;
			}
		}

		if (!own.MinimapDrag || !map) return;

		event.preventDefault();

		box = event.target.getBoundingClientRect();
		rx = (event.clientX - box.left - map.Left) / map.Scale + map.MinX;
		rz = (event.clientY - box.top - map.Top) / map.Scale + map.MinZ;
		point = this.Project([rx * map.Cos + rz * map.Sin, 0, -rx * map.Sin + rz * map.Cos]);
		own.Camera.X += own.Width / 2 - point[0];
		own.Camera.Y += own.Height / 2 - point[1];

		this.Dirty();
	},

	/*
	 * May it be done (ReadOnly: nothing; EditCheck (action, target): false refuses it)? action: move (a node dragged:
	 * {Node}), group (a group dragged by its title: {Group}), toggle (a group folded or unfolded by a press: {Group}). A
	 * refusal is told in denied {Action, Node or Group}.
	 */
	Can: function (action, target) {
		var allowed = !(this.ReadOnly === true || this.ReadOnly === 'true');
		if (allowed && typeof this.EditCheck === 'function')
			allowed = this.EditCheck(action, Object.assign({}, target)) !== false;

		if (!allowed)
			this.$Emit('denied', Object.assign({Action: action}, target));

		return allowed;
	},

	/* What it shows now, to keep: the view, where nodes were dragged, the groups folded. Restore(snapshot) brings it back. */
	Snapshot: function () {
		var own = this.Own();

		return JSON.parse(JSON.stringify({Angle: own.Camera.Yaw * 180 / Math.PI, Tilt: own.Camera.Pitch * 180 / Math.PI, Zoom: own.Camera.Zoom, X: own.Camera.X, Y: own.Camera.Y, Places: own.Moved, Folded: own.Folded}));
	},

	Restore: function (snapshot) {
		var self = this;
		var own = this.Own();
		var state = snapshot && typeof snapshot === 'object' ? snapshot : {};

		own.Camera.Yaw = this.Number(state.Angle, own.Camera.Yaw * 180 / Math.PI) * Math.PI / 180;
		own.Camera.Pitch = this.Pitch(this.Number(state.Tilt, own.Camera.Pitch * 180 / Math.PI));
		own.Camera.Zoom = Math.max(2, Math.min(240, this.Number(state.Zoom, own.Camera.Zoom)));
		own.Camera.X = this.Number(state.X, own.Camera.X);
		own.Camera.Y = this.Number(state.Y, own.Camera.Y);
		own.Turn = null;
		own.Fitted = true;
		own.Folded = Object.assign({}, state.Folded || {});
		own.Moved = {};

		Object.keys(state.Places || {}).forEach(function (id) {
			own.Moved[id] = {X: self.Number(state.Places[id].X, 0), Y: self.Number(state.Places[id].Y, 0)};
			own.Places[id] = own.Moved[id];
		});

		own.Shown = null;

		this.Dirty();
	},

	/* Picking */

	/* What is under a point of the canvas: a node (the nearest first), the title of a group, a link; null for the floor. */
	HitAt: function (x, y) {
		var hits = this.Own().Hits;
		var i;
		var hit;

		for (i = hits.length - 1; i >= 0; i--) {
			hit = hits[i];

			if (hit.Type === 'node' && x >= hit.Box[0] - 2 && x <= hit.Box[2] + 2 && y >= hit.Box[1] - 2 && y <= hit.Box[3] + 2) return hit;
		}

		for (i = hits.length - 1; i >= 0; i--) {
			hit = hits[i];

			if (hit.Type === 'group' && x >= hit.Box[0] && x <= hit.Box[2] && y >= hit.Box[1] && y <= hit.Box[3]) return hit;
		}

		for (i = hits.length - 1; i >= 0; i--) {
			hit = hits[i];

			if (hit.Type === 'link' && this.Near(x, y, hit.From, hit.To) < 5) return hit;
		}

		return null;
	},

	Near: function (x, y, a, b) {
		var dx = b[0] - a[0];
		var dy = b[1] - a[1];
		var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));

		return Math.sqrt(Math.pow(x - a[0] - dx * t, 2) + Math.pow(y - a[1] - dy * t, 2));
	},

	Local: function (event) {
		var box = this.Own().Canvas.getBoundingClientRect();

		return [event.clientX - box.left, event.clientY - box.top];
	},

	Down: function (event) {
		var own = this.Own();
		var at = this.Local(event);
		var hit = this.HitAt(at[0], at[1]);
		var floor;

		own.Canvas.focus({preventScroll: true});

		try {
			own.Canvas.setPointerCapture(event.pointerId);
		}
		catch (error) {
			own.Captured = false;
		}

		/* The right button, or Alt: the view turns and tilts. */
		if (event.button === 2 || event.button === 0 && event.altKey) {
			own.Drag = {Type: 'turn', At: at, Yaw: own.Camera.Yaw, Pitch: own.Camera.Pitch};

			return;
		}

		if (event.button !== 0) return;

		if (hit && hit.Type === 'node') {
			/* Shift with a node chosen: the way from it to this one. */
			if (event.shiftKey && own.Selected && own.Selected.indexOf(':') === -1 && hit.ID.indexOf('group:') !== 0 && hit.ID !== own.Selected) {
				this.Path(own.Selected, hit.ID);

				return;
			}

			this.Path();
			this.Select(hit.ID);

			if (hit.ID.indexOf('group:') !== 0) {
				floor = this.Floor(at[0], at[1]);
				own.Drag = {Type: 'node', ID: hit.ID, At: at, Start: Object.assign({}, own.Places[hit.ID]), Floor: floor, Moved: false};
			}

			return;
		}

		if (hit && hit.Type === 'group') {
			this.Select('group:' + hit.ID);

			own.Drag = {Type: 'group', ID: hit.ID, At: at, Floor: this.Floor(at[0], at[1]), Start: this.MembersOf(hit.ID).reduce(function (places, id) {
				if (own.Places[id])
					places[id] = Object.assign({}, own.Places[id]);

				return places;
			}, {}), Moved: false};

			return;
		}

		if (hit && hit.Type === 'link') {
			this.Select(hit.ID);

			return;
		}

		own.Drag = {Type: 'pan', At: at, X: own.Camera.X, Y: own.Camera.Y, Moved: false};
	},

	Move: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var at = this.Local(event);
		var floor;
		var hit;
		var dx;
		var dy;

		if (!drag) {
			hit = this.HitAt(at[0], at[1]);

			if ((hit ? hit.ID : null) !== own.Hover) {
				own.Hover = hit && hit.Type === 'node' ? hit.ID : null;
				own.Canvas.style.cursor = hit ? 'pointer' : '';
				own.Canvas.title = hit && hit.Type === 'node' && this.Comments === 'icon' ? this.CommentOf(hit.ID) : '';

				this.Dirty();
			}

			return;
		}

		dx = at[0] - drag.At[0];
		dy = at[1] - drag.At[1];

		/* Moved at last: may it be? A drag refused leaves all where it was. */
		if (Math.abs(dx) + Math.abs(dy) > 3 && !drag.Moved) {
			drag.Moved = true;

			if (drag.Type === 'node' && !this.Can('move', {Node: drag.ID}) || drag.Type === 'group' && !this.Can('group', {Group: drag.ID})) {
				own.Drag = null;

				return;
			}
		}

		if (drag.Type === 'pan') {
			own.Camera.X = drag.X + dx;
			own.Camera.Y = drag.Y + dy;
		}
		else if (drag.Type === 'turn') {
			own.Camera.Yaw = drag.Yaw + dx * 0.01;
			own.Camera.Pitch = Math.max(12 * Math.PI / 180, Math.min(85 * Math.PI / 180, drag.Pitch + dy * 0.006));
			own.Turn = null;
		}
		else if (drag.Type === 'node') {
			floor = this.Floor(at[0], at[1]);
			own.Places[drag.ID] = {X: Math.round(drag.Start.X + floor[0] - drag.Floor[0]), Y: Math.round(drag.Start.Y + floor[1] - drag.Floor[1])};
		}
		else if (drag.Type === 'group') {
			floor = this.Floor(at[0], at[1]);

			Object.keys(drag.Start).forEach(function (id) {
				own.Places[id] = {X: Math.round(drag.Start[id].X + floor[0] - drag.Floor[0]), Y: Math.round(drag.Start[id].Y + floor[1] - drag.Floor[1])};
			});
		}

		this.Dirty();
	},

	Up: function () {
		var own = this.Own();
		var self = this;
		var drag = own.Drag;

		own.Drag = null;

		if (!drag || !drag.Moved) return;

		if (drag.Type === 'node') {
			own.Moved[drag.ID] = own.Places[drag.ID];

			this.$Emit('move', {Node: drag.ID, X: own.Places[drag.ID].X, Y: own.Places[drag.ID].Y});
		}

		if (drag.Type === 'group') {
			Object.keys(drag.Start).forEach(function (id) {
				own.Moved[id] = own.Places[id];

				self.$Emit('move', {Node: id, X: own.Places[id].X, Y: own.Places[id].Y});
			});
		}

		if (drag.Type === 'turn' || drag.Type === 'pan')
			this.Told();
	},

	Wheel: function (event) {
		var own = this.Own();
		var at = this.Local(event);
		var before = this.Floor(at[0], at[1]);
		var after;
		var camera = own.Camera;

		event.preventDefault();

		camera.Zoom = Math.max(2, Math.min(240, camera.Zoom * Math.exp(-event.deltaY * 0.0015)));

		/* The point under the pointer stays under it. */
		after = this.Project([before[0], 0, before[1]]);
		camera.X += at[0] - after[0];
		camera.Y += at[1] - after[1];

		this.Dirty();
		this.Told();
	},

	Double: function (event) {
		var at = this.Local(event);
		var hit = this.HitAt(at[0], at[1]);
		var group;

		if (!hit) return;

		group = hit.Type === 'group' ? hit.ID : hit.ID.indexOf('group:') === 0 ? hit.ID.slice(6) : null;

		if (group !== null) {
			if (this.Can('toggle', {Group: group}))
				this.Toggle(group);

			return;
		}

		if (hit.Type === 'node')
			this.$Emit('open', {Node: hit.ID});
	},

	/* The keys: Q and E turn a quarter, + and - zoom, 0 fits, Enter opens, Escape lets go, the arrows go node to node. */
	Key: function (event) {
		var own = this.Own();
		var key = event.key;
		var selected = own.Selected && own.Selected.indexOf(':') === -1 ? own.Selected : null;

		if (key === 'q' || key === 'Q' || key === 'e' || key === 'E') {
			event.preventDefault();

			this.Rotate(key.toLowerCase() === 'q' ? -90 : 90);

			return;
		}

		if (key === '+' || key === '=' || key === '-') {
			event.preventDefault();

			own.Camera.Zoom = Math.max(2, Math.min(240, own.Camera.Zoom * (key === '-' ? 0.8 : 1.25)));

			this.Dirty();

			return;
		}

		if (key === '0') {
			this.Fit();

			return;
		}

		if (key === 'Escape') {
			this.Path();
			this.Select('');

			return;
		}

		if (key === 'Enter' && selected) {
			event.preventDefault();

			this.$Emit('open', {Node: selected});
		}
	},

	/* A node of the list out of sight took the focus: it is selected and seen. */
	Focused: function (id) {
		this.Select(id);
	},

	CommentOf: function (id) {
		var node = this.List().filter(function (one) {
			return String(one.ID) === String(id);
		})[0];
		var live = node ? Object.assign({}, node, this.Own().Live[String(id)] || {}) : null;

		return live && live.Comment ? String(live.Comment) : '';
	},

	Told: function () {
		var camera = this.Own().Camera;

		this.$Emit('view', {Angle: Math.round(camera.Yaw * 180 / Math.PI * 10) / 10, Tilt: Math.round(camera.Pitch * 180 / Math.PI * 10) / 10, Zoom: Math.round(camera.Zoom * 100) / 100});
	},

	/* Methods */

	/* A node by its ID, a link by link:<index>, a group by group:<ID>; nothing with an empty one. */
	Select: function (id) {
		var own = this.Own();
		var text = id === null || id === undefined ? '' : String(id);
		if ((own.Selected || '') === text) return;

		own.Selected = text || null;

		this.Dirty();
		this.$Emit('select', this.Selected());
	},

	Selected: function () {
		var selected = this.Own().Selected;

		return {
			Node: selected && selected.indexOf('link:') !== 0 && selected.indexOf('group:') !== 0 ? selected : null,
			Link: selected && selected.indexOf('link:') === 0 ? Number(selected.slice(5)) : null,
			Group: selected && selected.indexOf('group:') === 0 ? selected.slice(6) : null
		};
	},

	Places: function () {
		return JSON.parse(JSON.stringify(this.Own().Places));
	},

	/* The view turned by so many degrees, a step a frame. */
	Rotate: function (degrees) {
		var own = this.Own();

		own.Turn = {To: (own.Turn ? own.Turn.To : own.Camera.Yaw) + this.Number(degrees, 90) * Math.PI / 180};

		this.Dirty();
	},

	/* What a node (or link:<index>) shows, changed as it comes: no new layout. */
	Update: function (id, changes) {
		var own = this.Own();
		var key = String(id);

		own.Live[key] = Object.assign({}, own.Live[key] || {}, changes || {});
		own.Shown = null;

		this.Dirty();
	},

	/* A group folded into one node of all its members, or unfolded. */
	Toggle: function (id) {
		var own = this.Own();
		var group = this.GroupOf(id);
		if (!group)
			return false;

		own.Folded[group.ID] = !this.Folded(group);
		own.Shown = null;

		if (own.Selected === 'group:' + group.ID && own.Folded[group.ID] === false)
			own.Selected = null;

		this.Dirty();
		this.$Emit('toggle', {Group: String(group.ID), Collapsed: own.Folded[group.ID]});

		return own.Folded[group.ID];
	},

	/* All that stands in the view, with a margin. */
	Fit: function () {
		var self = this;
		var own = this.Own();
		var camera = own.Camera;
		var places = Object.keys(own.Places).map(function (id) {
			return own.Places[id];
		});
		var box = [Infinity, Infinity, -Infinity, -Infinity];
		var scale;

		if (!places.length || own.Width <= 60 || own.Height <= 60) return;

		camera.Zoom = 40;
		camera.X = 0;
		camera.Y = 0;

		places.forEach(function (place) {
			[[-1, 0, -1], [1, 0, 1], [1, 0, -1], [-1, 0, 1], [0, 1.2, 0]].forEach(function (corner) {
				var point = self.Project([place.X + corner[0], corner[1], place.Y + corner[2]]);

				box = [Math.min(box[0], point[0]), Math.min(box[1], point[1]), Math.max(box[2], point[0]), Math.max(box[3], point[1])];
			});
		});

		scale = Math.min((own.Width - 60) / Math.max(1, box[2] - box[0]), (own.Height - 70) / Math.max(1, box[3] - box[1]));
		camera.Zoom = Math.max(2, Math.min(90, 40 * scale));
		camera.X = (own.Width / 2 - (box[0] + box[2]) / 2) * camera.Zoom / 40;
		camera.Y = (own.Height / 2 - (box[1] + box[3]) / 2) * camera.Zoom / 40 - 6;

		this.Dirty();
	},

	/* Where a node is drawn on the page (the middle of its foot): {X, Y}, or null. */
	ToScreen: function (id) {
		var own = this.Own();
		var shown = this.Shown().Nodes.filter(function (node) {
			return node.ID === String(id);
		})[0];
		var point;
		var box;

		if (!shown)
			return null;

		point = this.Project([this.PlaceOf(shown).X, shown.Size * 0.4, this.PlaceOf(shown).Y]);
		box = own.Canvas.getBoundingClientRect();

		return {X: box.left + point[0], Y: box.top + point[1]};
	},

	/* What it shows, as a picture: a PNG data URL. */
	Picture: function () {
		this.Draw(performance.now());

		return this.Own().Canvas.toDataURL('image/png');
	}
});
