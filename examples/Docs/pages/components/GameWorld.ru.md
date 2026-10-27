<!-- generated -->
# GameWorld

Мир стратегии: карта клеток на canvas, сверху (Projection orthogonal) или под углом (isometric), её здания, юниты и вещи, выбор юнитов игрока, их приказы и пути в обход преград, туман войны. Карта — Map (её JSON или URL JSON своего формата или Tiled, .tmj: см. GameMaps) и то, что объявлено внутри: GameTerrain, GameLayer, GameBuilding, GameUnit и GameObject. Team — команда игрока: её юниты выбираются (клик, Shift — добавить, рамка мышью, двойной клик — все того же Type, Ctrl+A — все) и получают приказы (правый клик или касание: они находят путь, A*, и расходятся вокруг цели); Fog прячет то, чего они не видят, и оставляет разведанное. Вид — как у Board (X, Y, Zoom, MinZoom, MaxZoom; колесо — масштаб у указателя, средняя кнопка или Space — сдвиг, стрелки, + и -), Grid — линии клеток, Minimap — вся карта в углу, Paused и Speed — пауза и скорость времени. Слот hud — интерфейс игры поверх мира. События: ready (сам мир — для его методов), load ({Width, Height}), select ({IDs, Objects}), order ({Kind: move, attack или stop, IDs, X, Y, Target}), arrive ({ID, X, Y}), cell ({X, Y, Button, Object}), view, error. Методы: Load, Add, Change, Remove, Get, Objects, Select, Selection, Order, Stop, Cell, Paint, Near, Route, PathGrid, FogOfWar, CenterOn, ToCell, ToScreen.

## Свойства

| Свойство | По умолчанию |
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

## События

- `view`: Вид сдвинулся или изменил масштаб: {X, Y, Zoom}.
- `select`: Изменилось выделение: {IDs, Objects}.
- `order`: Выделенным юнитам отдан приказ: {Kind (move, attack или stop), IDs, X, Y, Target}.
- `arrive`: Юнит дошёл до конца пути: {ID, X, Y}.
- `cell`: Нажата клетка: {X, Y, Button, Object}, объект на ней или null.
- `load`: Карта загружена: {Width, Height} в клетках.
- `error`: Карту не удалось загрузить: ошибка.
- `ready`: Мир готов: сам компонент, чтобы вызывать его методы.

## Слоты

`hud`, по умолчанию

## Методы

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

## Пример

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
