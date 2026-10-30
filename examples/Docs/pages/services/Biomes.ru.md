<!-- generated -->
# Biomes

Земли игры: Names(), Has(name), Get(name), Define(name, {Ground, Scatter, Grass}) — temperate, taiga, tundra, desert, savanna, swamp и alien; Village(field, {X, Y, Houses, Radius, Seed, Shapes}) выкладывает дома и дороги на ровном и сухом месте. Работает и в Node.

## Методы

- `Names()`
- `Has(name)`
- `Get(name)`
- `Define(name, biome)`
- `Village(field, options)`

## Пример

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

## Тесты

- [lays out the same village of the same seed, on what is level and dry, moved there if it must](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1472) — `tests/regression/library-scene.test.js`
- [takes the lands of an application](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1505) — `tests/regression/library-scene.test.js`
- [makes a whole land of one attribute, and a village with its roads that nothing grows on](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1044) — `tests/regression/library-scene.test.js`
