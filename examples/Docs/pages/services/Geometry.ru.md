<!-- generated -->
# Geometry

Геометрия земли и планеты из одного источника — функций на языке ядра Elemenx.Compilers (Kernel): одни и те же на странице, в воркере, в wasm и в шейдере. Линия и область — список чисел (float[]), x и z парами; точки пространства — тройками x, y, z. Line(points, x, z) — ближайшая точка линии: {Distance, T (доля всей длины, от 0 до 1), Side (+1 слева по ходу, -1 справа), Segment (номер отрезка)}. Area(points, x, z) — {Inside (внутри ли области), Distance (до её края)}. Level(points, levels, x, z) — уровень линии там, где она ближе всего к точке, между уровнями её точек (levels — по одному на точку): так ложатся река и дорога. Fall(distance, radius) — 1 в середине и 0 на краю и дальше, плавно (полволны косинуса). Nearest(points, x, y, z) — из точек пространства {Index (ближайшей), Near (расстояние до неё), Next (до следующей), Other (номер следующей)}: по нему находятся плиты планеты. Painted(packed, x, y, z) — насколько направление лежит в нарисованных на сфере областях, их сумма: packed — [число областей, у каждой число точек, край в радианах, точки тройками]; 1 глубже края внутри контура, половина на контуре, 0 дальше края снаружи (так планета читает нарисованные разработчиком сушу и море). Strokes(packed, x, y, z) — что дают направлению нарисованные на сфере линии, их сумма: packed — [число линий, у каждой число точек, Reach в радианах, Amount, Power, точки тройками]; Amount на (1 − угол до линии / Reach) в степени Power, дальше Reach — ничего (хребты, рифты и реки, нарисованные на планете). Bend(record, t, width, bend) — насколько русло реки уходит в сторону от своего пути в доле t участка (км, в сторону cross(A, B)): участок упакован числами [A и B тройками, FlowA, FlowB, LevelA, LevelB, AlongA, AlongB, PhaseA, PhaseB, Seed, End (км реки, где она впадает в другую, иначе -1), From (1 — рукав дельты), число впадений, км каждого]; изгибы в bend ширин реки (width км на корень стока), вдвое шире реки, втрое меньше выше 1200 м, без изгибов у впадений. River(packed, x, y, z, radius, width, bend) — ближайшая река к направлению по таким участкам ([число, участки]) с её изгибами: {Far (км, Infinity без рек), Flow, Level}. Edits(packed, softs, x, y, z, height) — высота после кистей вдоль путей на сфере, по порядку: packed — [число кистей, у каждой вид (0 raise, 1 lower, 2 flatten, 3 smooth), число точек, Reach в радианах, Amount, Height, середина, Cap — косинус шапки, которую она задевает, точки]; вес (1 − t²)², t — угол до пути, делённый на Reach; smooth тянет к softs[её номер]. EditWeight(packed, at, x, y, z) — вес одной кисти, упакованной с места at. Code() — функции Kernel в js (собираются на странице, воркер берёт текст, Compiled); IR() — модуль IR для блоков геометрии Blueprints.Numeric: Line, Area, Level, Fall и Nearest. Source(names) отдаёт члены воркеру. Работает и в Node. Grid(data, side, radius, x, z) — сетка чисел над квадратом радиуса вокруг 0 (штамп): {Value — между четырьмя ближайшими, Inside — на сетке ли точка}. Tunnel(points, x, y, z, radius, flat, width, height, corner) — для точек пространства тройками: насколько точка далеко от стенки туннеля вокруг них (меньше 0 — внутри): круглый ход радиуса radius с ровным полом по flat или короб ширины и высоты со скруглёнными углами; {Distance, Axis — высота оси у точки}. Passages(packed, x, y, z, blend, crust, ground) — граф проходов, упакованный в числа: ходы и залы, плавно сшитые на blend, без выреза в пределах crust под землёй; {Distance, Floor — пол ближайшего}.

## Методы

- `Source(names)`
- `Code()`
- `IR()`
- `Line(points, x, z)`
- `Area(points, x, z)`
- `Level(points, levels, x, z)`
- `Grid(data, side, radius, x, z)`
- `Tunnel(points, x, y, z, radius, flat, width, height, corner)`
- `Passages(packed, x, y, z, blend, crust, ground)`
- `Fall(distance, radius)`
- `Strokes(packed, x, y, z)`
- `EditWeight(packed, at, x, y, z)`
- `Edits(packed, softs, x, y, z, height)`
- `Bend(record, t, width, bend)`
- `River(packed, x, y, z, radius, width, bend)`
- `Painted(packed, x, y, z)`
- `Nearest(points, x, y, z)`

## Тесты

- [reads what a developer drew on a planet of the kernel of Geometry and its table, as the code read it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/planet-graphs.test.js#L361) — `tests/regression/planet-graphs.test.js`
- [tells how much of areas of directions drawn on a sphere a point is, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L19) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [finds the nearest river of segments packed and how far aside it bends, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L59) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [gives what lines drawn on a sphere give a point, each by its fall to its sides, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L91) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [changes a height by brushes along paths on a sphere in their order, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L114) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [finds the nearest point of a line, how far along it, its side and its piece; whether a point is in an area](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L146) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [gives the level of a line between those of its points, and the nearest of points of space and the next](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L161) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [makes a graph of its blocks a function of numbers: the points a list given, the same run, js and wasm](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L170) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [computes what a formula reads once in a branch only when that branch is taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L214) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [keeps its blocks of a cave under names of their own, beside the nodes of a world](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L236) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [finds the nearest of points and the next one, and its index (Other)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L452) — `tests/regression/blueprints-ir.test.js`
- [carves the valley of a river and bends it of its graph and the kernel, the very ground and ways the code gave](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/planet-graphs.test.js#L276) — `tests/regression/planet-graphs.test.js`
