/*
 * Groups of tiles on a grid of 48px cells, like a start screen. Groups: [{ID, Title, Tiles}], where a tile is
 * {ID, Title, Icon, Size (small 1x1, medium 2x2, wide 4x2, large 4x4), Color, Badge, Text}.
 * Events: open (the tile, on click or Enter). Editable lets the user move tiles by dragging: the other tiles make
 * room while the tile is dragged, as the grid will look after the drop. A tile dropped beside the groups starts a new
 * group (NewGroupTitle); a group left empty by a drag goes away. The change event then carries the new Groups;
 * Escape puts everything back.
 */
Elemenx.Component('TileGrid', {
	$TemplateURL: 'TileGrid.html',
	$StyleURL: 'TileGrid.css',
	Groups: [],
	Editable: false,
	NewGroupTitle: 'New group',
	Dragging: '',
	Snapshot: null,
	Sequence: 0,

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
	},

	$OnDestroy: function () {
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

	Open: function (event, node) {
		var found = this.Find(node.getAttribute('data-id'));
		if (found)
			this.$Emit('open', found.Tile);
	},

	Key: function (event, node) {
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();

		this.Open(event, node);
	},

	/* The order of every group and tile, to tell whether a drag changed anything. */
	Signature: function (groups) {
		return (groups || []).map(function (group) {
			return group.ID + ':' + group.Tiles.map(function (tile) {
				return tile.ID;
			}).join(',');
		}).join('|');
	},

	/* Puts the tile id at index of the group with the ID group (a new group when group is null). */
	Place: function (id, group, index) {
		var from = this.Find(id);
		var groups;
		var target;
		var tile;

		if (!from) return;

		groups = this.Groups.map(function (entry) {
			return {ID: entry.ID, Title: entry.Title, Tiles: entry.Tiles.slice()};
		});

		if (group === null) {
			this.Sequence++;

			groups.push({ID: 'group-' + Date.now() + '-' + this.Sequence, Title: this.NewGroupTitle, Tiles: []});

			target = groups.length - 1;
		}
		else {
			target = groups.map(function (entry) {
				return String(entry.ID);
			}).indexOf(String(group));
		}

		if (target === -1) return;

		if (index < 0 || index > groups[target].Tiles.length - (target === from.Group ? 1 : 0))
			index = groups[target].Tiles.length - (target === from.Group ? 1 : 0);

		if (target === from.Group && index === from.Index) return;

		tile = groups[from.Group].Tiles.splice(from.Index, 1)[0];

		groups[target].Tiles.splice(index, 0, tile);

		this.Groups = groups;
	},

	Begin: function (event, node) {
		if (this.Dragging) return;

		this.Dragging = String(node.getAttribute('data-id'));
		this.Snapshot = this.Groups;

		document.addEventListener('pointerup', this.Released);
		document.addEventListener('pointercancel', this.Cancelled);
		document.addEventListener('keydown', this.Escaped, true);
	},

	/* While a tile is dragged over a group, it takes its place there at once; the drop keeps the last place. */
	Preview: function (event, node) {
		if (!this.Dragging || event.detail.Type !== 'tile') return;

		this.Place(event.detail.Data, node.getAttribute('data-group'), event.detail.Index);
	},

	DropOnNew: function (event) {
		if (!this.Dragging || event.detail.Type !== 'tile') return;

		this.Place(event.detail.Data, null, 0);
	},

	Unlisten: function () {
		document.removeEventListener('pointerup', this.Released);
		document.removeEventListener('pointercancel', this.Cancelled);
		document.removeEventListener('keydown', this.Escaped, true);
	},

	/* Ends a drag: a cancel restores the groups, a drop removes the groups it emptied and reports the change. */
	End: function (cancel) {
		var snapshot = this.Snapshot;
		var empty = {};
		var groups;

		this.Unlisten();

		if (!this.Dragging) return;

		(snapshot || []).forEach(function (group) {
			if (!group.Tiles.length)
				empty[String(group.ID)] = true;
		});

		groups = cancel ? snapshot : this.Groups.filter(function (group) {
			return group.Tiles.length || empty[String(group.ID)];
		});

		this.Dragging = '';
		this.Snapshot = null;
		this.Groups = groups;

		if (!cancel && this.Signature(groups) !== this.Signature(snapshot))
			this.$Emit('change', groups);
	}
});
