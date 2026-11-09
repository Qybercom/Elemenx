<!-- generated -->
# SceneTerrainGenerator

Земля игры, непрерывная: высоты из шума в любой точке (без клеток), её сетки кусками и пути по ней. Flat(options) — земля плоской карты: Size (1000), Height (высота самых высоких холмов, 60), Water (уровень моря от 0 до 1, 0.35), Scale (размер холмов, 180), Ridges (доля гор, 0.4), Seed; её методы Height(x, z) (ниже 0 — под морем), Normal(x, z), Slope(x, z) (0 — ровно, 1 — стена), Walkable(x, z, options) (MaxSlope, Swim, Blocked(x, z)), Chunk(x, z, size, resolution) — геометрия квадрата с цветами высот и склонов и юбкой под краями, Path({X, Z}, {X, Z}, options) — путь из точек {X, Y, Z} в обход непроходимого, спрямлённый где можно, или null. Sphere(options) — земля планеты, та самая, что на её запечённой поверхности (шум Renderer, как его запекает шейдер Scene): Radius, Height, Seed, Ocean, Type; её методы Land(direction), Elevation(direction), Point(direction), Altitude(point), Patch(face, u, v, size, resolution). Cells({Width, Height, Depth, Color(x, y)}) — плоская земля карты клеток, одним куском. Работает и в Node.

Рельеф как граф. Параметр Relief земли — граф-генератор Blueprints: входы X и Z, результаты Height (от 0 до 1, как холмы из шума), Moisture и Temperature (от 0 до 1). Его параметры Scale, Ridges, Water и Height берутся из параметров земли, если они заданы, иначе — свои значения графа. LibraryRelief(options) строит граф обычного рельефа этих параметров: те же высоты до бита и тот же климат, с него начинает редактор. Relief(settings) один раз компилирует граф в JavaScript (Blueprints.Code) и кладёт исходник в параметры (ReliefSource), поэтому воркер собирает ту же функцию без графа.

Климат. У поля есть Climate(x, z) → {Moisture, Temperature}: из графа рельефа, а без него — температура 0.72 у моря, падает с высотой (на 0.7 к вершинам) и колеблется по шуму; влажность — свой шум, в пять раз шире холмов.

Биомы по климату. Параметр Biomes земли — список имён биомов SceneBiomes или записей {Biome, Ground, Grass, Climate, Scatter}. Climate — конверт {Height, Moisture, Temperature} или список конвертов, каждый диапазон [от, до] (null — без края; Height в долях Top, ниже 0 — под морем). Поле получает Biome(x, z) → {List: [{Name, Ground, Weight}], Gap}: веса мягкие на стыках (BiomeOf), Gap — точка вне всех конвертов. Paint смешивает палитры биомов, Grassy убирает траву там, где у биома её нет. Список с палитрами кладётся в параметры (BiomeList) для воркеров.

Объём земли. Carves в параметрах вырезают из земли и наращивают её: tunnel (Points [[x, z, y]...], Radius, Flat — ровный пол, Depth), sphere (At, Radius — выкопанная яма), caves (естественные пещеры из шума — ходы и залы — вокруг Center в пределах Radius: Top и Bottom — глубины слоя, Scale, Width, Halls, Seed; Top 0 выводит их на поверхность), passages (граф подземных ходов — для пеших и для дорог: Nodes [{ID, At [x, z] или [x, z, y] — без y на Depth под землёй, 6; Radius — зал; Depth}], Ways [{From, To, Points — промежуточные, без высоты на ровном уклоне от узла к узлу; Radius, Flat; Width и Height — коробом, как тоннель дороги}]; на развилке из трёх ходов и больше сам собой появляется зал в полтора раза шире самого широкого хода, пол зала на уровне пола ходов; ходы и залы сливаются плавно, под пол слияние не копает; Rough от 0 до 1 — неровные стены естественной пещеры (шум на такую долю половины самого широкого хода, у пола его нет — пол остаётся проходимым), Scale шума (6), Crust, Seed), overhangs (нависающие скалы на крутых склонах: Amount, Scale, Slope, Center и Radius). У поля появляются Density(x, y, z) (твёрдое там, где больше 0) и Volume; куски земли, которых касается вырез, строятся по плотности (Volumetric, surface nets: без щелей между соседями, с юбкой по краю), остальные — как обычно. По такой земле ходят как по локации с этажами (Underground): Height(x, z, y) — пол под тем, кто на высоте y (шаг вверх до Climb, 0.6 м), Blocked — порода там, где тело, CanStep — можно ли шагнуть (вверх не круче Steep), Stands. Всё работает и в воркерах. В графе мира это шаги Tunnel, Caves, Passages и Overhangs.

