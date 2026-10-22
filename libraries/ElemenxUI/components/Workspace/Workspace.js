/*
 * An IDE-like application frame built on elemenx-screen, elemenx-container and elemenx-column.
 * Slots: header, ribbon (a Ribbon under the header), top-stripe (a band under them), left-stripe, left, main, bottom,
 * right, right-stripe, bottom-stripe (a band above the status bar) and status. Variant="ribbon" makes the frame of an
 * Office-like Application: the header becomes a slim title bar that joins the Ribbon. The frame does not decide its content: an area shows
 * only while its slot renders something (put *if on a tool window to open and close it), and the left, right and
 * bottom areas are resized by their edge; the resize event reports {Panel, Size}.
 *
 * Tool windows the user arranges: a WorkspaceToolWindow with an ID in the slot tools is placed by the frame. Its Area
 * (left, right or bottom) is where it starts; a button on the stripe of that side (its Icon, Title and Badge: a count,
 * 'dot', 'busy'...) opens and closes it, one tool window open in an area at a time (Open opens it at first). While
 * Customize is on, the buttons are dragged from stripe to stripe (the lower part of the left stripe is the bottom
 * area) and in their order: the tool window goes with its button. Layout is the arrangement: {Areas: {id: area},
 * Order: [id], Open: {left, right, bottom: id or null}, Sizes: {left, right, bottom: pixels}}; every change of it
 * (a move, an opening, a resize) emits layout with the new one, and Persist (a key) keeps it in the storage of the
 * browser for the next visit. ResetLayout() goes back to the areas of the tool windows.
 */
