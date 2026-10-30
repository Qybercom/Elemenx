<!-- generated -->
# Biomes

The lands of a game: what a ground looks like and what grows on it, and the places people made on it.

- Names(), Has(name), Get(name), Define(name, biome): a biome is {Ground: {Sand, Low, High, Rock, Snow, Deep, Road} ([r, g, b], 0 to 1, each by what it is the color of; the others stay the ones of the ground), Scatter: [rules of the trait Scatter], Grass: {rule of the trait Grass, or null}}. temperate, taiga, tundra, desert, savanna, swamp, alien.
- Village(field, {X, Y, Houses, Radius, Seed, Shapes}) lays out a village on a ground (Terrain.Flat): {Objects (specs for GameScene.Add), Roads ([[x, z]...], one way to each house and one out of it), Center}. It keeps to what is level and dry, and moves to the nearest such place when its own is not.

The same functions run in Node: they read no page.

## Methods

- `Names()`
- `Has(name)`
- `Get(name)`
- `Define(name, biome)`
- `Village(field, options)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var biomes = this.$Service('Biomes');
		var field = this.$Service('Terrain').Flat({Size: 400, Height: 30, Water: 0.3, Seed: 'docs'});
		var village = biomes.Village(field, {X: 20, Y: 20, Houses: 6, Seed: 'docs'});

		this.Text = 'Lands: ' + biomes.Names().join(', ') + '\n\nA village: ' + village.Objects.map(function (house) {
			return house.Kind + ' at ' + house.X + ', ' + house.Y;
		}).join('; ') + '\nRoads: ' + village.Roads.length;
	}
})
</script>
```

## Tests

- [lays out the same village of the same seed, on what is level and dry, moved there if it must](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1472) — `tests/regression/library-scene.test.js`
- [takes the lands of an application](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1505) — `tests/regression/library-scene.test.js`
- [makes a whole land of one attribute, and a village with its roads that nothing grows on](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1044) — `tests/regression/library-scene.test.js`
