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

`view`, `select`, `order`, `arrive`, `cell`, `load`, `error`, `ready`

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
