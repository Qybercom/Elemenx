<!-- generated -->
# PlanetEditor

Редактор планеты в виде глобуса (ScenePlanet). Разработчик рисует на нём материки и океаны, хребты, рифты и реки, климатические области и биомы, а то, что планета из этого делает, показывается как есть на любом приближении: каждый пиксель считается из функции планеты в воркерах (Picture), сначала крупно, потом мельче, поэтому ничего не размывается.

Value — планета: параметры ScenePlanet.Make ({Seed, Radius, Ocean, Relief, Depth, Plates, Detail, LocationSize, Grid — сетка локаций cube или hex, Locations, Paint}); change отдаёт её после каждого действия, select — {Index} выбранного мазка, drawn — картинка вида готова целиком.

Tool: look (перетаскивание вращает глобус, колесо приближает, щелчок выбирает мазок) или вид мазка: land, sea, climate, biome — области, mountains, rift, river — линии; каждый щелчок по глобусу ставит точку, двойной щелчок или Enter заканчивает, Escape отменяет. Overlay — что показывать: relief, plates (движение плит стрелками; красные границы — схождение, синие — расхождение), wind (ветра стрелками), temperature, moisture, biomes. Панель сбоку задаёт параметры планеты и выбранного мазка, Delete удаляет его. Мазки рисуются дугами по поверхности. Под указателем — широта, долгота, высота, температура и биом.

Методы: Planet(), View(), SetView({Yaw, Pitch, Zoom}), At(clientX, clientY), Finish(), Cancel(), Remove(index), Render(). В GameEditor — вкладка «Планета».

Реки и поселения. Инструменты «Поселения» (settlements) и «Русла рек» (streams) показывают реки и поселения, которые делает планета — так же, как их делают сцена и запекание (в воркерах: реки по её высотам, поселения по ним; пока они строятся, в панели сказано «Строятся реки и поселения…»), — и меняют их. Правки хранятся в Places планеты (ScenePlanet.PlacedTowns, PlacedRivers) и накладываются заново на сделанное, поэтому перезапекание их не теряет. «Поселения»: нажатие выбирает поселение (его вид — в панели), перетаскивание передвигает, нажатие там, где поселения нет, добавляет деревню. «Русла рек»: нажатие на реку выбирает её, нажатия в других местах проводят новую (Enter или двойное нажатие заканчивает; сток у устья — Flow в панели). Delete удаляет выбранное; правки отменяются как остальные (Undo). Реки рисуются шириной по стоку, проведённые — штрихом; поселения — кружками по виду (--elemenx-planet-editor-town).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Tool` | `'look'` |
| `Overlay` | `'relief'` |
| `Label` | `''` |

## События

- `drawn`
- `change`
- `select`
- `location`

## Методы

- `Planet()`
- `View()`
- `SetView(view)`
- `At(clientX, clientY)`
- `Render()`
- `Finish()`
- `Cancel()`
- `Remove(index)`

## Тесты

- [draws a globe in a view of no size, lower than its bands, some of them of no height](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L60) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [paints the globe of the planet in workers, each pixel of it, and tells the point under the pointer](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L89) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [draws a continent by its points on the globe, sets its fields and takes it away, each change emitted](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L113) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [shows the winds and the plates as arrows over the globe](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L169) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L186) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [ends and drops a stroke by its bar of actions, a press on the bar no point of it, and two fingers bring the globe nearer](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L240) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [paints the relief with a brush along a drag, an edit of the planet, and undoes and redoes it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L305) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [draws a region of a rule, sets the rule of a biome, and edits the graph of a rule into one of the planet](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L353) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [turns the globe as a ball: over its poles, round the middle of the view, north up again, its marks where its points are](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L418) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [shows the settlements and rivers its planet makes and changes them in its Places, laid over them again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L467) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
