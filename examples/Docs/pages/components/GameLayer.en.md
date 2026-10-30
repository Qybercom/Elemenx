<!-- generated -->
# GameLayer

A layer of the ground of the map of a GameScene, declared in it: its rows of text inside it (a character a kind of GameTerrain, or of the ones GameMaps knows: . grass, ~ water, = ford, : sand, ^ hills, T forest, # rock, _ road; a space leaves the cell to the layers under it), or Rows. Name names it. It shows nothing by itself.

## Properties

| Property | Default |
| --- | --- |
| `Name` | `''` |
| `Rows` | `[]` |

## Slots

default

## Example

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

## Tests

- [GameScene: sets no timer of no function while it is made (a page that forbids eval refuses one)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L81) — `tests/regression/game-world.test.js`
- [GameScene: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L102) — `tests/regression/game-world.test.js`
- [draws a map of cells: its objects with their models, in the places of their cells, by the API of every scene](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L691) — `tests/regression/library-scene.test.js`
