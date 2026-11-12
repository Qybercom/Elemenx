<!-- generated -->
# SceneBiomes

The lands of a game: what a ground looks like and what grows on it, and the places people made on it.

- Names(), Has(name), Get(name), Define(name, biome): a biome is {Ground: {Sand, Low, High, Rock, Snow, Deep, Road} ([r, g, b], 0 to 1, each by what it is the color of; the others stay the ones of the ground; Materials: {the same parts: the material of SceneMaterials each is made of}), Scatter: [rules of the trait Scatter], Grass: {rule of the trait Grass, or null}, Climate: where it is on a ground of lands by their climate (Biomes of SceneTerrainGenerator.Flat): {Height, Moisture, Temperature}, or a list of them, each a range [from, to] (null: no end; Height in parts of the top of the ground, the others 0 to 1)}. temperate, taiga, tundra, desert, savanna, swamp (their climates hold every one, none twice), alien (none: it is a land of its own); data of the resources (resources/biomes, ElemenxGraphics/biomes/<name>): an Application gives one of that name in its place.
- Check(list, field): whether lands by their climate cover a ground and its heights as they should: the gaps of their climates in each band of heights, lands the ground never reaches, lands it never has, the part of it of no land.
- Village(field, {X, Y, Houses, Radius, Seed, Shapes}) lays out a village on a ground (SceneTerrainGenerator.Flat): {Objects (specs for Scene.Add), Roads ([[x, z]...], one way to each house and one out of it), Center}. It keeps to what is level and dry, and moves to the nearest such place when its own is not.

The same functions run in Node: they read no page.

## Methods

- `Names()`
- `Has(name)`
- `Get(name)`
- `Define(name, biome)`
- `Check(list, field)`
- `Village(field, options)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var biomes = this.$Service('SceneBiomes');
		var field = this.$Service('SceneTerrainGenerator').Flat({Size: 400, Height: 30, Water: 0.3, Seed: 'docs'});
		var village = biomes.Village(field, {X: 20, Y: 20, Houses: 6, Seed: 'docs'});

		this.Text = 'Lands: ' + biomes.Names().join(', ') + '\n\nA village: ' + village.Objects.map(function (house) {
			return house.Kind + ' at ' + house.X + ', ' + house.Y;
		}).join('; ') + '\nRoads: ' + village.Roads.length;
	}
})
</script>
```

## Tests

- [reads the lands of their resources, in their order](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L962) — `tests/regression/blueprints.test.js`
- [makes the provider only as a name of it is wanted, in the Application that wants it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-provides.test.js#L47) — `tests/regression/library-provides.test.js`
- [makes the providers for a list, and none for a name no one declares](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-provides.test.js#L62) — `tests/regression/library-provides.test.js`
- [makes a whole land of one biome of its World, and a village with its roads that nothing grows on](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9460) — `tests/regression/library-scene.test.js`
- [lays out the same village of the same seed, on what is level and dry, moved there if it must](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10464) — `tests/regression/library-scene.test.js`
- [takes the lands of an application](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10497) — `tests/regression/library-scene.test.js`
- [lays a rainforest, a semidesert and a steppe in place of others where they hold, the usual six as they were](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L513) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
- [tells where lands by their climate leave heights and climates of a ground bare, and lands it never has](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L529) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
