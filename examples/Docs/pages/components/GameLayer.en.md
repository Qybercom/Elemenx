<!-- generated -->
# GameLayer

A layer of the ground of a GameWorld, declared in it: its rows of text inside it (a character a kind of GameTerrain, or of the ones GameMaps knows: . grass, ~ water, = ford, : sand, ^ hills, T forest, # rock, _ road; a space leaves the cell to the layers under it), or Rows. Name names it. It shows nothing by itself.

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
