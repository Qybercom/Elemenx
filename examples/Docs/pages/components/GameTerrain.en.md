<!-- generated -->
# GameTerrain

A kind of ground of a GameWorld, declared in it: Key (the character of the rows of a GameLayer), Name, Color, Cost (to enter a cell of it: 1 by default, Infinity blocks), Opaque (it hides what is behind it: a forest), Image (a picture of a tile). It shows nothing by itself: the world reads it.

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
	<GameWorld Team="blue">
		<GameTerrain Key="o" Name="Lava" Color="#d8453c" Cost="Infinity" />
		<GameTerrain Key="m" Name="Mud" Color="#6b4f2a" Cost="4" />
		<GameLayer [rows]="Rows" />
		<GameUnit ID="scout" X="1" Y="1" Team="blue" Type="scout" />
	</GameWorld>
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
