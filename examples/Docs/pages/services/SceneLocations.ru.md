<!-- generated -->
# SceneLocations

SceneLocations: локации планеты ScenePlanet. Каждая локация — клетка её поверхности (квадрат грани куба, ScenePlanet.CellAt), которую сцена показывает подробно, рядом — соседи. Они задаются в самой планете (параметрах ScenePlanet.Make): LocationSize (сторона клетки, км, 4) и Locations {ID: локация}. Локация: {ID (её клетки), Kind (generated — из графа мира планеты в этой точке; model — файл, адрес в Model), World (свой граф мира, если её правили; иначе — планеты в этой точке), Passages ([{Side (0–3: +X, +Z, −X, −Z локации), At (0–1 вдоль стороны), Kind (road, path, river, tunnel, gate), Width (м), Mode (seamless — в соседа заходят бесшовно; passage — через проход), To (ID соседа)}]), Beyond (что за стороной без соседа: cliff, wall, void, sea или far — дальняя земля планеты; по умолчанию far)}. Клетка без заданной локации — планета как есть, сгенерированная.

- Location(planet, id) — локация целиком: место (широта, долгота, поворот осей вдоль сторон клетки, размер, контур в метрах), вид, модель, граф мира, проходы, Beyond и стороны с соседями.
- At(planet, широта, долгота) — ID локации точки.
- Open(planet, id) — стороны, к которым можно пристроить новую локацию.
- Tell(planet, id, changes) и Forget(planet, id) — задать или убрать локацию (копия планеты).
- Passage(planet, id, passage) — проход на стороне и такой же у соседа на обращённой стороне, чтобы вели друг в друга.

В редакторе планеты — инструмент «Локация»: щелчок выбирает клетку, панель задаёт вид, модель, «за краем» и проходы, «Открыть» открывает локацию в редакторе сцены GameEditor с землёй планеты в этой точке.

## Методы

- `At(planet, latitude, longitude)`
- `Location(planet, id)`
- `Open(planet, id)`
- `Tell(planet, id, changes)`
- `Forget(planet, id)`
- `Passage(planet, id, passage)`

## Тесты

- [finds the location of a point, its place, its sides and its World: the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L18) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [tells locations, the sides still open beside them, and passages that lead both ways](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L38) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [flies down from space to a marker through the air, sets down in the location of the point, and goes up to a low orbit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L44) — `tests/regression/library-scene-landing.test.js`
- [picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L145) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
