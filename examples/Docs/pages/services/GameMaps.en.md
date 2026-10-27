<!-- generated -->
# GameMaps

The maps of GameWorld: its own JSON, or a map of Tiled (.tmj), made into one form.

- Normalize(map) returns the map GameWorld draws: {Width, Height, Projection (orthogonal or isometric), TileWidth, TileHeight, Terrain: {key: {Name, Color, Cost, Opaque, Image, SourceX, SourceY, SourceWidth, SourceHeight}}, Layers: [{Name, Cells (Width * Height keys of Terrain, null where empty)}], Objects: [{ID, Kind, X, Y, Width, Height, Team, ...}]}. A layer of the JSON gives Rows (lines of text, a character a key of Terrain: '.' grass, '~' water...) or Data (the keys, row by row).
- FromTiled(data, base) reads a map of Tiled: its tile layers (each tile a key of Terrain, drawn with the picture of its tileset; the properties cost and opaque of a tile, Color for a picture missing), its object layers (the class or type of an object its Kind: unit, building or anything else, its properties its fields) and its orientation. base: the URL the pictures of the tilesets are relative to.
- Load(url, callback): fetches a map (JSON of its own or of Tiled) and calls back (error, map).

Positions are in cells: X across, Y down (on an isometric map, along its two edges).

## Methods

- `Normalize(map)`
- `FromTiled(data, base)`
- `Load(url, callback)`

## Example

```example
<div style="height: 260px;">
	<GameWorld [map]="Map" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	/* A map of its own JSON: its terrain, its rows of text and its objects. GameMaps.Load reads one from a URL, of Tiled too (.tmj). */
	Map: {
		Width: 12,
		Height: 6,
		Terrain: {o: {Name: 'lava', Color: '#d8453c', Cost: 'Infinity'}},
		Layers: [{Name: 'ground', Rows: [
			'....~~......',
			'....~~..oo..',
			'....==..oo..',
			'....~~......',
			'..^^~~....TT',
			'....~~....TT'
		]}],
		Objects: [
			{ID: 'hut', Kind: 'building', X: 1, Y: 1, Width: 2, Height: 2, Team: 'blue'},
			{ID: 'scout', Kind: 'unit', X: 2, Y: 4, Team: 'blue'}
		]
	},

	$OnCreate: function () {
		var map = this.$Service('GameMaps').Normalize(this.Map);

		this.Note = map.Width + ' by ' + map.Height + ' cells, ' + Object.keys(map.Terrain).length + ' kinds of ground, ' + map.Objects.length + ' objects.';
	}
})
</script>
```
