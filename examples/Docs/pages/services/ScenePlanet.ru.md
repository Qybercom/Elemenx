<!-- generated -->
# ScenePlanet

ScenePlanet: планета как одна непрерывная функция направления от её центра — одинаковая на любом расстоянии. Глобус в космосе сцены, карта, которую рисует разработчик, и каждая локация на поверхности читают одни и те же числа, поэтому берег, видимый с орбиты, — это тот же берег, по которому ходят. Ничего не запекается: точка считается тогда, когда её спросили, и так подробно, как спросили.

- Make(options) — планета: Radius (км, 6371), Seed, Ocean (доля под морем, 0.65 — уровень моря подбирается по выборке точек так, чтобы доля совпала), Relief (метры высочайших гор, 8000), Depth (метры глубочайшего моря, 6000), Plates (число тектонических плит, 14), Detail (км: до этой подробности берег задаётся глобусом; мельче суша и море никогда не меняются местами, 2), Paint (нарисованное разработчиком), Biomes (имена SceneBiomes). Возвращает {Sample, Elevation, Land, Plate, Wind, Climate, Biome, Point, Direction, LatLon, Radius, Plates}. Sample(direction) — всё о точке: Elevation (метры над морем), Land, Plate {ID, Oceanic, Boundary — км до соседней плиты, Push — больше 0 плиты сходятся (горы, желоба), меньше 0 расходятся (рифты, срединные хребты)}, Wind [восток, север] (м/с: пассаты до 30°, западные ветры до 60°, полярные восточные), Celsius, Temperature и Moisture (0–1: тепло у экватора, холод у полюсов и в горах; влажность с наветренного моря, дождевая тень за хребтами), Biome ('' под морем).
- Paint — мазки по глобусу, точки [широта, долгота] в градусах: land и sea (области: Points, Edge км — материки и океаны там, где нарисованы), mountains (линия: Width км, Height м), rift (линия: Width, Depth), river (линия: Width км), climate (область: Temperature — плюс-минус °C, Moisture — плюс-минус, Edge), biome (область: Biome, Edge).
- Direction(широта, долгота), LatLon(direction), Kinds() — виды мазков.

Работает в воркерах и в Node.

## Методы

- `Direction(latitude, longitude)`
- `LatLon(direction)`
- `Make(options)`
- `Project(view, direction)`
- `Unproject(view, px, py)`
- `Picture(options, view, rect, step, overlay)`
- `Sphere(options)`
- `Work()`

## Тесты

- [turns a latitude and a longitude into a direction and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L31) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [keeps as much of it under the sea as Ocean says, warm at the equator and cold at the poles, its winds by their belts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L42) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [raises what was painted: a continent where it is drawn, a sea, a range of mountains, a climate and a biome of its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L64) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [tells its coasts at any scale alike: what is finer than Detail never turns the land into the sea](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L80) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [has tectonic plates whose borders close into mountains and part into rifts, each plate its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L104) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [paints a piece of a globe in a worker byte for byte as in the page, and turns a pixel into a direction and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L127) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [gives its ground to land on as the Sphere of SceneTerrainGenerator does: its heights, squares with its colors, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L149) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [lays its surface out in cells of locations: each found of its points, its neighbours over the edges of the faces too, its place and outline a location takes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L171) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [sets down on the sea of a point of the sea, the water of the location at its level 0, the view near the ship](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L227) — `tests/regression/library-scene-landing.test.js`
- [paints the globe of the planet in workers, each pixel of it, and tells the point under the pointer](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L55) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [draws a continent by its points on the globe, sets its fields and takes it away, each change emitted](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L74) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [makes the land of a place of a planet exactly as its globe: its heights and coasts, its lands, its neighbour meeting it at their border, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L107) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
