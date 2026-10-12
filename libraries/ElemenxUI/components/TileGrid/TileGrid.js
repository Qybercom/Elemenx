/*
 * Groups of tiles on a grid of 48px cells, like a start screen.
 * Groups: [{ID, Title, Tiles, Locked, Actions, Element, Render}]. A group header shows Actions ([{ID, Icon, Label,
 * Title, Run}], buttons that emit groupaction with {Group, Action} and call Run(group)) and custom content: Element
 * (a DOM node) or Render(container, group). A Locked group keeps its tiles and takes no others.
 * A tile is {ID, Title, Icon, Size (small 1x1, medium 2x2, wide 4x2, large 4x4), Row, Column, Color, Badge, Text,
 * Class, Locked, Element, Render}. Row and Column place the tile on the cells of its group (from 0); a tile without
 * them takes the first free place. Element or Render(container, tile) replace the icon and the text with custom
 * content, Class adds classes, Locked keeps the tile in its place. Columns is the width of a group in cells; a group
 * may have its own Columns, and while Editable the handle on its right edge stretches it (pointer or arrow keys,
 * whole columns, from its widest tile up to MaxColumns), reported by change.
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
	Groups: [],
	Editable: false,
	Columns: 4,
	MaxColumns: 12,
	Resizing: null,
	GroupPolicy: 'end',
	NewGroupTitle: 'New group',
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
			if (event.key === 'Escape')
				self.End(true);
		};

		/* The width of a group in cells: its own Columns, or the Columns of the grid. */
		this.ColumnsOf = function (group) {
			return Number(group && group.Columns) || Number(self.Columns) || 4;
		};

		/* The grid-area of a tile: its place in the layout of its group. */
		this.Area = function (group, tile) {
			var spot = self.Layout(group.Tiles, self.ColumnsOf(group)).filter(function (entry) {
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
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();

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
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();

		this.Open(event, node);
	},

	Act: function (event, node) {
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
		var span = {small: [1, 1], medium: [2, 2], wide: [4, 2], large: [4, 4]}[tile.Size || 'medium'] || [2, 2];

		return [Math.min(span[0], columns || 4), span[1]];
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

			created = {ID: 'group-' + Date.now() + '-' + this.Sequence, Title: this.NewGroupTitle, Tiles: []};
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

		columns = Math.max(this.Narrowest(group), Math.min(Number(this.MaxColumns) || 12, columns));

		if (columns === this.ColumnsOf(group)) return null;

		for (key in group) {
			if (Object.prototype.hasOwnProperty.call(group, key))
				copy[key] = group[key];
		}

		copy.Columns = columns;

		/* The tiles keep their places where they still fit; the others take the first free ones. */
		copy.Tiles = this.Layout(group.Tiles, columns).map(function (spot) {
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

		this.Resizing = {ID: String(group.ID), X: event.clientX, Columns: this.ColumnsOf(group), Snapshot: this.Groups};
	},

	ResizeMove: function (event) {
		var resizing = this.Resizing;
		var groups;

		if (!resizing) return;

		groups = this.Widened(resizing.Snapshot, resizing.ID, resizing.Columns + Math.round((event.clientX - resizing.X) / 56));

		this.Groups = groups || resizing.Snapshot;
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
		var step = {ArrowRight: 1, ArrowLeft: -1}[event.key];
		var groups;

		if (!group || !step) return;

		event.preventDefault();

		groups = this.Widened(this.Groups, group.ID, this.ColumnsOf(group) + step);

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

		document.addEventListener('pointerup', this.Released);
		document.addEventListener('pointercancel', this.Cancelled);
		document.addEventListener('keydown', this.Escaped, true);
	},

	/*
	 * While a tile is dragged over a group, it takes the cell under the top left corner of its ghost there at once,
	 * worked out from the groups as they were before the drag, so the tiles it pushed come back when it moves on.
	 */
	Preview: function (event, node) {
		var detail = event.detail;
		var found;
		var cells;
		var rect;
		var row;
		var column;
		var key;
		var groups;

		if (!this.Dragging || detail.Type !== 'tile') return;

		found = this.Find(detail.Data);
		cells = node.querySelector('.elemenx-tile-cells');

		if (!found || !cells) return;

		rect = cells.getBoundingClientRect();
		row = Math.round((detail.ClientY - detail.OffsetY - rect.top) / 56);
		column = Math.round((detail.ClientX - detail.OffsetX - rect.left) / 56);
		key = node.getAttribute('data-group') + ':' + row + ':' + column;

		if (key === this.Target) return;

		groups = this.Arrange(this.Snapshot, detail.Data, node.getAttribute('data-group'), row, column, null);

		if (!groups) return;

		this.Target = key;
		this.Groups = groups;
	},

	/* A tile that leaves the group it is shown in goes back to its place, until a group takes it again. */
	Leave: function (event, node) {
		if (!this.Dragging || this.Target.indexOf(node.getAttribute('data-group') + ':') !== 0) return;

		this.Target = '';
		this.Groups = this.Snapshot;
	},

	/*
	 * Over the grid but outside the groups (below the last row of a group, or between groups), the tile goes to the
	 * group whose column the pointer is in, so a tile can be put under the lowest tile of a group.
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
		this.Start(event, Number(node.getAttribute('data-index')));
	},

	/* A new group for the dropped tile, at position at (null: after the last group). */
	Start: function (event, at) {
		var groups;

		if (!this.Dragging || event.detail.Type !== 'tile' || this.GroupPolicy === 'none') return;

		groups = this.Arrange(this.Snapshot, event.detail.Data, null, 0, 0, at);

		if (groups)
			this.Groups = groups;
	},

	Unlisten: function () {
		document.removeEventListener('pointerup', this.Released);
		document.removeEventListener('pointercancel', this.Cancelled);
		document.removeEventListener('keydown', this.Escaped, true);
	},

	/* The tile that a <Tile> declares; its content (moved into the tile once shown) is kept on the declaration. */
	Read: function (node) {
		var content = node.ElemenxContent || node.querySelector('.elemenx-tile-source-content');
		var tile = {Declared: true};
		var names = ['ID', 'Title', 'Icon', 'Size', 'Row', 'Column', 'Color', 'Badge', 'Text', 'Class'];

		node.ElemenxContent = content;

		names.forEach(function (name) {
			var value = node.getAttribute('data-' + name.toLowerCase());
			if (value === null) return;

			tile[name] = name === 'Row' || name === 'Column' ? Number(value) : value;
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

			return {
				ID: node.getAttribute('data-id'),
				Title: node.getAttribute('data-title') || '',
				Locked: node.getAttribute('data-locked') === 'true',
				Columns: Number(node.getAttribute('data-columns')) || null,
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

				if (copy.Columns == null)
					copy.Columns = own.Columns;

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
				target = {ID: entry.ID, Title: entry.Title, Locked: entry.Locked, Columns: entry.Columns, Declared: true, Tiles: []};

				groups.push(target);
			}

			entry.Tiles.forEach(function (tile) {
				if (!placed[String(tile.ID)])
					target.Tiles = target.Tiles.concat([tile]);
			});
		});

		this.Groups = groups;
	},

	/* Ends a drag: a cancel restores the groups, a drop removes the groups it emptied and reports the change. */
	End: function (cancel) {
		var snapshot = this.Snapshot;
		var created = this.Created;
		var empty = {};
		var groups;
		var group;

		this.Unlisten();

		if (!this.Dragging) return;

		(snapshot || []).forEach(function (entry) {
			if (!entry.Tiles.length)
				empty[String(entry.ID)] = true;
		});

		groups = cancel ? snapshot : this.Groups.filter(function (entry) {
			return entry.Tiles.length || empty[String(entry.ID)];
		});

		this.Dragging = '';
		this.Snapshot = null;
		this.Target = '';
		this.Created = '';
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
