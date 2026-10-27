<!-- generated -->
# GameLayer

Слой земли GameWorld, объявленный в нём: строки текста внутри него (символ — вид GameTerrain или из тех, что знает GameMaps: . трава, ~ вода, = брод, : песок, ^ холмы, T лес, # скала, _ дорога; пробел оставляет клетку нижним слоям) или Rows. Name — его имя. Сам по себе ничего не показывает.

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
	<GameWorld>
		<GameLayer Name="ground" [rows]="Ground" />
		<GameLayer Name="roads" [rows]="Roads" />
	</GameWorld>
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
