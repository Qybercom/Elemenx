<!-- generated -->
# UniverseData

UniverseData: вселенная как данные (docs/UNIVERSE-FORMAT.md, docs/SPACE-FORMAT.md) — паспорт, галактики, которые делаются из зерна куб за кубом без конца (столько, сколько в настоящей вселенной, в случайных местах, без пустот), галактики автора на своих местах, галактика, в которой начинают (Home), правки и записанные в неё галактики (GalaxyData). Единицы — мегапарсеки (Мпк; Units.ly — световых лет в одном).

- Make(options) — данные вселенной из {Seed, ID, Name, Cube (ребро куба, Мпк: 10), Density ({вид: галактик в кубическом Мпк}, по умолчанию Densities — настоящие числа), Near (Мпк: ближе этого к галактике автора галактики зерна не делаются, 0.5), Galaxies (галактики автора: {ID, Name, Seed, Kind, Coordinates [x, y, z] Мпк и всё, что принимает GalaxyData.Make}), Home (ID галактики, в которой начинают: авторской или из зерна)}. data — {Manifest, Edits {Overrides, Removed, Added}, Galaxies (записанные)}.
- Densities — галактик в кубическом мегапарсеке каждого вида, как в ближней вселенной: около 0.02 больших (spiral, barred, lenticular, elliptical) и вчетверо больше малых (irregular, dwarf), ring — редкость. У галактики вроде нашей соседка того же размера в паре мегапарсеков, малая — ближе мегапарсека.
- Cube(data, x, y, z) — галактики куба (x, y, z — целые, место в сетке) из зерна, всегда одни и те же, и авторские в нём: {Key, Count (из зерна, до исключений), Galaxies: [{ID, Name, Seed, Kind, Radius (св. лет), Place [x, y, z] (Мпк), Cube, Offset (Мпк внутри куба), Author}]}. Сколько галактик в кубе — из средней плотности, немного больше или меньше; каждая — из своей последовательности: место, вид (по долям плотности), зерно; остальное (радиус, рукава) — GalaxyData.Make этого зерна. Место — номер куба и смещение в нём, поэтому числа остаются малыми, как бы далеко ни был куб.
- CubeOf(data, place) — куб места [x, y, z] (Мпк).
- Near(data, place, radius, limit) — галактики в пределах radius Мпк от места, ближние первыми (Distance, Мпк), не больше limit.
- Find(data, id) — одна галактика списка по ID: 'x.y.z-n' из зерна или авторская.
- Galaxy(data, id) — данные галактики (GalaxyData): записанные во вселенной (Galaxies), иначе сделанные из её зерна и вида на её месте (Coordinates); раз сделанные хранятся.
- Home(data) — галактика, в которой начинают (Find от Manifest.Home; если не задана — спиральная, ближайшая к началу координат).
- Distance(a, b) — расстояние между двумя местами, Мпк.
- Pole(galaxy) — север галактики (из списка) во вселенной, из её зерна; Frame(galaxy) — её оси [X, Y (север), Z] во вселенной; Into(frame, way) — направление вселенной в осях галактики.
- Sky(data, id, count) — галактики, видимые из галактики id, самые крупные на вид первыми, count (16) штук, как их берёт фон (Far у SceneCosmos): {ID, Name, Kind, Distance (Мпк), Size (радианы, половина поперечника, как есть), Way и Pole (в осях галактики, из которой смотрят), Shape (зерно облика для шейдера: вид, рукава, бар)}.
- SkyFrom(data, place, count) — то же, но из точки между галактиками (Мпк; туда выходят из варпа), направления — вселенной. Размер на вид — угол по радиусу (не больше прямого: из галактики рядом она — огромный диск).
- Rename(data, id, name), Remove(data, id), Add(data, galaxy) (авторская), SetGalaxy(data, id, galaxy) — правки.
- Use, DataOf, Open, Write, Save, Pack — как у GalaxyData; части {Kind: 'universe'}, {Kind: 'edits'}, части записанной галактики — с Galaxy: id (galaxies/<id>/... в файле).

Все её числа — только точные (docs/UNIVERSE-FORMAT.md): последовательности зерна, суммы, произведения, корни. Поэтому одно зерно — одна и та же вселенная в любом браузере, в Node и в порте на PHP или C++; эталоны — docs/universe-golden.json.

Open по адресу папки (кончается на /) читает раскладку elemenx universe bake и serve (tools/universe.js): её universe.json и edits.json; Fetch(data, x, y, z, callback(error, cube)) читает там куб (он хранится и дальше Cube отдаёт его), а что прочитать не удалось — делает сам, то же самое. Команды CLI: elemenx universe bake <universe.json | seed> <папка> [--radius 20] [--around x,y,z] — область вокруг дома для любого статического сервера; elemenx universe serve <universe.json | seed> [--port 4180] — те же пути по запросу, вся вселенная без конца, и звёзды секторов её галактик (galaxies/<id>/sectors/<x>.<y>.<z>.json).

## Методы

- `Make(options)`
- `CubeOf(data, place)`
- `Distance(a, b)`
- `Cube(data, x, y, z)`
- `Near(data, place, radius, limit)`
- `Find(data, id)`
- `Galaxy(data, id)`
- `Home(data)`
- `Pole(galaxy)`
- `Frame(galaxy)`
- `Into(frame, way)`
- `Sky(data, id, count)`
- `SkyFrom(data, place, count)`
- `Rename(data, id, name)`
- `Remove(data, id)`
- `Add(data, galaxy)`
- `SetGalaxy(data, id, galaxy)`
- `Use(key, data)`
- `DataOf(key)`
- `Write(data, store, callback, whole)`
- `Save(data)`
- `Pack(data, callback)`
- `Open(source, callback)`
- `Fetch(data, x, y, z, callback)`

## Тесты

- [bakes the cubes round its home, the passport and the sky of its galaxies, as UniverseData makes them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js#L26) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js`
- [makes the galaxies of a cube of its seed, the same each time, as many as a real universe has, anywhere however far](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js#L27) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js`
- [puts the galaxies of the author at their places with none of the seed close to them, its home one of them or else a spiral near the origin](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js#L70) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js`
- [keeps what was changed of it (renamed, removed, added, a galaxy written) through its file](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js#L114) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js`
- [serves the same layout made as it is asked for, the stars of a sector of a galaxy too, anywhere](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js#L42) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js`
- [enters a galaxy (the data of its seed at its place), a system of it sees the galaxies round it in its sky, and leaves again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js#L124) — `libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js`
- [jumps to a galaxy of its sky at the steps between galaxies, out at its edge in the system of a star there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js#L252) — `libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js`
- [cannot go between galaxies with steps of a galaxy alone; out of the way on it, it stands between them with them all round it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js#L310) — `libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js`