Passages(carve, height) — граф выреза passages: {Nodes: [{ID, At [x, y, z], Ways (ID ходов), Kind (end, bend, fork, cross — по числу ходов), Hall (радиус зала, 0 — без зала), Floor}], Ways: [{ID, From, To, Points [[x, y, z]...] от узла к узлу, Length, Radius, Flat, Width, Height}]}; ход к неизвестному узлу пропускается. PassageRoute(graph, from, to) — кратчайший путь по графу (Passages или графу тоннелей дорог SceneRoads.TunnelGraph): {Nodes, Ways, Points, Length} или null, если туда не дойти. Трава над устьем хода, открытым небу, не растёт.
Path на такой земле — WayUnder: A* по клеткам, каждая на своём полу, шаги по CanStep (вверх до Climb и не круче Steep, вниз любой спуск), не круче MaxSlope правил, не в море без Swim; путь выпрямляется там, где можно пройти прямо. Height(x, z) без y — поверхность под небом с учётом выкопанного. Второй канал UV кусков земли — доля видимого неба (1 у обычной земли; у объёмной — по пяти лучам вверх сквозь плотность).

Border(options) — контур локации на её земле и то, что за ним: Points (углы), Sides (стороны), Beyond (far — земля как есть; cliff — обрыв на Depth, 250 м; void — пропасть, 3000 м; sea — уходит под море, 40 м; wall — земля как есть, стену ставит шаг Border графа мира), Passages ([{Side, At, Width}] — за ними земля идёт как есть), Open (стороны, открытые целиком), Edge (на скольких метрах меняется, 40). Даёт Height(x, z, h), Distance(x, z) (до контура, снаружи больше 0), Gap(x, z) (1 на пути прохода). Земля Flat с параметром Border получает его в поле Border.

Site({Options, Latitude, Longitude, Turn}) — место планеты ScenePlanet как плоская земля: плоскость, касающаяся планеты в этом месте (X на восток, Z на юг, повёрнутые на Turn). Elevation(x, z) — высота планеты там (метры, уровень моря 0), Sample(x, z) — всё, что планета говорит о точке, Direction(x, z) — направление, Local(direction) — обратно, точка места, в которую приходит направление: этим сшиваются два соседних места, одна и та же точка планеты в обоих.

Материалы земли (SceneMaterials). Поле получает Materials — до 12 материалов своих палитр и эскиза (слоты шейдера земли) — и MaterialSlot (имя → слот). Каждая часть палитры (Sand, Low, High, Rock, Snow, Deep, Road) берёт материал из Materials палитры, иначе из GroundMaterials; элемент эскиза берёт свой Material, иначе материал по типу (LookMaterials). Paint(field, x, z, y, slope, into) при into (12 чисел) прибавляет вес каждого материала в точке так же, как смешиваются цвета. Каждый биом списка Biomes несёт и Scatter — правила рассадки из SceneBiomes, чтобы глобус планеты рисовал по ним леса. Куски земли (Chunk, Piece) несут Materials — 12 весов на вершину, юбка тоже. Трава, скала и снег переходят друг в друга полосой по высоте (линия снега волнистая) и по крутизне, так что соседние вершины склона не делят его на зубцы.

RoadWay(field, from, to, options) — путь дороги по полю от [x, z] до [x, z]: A* по точкам шагом Step (1/64 поля). Подъём тем дороже, чем круче, а уклон больше MaxGrade (0.12) — намного дороже; над водой в Bridge раз (6). Затем лишние точки убираются: остаются только те, где путь отходит от прямой больше чем на полшага. Результат — [[x, z]...] или null. План поселения (SettlementPlan) не ставит участки на чужие дороги, улицы, реки, железные дороги и каньоны эскиза: середина, углы и середины сторон участка должны быть дальше половины ширины пути плюс обочины.

Здания поселений. В деревне иногда встречаются амбар, гараж и церковь; в посёлке — школа, церковь, заправка и гаражи; в городе — школа, многоэтажная парковка, заправка и церковь. Новые кварталы: civic (школа, церковь, вокзал), service (заправка, гаражи, парковка), farm (амбары, водонапорная башня, коттедж). В industry добавлены ангары и водонапорные башни. SettlementSizes знает размеры всех классов SceneBuildingGenerator.

