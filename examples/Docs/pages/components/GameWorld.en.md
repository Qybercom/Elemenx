<!-- generated -->
# GameWorld

The world of a strategy game, seen from above (Projection orthogonal) or at an angle (isometric): a map of cells drawn on a canvas, its buildings, units and things, the selection of the units of the player, their orders and their ways round what blocks them, the fog of war.

The map: Map (its JSON, or the URL of a JSON of its own or of Tiled, .tmj: see the GameMaps Service), and what is declared inside it: GameTerrain (a kind of ground), GameLayer (rows of ground), GameBuilding, GameUnit and GameObject (a tree, a rock). Team is the team of the player: its units are selected (a click, Shift for more, a frame drawn with the mouse, a double click for all of their Type, Ctrl+A for all) and ordered (a right click, or a tap on a touch screen: they find their way, A*, and spread round the goal); Fog hides what they do not see, and keeps what was explored. The view moves as the one of Board (X, Y, Zoom, MinZoom, MaxZoom; the wheel zooms at the pointer, a drag with the middle button or with Space held moves it, so do the arrows; + and - zoom), Grid draws the lines of the cells, Minimap the whole map in a corner, Paused and Speed hold and hurry the time. The slot hud takes the HUD of the game over the world.

Events: ready (the world, for its methods), load ({Width, Height}), select ({IDs, Objects}), order ({Kind: move, attack or stop, IDs, X, Y, Target}), arrive ({ID, X, Y}), cell ({X, Y, Button, Object}: a press that is not a selection nor an order), view ({X, Y, Zoom}), error. Methods: Load(map, callback), Add(object), Change(id, changes), Remove(id), Get(id), Objects(filter), Select(ids), Selection(), Order(ids, target, kind), Stop(ids), Cell(x, y), Paint(x, y, key, layer), Near(x, y, radius, filter), Route(from, to), PathGrid(), FogOfWar(), CenterOn(x, y), ToCell(clientX, clientY), ToScreen(x, y).

## Properties

| Property | Default |
| --- | --- |
| `Map` | `null` |
| `Projection` | `''` |
| `Team` | `''` |
| `Fog` | `false` |
| `Grid` | `true` |
| `Minimap` | `false` |
| `X` | `null` |
| `Y` | `null` |
| `Zoom` | `1` |
| `MinZoom` | `0.25` |
| `MaxZoom` | `4` |
| `Paused` | `false` |
| `Speed` | `1` |
| `Label` | `''` |

## Events

- `view`: The view moved or zoomed: {X, Y, Zoom}.
- `select`: The selection changed: {IDs, Objects}.
- `order`: The selected units were ordered: {Kind (move, attack or stop), IDs, X, Y, Target}.
- `arrive`: A unit reached the end of its way: {ID, X, Y}.
- `cell`: A cell was pressed: {X, Y, Button, Object}, the object on it or null.
- `load`: The map was loaded: {Width, Height} in cells.
- `error`: The map could not be loaded: the error.
- `ready`: The world is ready: the component itself, to call its methods.

## Slots

`hud`, default

## Methods

- `Load(map, callback)`
- `Add(object)`
- `Change(id, changes)`
- `Remove(id)`
- `Get(id)`
- `Objects(filter)`
- `Select(ids)`
- `Selection()`
- `Order(ids, target, kind)`
- `Stop(ids)`
- `Cell(x, y)`
- `Paint(x, y, key, layer)`
- `Near(x, y, radius, filter)`
- `Route(from, to)`
- `PathGrid()`
- `FogOfWar()`
- `CenterOn(x, y)`
- `ToCell(clientX, clientY)`
- `ToScreen(x, y)`

## Example

```example
<div style="height: 360px;">
	<GameWorld Team="blue" Minimap="true" [fog]="Fog" (select)="Selected" (order)="Ordered" (arrive)="Arrived">
		<GameLayer Name="ground" [rows]="Rows" />
		<GameBuilding ID="keep" X="2" Y="4" Width="3" Height="2" Team="blue" Type="keep" />
		<GameUnit *for="unit of Units" [id]="unit.ID" [x]="unit.X" [y]="unit.Y" [team]="unit.Team" [type]="unit.Type" />
		<GameObject ID="oak" Kind="tree" X="7" Y="1" Blocks="true" Opaque="true" />
	</GameWorld>
</div>
<Toggle Label="Fog of war" [checked]="Fog" (change)="Fogged" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Select the blue units (a click, or a frame), then a right click sends them there.',
	Fog: false,
	Rows: [
		'TTT.........~~......',
		'TT..........~~......',
		'T...........=~......',
		'............~~..^^..',
		'.....__________..^^.',
		'.....____.....~~....',
		'............:~~:....',
		'...##.......:~~:....',
		'...##........~~.....',
		'.............~~.....'
	],
	Units: [
		{ID: 'archer-1', X: 6, Y: 5, Team: 'blue', Type: 'archer'},
		{ID: 'archer-2', X: 7, Y: 6, Team: 'blue', Type: 'archer'},
		{ID: 'raider', X: 17, Y: 8, Team: 'red', Type: 'raider'}
	],

	Fogged: function (checked) {
		this.Fog = checked;
	},

	Selected: function (event) {
		this.Note = 'Selected: ' + (event.IDs.join(', ') || 'none');
	},

	Ordered: function (event) {
		this.Note = event.Kind + ' to ' + event.X + ', ' + event.Y + ': ' + event.IDs.join(', ');
	},

	Arrived: function (event) {
		this.Note = event.ID + ' arrived at ' + event.X + ', ' + event.Y;
	}
})
</script>
```

## Tests

- [GameMaps: its own JSON with rows of text, and a map of Tiled with its tiles, their properties and its objects](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L87) — `tests/regression/game-world.test.js`
- [GameWorld: sets no timer of no function while it is made (a page that forbids eval refuses one)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L116) — `tests/regression/game-world.test.js`
- [GameWorld: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L137) — `tests/regression/game-world.test.js`
- [GameWorld: a declaration changed moves its object, one taken away takes it away; a map by its URL loads](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L226) — `tests/regression/game-world.test.js`
