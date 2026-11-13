<!-- generated -->
# SceneLocations

SceneLocations: локации планеты ScenePlanet. Каждая локация — клетка её поверхности (ScenePlanet.CellAt: квадрат грани куба или шестиугольник икосаэдра), которую сцена показывает подробно, рядом — соседи. Они задаются в самой планете (параметрах ScenePlanet.Make): LocationSize (размер клетки, км, 4), Grid (cube — квадраты, по умолчанию; hex — шестиугольники, 12 из них пятиугольники) и Locations {ID: локация}. Локация: {ID (её клетки), Kind (generated — из графа мира планеты в этой точке; model — файл, адрес в Model), World (свой граф мира, если её правили; иначе — планеты в этой точке), Passages ([{Side (0–3: +X, +Z, −X, −Z локации; у шестиугольника 0–5 по кругу), At (0–1 вдоль стороны), Kind (road, path, river, tunnel, gate), Width (м), Mode (seamless — в соседа заходят бесшовно; passage — через проход), To (ID соседа)}]), Beyond (что за стороной, рядом с которой нет заданной локации или есть только проходы в неё: cliff — обрыв, wall — стена по контуру, void — пропасть, sea — море, far — дальняя земля планеты; по умолчанию far)}. Клетка без заданной локации — планета как есть, сгенерированная.

- Location(planet, id) — локация целиком: место (широта, долгота, поворот осей, размер, контур и стороны в метрах), вид, модель, граф мира, проходы, Beyond и стороны с соседями. Граф мира планеты — квадратная земля вокруг контура с полями (Extent(place)), его шаг Border делает то, что за контуром, а проходы — дороги (у реки — река) от стороны к середине и ворота в стене у прохода вида gate. Сторона, рядом с которой задана локация, а проходов на ней нет, открыта целиком: за ней та локация.
- At(planet, широта, долгота) — ID локации точки.
- Open(planet, id) — стороны, к которым можно пристроить новую локацию.
- Tell(planet, id, changes) и Forget(planet, id) — задать или убрать локацию (копия планеты).
- Passage(planet, id, passage) — проход на стороне и такой же у соседа на обращённой стороне, чтобы вели друг в друга.
- Bake(planet, id, side, given) — планета, в которую запечена земля локации: её высоты со всеми правками (side × side по квадрату её земли, 64) или данные высоты ({Side, Heights} — для модели). Так глобус, поверхность при спуске и горизонт соседних локаций показывают локацию такой, какой её сделали. Forget убирает и запечённое. Земля самих локаций строится из планеты как она есть, без запечённого, поэтому правки не накладываются дважды.

В GameEditor правка открытой локации планеты сама сохраняется в планету (её World) и запекается в неё, когда правки ненадолго затихают.

В редакторе планеты — инструмент «Локация»: щелчок выбирает клетку, панель задаёт вид, модель, «за краем» и проходы, «Открыть» открывает локацию в редакторе сцены GameEditor с землёй планеты в этой точке.

Реки планеты, проходящие через локацию, становятся реками её эскиза (слой rivers): линии типа river по их пути, на уровне реки, шириной 15 м × √стока. Путь петляет: точка каждые 400 м со сдвигом вбок волнами в километр и в сотни метров, одинаковыми для одной реки.

Поселения планеты (Settlements у ScenePlanet: ключ или список), стоящие в локации, становятся поселениями её эскиза (слой settlements): область типа settlement своего вида вокруг точки поселения (город около 900 м в поперечнике середины, посёлок 450, деревня 180), целиком внутри локации. Towns(planet, place) даёт этот слой, Streams(planet, place) — слой рек, а Sketch(planet, place) — весь эскиз земли локации.

Магистрали планеты (Highways), проходящие через локацию, становятся дорогами её эскиза (слой trunks, Trunk: true, Class): от точки, где магистраль входит через контур, до точки, где выходит, и немного за контур. На общей стороне соседних локаций это одна и та же точка планеты. Trunks(planet, place) даёт этот слой. В локации шаг Roads прокладывает магистраль по рельефу и подводит к ней поселения; проходы на краях тоже становятся дорогами до ближайшего поселения (или до середины). Опция планеты LocationRoads: false отключает дороги локаций.

## Методы

- `At(planet, latitude, longitude)`
- `Location(planet, id)`
- `Open(planet, id)`
- `Tell(planet, id, changes)`
- `Forget(planet, id)`
- `Bake(planet, id, side, given)`
- `Passage(planet, id, passage)`

## Тесты

- [finds the location of a point, its place, its sides and its World: the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L18) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [tells locations, the sides still open beside them, and passages that lead both ways](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L39) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [lays its locations out in hexagons too: six sides, passages on them both ways](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L67) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [makes what is past its outline: a cliff falls, a passage keeps its way open with a road to the middle, a wall stands with a gate, a side with a location beside and no passage stays open](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L87) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [bakes an edited location into the planet: its globe and its surface show the edit, the location beside and its own ground are as they were](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L146) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [has the settlements of its planet as settlements of its sketch, round their points and within it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L182) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [has the highways of its planet as roads of its sketch, meeting those of the location beside at their border](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L211) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L161) — `tests/regression/library-scene-landing.test.js`
- [flies down from space to a marker through the air, sets down in the location of the point, and goes up to a low orbit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L213) — `tests/regression/library-scene-landing.test.js`
- [flies on into the location beside at the same point of the planet, through a passage behind a veil, the far ground of the planet past it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L467) — `tests/regression/library-scene-landing.test.js`
- [picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L183) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [gathers the water of its land into rivers down to the sea, cuts their valleys, and gives them to the locations they cross](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L439) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