Elemenx.Component('Workspace', {
	$TemplateURL: 'Workspace.html',
	$StyleURL: 'Workspace.css',
	Variant: '',
	Layout: null,
	Persist: '',
	Customize: false,
	Tools: [],

	$OnCreate: function () {
		var self = this;
		var known = [];

		/* The tool windows declared in the slot tools, also the ones moved into their areas. */
		this.Known = function () {
			return known;
		};

		this.Forget = function (node) {
			var index = known.indexOf(node);
			if (index !== -1)
				known.splice(index, 1);

			self.Read();
		};

		function layout (value) {
			return value && typeof value === 'object' ? value : {};
		}

		this.AreaOf = function (tool, value) {
			var area = (layout(value).Areas || {})[tool.ID];

			return area === 'left' || area === 'right' || area === 'bottom' ? area : tool.Area;
		};

		/* The tool windows of an area, in the order of the layout, then of the template. */
		this.ToolsIn = function (area, tools, value) {
			var order = layout(value).Order || [];

			return (tools || []).filter(function (tool) {
				return self.AreaOf(tool, value) === area;
			}).sort(function (a, b) {
				var x = order.indexOf(a.ID);
				var y = order.indexOf(b.ID);
				if (x === -1 && y === -1)
					return a.Index - b.Index;

				if (x === -1) return 1;
				if (y === -1) return -1;

				return x - y;
			});
		};

		/* The ID of the tool window open in an area, or ''. */
		this.OpenIn = function (area, tools, value) {
			var open = layout(value).Open || {};
			var list = self.ToolsIn(area, tools, value);
			var id = Object.prototype.hasOwnProperty.call(open, area) ? open[area] : (list.filter(function (tool) {
				return tool.Open;
			})[0] || {}).ID;

			return list.some(function (tool) {
				return tool.ID === id;
			}) ? id : '';
		};

		/* What *mount puts in the panel of an area: the element of its open tool window. */
		this.Mounted = function (area, tools, value) {
			var id = self.OpenIn(area, tools, value);
			var tool = (tools || []).filter(function (entry) {
				return entry.ID === id;
			})[0];

			return tool ? {Element: tool.Node} : null;
		};

		this.SizeOf = function (area, value) {
			var size = (layout(value).Sizes || {})[area];

			return size ? size + 'px' : null;
		};
	},

	$OnReady: function () {
		var self = this;
		var sources = this.$Element().querySelector('.elemenx-workspace-sources');
		var text;

		if (this.Persist) {
			try {
				text = window.localStorage.getItem('elemenx-workspace:' + this.Persist);

				if (text)
					this.Layout = JSON.parse(text);
			}
			catch (error) {
				text = null;
			}
		}

		this.Watcher = new MutationObserver(function () {
			self.Read();
		});

		this.Watcher.observe(sources, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-tool', 'data-title', 'data-icon', 'data-badge', 'data-area', 'data-open']});

		this.Read();
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();
	},

	/* The tool windows: the ones in the slot tools now, and the ones moved from it into their areas. */
	Read: function () {
		var self = this;
		var known = this.Known();
		var sources = this.$Element().querySelector('.elemenx-workspace-sources');

		Array.prototype.forEach.call(sources.querySelectorAll('[data-tool]'), function (node) {
			if (known.indexOf(node) === -1) {
				known.push(node);

				/* A tool window that goes (its *if) tells the frame, wherever its element is now. */
				node.ElemenxForget = self.Forget;
			}
		});

		this.Tools = known.map(function (node, index) {
			var badge = node.getAttribute('data-badge');

			return {
				ID: node.getAttribute('data-tool'),
				Title: node.getAttribute('data-title') || '',
				Icon: node.getAttribute('data-icon') || 'panel-left',
				Badge: badge === null ? '' : badge,
				Area: /^(left|right|bottom)$/.test(node.getAttribute('data-area')) ? node.getAttribute('data-area') : 'left',
				Open: node.getAttribute('data-open') === 'true',
				Index: index,
				Node: node
			};
		});
	},

	/* A new layout: kept, reported. */
	Arranged: function (value) {
		this.Layout = value;

		if (this.Persist) {
			try {
				window.localStorage.setItem('elemenx-workspace:' + this.Persist, JSON.stringify(value));
			}
			catch (error) {
				this.$Emit('layout', value);

				return;
			}
		}

		this.$Emit('layout', value);
	},

	/* A copy of the layout with its parts, for a change. */
	Copy: function () {
		var value = this.Layout && typeof this.Layout === 'object' ? this.Layout : {};

		return {
			Areas: Object.assign({}, value.Areas || {}),
			Order: (value.Order || []).slice(),
			Open: Object.assign({}, value.Open || {}),
			Sizes: Object.assign({}, value.Sizes || {})
		};
	},

	/* The close button of a tool window placed by the frame: its area closes. */
	ToolClosed: function (event, node) {
		var value = this.Copy();

		value.Open[node.getAttribute('data-panel')] = null;

		this.Arranged(value);
	},

	/* A button of a stripe: its tool window opens in its area, or closes when it is the open one. */
	Toggled: function (event, node) {
		var id = node.getAttribute('data-tool');
		var tool = this.Tools.filter(function (entry) {
			return entry.ID === id;
		})[0];
		var value = this.Copy();
		var area;

		if (!tool) return;

		area = this.AreaOf(tool, this.Layout);
		value.Open[area] = this.OpenIn(area, this.Tools, this.Layout) === id ? null : id;

		this.Arranged(value);
	},

	/* A button dropped on a stripe (Customize): its tool window goes to that area, at that place, and stays open. */
	Docked: function (event, node) {
		var detail = event.detail;
		var area = node.getAttribute('data-area');
		var id = String(detail.Data);
		var tool = this.Tools.filter(function (entry) {
			return entry.ID === id;
		})[0];
		var value = this.Copy();
		var from;
		var list;
		var order;

		if (!tool || !/^(left|right|bottom)$/.test(area)) return;

		from = this.AreaOf(tool, this.Layout);

		list = this.ToolsIn(area, this.Tools, this.Layout).map(function (entry) {
			return entry.ID;
		}).filter(function (entry) {
			return entry !== id;
		});

		list.splice(Math.max(0, Math.min(list.length, detail.Index == null ? list.length : detail.Index)), 0, id);

		order = value.Order.filter(function (entry) {
			return list.indexOf(entry) === -1;
		}).concat(list);

		/* An open tool window stays open in its new area. */
		if (from !== area && this.OpenIn(from, this.Tools, this.Layout) === id) {
			value.Open[from] = null;
			value.Open[area] = id;
		}

		value.Areas[id] = area;
		value.Order = order;

		this.Arranged(value);
	},

	ResetLayout: function () {
		this.Arranged({Areas: {}, Order: [], Open: {}, Sizes: {}});
	},

	Resized: function (event, node) {
		var panel = node.getAttribute('data-panel');
		var size = panel === 'bottom' ? event.detail.Height : event.detail.Width;
		var value = this.Copy();

		this.$Emit('resize', {Panel: panel, Size: size});

		value.Sizes[panel] = Math.round(size);

		this.Arranged(value);
	}
});
