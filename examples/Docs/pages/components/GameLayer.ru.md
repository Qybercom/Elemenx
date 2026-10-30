<!-- generated -->
# GameLayer

Слой земли GameScene, объявленный в нём: строки текста внутри него (символ — вид GameTerrain или из тех, что знает GameMaps: . трава, ~ вода, = брод, : песок, ^ холмы, T лес, # скала, _ дорога; пробел оставляет клетку нижним слоям) или Rows. Name — его имя. Сам по себе ничего не показывает.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Rows` | `[]` |

## Слоты

по умолчанию

## Пример

```example
<div style="height: 280px;">
	<GameScene>
		<GameLayer Name="ground" [rows]="Ground" />
		<GameLayer Name="roads" [rows]="Roads" />
	</GameScene>
</div>
<p class="elemenx-text small muted">Two layers: the road over the ground; a space leaves a cell to the layer under it.</p>
<script>
({
	Ground: [
		'............',
		'.....~~.....',
		'.....~~..^^.',
		'.....~~.....',
		'............'
	],
	Roads: [
		'            ',
		'            ',
		'____==______',
		'            ',
		'            '
	]
})
</script>
```

## Тесты

- [GameScene: sets no timer of no function while it is made (a page that forbids eval refuses one)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L81) — `tests/regression/game-world.test.js`
- [GameScene: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L102) — `tests/regression/game-world.test.js`
- [draws a map of cells: its objects with their models, in the places of their cells, by the API of every scene](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L691) — `tests/regression/library-scene.test.js`
