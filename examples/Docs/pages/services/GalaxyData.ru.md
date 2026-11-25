<!-- generated -->
# GalaxyData

GalaxyData: галактика как данные (docs/SPACE-FORMAT.md) — паспорт, сверхмассивная чёрная дыра в центре (есть всегда), звёзды, которые делаются из зерна сектор за сектором (не хранятся), правки поверх неё и системы её звёзд (SystemData). Единицы: световые годы, время в миллионах лет; плоскость галактики — X и Z, север — +Y.

- Kinds() — виды: spiral, barred (с перемычкой), lenticular (диск без рукавов), elliptical, irregular (сгустки молодых звёзд), dwarf (маленькая тусклая сфера), ring (кольцо молодых звёзд вокруг старого ядра).
- Make(options) — данные галактики из {Seed, Kind, Name, Radius, Arms, Pitch, Mass (чёрной дыры, в Солнцах), Coordinates (мегапарсеки)}; чего нет — из зерна и вида. data — {Manifest, Edits {Overrides, Removed, Added}, Systems}.
- Density(data, place) — звёзд в кубическом световом году (около 0.004 там, где Солнце в галактике вроде нашей).
- Sector(data, x, y, z, limit) — звёзды сектора (куб Manifest.Sector, 100 св. лет), всегда одни и те же: {Count, Stars: [{ID, Name, Place, Mass, Temperature, Color, Luminosity, Class}]}; первые limit из всех, одни и те же при любом limit. Большинство — красные карлики.
- Star(data, id) — звезда по ID ('x.y.z-номер', сектор может быть и ниже нуля: '3.-1.-2-14').
- Position(data, place, time) — где место через time млн лет вращения (плоская кривая: 220 км/с, 734 св. года за млн лет).
- Added(data, time) — то, что добавлено руками (AddBody), там, где оно через time млн лет: звезда (Kind star) обходит центр, как остальные, и есть среди звёзд своего сектора со своей системой; тело вне систем движется по своей Velocity (св. лет за млн лет).
- Glow(data, count) — точки свечения всей галактики издали: {Positions, Colors}.
- BulgeOf(manifest) — её гладкая середина {Radius (св. лет), Flat, Color, Bright}, то же, что Bulge у Glow.
- StructureGLSL — свет её частей, кроме рукавов, одним куском GLSL: старые звёзды (galaxy_old), тонкий и толстый диски (galaxy_thin, galaxy_thick), гало (galaxy_halo), балдж с ядром и баром (galaxy_bulge). Один и тот же для галактики издали (SceneGalaxy) и её полосы на небе изнутри (SceneCosmos), поэтому изнутри она тех же чисел и цветов, что снаружи.
- System(data, id) — система звезды: записанная в галактике, иначе из зерна звезды с её массой (Astronomy.Generate с Mass); для 'centre' — система центральной чёрной дыры: дыра с диском и молодые звёзды на тесных вытянутых орбитах (сотни–тысячи а.е., как S2), из зерна галактики.
- Hole(data) — центральная чёрная дыра как тело ({ID: 'centre', Kind: 'blackhole', Place [0, 0, 0], Mass}); Star(data, 'centre') возвращает её же. HoleSystem(data) — её система из зерна: у звёзд вокруг дыры свои планеты и станции в пределах сферы Хилла в перицентре, вокруг них рой старых звёзд ядерного скопления (трейт Cluster).
- Cluster(options) — звёздное скопление как система SystemData из зерна: {Seed, Type (open — рассеянное, globular — шаровое, nuclear — ядерное вокруг чёрной дыры), Name, Count (сколько звёзд перечислено поштучно), Radius (св. лет), Mass (масса дыры ядерного)}. Середина ID 'cluster' с трейтом Cluster {Type, Radius, Count, Seed} — рой неперечисленных звёзд, который рисует Scene; звёзды на орбитах по профилю Пламмера, у каждой планеты и станции, которые оставляет ей сфера Хилла.
- Cosmos(data, id) — фон неба системы звезды (Cosmos сцены): полоса этой самой галактики, видимая с места звезды (Galaxy — паспорт, Place), ось — север галактики, как лежит система.
- Code(), IR() — рукава галактики из одного источника (Kernel на языке ядра: gx_turn, gx_bend, gx_wave, gx_arm на шуме градиентов Noise) как js и как IR для графа Blueprints; Spiral(data) — рукава по графу галактики (data.Graph, свой граф даёт сцена; SceneBlueprints.Galaxy): на них лежат и звёзды, и сгустки, и картинка; SeedNumber(manifest) — число зерна для её шума.
- Rename, Remove, AddBody (тело вне систем: Place и Velocity), SetSystem — правки.
- Use, DataOf, Open, Write, Save, Pack — как у SystemData; части {Kind: 'galaxy'}, {Kind: 'edits'}, части записанной системы — с System: id.
- Звёзды секторов получили тип (Type: main, white-dwarf, brown-dwarf, giant, supergiant, neutron, pulsar, magnetar — примерно как в настоящей галактике) и Kind — вид сцены; система такой звезды строится вокруг звезды этого вида.
- Search(data, options) — поиск вокруг места, ближние первыми: звёзды секторов, туманности, скопления, чёрная дыра, добавленное вручную. options: Centre [x, y, z] (св. лет, на время 0), Radius (100 св. лет), Type (тип звезды, туманности, скопления, blackhole, или star / nebula / cluster целиком), Class (начало класса: G, K3), Edited (renamed, written, any — только переименованное или с записанной системой), Mass и Temperature [от, до] (только звёзды), Text (в имени или ID), Limit (500), Budget (сколько звёзд можно перебрать, 200 000). Возвращает {Items, More (найдено больше Limit), Partial (бюджет кончился раньше, чем весь регион просмотрен)}. Звёзды разыгрываются из зерна сектор за сектором кольцами от центра; свет и класс считаются, только если о них спросили или звезда попала в список.
- Knots(data) — узлы звездообразования, ровно те, что рисует картинка галактики: две сетки плоскости (клетки в 1/30 и 1/90 радиуса), в клетке не больше одного узла; место, размер и светится ли — из зерна и силы рукава. {Grids: [{Cell (тыс. св. лет), Count, Half, Data: x, z, размер, вес на клетку}]} — SceneGalaxy отдаёт их шейдеру текстурами. Нет рукавов — нет узлов.
- Objects(data) — туманности и скопления галактики из её зерна, всегда одни и те же: HII — по одной на каждый узел Knots (того же размера), тёмные — на пыли внутренней кромки рукавов, планетарные и остатки сверхновых (Ia, II, Ib, Ic; в эллиптической только Ia) по диску, рассеянные скопления по рукавам, шаровые — шаром вокруг всего. Каждый {ID, Kind, Type, Subtype, Name, Place, Radius, Seed}; правки мира (имя, удаление) поверх. ObjectOf(data, id) — один из них, ObjectSystem(data, id) — его сцена как система: туманность с тем, что в ней или что её сделало, или скопление. Star и System принимают их ID, поэтому в них входят как в звезду.

