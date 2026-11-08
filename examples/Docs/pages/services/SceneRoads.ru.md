<!-- generated -->
# SceneRoads

Дороги сцены любого вида: автомагистрали, улицы, просёлки, гоночные трассы, тропы, взлётные полосы и железные дороги. Дорога — это линия через её точки и тип, её поперечный профиль: полосы от левого края к правому.

- Покрытия: из чего сделана полоса (asphalt, concrete, cobbles, paving, gravel, dirt, sand, grass, ballast, runoff, rumble, cycle, steel, wood): {Color, Rough, Metal, Grip (1 — держит как сухой асфальт), Drag (0 — без сопротивления), Material (узор: материал SceneMaterials, без него — ровный цвет)}. Встроенные покрытия рисуются материалами: asphalt, concrete, cobbles, paving, gravel, dirt, sand, газон (lawn), ballast, terrazzo (runoff), concrete (rumble), asphalt (cycle), metal (steel), wood. В модели дороги материал полосы несёт Pattern. Surface(name, surface) добавляет или заменяет покрытие, Surface(name) возвращает его.
- Типы: Define(name, type) добавляет или заменяет тип, Type(name) возвращает его, Types() — список имён. Тип — {Title, Group (road, street, path, race, air, rail), Strips: [{Kind (lane, shoulder, verge, kerb, sidewalk, median, parking, cycle, runoff, rumble, bed, ditch...), Width (м), Surface, Height (над уровнем дороги: поребрик, тротуар, насыпь железной дороги), Way (полосы движения: 1 — по направлению линии, -1 — обратно, 0 — в обе стороны), Left и Right (разметка края: solid, dashed, double, dotted или none), Marking (её цвет)}], Rails ([{Offset (от середины), Gauge (м)}]: рельсы на шпалах), Sleepers ({Step, Length, Surface}), Speed (км/ч), Catenary (провода над ней: железная дорога или трамвай)}. Типы любой библиотеки объявляются в $Provides ({SceneRoads: {Types: [...]}}).
- Line(points, options): линия дороги, гладкая и ровная, через точки [[x, z] или [x, z, y]] (Closed — кольцо) с шагом Step метров (2): [{X, Y, Z, Way [x, z], Along (метры от начала), Bend}]; Height(x, z), если задана, — высота точки без своей высоты.
- Road(spec): дорога из {ID, Type, Points, Closed, Width (вместо ширины типа: полосы масштабируются), Height} с её линией, шириной и полосами на их смещениях ({Left, Right} от середины). Мосты и тоннели (Bridges и Tunnels: [[from, to]] в метрах вдоль неё, или Structures: true — найти их там, где она идёт на Clear метров выше земли или на Cover ниже), ограждения (Barriers: [{Side, Kind (guardrail, wall, jersey, tyres, fence), Height, Gap, From, To}]), линии вещей рядом с ней (Along: ряды фонарей, заборы, живые изгороди) и отметки поперёк (Marks: start, line, stop).
- Network(specs, junctions, options): дороги, которые встречаются, и их перекрёстки — заданные и найденные там, где две дороги пересекаются или одна кончается на другой; дороги приходят к уровню перекрёстка, а их разметка у него обрывается. JunctionAt(junctions, x, z) — перекрёсток под точкой.
- Near(road, x, z, hint): {Offset (от середины, слева меньше 0), Along (индекс ближайшей точки), At (метры от начала), Way, Y (высота дороги там)}; hint — Along мгновение назад, ищет только рядом с ним.
- Under(roads, x, z, hints): что под точкой, верхняя дорога: {Road (её ID), Strip (вид полосы), Surface, Height, Grip, Drag, Offset, Along} или null вне дорог. BarrierHit(roads, x, z, fromX, fromZ, hints) — прошла ли точка сквозь ограждение.
- Sketch(roads, junctions): линии, под которыми земля выравнивается, и линии вещей рядом с дорогами.
- Asset(roads, options): дороги как модель SceneModels (Define(name, {URL: name, Asset, Fit: false})): полосы, бока того, что приподнято, разметка, рельсы и шпалы, провода, мосты и тоннели, ограждения, перекрёстки.

У типа дороги может быть свой Along — ряды предметов вдоль неё (если у самой дороги Along не задан). Улицы (street, avenue, boulevard, alley, tram) ставят фонари на тротуарах через 28 м, скамьи, урны, гидранты и клумбы, а street и avenue — ещё остановки и киоски. Шоссе (highway, motorway) ставят мачты освещения через 60 м. Ряды дороги сеются там, где она проходит, на любой высоте (MinHeight −1000).

Carves(roads) — то, что тоннели дорог вырезают в земле (Carves земли типа tunnel), чтобы дорога входила в холм через дыру, а не шла открытой выемкой: по стволу на каждые 12 м ширины (у автострады два рядом), круг шириной со свою часть дороги и ещё метр, не меньше 5 м радиусом, пол срезан ровно чуть ниже дороги, а ближе метра к поверхности ничего не вырезается (Crust: у мелкого тоннеля потолок из земли, склон остаётся целым). Вырез начинается за радиус до тоннеля и кончается через радиус после, так что дыра открывается там, где кончается подъезд. TunnelLamps(road) — ряд ламп под сводом по середине тоннеля через каждые 10 м; в модели дороги они светятся сами.

## Методы

- `Surface(name, surface)`
- `Define(name, type)`
- `Type(name)`
- `Types()`
- `Line(given, options)`
- `Road(spec, options)`
- `Near(road, x, z, hint)`
- `Under(roads, x, z, hints)`
- `Sketch(roads, junctions)`
- `Asset(roads, options)`
- `AssetOf(roads, options)`
- `Work()`

## Тесты

- [knows roads, streets, paths, tracks, runways and railways, each a cross-section of strips](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L20) — `tests/regression/scene-roads.test.js`
- [takes a type of its own and a surface of its own, and refuses a type of no strips](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L42) — `tests/regression/scene-roads.test.js`
- [makes a line smooth and even through its points, with its ways, metres and heights](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L56) — `tests/regression/scene-roads.test.js`
- [closes a ring on itself, and finds where a point is on it, near a hint](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L86) — `tests/regression/scene-roads.test.js`
- [tells what is under a point: its strip, surface, height and grip, the higher of two roads, none off them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L100) — `tests/regression/scene-roads.test.js`
- [scales the strips of a type to a width given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L120) — `tests/regression/scene-roads.test.js`
- [gives the lines a ground is made level under](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L128) — `tests/regression/scene-roads.test.js`
- [takes bridges and tunnels given, or finds them where the road leaves the ground, and levels no ground there](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L137) — `tests/regression/scene-roads.test.js`
- [makes a model of the roads: their surfaces, markings, and the rails and sleepers of a railway](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L181) — `tests/regression/scene-roads.test.js`
- [hangs the wires of a railway or a tram on masts, and lays the rails of a tram in the road, with no sleepers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L211) — `tests/regression/scene-roads.test.js`
- [has barriers only where asked, of their kinds, sides and stretches, and they stop what drives into them from either side](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L233) — `tests/regression/scene-roads.test.js`
- [finds the junctions of a network where roads cross or end on one another, brings the roads to one level there and stops their paint](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L261) — `tests/regression/scene-roads.test.js`

+13 ещё в тех же файлах
