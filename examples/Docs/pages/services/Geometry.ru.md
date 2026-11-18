<!-- generated -->
# Geometry

Геометрия земли и планеты из одного источника — функций на языке ядра Elemenx.Compilers (Kernel): одни и те же на странице, в воркере, в wasm и в шейдере. Линия и область — список чисел (float[]), x и z парами; точки пространства — тройками x, y, z. Line(points, x, z) — ближайшая точка линии: {Distance, T (доля всей длины, от 0 до 1), Side (+1 слева по ходу, -1 справа), Segment (номер отрезка)}. Area(points, x, z) — {Inside (внутри ли области), Distance (до её края)}. Level(points, levels, x, z) — уровень линии там, где она ближе всего к точке, между уровнями её точек (levels — по одному на точку): так ложатся река и дорога. Fall(distance, radius) — 1 в середине и 0 на краю и дальше, плавно (полволны косинуса). Nearest(points, x, y, z) — из точек пространства {Index (ближайшей), Near (расстояние до неё), Next (до следующей)}: по нему находятся плиты планеты. Code() — функции Kernel в js (собираются на странице, воркер берёт текст, Compiled); IR() — модуль IR для блоков геометрии Blueprints.Numeric: Line, Area, Level, Fall и Nearest. Source(names) отдаёт члены воркеру. Работает и в Node. Grid(data, side, radius, x, z) — сетка чисел над квадратом радиуса вокруг 0 (штамп): {Value — между четырьмя ближайшими, Inside — на сетке ли точка}. Tunnel(points, x, y, z, radius, flat, width, height, corner) — для точек пространства тройками: насколько точка далеко от стенки туннеля вокруг них (меньше 0 — внутри): круглый ход радиуса radius с ровным полом по flat или короб ширины и высоты со скруглёнными углами; {Distance, Axis — высота оси у точки}. Passages(packed, x, y, z, blend, crust, ground) — граф проходов, упакованный в числа: ходы и залы, плавно сшитые на blend, без выреза в пределах crust под землёй; {Distance, Floor — пол ближайшего}.

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
- `Nearest(points, x, y, z)`

## Тесты

- [finds the nearest point of a line, how far along it, its side and its piece; whether a point is in an area](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L19) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [gives the level of a line between those of its points, and the nearest of points of space and the next](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L34) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [makes a graph of its blocks a function of numbers: the points a list given, the same run, js and wasm](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L43) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [computes what a formula reads once in a branch only when that branch is taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L87) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [keeps its blocks of a cave under names of their own, beside the nodes of a world](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L109) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
