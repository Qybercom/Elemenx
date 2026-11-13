<!-- generated -->
# SceneBiomes

Земли игры: Names(), Has(name), Get(name), Define(name, {Ground, Scatter, Grass}) — temperate, taiga, tundra, desert, savanna, swamp, alien, rainforest, semidesert и steppe; Village(field, {X, Y, Houses, Radius, Seed, Shapes}) выкладывает дома и дороги на ровном и сухом месте. Работает и в Node.

У биомов есть Climate — где они лежат на земле с биомами по климату (Biomes у SceneTerrainGenerator.Flat): {Height, Moisture, Temperature} или список таких конвертов. Встроенные temperate, taiga, tundra, desert, savanna и swamp вместе покрывают весь климат без пробелов; у alien конверта нет. Биом с Over (список имён) занимает место этих биомов там, где лежит сам: их вес уменьшается на его вес. Так rainforest (тепло и влажность от 0,6: тёмный густой тропический лес) встаёт на место swamp, temperate и savanna, semidesert (тепло, влажность 0,15–0,33: светлая пятнистая земля, кусты и камни) — на место desert и savanna, steppe (умеренное тепло, влажность до 0,3: травянистая равнина) — на место temperate. Без них в списке прежняя шестёрка лежит как раньше; все девять — список биомов планеты по умолчанию.

Check(list, field) проверяет, как биомы покрывают землю и её высоты: range — пустой диапазон; gap — полоса высот, где для какого-то климата нет биома (Heights, Moisture, Temperature этого пробела); unreachable — биом, чьих высот на земле нет; unused — биом, которого на земле нет совсем; uncovered — доля земли без биома. Возвращает {Problems, Share (доля земли каждого биома), Gap, Heights (диапазон высот, где биом есть)}. Без field проверяется только климат по полосам высот.

У палитры биома может быть Materials — из какого материала SceneMaterials сделана каждая её часть (Sand, Low, High, Rock, Snow, Deep, Road). Встроенные: taiga — почва с мхом и гравий, tundra — снег и гравий, desert — песок, savanna — глина на возвышенностях, swamp — почва и глина; temperate — материалы земли по умолчанию (газон, почва, скала, песок).

## Методы

- `Names()`
- `Has(name)`
- `Get(name)`
- `Define(name, biome)`
- `Check(list, field)`
- `Village(field, options)`

## Пример

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

## Тесты

- [reads the lands of their resources, in their order](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L962) — `tests/regression/blueprints.test.js`
- [makes the provider only as a name of it is wanted, in the Application that wants it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-provides.test.js#L47) — `tests/regression/library-provides.test.js`
- [makes the providers for a list, and none for a name no one declares](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-provides.test.js#L62) — `tests/regression/library-provides.test.js`
- [makes a whole land of one biome of its World, and a village with its roads that nothing grows on](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9504) — `tests/regression/library-scene.test.js`
- [lays out the same village of the same seed, on what is level and dry, moved there if it must](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10508) — `tests/regression/library-scene.test.js`
- [takes the lands of an application](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10541) — `tests/regression/library-scene.test.js`
- [lays a rainforest, a semidesert and a steppe in place of others where they hold, the usual six as they were](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L513) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
- [tells where lands by their climate leave heights and climates of a ground bare, and lands it never has](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L529) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
