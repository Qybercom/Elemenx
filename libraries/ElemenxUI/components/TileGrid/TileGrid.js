/*
 * Groups of tiles on a grid of 48px cells, like a start screen.
 * Groups: [{ID, Title, Tiles, Locked, Actions, Element, Render}]. A group header shows Actions ([{ID, Icon, Label,
 * Title, Run}], buttons that emit groupaction with {Group, Action} and call Run(group)) and custom content: Element
 * (a DOM node) or Render(container, group). A Locked group keeps its tiles and takes no others.
 * A tile is {ID, Title, Icon, Size (small 1x1, medium 2x2, wide 4x2, tall 2x4, large 4x4, xlarge 6x4), Width and
 * Height (any number of cells, over Size), Row, Column, Color, Badge, Text, Class, Locked, Element, Render}. Row and Column place the tile on the cells of its group (from 0); a tile without
 * them takes the first free place. Element or Render(container, tile) replace the icon and the text with custom
 * content, Class adds classes, Locked keeps the tile in its place. Columns is the width of a group in cells; a group
 * may have its own Columns and Rows (its least height), and while Editable the handles on its right edge, its bottom
 * edge and its corner stretch it (pointer or arrow keys, whole cells, from its widest tile up to MaxColumns (0: no
 * limit), from its lowest tile down), reported by change. Fit gives a group no more columns than the grid has room
 * for: on a narrow screen the tiles that do not fit take free places below, and come back as it widens.
 * Direction 'horizontal' puts the groups in one row, as on a start screen; 'columns' stacks them in columns, as the
 * Start menu of Windows: a group has the Stack (a number) of its column, and the columns wrap to a new row when the
 * grid is narrower than they are, each whole; a tile dragged above or below a group, or beside a column, starts a
 * group there (unless GroupPolicy is 'none'). In wrap (the default) the stacks wrap the same way, a group a stack of
 * its own until another goes above or below it: with GroupPolicy 'between' a tile dragged above or below a group starts
 * a group in its stack (the room under its lowest tile stays the group's), and beside a stack a new stack. Scroll makes the grid scroll on its own (give it a height), and a
 * tile dragged to its edge scrolls it. On a touch screen a finger scrolls over the tiles, and a
 * press held still takes a tile.
 * Arrangement() returns the places of the tiles and the sizes of the groups ([{ID, Title, Columns, Rows, Stack, Tiles: [{ID,
 * Row, Column, Size, Width, Height}]}]); Restore(arrangement) brings them back (tiles and groups it does not name stay
 * as they are); Persist (a key) keeps the arrangement in the storage of the browser and restores it on the next visit. A tile dragged past the right edge of a
 * group widens it by a column after GrowDelay milliseconds there (the edge shows it), again while it stays.
 * Events: open (the tile, on click or Enter). Editable lets the user move tiles by dragging: the tile goes to the cell
 * under the top left corner of its ghost and pushes down the tiles in its way, while it moves, as the grid will look
 * after the drop; places left empty stay empty.
 * GroupPolicy decides where a dragged tile may start a new group: 'end' (beside the last group), 'between' (also
 * between the groups) or 'none'; the new group is named NewGroupTitle and reported by groupcreate ({Group, Tile}).
 * A group left empty by a drag goes away. The change event carries the new Groups, every tile of a changed group with
 * its Row and Column; Escape puts everything back.
 * The groups and tiles may also be declared in the template: <TileGroup ID Title Locked> with <Tile> children that
 * take the props of a tile; the markup inside a <Tile> is its custom content, bound to the page like any markup.
 * Declarations add to Groups (a <Tile> with the ID of a tile of Groups gives it its props and content) and follow
 * the template: a new <Tile> joins its group, a removed one leaves, a changed prop shows; the places of the tiles
 * stay with the grid once they are set.
 */