Вырез tunnel принимает Crust — сколько метров земли над ним никогда не вырезается: мелкий тоннель сохраняет потолок, а склон над ним остаётся целым. Без Crust тоннель открывается там, где доходит до поверхности. С Width вырез tunnel — не круглая труба, а короб вокруг своей оси: шириной Width и высотой Height (по умолчанию два радиуса), ровные пол и свод, углы скруглены на Corner (1,5 м). Так вырезают землю тоннели дорог (SceneRoads.Carves): один короб во всю ширину облицовки, без корки.


Квадрат грани глобуса (SpherePatch) несёт в Materials (8 чисел на точку) положение точки на квадрате от 0 до 1 — для его картинки — и юбку под краями: каждую точку края ещё раз, ниже на десятую клетки (не меньше 50 м), видимую с обеих сторон, чтобы квадраты разных размеров не оставляли щелей. Piece(«Sphere», options, roads, [face, u, v, size, resolution, picture]) с размером picture и полем, которое красит себя само (ScenePlanet), даёт и Picture; Piece(«SpherePicture», …, [face, u, v, size, picture]) — одну картинку.

## Методы

- `Relief(settings)`
- `Climate(settings)`
- `LibraryRelief(options)`
- `Flat(options)`
- `Border(options)`
- `OnRoad(field, x, z, width)`
- `Sphere(options)`
- `Work()`
- `Sketched(sketch, base, seed)`
- `SketchChanged(before, after)`
- `FromGrid(options, heights, side)`
- `Heights(field, side)`
- `Field(shape, options)`
- `Piece(shape, options, roads, args)`
- `Free(size, side, lines, areas, edge)`
- `Floor(options, side)`
- `Grid(options, side, top, steep)`
- `Source(names)`

## Пример

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var terrain = this.$Service('SceneTerrainGenerator');
		var field = terrain.Flat({Size: 400, Height: 40, Seed: 7});
		var way = field.Path({X: 20, Z: 20}, {X: 180, Z: 160});
		var planet = terrain.Sphere({Radius: 6371, Height: 8, Seed: 3, Ocean: 0.6, Type: 'terran'});

		this.Text = 'Height(100, 100): ' + field.Height(100, 100).toFixed(2) + ', Slope: ' + field.Slope(100, 100).toFixed(2) + ', Walkable: ' + field.Walkable(100, 100) + '\n\nPath: ' + (way ? way.length + ' points, ' + way.map(function (point) {
			return Math.round(point.X) + ',' + Math.round(point.Z);
		}).join(' → ') : 'none') + '\n\nSphere: Elevation at the pole ' + planet.Elevation([0, 1, 0]).toFixed(3) + ', at the equator ' + planet.Elevation([1, 0, 0]).toFixed(3);
	}
})
</script>
```

## Тесты

- [gives its ground to land on as the Sphere of SceneTerrainGenerator does: its heights, squares with its colors, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L176) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [makes the buildings of a town of their own shapes, each as tall as its Size, its wings within its width and depth](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L118) — `tests/regression/buildings.test.js`
- [asks first for the squares of a cave under a mountain the eye is in, before the low ground round the mountain](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-lod.test.js#L138) — `tests/regression/ground-lod.test.js`
- [asks for as many squares a frame as the workers take, however long the walk over them took](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-lod.test.js#L187) — `tests/regression/ground-lod.test.js`
- [draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L72) — `tests/regression/library-material-blueprints.test.js`
- [draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L198) — `tests/regression/library-material-blueprints.test.js`
- [keeps no grass where a tunnel cut the ground away under the sky](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-roads.test.js#L366) — `tests/regression/library-scene-roads.test.js`
- [takes a ground from a model: floors one over the other, walls that stop a walker, and a plane at its foot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1518) — `tests/regression/library-scene.test.js`
- [walks a hero with the feet of a body: walls stop it at any speed, it slides along them, jumps and falls, and faces the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1821) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2131) — `tests/regression/library-scene.test.js`
- [Workers runs the methods of Services in workers made of their source, and in the page when it cannot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4171) — `tests/regression/library-scene.test.js`
- [makes the squares of a ground of noise in workers, lets go of what came for roads that changed, and grows grass with no noise in a frame](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4275) — `tests/regression/library-scene.test.js`

+40 ещё в тех же файлах
