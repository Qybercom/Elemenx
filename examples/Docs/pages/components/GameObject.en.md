<!-- generated -->
# GameObject

A thing of a GameWorld, declared in it: a tree, a rock, a resource, a flag. ID, Kind (tree, rock, or a name of your own), X and Y, Width and Height (1 by 1), Color, Image (a picture standing on its cell), Blocks (no way through it), Opaque (it hides what is behind it), Name. It shows nothing by itself: the world draws it.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Kind` | `'tree'` |
| `X` | `0` |
| `Y` | `0` |
| `Width` | `1` |
| `Height` | `1` |
| `Name` | `''` |
| `Color` | `''` |
| `Image` | `''` |
| `Blocks` | `false` |
| `Opaque` | `false` |

## Example

```example
<div style="height: 280px;">
	<GameWorld Team="blue">
		<GameLayer [rows]="Rows" />
		<GameObject *for="tree of Trees" Kind="tree" [id]="tree.ID" [x]="tree.X" [y]="tree.Y" Blocks="true" Opaque="true" />
		<GameObject ID="stone" Kind="rock" X="6" Y="3" Blocks="true" />
		<GameObject ID="gold" Kind="gold" X="9" Y="1" Color="#e0b33c" Name="Gold mine" />
		<GameUnit ID="worker" X="0" Y="4" Team="blue" Type="worker" />
	</GameWorld>
</div>
<script>
({
	Rows: [
		'............',
		'............',
		'............',
		'............',
		'............'
	],
	Trees: [{ID: 't1', X: 3, Y: 1}, {ID: 't2', X: 4, Y: 1}, {ID: 't3', X: 3, Y: 2}, {ID: 't4', X: 4, Y: 3}]
})
</script>
```

## Tests

- [GameWorld: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L137) — `tests/regression/game-world.test.js`
