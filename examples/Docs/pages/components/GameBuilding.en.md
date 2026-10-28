<!-- generated -->
# GameBuilding

A building of a GameWorld, declared in it: ID, X and Y (its first cell), Width and Height (the cells it takes, 2 by 2 by default; no way through them), Team, Type (barracks), Name, Color (its walls), Roof (the color of its roof, of its team by default), Tall (its walls, in heights of a tile), Image (a picture standing on its footprint), Health and MaxHealth, Sight. It shows nothing by itself: the world draws it.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `X` | `0` |
| `Y` | `0` |
| `Width` | `2` |
| `Height` | `2` |
| `Team` | `''` |
| `Type` | `''` |
| `Name` | `''` |
| `Color` | `''` |
| `Roof` | `''` |
| `Tall` | `1` |
| `Image` | `''` |
| `Health` | `null` |
| `MaxHealth` | `null` |
| `Sight` | `4` |

## Example

```example
<div style="height: 280px;">
	<GameWorld Team="blue">
		<GameLayer [rows]="Rows" />
		<GameBuilding ID="hall" X="1" Y="1" Width="3" Height="2" Team="blue" Type="hall" Name="Town hall" Tall="2" Health="400" MaxHealth="500" />
		<GameBuilding ID="tower" X="8" Y="2" Team="red" Type="tower" Roof="#3a2e1f" />
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
	]
})
</script>
```

## Tests

- [GameWorld: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L137) — `tests/regression/game-world.test.js`
