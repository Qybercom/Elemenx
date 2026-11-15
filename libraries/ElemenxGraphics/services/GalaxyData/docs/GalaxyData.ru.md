GalaxyData: галактика как данные (docs/SPACE-FORMAT.md) — паспорт, сверхмассивная чёрная дыра в центре (есть всегда), звёзды, которые делаются из зерна сектор за сектором (не хранятся), правки поверх неё и системы её звёзд (SystemData). Единицы: световые годы, время в миллионах лет; плоскость галактики — X и Z, север — +Y.

- Kinds() — виды: spiral, barred (с перемычкой), lenticular (диск без рукавов), elliptical, irregular (сгустки молодых звёзд), dwarf (маленькая тусклая сфера), ring (кольцо молодых звёзд вокруг старого ядра).
- Make(options) — данные галактики из {Seed, Kind, Name, Radius, Arms, Pitch, Mass (чёрной дыры, в Солнцах), Coordinates (мегапарсеки)}; чего нет — из зерна и вида. data — {Manifest, Edits {Overrides, Removed, Added}, Systems}.
- Density(data, place) — звёзд в кубическом световом году (около 0.004 там, где Солнце в галактике вроде нашей).
- Sector(data, x, y, z, limit) — звёзды сектора (куб Manifest.Sector, 100 св. лет), всегда одни и те же: {Count, Stars: [{ID, Name, Place, Mass, Temperature, Color, Luminosity, Class}]}; первые limit из всех, одни и те же при любом limit. Большинство — красные карлики.
- Star(data, id) — звезда по ID ('x.y.z-номер', сектор может быть и ниже нуля: '3.-1.-2-14').
- Position(data, place, time) — где место через time млн лет вращения (плоская кривая: 220 км/с, 734 св. года за млн лет).
- Added(data, time) — то, что добавлено руками (AddBody), там, где оно через time млн лет: звезда (Kind star) обходит центр, как остальные, и есть среди звёзд своего сектора со своей системой; тело вне систем движется по своей Velocity (св. лет за млн лет).
- Glow(data, count) — точки свечения всей галактики издали: {Positions, Colors}.
- System(data, id) — система звезды: записанная в галактике, иначе из зерна звезды с её массой (Astronomy.Generate с Mass); для 'centre' — система центральной чёрной дыры: дыра с диском и молодые звёзды на тесных вытянутых орбитах (сотни–тысячи а.е., как S2), из зерна галактики.
- Hole(data) — центральная чёрная дыра как тело ({ID: 'centre', Kind: 'blackhole', Place [0, 0, 0], Mass}); Star(data, 'centre') возвращает её же. HoleSystem(data) — её система из зерна.
- Cosmos(data, id) — фон неба системы звезды (Cosmos сцены): полоса её галактики, ось — север галактики, как лежит система.
- Rename, Remove, AddBody (тело вне систем: Place и Velocity), SetSystem — правки.
- Use, DataOf, Open, Write, Save, Pack — как у SystemData; части {Kind: 'galaxy'}, {Kind: 'edits'}, части записанной системы — с System: id.
