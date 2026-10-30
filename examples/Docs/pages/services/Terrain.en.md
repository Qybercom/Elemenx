<!-- generated -->
# Terrain

The ground of a game, continuous: heights of noise anywhere (no cells), its meshes in chunks, and ways over it.

- Flat(options) returns a field of a flat map: options Size (of the map, 1000), Height (of its highest hills, 60), Water (the level of the sea, 0 to 1, 0.35), Scale (the size of its hills, 180), Ridges (0 to 1: how much of it is folded into mountains, 0.4), Seed; it has Size, Top (its Height) and Water. Its methods: Height(x, z) (the height of the ground; below 0 under the sea), Normal(x, z), Slope(x, z) (0 flat, 1 a wall), Walkable(x, z, options) (MaxSlope 0.45; Swim: the sea too; Blocked(x, z): true where a thing stands in the way), Chunk(x, z, size, resolution) (a geometry of a square of it, its positions relative to its middle, with Colors of its heights and slopes and a skirt under its edges so chunks of other sizes leave no gap) and Path(from, to, options) (a way of points {X, Y, Z} round what cannot be walked, made straight where it can be; null when there is none; options Step, the finest it looks, MaxSlope, Swim).
- Sphere(options) returns the ground of a planet, the very one its baked surface shows (the noise of Graphics3D, as the shader of a GameScene bakes it): options Radius (units), Height (its relief), Seed (the number of its pattern), Ocean (0 to 1), Type (rocky, desert, terran, ocean, ice, lava, dwarf, moon). Its methods: Land(direction) (the ground of the noise: below 0 the sea), Elevation(direction) (above the radius), Point(direction) (on the ground), Altitude(point) (above the ground under it), Patch(face, u, v, size, resolution) (a geometry of a square of a face of its cube, from u and v of -1 to 1, its positions relative to its Center, the land in UV.x, the sea in UV.y).
- Cells(options) returns the flat ground of a map of cells, a mesh of one piece: options Width, Height (in cells), Depth (the length of a cell along Z, 1), Color(x, y) ([r, g, b], 0 to 1, of a cell); it has the methods of Flat, and Whole and Center (the middle of the map: X from 0 to Width, Z from 0 to Height * Depth).

The same functions run in Node: they read no page.

## Methods

- `Flat(options)`
- `Cells(options)`
- `Sphere(options)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var terrain = this.$Service('Terrain');
		var field = terrain.Flat({Size: 400, Height: 40, Seed: 7});
		var way = field.Path({X: 20, Z: 20}, {X: 180, Z: 160});
		var planet = terrain.Sphere({Radius: 6371, Height: 8, Seed: 3, Ocean: 0.6, Type: 'terran'});

		this.Text = 'Height(100, 100): ' + field.Height(100, 100).toFixed(2) + ', Slope: ' + field.Slope(100, 100).toFixed(2) + ', Walkable: ' + field.Walkable(100, 100) + '\n\nPath: ' + (way ? way.length + ' points, ' + way.map(function (point) {
			return Math.round(point.X) + ',' + Math.round(point.Z);
		}).join(' → ') : 'none') + '\n\nSphere: Elevation at the pole ' + planet.Elevation([0, 1, 0]).toFixed(3) + ', at the equator ' + planet.Elevation([1, 0, 0]).toFixed(3);
	}
})
</script>
```

## Tests

- [has continuous heights, chunks with a skirt, and ways that keep out of the sea](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1524) — `tests/regression/library-scene.test.js`
- [has the ground of a planet whose coasts are the ones its baked surface shows, its squares turned outwards](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1558) — `tests/regression/library-scene.test.js`
- [terrain draws a ground with its trees and houses, its units walk to the village round what blocks them, and the game saves](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3239) — `tests/examples/ui-kit.spec.js`