Elemenx.Component('TileGrid', {
	$TemplateURL: 'TileGrid.html',
	$StyleURL: 'TileGrid.css',
	$Meta: {
		Group: 'layout',
		Icon: 'grid',
		Description: 'Groups of tiles on a grid of 48px cells, like a start screen.',
		Container: true,
		Children: ['TileGroup'],
		Events: {
			open: 'A tile was pressed: the tile.',
			groupaction: 'An action of a group header was pressed: {Group, Action}.',
			change: 'The tiles or the groups were moved or resized: Groups, as they are now.',
			groupcreate: 'A tile dropped beside the groups made a new group: {Group, Tile}.'
		},
		Methods: ['Arrangement()', 'Restore(arrangement)'],
		Props: {
			Groups: 'The groups: [{ID, Title, Tiles, Locked, Actions, Element, Render}] (TileGroup children add more).',
			Editable: 'Lets the user move the tiles and stretch the groups.',
			Columns: 'The width of a group, in cells.',
			MaxColumns: 'The widest a group may be stretched (0: no limit).',
			Fit: 'No more columns than the grid has room for.',
			Direction: {Options: ['wrap', 'horizontal', 'columns'], Description: 'wrap, horizontal (the groups in one row) or columns (stacked in columns that wrap, as the Start menu).'},
			Scroll: 'The grid scrolls on its own (give it a height).',
			Persist: 'A key that keeps the arrangement in the storage of the browser.',
			GrowDelay: 'How long a tile at the edge of a group waits before it widens the group, in milliseconds.',
			GroupPolicy: {Options: ['end', 'between', 'none'], Description: 'Where a dragged tile may start a group: end, between or none.'},
			NewGroupTitle: 'The title of a group a drag starts.'
		},
		Sample: {Groups: [{ID: 'start', Title: 'Start', Tiles: [{ID: 'mail', Title: 'Mail', Icon: 'mail', Size: 'medium', Color: '#3f6c9e'}, {ID: 'photos', Title: 'Photos', Icon: 'image', Size: 'wide', Color: '#b4483f'}]}], Editable: true, Fit: true, GroupPolicy: 'between'}
	},
	Groups: [],
	Editable: false,
	Columns: 4,
	MaxColumns: 12,
	Fit: false,
	Room: 0,
	Direction: 'wrap',
	Scroll: false,
	Persist: '',
	GrowDelay: 500,
	Resizing: null,
	Grown: null,
	Growing: '',
	GrowTimer: 0,
	Last: null,
	GroupPolicy: 'end',
	NewGroupTitle: '',
	Dragging: '',
	Snapshot: null,
	Target: '',
	Created: '',
	Sequence: 0,
	Declared: '',
	Pending: false,

	$OnCreate: function () {
		var self = this;

		this.Released = function () {
			self.End(false);
		};

		this.Cancelled = function () {
			self.End(true);
		};

		this.Escaped = function (event) {
			if (Elemenx.Locale.Key(event) === 'Escape')
				self.End(true);
		};

		/* The width of a group in cells: its own Columns, or the Columns of the grid; with Fit, no more than there is room for. */
		/*
		 * The stacks of the groups: the groups of one Stack (in their order), the stacks by their Stack, a group without a
		 * Stack a stack of its own at its place in Groups; in one row (horizontal) a stack for each group, no box of its own.
		 */
		this.Stacks = function (groups, direction) {
			var stacks = [];
			var byValue = {};
			var stacked = direction !== 'horizontal';

			(groups || []).forEach(function (group, index) {
				var value = stacked && typeof group.Stack === 'number' ? group.Stack : index;

				if (!stacked || !byValue[value]) {
					byValue[value] = {Key: stacked ? 'stack-' + value : 'group-' + group.ID, Value: value, Groups: []};

					stacks.push(byValue[value]);
				}

				byValue[value].Groups.push(group);
			});

			return stacked ? stacks.sort(function (a, b) {
				return a.Value - b.Value;
			}) : stacks;
		};

		/* Whether a drag may start a group above or below a group, or beside a stack: in columns, and in wrap with GroupPolicy between. */
		this.Stacked = function (direction, policy) {
			return policy !== 'none' && (direction === 'columns' || (direction !== 'horizontal' && policy === 'between'));
		};

		/* The place of a group in Groups, by its ID. */
		this.IndexOf = function (groups, group) {
			return (groups || []).map(function (entry) {
				return String(entry.ID);
			}).indexOf(String(group.ID));
		};

		this.ColumnsOf = function (group, room) {
			var columns = Number(group && group.Columns) || Number(self.Columns) || 4;

			return room ? Math.max(1, Math.min(columns, room)) : columns;
		};

		/* The height of a group in cells: its Rows, or the rows its tiles take. */
		this.RowsOf = function (group) {
			return Math.max(Number(group && group.Rows) || 0, self.Bottom(group));
		};

		/* A tile dragged near an edge of a grid that scrolls scrolls it, a frame at a time. */
		var edge = {Point: null, Frame: 0};

		function scrolled () {
			var root = self.$Element();
			var point = edge.Point;
			var rect;
			var dx = 0;
			var dy = 0;

			edge.Frame = 0;

			if (!self.Dragging || !point || !root) return;

			rect = root.getBoundingClientRect();

			if (root.scrollWidth > root.clientWidth)
				dx = point.X < rect.left + 48 ? -1 : point.X > rect.right - 48 ? 1 : 0;

			if (root.scrollHeight > root.clientHeight)
				dy = point.Y < rect.top + 48 ? -1 : point.Y > rect.bottom - 48 ? 1 : 0;

			if (!dx && !dy) return;

			root.scrollLeft += dx * 12;
			root.scrollTop += dy * 12;

			edge.Frame = window.requestAnimationFrame(scrolled);
		}

		this.Edge = function (event) {
			edge.Point = {X: event.clientX, Y: event.clientY};

			if (!edge.Frame)
				edge.Frame = window.requestAnimationFrame(scrolled);
		};

		this.EdgeStop = function () {
			document.removeEventListener('pointermove', self.Edge, true);

			window.cancelAnimationFrame(edge.Frame);

			edge.Frame = 0;
		};

		/* The grid-area of a tile: its place in the layout of its group. */
		this.Area = function (group, tile) {
			var spot = self.Layout(group.Tiles, self.ColumnsOf(group, self.Room)).filter(function (entry) {
				return String(entry.Tile.ID) === String(tile.ID);
			})[0];

			return spot ? (spot.Row + 1) + ' / ' + (spot.Column + 1) + ' / span ' + spot.Height + ' / span ' + spot.Width : null;
		};
	},

	$OnReady: function () {
		var self = this;
		var sources = this.$Element().querySelector('.elemenx-tile-sources');

		function source (node) {
			return node.nodeType === 1 && (node.matches('.elemenx-tile-source, .elemenx-tile-group-source') || !!node.querySelector('.elemenx-tile-source, .elemenx-tile-group-source'));
		}

		/* Only declarations count: the content of a tile is moved into the tile and changes there freely. */
		function relevant (record) {
			if (record.type === 'attributes')
				return record.target.matches('.elemenx-tile-source, .elemenx-tile-group-source');

			return Array.prototype.some.call(record.addedNodes, source) || Array.prototype.some.call(record.removedNodes, source);
		}

		if (!sources) return;

		this.Watcher = new MutationObserver(function (records) {
			if (records.some(relevant))
				self.Sync();
		});

		this.Watcher.observe(sources, {subtree: true, childList: true, attributes: true});

		this.Sync();

		this.Load();

		/* Fit: the room of the grid in columns of cells, as it resizes. */
		if (typeof ResizeObserver === 'function') {
			this.Measure = new ResizeObserver(function () {
				var room = self.Fit && self.Fit !== 'false' ? Math.max(1, Math.floor((self.$Element().clientWidth + 8) / 56)) : 0;
				if (room !== self.Room)
					self.Room = room;
			});

			this.Measure.observe(this.$Element());
		}

		/* The arrangement is kept at every change, with Persist. */
		this.$On('change', function () {
			self.Save();
		});
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();

		if (this.Measure)
			this.Measure.disconnect();

		this.EdgeStop();

		this.Unlisten();
	},

	Find: function (id) {
		var g = 0;
		var t;

		while (g < this.Groups.length) {
			t = 0;

			while (t < this.Groups[g].Tiles.length) {
				if (String(this.Groups[g].Tiles[t].ID) === String(id))
					return {Group: g, Index: t, Tile: this.Groups[g].Tiles[t]};

				t++;
			}

			g++;
		}

		return null;
	},

	GroupIndex: function (id) {
		return this.Groups.map(function (group) {
			return String(group.ID);
		}).indexOf(String(id));
	},

	/* A click on a control inside a custom tile is the control's, not an opening of the tile. */
	Open: function (event, node) {
		var control = event.target.closest && event.target.closest('a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]');
		var found = this.Find(node.getAttribute('data-id'));

		if (control && control !== node && node.contains(control)) return;

		if (found)
			this.$Emit('open', found.Tile);
	},

	Key: function (event, node) {
		if (Elemenx.Locale.Key(event) !== 'Enter' && Elemenx.Locale.Key(event) !== ' ') return;

		event.preventDefault();

		this.Open(event, node);
	},

	/* A Button of an action: the group and the action on the element round it. */
	Act: function (event) {
		var node = event.target.closest('[data-action]');
		var group = this.Groups[this.GroupIndex(node.getAttribute('data-group'))];
		var action = group && (group.Actions || []).filter(function (entry) {
			return String(entry.ID) === node.getAttribute('data-action');
		})[0];
		if (!action) return;

		if (typeof action.Run === 'function')
			action.Run(group);

		this.$Emit('groupaction', {Group: group, Action: action});
	},

	/* The groups, their tiles and the places of the tiles, to tell whether a drag changed anything. */
	Signature: function (groups) {
		var self = this;

		return (groups || []).map(function (group) {
			return group.ID + '#' + self.ColumnsOf(group) + ':' + self.Layout(group.Tiles, self.ColumnsOf(group)).map(function (spot) {
				return spot.Tile.ID + '@' + spot.Row + ',' + spot.Column;
			}).join(',');
		}).join('|');
	},

	/* The cells of a tile in a group of columns: [columns, rows]. */
	Span: function (tile, columns) {
		var span = {small: [1, 1], medium: [2, 2], wide: [4, 2], tall: [2, 4], large: [4, 4], xlarge: [6, 4]}[tile.Size || 'medium'] || [2, 2];
		var width = Number(tile.Width) > 0 ? Math.round(Number(tile.Width)) : span[0];
		var height = Number(tile.Height) > 0 ? Math.round(Number(tile.Height)) : span[1];

		return [Math.min(width, columns || 4), height];
	},

	/* The most columns a group may have: MaxColumns, none for 0. */
	Limit: function () {
		var max = Number(this.MaxColumns);

		return max === 0 && this.MaxColumns !== '' && this.MaxColumns !== null ? Infinity : max || 12;
	},

	/* The rows the tiles of a group take at its width. */
	Bottom: function (group) {
		return Math.max.apply(Math, [0].concat(this.Layout(group && group.Tiles, this.ColumnsOf(group, this.Room)).map(function (spot) {
			return spot.Row + spot.Height;
		})));
	},

	Overlaps: function (a, b) {
		return a.Row < b.Row + b.Height && b.Row < a.Row + a.Height && a.Column < b.Column + b.Width && b.Column < a.Column + a.Width;
	},

	/*
	 * The places of tiles: [{Tile, Row, Column, Width, Height}] in their order. A tile keeps its Row and Column when
	 * they fit and are free; the others take the first free place, row by row.
	 */
	Layout: function (tiles, columns) {
		var placed = [];
		var spots = [];
		var self = this;

		function fits (spot) {
			return spot.Column >= 0 && spot.Row >= 0 && spot.Column + spot.Width <= columns && !placed.some(function (other) {
				return self.Overlaps(spot, other);
			});
		}

		(tiles || []).forEach(function (tile, index) {
			var span = self.Span(tile, columns);
			var spot = {Tile: tile, Row: Number(tile.Row), Column: Number(tile.Column), Width: span[0], Height: span[1]};

			if (tile.Row != null && tile.Column != null && fits(spot)) placed.push(spot);
			else spot.Row = -1;

			spots[index] = spot;
		});

		spots.forEach(function (spot) {
			if (spot.Row !== -1) return;

			spot.Row = 0;
			spot.Column = 0;

			while (!fits(spot)) {
				spot.Column++;

				if (spot.Column + spot.Width > columns) {
					spot.Column = 0;
					spot.Row++;
				}
			}

			placed.push(spot);
		});

		return spots;
	},

	/* A copy of tile at a place. */
	Moved: function (tile, row, column) {
		var copy = {};
		var key;

		for (key in tile) {
			if (Object.prototype.hasOwnProperty.call(tile, key))
				copy[key] = tile[key];
		}

		copy.Row = row;
		copy.Column = column;

		return copy;
	},

	/*
	 * The tiles of a group with tile put at row and column: locked tiles stay, the dragged tile takes its place
	 * (null when a locked tile is there) and every other tile in its way moves down until it is free.
	 */
	Settle: function (tiles, tile, row, column, columns) {
		var self = this;
		var span = this.Span(tile, columns);
		var spots = this.Layout(tiles, columns);
		var dragged = {Tile: tile, Row: Math.max(0, row), Column: Math.max(0, Math.min(columns - span[0], column)), Width: span[0], Height: span[1]};
		var settled = spots.filter(function (spot) {
			return spot.Tile.Locked;
		});
		var moving = spots.filter(function (spot) {
			return !spot.Tile.Locked;
		}).sort(function (a, b) {
			return a.Row - b.Row || a.Column - b.Column;
		});

		if (settled.some(function (spot) {
			return self.Overlaps(spot, dragged);
		})) return null;

		settled.push(dragged);

		moving.forEach(function (spot) {
			while (settled.some(function (other) {
				return self.Overlaps(spot, other);
			})) {
				spot.Row++;
			}

			settled.push(spot);
		});

		return settled.sort(function (a, b) {
			return a.Row - b.Row || a.Column - b.Column;
		}).map(function (spot) {
			return self.Moved(spot.Tile, spot.Row, spot.Column);
		});
	},

	/*
	 * The groups of base with the tile id at row and column of the group with the ID group, or at the start of a new
	 * group made at position at (group null); null when the tile cannot go there.
	 */
	Arrange: function (base, id, group, row, column, at) {
		var self = this;
		var source = -1;
		var target;
		var tile = null;
		var groups;
		var tiles;
		var created;

		groups = base.map(function (entry, index) {
			var copy = {};
			var key;

			for (key in entry) {
				if (Object.prototype.hasOwnProperty.call(entry, key))
					copy[key] = entry[key];
			}

			copy.Tiles = entry.Tiles;

			entry.Tiles.forEach(function (candidate) {
				if (String(candidate.ID) === String(id)) {
					source = index;
					tile = candidate;
				}
			});

			return copy;
		});

		if (!tile)
			return null;

		/* The tiles left in the source group keep their places; the hole stays. */
		groups[source].Tiles = this.Layout(groups[source].Tiles, this.ColumnsOf(groups[source])).filter(function (spot) {
			return String(spot.Tile.ID) !== String(tile.ID);
		}).map(function (spot) {
			return self.Moved(spot.Tile, spot.Row, spot.Column);
		});

		if (group === null) {
			this.Sequence++;

			created = {ID: 'group-' + Date.now() + '-' + this.Sequence, Title: (this.NewGroupTitle || Elemenx.Locale.Text('ui.tileGrid.newGroupTitle')), Tiles: []};
			target = at == null || at < 0 || at > groups.length ? groups.length : at;

			groups.splice(target, 0, created);

			this.Created = String(created.ID);
		}
		else {
			target = groups.map(function (entry) {
				return String(entry.ID);
			}).indexOf(String(group));
		}

		if (target === -1 || (groups[target].Locked && target !== source)) return null;

		tiles = this.Settle(groups[target].Tiles, tile, row, column, this.ColumnsOf(groups[target]));

		if (!tiles)
			return null;

		groups[target].Tiles = tiles;

		return groups;
	},

	/* The narrowest a group may be: its widest tile. */
	Narrowest: function (group) {
		var self = this;

		return Math.max.apply(Math, [1].concat(group.Tiles.map(function (tile) {
			return self.Span(tile, Infinity)[0];
		})));
	},

	/* Groups with the group id at a width of columns, or null when it has that width already or cannot have it. */
	Widened: function (base, id, columns) {
		var self = this;
		var index = base.map(function (entry) {
			return String(entry.ID);
		}).indexOf(String(id));
		var group = base[index];
		var copy = {};
		var key;

		if (!group)
			return null;

		columns = Math.max(this.Narrowest(group), Math.min(this.Limit(), columns));

		if (columns === this.ColumnsOf(group)) return null;

		for (key in group) {
			if (Object.prototype.hasOwnProperty.call(group, key))
				copy[key] = group[key];
		}

		copy.Columns = columns;

		/*
		 * The tiles keep their places: a wider group lays them out at the old width first, so the tiles without a place
		 * of their own do not flow into the new columns; in a narrower one the tiles that no longer fit take free places.
		 */
		copy.Tiles = this.Layout(group.Tiles, Math.min(columns, this.ColumnsOf(group))).map(function (spot) {
			return self.Moved(spot.Tile, spot.Row, spot.Column);
		});

		return base.slice(0, index).concat([copy], base.slice(index + 1));
	},

	ResizeStart: function (event, node) {
		var group = this.Groups[this.GroupIndex(node.getAttribute('data-group'))];
		if (!group || event.button !== 0) return;

		event.preventDefault();
		event.stopPropagation();

		node.setPointerCapture(event.pointerId);

		this.Resizing = {ID: String(group.ID), Edge: node.getAttribute('data-edge') || 'e', X: event.clientX, Y: event.clientY, Columns: this.ColumnsOf(group), Rows: this.RowsOf(group), Snapshot: this.Groups};
	},

	ResizeMove: function (event) {
		var resizing = this.Resizing;
		var groups = resizing ? resizing.Snapshot : null;

		if (!resizing) return;

		if (resizing.Edge.indexOf('e') !== -1)
			groups = this.Widened(groups, resizing.ID, resizing.Columns + Math.round((event.clientX - resizing.X) / 56)) || groups;

		if (resizing.Edge.indexOf('s') !== -1)
			groups = this.Heightened(groups, resizing.ID, resizing.Rows + Math.round((event.clientY - resizing.Y) / 56)) || groups;

		this.Groups = groups;
	},

	/* Groups with the group id at least rows high (no lower than its tiles), or null when nothing changes. */
	Heightened: function (base, id, rows) {
		var index = this.GroupIndexIn(base, id);
		var group = base[index];
		var copy = {};
		var key;

		if (!group)
			return null;

		rows = Math.max(this.Bottom(group), rows);

		if (rows === this.RowsOf(group)) return null;

		for (key in group) {
			if (Object.prototype.hasOwnProperty.call(group, key))
				copy[key] = group[key];
		}

		copy.Rows = rows;

		return base.slice(0, index).concat([copy], base.slice(index + 1));
	},

	ResizeEnd: function (event, node) {
		var resizing = this.Resizing;
		if (!resizing) return;

		if (node.hasPointerCapture(event.pointerId))
			node.releasePointerCapture(event.pointerId);

		this.Resizing = null;

		if (this.Signature(this.Groups) !== this.Signature(resizing.Snapshot))
			this.$Emit('change', this.Groups);
	},

	ResizeKey: function (event, node) {
		var group = this.Groups[this.GroupIndex(node.getAttribute('data-group'))];
		var height = node.getAttribute('data-edge') === 's';
		var step = (height ? {ArrowDown: 1, ArrowUp: -1} : {ArrowRight: 1, ArrowLeft: -1})[Elemenx.Locale.Key(event)];
		var groups;

		if (!group || !step) return;

		event.preventDefault();

		groups = height ? this.Heightened(this.Groups, group.ID, this.RowsOf(group) + step) : this.Widened(this.Groups, group.ID, this.ColumnsOf(group) + step);

		if (!groups) return;

		this.Groups = groups;

		this.$Emit('change', groups);
	},

	Begin: function (event, node) {
		if (this.Dragging) return;

		this.Dragging = String(node.getAttribute('data-id'));
		this.Snapshot = this.Groups;
		this.Target = '';
		this.Created = '';

		/* The document of the drag (the page, or a window the Application opened), whose listeners come off at the end. */
		this.Listened = (this.$Element().ownerDocument || document);

		this.Listened.addEventListener('pointerup', this.Released);
		this.Listened.addEventListener('pointercancel', this.Cancelled);
		this.Listened.addEventListener('keydown', this.Escaped, true);
		this.Listened.addEventListener('pointermove', this.Edge, true);
	},

	/*
	 * While a tile is dragged over a group, it takes the cell under the top left corner of its ghost there at once,
	 * worked out from the groups as they were before the drag, so the tiles it pushed come back when it moves on.
	 */
	Preview: function (event, node) {
		var detail = event.detail;
		var found;
		var cells;
		var base;
		var group;
		var columns;
		var rect;
		var row;
		var column;
		var key;
		var groups;

		if (!this.Dragging || detail.Type !== 'tile') return;

		found = this.Find(detail.Data);
		cells = node.querySelector('.elemenx-tile-cells');

		if (!found || !cells) return;

		base = this.Base();
		group = base[this.GroupIndexIn(base, node.getAttribute('data-group'))];

		if (!group) return;

		columns = this.ColumnsOf(group, this.Room);
		rect = cells.getBoundingClientRect();
		row = Math.round((detail.ClientY - detail.OffsetY - rect.top) / 56);
		column = Math.round((detail.ClientX - detail.OffsetX - rect.left) / 56);
		key = group.ID + ':' + row + ':' + column + ':' + columns;

		this.Last = {Detail: detail, Node: node};

		/* The ghost reaches past the right edge: the group grows if it stays there. */
		if (column + this.Span(found.Tile, Infinity)[0] > columns && columns < this.Limit() && !group.Locked) this.Wait(String(group.ID));
		else this.StopGrowing();

		if (key === this.Target) return;

		groups = this.Arrange(base, detail.Data, group.ID, row, column, null);

		if (!groups) return;

		this.Target = key;
		this.Groups = groups;
	},

	GroupIndexIn: function (groups, id) {
		return groups.map(function (group) {
			return String(group.ID);
		}).indexOf(String(id));
	},

	/* The groups before the drag, with the groups that the drag widened. */
	Base: function () {
		var base = this.Snapshot;
		var grown = this.Grown || {};
		var id;

		for (id in grown) {
			if (Object.prototype.hasOwnProperty.call(grown, id))
				base = this.Widened(base, id, grown[id]) || base;
		}

		return base;
	},

	/* Widens the group id by a column after GrowDelay, unless the ghost leaves the edge first. */
	Wait: function (id) {
		var self = this;

		if (this.Growing === id) return;

		this.StopGrowing();

		this.Growing = id;
		this.GrowTimer = window.setTimeout(function () {
			var base;
			var grown = {};
			var key;

			self.GrowTimer = 0;

			if (!self.Dragging || self.Growing !== id || !self.Last) return;

			base = self.Base();

			for (key in self.Grown || {}) {
				if (Object.prototype.hasOwnProperty.call(self.Grown, key))
					grown[key] = self.Grown[key];
			}

			grown[id] = self.ColumnsOf(base[self.GroupIndexIn(base, id)]) + 1;

			self.Grown = grown;
			self.Growing = '';
			self.Target = '';

			self.Preview({detail: self.Last.Detail}, self.Last.Node);
		}, Number(this.GrowDelay) || 0);
	},

	/* The groups that a drag widened, back to the width their tiles need, never below the width they had before. */
	Shrunk: function (groups, snapshot) {
		var self = this;
		var grown = this.Grown || {};
		var id;
		var index;
		var before;
		var needed;

		for (id in grown) {
			if (!Object.prototype.hasOwnProperty.call(grown, id)) continue;

			index = this.GroupIndexIn(groups, id);
			before = snapshot[this.GroupIndexIn(snapshot, id)];

			if (index === -1 || !before) continue;

			needed = Math.max.apply(Math, [this.ColumnsOf(before)].concat(this.Layout(groups[index].Tiles, this.ColumnsOf(groups[index])).map(function (spot) {
				return spot.Column + spot.Width;
			})));

			groups = self.Widened(groups, id, needed) || groups;
		}

		return groups;
	},

	StopGrowing: function () {
		window.clearTimeout(this.GrowTimer);

		this.GrowTimer = 0;
		this.Growing = '';
	},

	/* A tile that leaves the group it is shown in goes back to its place, until a group takes it again. */
	Leave: function (event, node) {
		var id = node.getAttribute('data-group');
		var grown = {};
		var key;

		if (!this.Dragging) return;

		if (this.Growing === id)
			this.StopGrowing();

		if (this.Target.indexOf(id + ':') !== 0) return;

		for (key in this.Grown || {}) {
			if (Object.prototype.hasOwnProperty.call(this.Grown, key) && key !== id)
				grown[key] = this.Grown[key];
		}

		this.Grown = grown;
		this.Target = '';
		this.Groups = this.Base();
	},

	/*
	 * Over the grid but outside the groups (below the last row of a group, or between groups), the tile goes to the
	 * group whose column the pointer is in, so a tile can be put under the lowest tile of a group. In columns that room
	 * belongs to the place of a new group under it.
	 */
	Beside: function (event, node) {
		var groups = node.querySelectorAll('.elemenx-tile-group[data-group]');
		var x = event.detail.ClientX;
		var y = event.detail.ClientY;
		var best = null;
		var distance = Infinity;
		var rect;
		var gap;
		var i = 0;

		if (this.Direction === 'columns') return;

		while (i < groups.length) {
			rect = groups[i].getBoundingClientRect();
			gap = Math.max(rect.left - x, 0, x - rect.right);

			if (rect.top <= y && gap < distance && !groups[i].classList.contains('locked')) {
				distance = gap;
				best = groups[i];
			}

			i++;
		}

		if (best && distance <= 16)
			this.Preview(event, best);
	},

	DropOnNew: function (event) {
		this.Start(event, null);
	},

	DropBetween: function (event, node) {
		this.Start(event, Number(node.getAttribute('data-index')), node.hasAttribute('data-stack') && this.Direction !== 'horizontal' ? Number(node.getAttribute('data-stack')) : null);
	},

	/* A new column beside a column: a group of its own, its Stack between the ones around it. */
	DropSide: function (event, node) {
		this.Start(event, null, Number(node.getAttribute('data-stack')));
	},

	/*
	 * A new group for the dropped tile, at position at (null: after the last group); out of one row (horizontal) in
	 * the stack stack names (a value between two stacks makes a new one there), the stacks numbered again from 0.
	 */
	Start: function (event, at, stack) {
		var created = null;
		var values;
		var groups;

		if (!this.Dragging || event.detail.Type !== 'tile' || this.GroupPolicy === 'none') return;

		groups = this.Arrange(this.Snapshot, event.detail.Data, null, 0, 0, at);

		if (!groups) return;

		if (this.Direction !== 'horizontal') {
			groups.forEach(function (group, index) {
				if (typeof group.Stack !== 'number')
					group.Stack = index;

				if (String(group.ID) === this.Created)
					created = group;
			}, this);

			if (created)
				created.Stack = stack === null || stack === undefined || isNaN(stack) ? groups.length : stack;

			values = groups.map(function (group) {
				return group.Stack;
			}).filter(function (value, index, list) {
				return list.indexOf(value) === index;
			}).sort(function (a, b) {
				return a - b;
			});

			groups.forEach(function (group) {
				group.Stack = values.indexOf(group.Stack);
			});
		}

		this.Groups = groups;
	},

	Unlisten: function () {
		(this.Listened || document).removeEventListener('pointerup', this.Released);
		(this.Listened || document).removeEventListener('pointercancel', this.Cancelled);
		(this.Listened || document).removeEventListener('keydown', this.Escaped, true);
	},

	/* The tile that a <Tile> declares; its content (moved into the tile once shown) is kept on the declaration. */
	Read: function (node) {
		var content = node.ElemenxContent || node.querySelector('.elemenx-tile-source-content');
		var tile = {Declared: true};
		var names = ['ID', 'Title', 'Icon', 'Size', 'Width', 'Height', 'Row', 'Column', 'Color', 'Badge', 'Text', 'Class'];

		node.ElemenxContent = content;

		names.forEach(function (name) {
			var value = node.getAttribute('data-' + name.toLowerCase());
			if (value === null) return;

			tile[name] = /^(Row|Column|Width|Height)$/.test(name) ? Number(value) : value;
		});

		tile.Locked = node.getAttribute('data-locked') === 'true';
		tile.Element = content && (content.textContent.trim() !== '' || content.querySelector('*')) ? content : null;

		return tile;
	},

	/* The declarations of the template as groups: [{ID, Title, Locked, Tiles}]. */
	Declarations: function () {
		var self = this;
		var sources = this.$Element().querySelector('.elemenx-tile-sources');
		var nodes = sources ? sources.querySelectorAll('.elemenx-tile-group-source') : [];

		return Array.prototype.map.call(nodes, function (node) {
			var tiles = Array.prototype.filter.call(node.querySelectorAll('.elemenx-tile-source'), function (tile) {
				return tile.closest('.elemenx-tile-group-source') === node;
			});

			var actions = node.ElemenxActions || node.querySelector('.elemenx-tile-group-source-actions');

			/* The actions of the slot actions: the header shows them (the node moves there, so it is kept). */
			node.ElemenxActions = actions;

			return {
				ID: node.getAttribute('data-id'),
				Title: node.getAttribute('data-title') || '',
				Locked: node.getAttribute('data-locked') === 'true',
				Columns: Number(node.getAttribute('data-columns')) || null,
				Rows: Number(node.getAttribute('data-rows')) || null,
				Stack: node.hasAttribute('data-stack') ? Number(node.getAttribute('data-stack')) : null,
				Element: actions && actions.querySelector('*') ? actions : null,
				Declared: true,
				Tiles: tiles.map(function (tile) {
					return self.Read(tile);
				})
			};
		});
	},

	/*
	 * Brings the declarations into Groups: declared props and content replace those of the tile with the same ID, the
	 * tile keeping its group and place; a new declared tile joins its group (made when missing); a tile or a group
	 * whose declaration is gone leaves. Waits for the end of a drag.
	 */
	Sync: function () {
		var declared = this.Declarations();
		var key = JSON.stringify(declared, function (name, value) {
			return name === 'Element' ? !!value : value;
		});
		var tiles = {};
		var placed = {};
		var groups;

		if (this.Dragging) {
			this.Pending = true;

			return;
		}

		if (key === this.Declared) return;

		this.Declared = key;

		declared.forEach(function (group) {
			group.Tiles.forEach(function (tile) {
				tiles[String(tile.ID)] = {Tile: tile, Group: group};
			});
		});

		function merge (tile, source) {
			var copy = {};
			var name;

			for (name in tile) {
				if (Object.prototype.hasOwnProperty.call(tile, name))
					copy[name] = tile[name];
			}

			for (name in source) {
				if (Object.prototype.hasOwnProperty.call(source, name) && (name !== 'Row' && name !== 'Column' || copy[name] == null))
					copy[name] = source[name];
			}

			return copy;
		}

		groups = (this.Groups || []).map(function (group) {
			var copy = {};
			var name;
			var own = declared.filter(function (entry) {
				return String(entry.ID) === String(group.ID);
			})[0];

			for (name in group) {
				if (Object.prototype.hasOwnProperty.call(group, name))
					copy[name] = group[name];
			}

			if (own) {
				copy.Title = own.Title;
				copy.Locked = own.Locked;

				if (own.Element)
					copy.Element = own.Element;

				if (copy.Columns == null)
					copy.Columns = own.Columns;

				if (copy.Rows == null)
					copy.Rows = own.Rows;

				if (typeof copy.Stack !== 'number' && typeof own.Stack === 'number')
					copy.Stack = own.Stack;

				copy.Declared = true;
			}

			copy.Tiles = group.Tiles.filter(function (tile) {
				return !tile.Declared || tiles[String(tile.ID)];
			}).map(function (tile) {
				var found = tiles[String(tile.ID)];

				placed[String(tile.ID)] = true;

				return found ? merge(tile, found.Tile) : tile;
			});

			return copy;
		}).filter(function (group) {
			return !group.Declared || group.Tiles.length || declared.some(function (entry) {
				return String(entry.ID) === String(group.ID);
			});
		});

		declared.forEach(function (entry) {
			var target = groups.filter(function (group) {
				return String(group.ID) === String(entry.ID);
			})[0];

			if (!target) {
				target = {ID: entry.ID, Title: entry.Title, Locked: entry.Locked, Columns: entry.Columns, Rows: entry.Rows, Element: entry.Element, Declared: true, Tiles: []};

				groups.push(target);
			}

			entry.Tiles.forEach(function (tile) {
				if (!placed[String(tile.ID)])
					target.Tiles = target.Tiles.concat([tile]);
			});
		});

		this.Groups = groups;
	},

	/* The places of the tiles and the sizes of the groups, to keep and to give back to Restore. */
	Arrangement: function () {
		return (this.Groups || []).map(function (group) {
			return {
				ID: group.ID,
				Title: group.Title || '',
				Columns: group.Columns || null,
				Rows: group.Rows || null,
				Stack: typeof group.Stack === 'number' ? group.Stack : null,
				Tiles: group.Tiles.map(function (tile) {
					var place = {ID: tile.ID, Row: tile.Row == null ? null : tile.Row, Column: tile.Column == null ? null : tile.Column, Size: tile.Size || 'medium'};

					if (tile.Width)
						place.Width = tile.Width;

					if (tile.Height)
						place.Height = tile.Height;

					return place;
				})
			};
		});
	},

	/*
	 * Brings back an arrangement: its groups in its order (a group it names that is gone comes back with its Title), each
	 * with the tiles it names at their places and sizes; the tiles and groups it does not name stay where they are.
	 */
	Restore: function (arrangement) {
		var tiles = {};
		var named = {};
		var groups;

		if (!Array.isArray(arrangement)) return;

		(this.Groups || []).forEach(function (group) {
			group.Tiles.forEach(function (tile) {
				tiles[String(tile.ID)] = tile;
			});
		});

		arrangement.forEach(function (group) {
			(group.Tiles || []).forEach(function (place) {
				if (tiles[String(place.ID)])
					named[String(place.ID)] = true;
			});
		});

		groups = arrangement.map(function (entry) {
			var own = (this.Groups || []).filter(function (group) {
				return String(group.ID) === String(entry.ID);
			})[0];
			var copy = {};
			var key;

			for (key in own || {}) {
				if (Object.prototype.hasOwnProperty.call(own, key))
					copy[key] = own[key];
			}

			copy.ID = entry.ID;
			copy.Title = own ? own.Title : entry.Title || '';
			copy.Columns = entry.Columns || null;
			copy.Rows = entry.Rows || null;

			if (typeof entry.Stack === 'number')
				copy.Stack = entry.Stack;

			copy.Tiles = (entry.Tiles || []).filter(function (place) {
				return !!tiles[String(place.ID)];
			}).map(function (place) {
				var tile = tiles[String(place.ID)];
				var moved = {};
				var name;

				for (name in tile) {
					if (Object.prototype.hasOwnProperty.call(tile, name))
						moved[name] = tile[name];
				}

				moved.Row = place.Row;
				moved.Column = place.Column;
				moved.Size = place.Size || tile.Size;
				moved.Width = place.Width || null;
				moved.Height = place.Height || null;

				return moved;
			}).concat(own ? own.Tiles.filter(function (tile) {
				return !named[String(tile.ID)];
			}) : []);

			return copy;
		}, this);

		(this.Groups || []).forEach(function (group) {
			if (arrangement.some(function (entry) {
				return String(entry.ID) === String(group.ID);
			})) return;

			group = Object.assign({}, group, {Tiles: group.Tiles.filter(function (tile) {
				return !named[String(tile.ID)];
			})});

			if (group.Tiles.length || !group.Declared)
				groups.push(group);
		});

		this.Groups = groups.filter(function (group) {
			return group.Tiles.length || group.Declared || arrangement.some(function (entry) {
				return String(entry.ID) === String(group.ID) && (entry.Tiles || []).length;
			});
		});
	},

	/* Persist: the arrangement from the storage of the browser, and into it. */
	Load: function () {
		var text;

		if (!this.Persist) return;

		try {
			text = window.localStorage.getItem('elemenx-tile-grid:' + this.Persist);
		}
		catch (error) {
			text = null;
		}

		if (text) {
			/* A value of the storage that is no arrangement is left alone. */
			try {
				this.Restore(JSON.parse(text));
			}
			catch (error) {
				return;
			}
		}
	},

	Save: function () {
		if (!this.Persist) return;

		try {
			window.localStorage.setItem('elemenx-tile-grid:' + this.Persist, JSON.stringify(this.Arrangement()));
		}
		catch (error) {
			return;
		}
	},

	/* Ends a drag: a cancel restores the groups, a drop removes the groups it emptied and reports the change. */
	End: function (cancel) {
		var snapshot = this.Snapshot;
		var created = this.Created;
		var empty = {};
		var groups;
		var group;

		this.Unlisten();

		this.EdgeStop();

		if (!this.Dragging) return;

		(snapshot || []).forEach(function (entry) {
			if (!entry.Tiles.length)
				empty[String(entry.ID)] = true;
		});

		groups = cancel ? snapshot : this.Groups.filter(function (entry) {
			return entry.Tiles.length || empty[String(entry.ID)];
		});

		if (!cancel)
			groups = this.Shrunk(groups, snapshot);

		this.StopGrowing();

		this.Dragging = '';
		this.Snapshot = null;
		this.Target = '';
		this.Created = '';
		this.Grown = null;
		this.Last = null;
		this.Groups = groups;

		if (this.Pending) {
			this.Pending = false;
			this.Declared = '';

			this.Sync();
		}

		if (cancel || this.Signature(groups) === this.Signature(snapshot)) return;

		group = groups.filter(function (entry) {
			return String(entry.ID) === created;
		})[0];

		if (group)
			this.$Emit('groupcreate', {Group: group, Tile: group.Tiles[0]});

		this.$Emit('change', groups);
	}
});
