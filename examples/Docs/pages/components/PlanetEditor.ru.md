<!-- generated -->
# PlanetEditor

Редактор планеты в виде глобуса (ScenePlanet). Разработчик рисует на нём материки и океаны, хребты, рифты и реки, климатические области и биомы, а то, что планета из этого делает, показывается как есть на любом приближении: каждый пиксель считается из функции планеты в воркерах (Picture), сначала крупно, потом мельче, поэтому ничего не размывается.

Value — планета: параметры ScenePlanet.Make ({Seed, Radius, Ocean, Relief, Depth, Plates, Detail, Paint}); change отдаёт её после каждого действия, select — {Index} выбранного мазка, drawn — картинка вида готова целиком.

Tool: look (перетаскивание вращает глобус, колесо приближает, щелчок выбирает мазок) или вид мазка: land, sea, climate, biome — области, mountains, rift, river — линии; каждый щелчок по глобусу ставит точку, двойной щелчок или Enter заканчивает, Escape отменяет. Overlay — что показывать: relief, plates (движение плит стрелками; красные границы — схождение, синие — расхождение), wind (ветра стрелками), temperature, moisture, biomes. Панель сбоку задаёт параметры планеты и выбранного мазка, Delete удаляет его. Мазки рисуются дугами по поверхности. Под указателем — широта, долгота, высота, температура и биом.

Методы: Planet(), View(), SetView({Yaw, Pitch, Zoom}), At(clientX, clientY), Finish(), Cancel(), Remove(index), Render(). В GameEditor — вкладка «Планета».

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

- [paints the globe of the planet in workers, each pixel of it, and tells the point under the pointer](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L55) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [draws a continent by its points on the globe, sets its fields and takes it away, each change emitted](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L74) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [shows the winds and the plates as arrows over the globe](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L128) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L145) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