Плотность звёзд в точке (Density) считает граф blueprints/galaxy/density по виду галактики и её форме; рукава (Arm), сгустки (Clumps) и бар (Along, Across) подаются в него на вход. Свой граф — DensityGraph паспорта галактики.

## Методы

- `Make(options)`
- `BulgeOf(manifest)`
- `Code()`
- `IR()`
- `SeedNumber(manifest)`
- `Spiral(data)`
- `Density(data, place)`
- `Sector(data, x, y, z, limit)`
- `Search(data, options)`
- `Objects(data)`
- `Knots(data)`
- `ObjectOf(data, id)`
- `ObjectSystem(data, id)`
- `Star(data, id)`
- `Hole(data)`
- `HoleSystem(data)`
- `Cluster(options)`
- `Added(data, time)`
- `Position(data, place, time)`
- `Glow(data, count)`
- `System(data, id)`
- `Cosmos(data, id)`
- `Rename(data, id, name)`
- `Remove(data, id)`
- `AddBody(data, body)`
- `SetSystem(data, id, system)`
- `Use(key, data)`
- `DataOf(key)`
- `Write(data, store, callback, whole)`
- `Save(data)`
- `Pack(data, callback)`
- `Open(source, callback)`

## Тесты

- [gives its middle of each kind and the light of its parts in one piece of GLSL, seen from far and from within alike](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L32) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [makes a galaxy of a seed and of a kind, with its supermassive black hole at its centre](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L58) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [is as dense as a real galaxy: about 0.004 stars a cubic light-year where the Sun is, more in its core, few above it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L71) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [makes the stars of a sector the same each time, as many as its density, the first ones the same however many are asked for](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L87) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [turns its stars round its centre on a flat curve: a star far out turns more slowly](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L114) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [glows of points of its kind, and gives the system of a star of its seed with the mass of the star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L124) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [Astronomy.Generate takes the mass of its star (a star of a galaxy), the rest of the system still of its seed](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L146) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [keeps its edits, a written system and a free body, saved as a file and opened again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L157) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [takes a star put in by hand among the stars of its sector, with a system of its mass, and moves a body of no system along its velocity](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L179) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [gives its black hole as a body with a system of its own: the hole and its disc, the young stars close round it on long thin orbits](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L210) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [gives the stars round its black hole the planets and stations their room leaves them, and the swarm of its nuclear cluster](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L236) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [makes star clusters of three kinds of a seed: open ones loose and young, globular ones old and packed, nuclear ones round a black hole](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L263) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`

+18 ещё в тех же файлах
