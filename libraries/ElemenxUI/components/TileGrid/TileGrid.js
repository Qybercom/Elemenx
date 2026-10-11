/*
 * Groups of tiles on a grid of 48px cells, like a start screen. Groups: [{ID, Title, Tiles}], where a tile is
 * {ID, Title, Icon, Size (small 1x1, medium 2x2, wide 4x2, large 4x4), Color, Badge, Text}.
 * Events: open (the tile, on click or Enter). Editable lets the user move tiles by dragging them onto another tile
 * or onto a group; the change event then carries the new Groups.
 */
Elemenx.Component('TileGrid', {
	$TemplateURL: 'TileGrid.html',
	$StyleURL: 'TileGrid.css',
	Groups: [],
	Editable: false,

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

	/* Moves a tile before another one (onto a tile) or to the end of a group (onto the group). */
	Move: function (id, group, before) {
		var groups = this.Groups.map(function (entry) {
			return {ID: entry.ID, Title: entry.Title, Tiles: entry.Tiles.slice()};
		});
		var from = this.Find(id);
		var target = groups.map(function (entry) {
			return String(entry.ID);
		}).indexOf(String(group));
		var tile;
		var index;

		if (!from || target === -1 || String(before) === String(id)) return;

		group = target;

		tile = groups[from.Group].Tiles.splice(from.Index, 1)[0];
		index = before ? groups[group].Tiles.map(function (entry) {
			return String(entry.ID);
		}).indexOf(String(before)) : -1;

		if (index === -1) groups[group].Tiles.push(tile);
		else groups[group].Tiles.splice(index, 0, tile);

		this.Groups = groups;

		this.$Emit('change', groups);
	},

	DropOnTile: function (event, node) {
		event.stopPropagation();

		this.Move(event.detail.Data, node.getAttribute('data-group'), node.getAttribute('data-id'));
	},

	DropOnGroup: function (event, node) {
		this.Move(event.detail.Data, node.getAttribute('data-group'), null);
	}
});