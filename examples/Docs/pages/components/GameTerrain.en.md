<!-- generated -->
# GameTerrain

A kind of ground of the map of a GameScene, declared in it: Key (the character of the rows of a GameLayer), Name, Color, Cost (to enter a cell of it: 1 by default, Infinity blocks), Opaque (it hides what is behind it: a forest), Image (a picture of a tile). It shows nothing by itself: the scene reads it.

## Properties

| Property | Default |
| --- | --- |
| `Key` | `''` |
| `Name` | `''` |
| `Color` | `''` |
| `Cost` | `1` |
| `Opaque` | `false` |
| `Image` | `''` |

## Example

```example
<div style="height: 280px;">
	<GameScene Team="blue">
		<GameTerrain Key="o" Name="Lava" Color="#d8453c" Cost="Infinity" />
		<GameTerrain Key="m" Name="Mud" Color="#6b4f2a" Cost="4" />
		<GameLayer [rows]="Rows" />
		<GameObject Kind="unit" ID="scout" X="1" Y="1" Team="blue" Type="scout" />
	</GameScene>
</div>
<p class="elemenx-text small muted">The lava blocks the way, the mud costs four times the grass: send the scout across (a click, then a right click).</p>
<script>
({
	Rows: [
		'..........',
		'...ooo....',
		'...ooo....',
		'..mmmmm...',
		'..mmmmm...',
		'..........'
	]
})
</script>
```

## Tests

- [GameScene: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L102) — `tests/regression/game-world.test.js`
