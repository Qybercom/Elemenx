<!-- generated -->
# GameUnit

A unit of a GameWorld, declared in it: ID, X and Y (the cell it stands on), Team (the one of the player is the Team of the world: it selects and orders it), Type (archer, worker: its kind in the game), Name, Color (of its team by default), Image (a picture of it, standing on its feet), Health and MaxHealth, Speed (cells a second), Sight (the cells it sees in the fog). It shows nothing by itself: the world draws it and moves it.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `X` | `0` |
| `Y` | `0` |
| `Team` | `''` |
| `Type` | `''` |
| `Name` | `''` |
| `Color` | `''` |
| `Image` | `''` |
| `Health` | `null` |
| `MaxHealth` | `null` |
| `Speed` | `2` |
| `Sight` | `5` |

## Example

```example
<div style="height: 280px;">
	<GameWorld Team="blue" (arrive)="Arrived">
		<GameLayer [rows]="Rows" />
		<GameUnit ID="knight" X="1" Y="2" Team="blue" Type="knight" Name="Sir Ada" Health="70" MaxHealth="100" Speed="3" />
		<GameUnit ID="worker" X="2" Y="3" Team="blue" Type="worker" />
		<GameUnit ID="raider" X="9" Y="1" Team="red" Type="raider" />
	</GameWorld>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Select a blue unit, then a right click sends it; on a red unit it attacks.',
	Rows: [
		'............',
		'............',
		'.....##.....',
		'.....##.....',
		'............'
	],

	Arrived: function (event) {
		this.Note = event.ID + ' arrived at ' + event.X + ', ' + event.Y;
	}
})
</script>
```
