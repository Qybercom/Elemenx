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

`view`, `select`, `order`, `arrive`, `cell`, `load`, `error`, `ready`

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
