<!-- generated -->
# PlanetData

PlanetData: планета как данные (docs/PLANET-FORMAT.md) — паспорт и слои, каждый тайлами на гранях куба: у каждой грани своё дерево квадрантов, уровень 0 — вся грань, уровень L — 2^L на 2^L тайлов. ScenePlanet читает их вместо своего шума: ScenePlanet.UseData(key, data), а затем Make({Data: key}).

- Bake(options, settings, callback(error, data)) — записать планету с опциями ScenePlanet как данные, в воркерах планеты. settings: ID, Name, Depth (самый глубокий уровень высот, 3), Size (отсчётов на сторону тайла, 129), Biomes (самый глубокий уровень биомов, 2), Progress(done, total). Высота тайла уровня — рельеф планеты не мельче его текселя.
- Open(source, callback(error, data)) — данные планеты: то, что дал Bake; байты её файла (Save; Blob, File, ArrayBuffer или Uint8Array); URL файла (.planet, .zip, blob:) или папки её файлов (planet.json и тайлы, которые он перечисляет). Все тайлы прочитаны до вызова callback. Планета из сети, прочитанная один раз, хранится в браузере (Store), и та же планета снова (тот же manifest) берётся оттуда: из сети приходит только planet.json.
- Save(data) — байты её файла: zip из planet.json и тайлов (Archive.Zip).
- Store(data, callback(error)), Stored(id, callback(error, data)), List(callback(error, [manifest])), Remove(id, callback(error)) — планеты в браузере (IndexedDB, база elemenx-planets), чтобы открыть их снова без файла; хранятся, пока их не удалят. Stored без такой планеты (или без IndexedDB) даёт null, Store без IndexedDB — ошибку.
- Tile(bytes) и Bytes(layer, face, level, x, y, values) — тайл из байтов его файла ({Face, Level, X, Y, Size, Values}) и обратно.

data — {Manifest, Tiles: {имя: Int16Array или Uint8Array}}. Manifest — паспорт: Format (elemenx-planet), Version (1), ID, Name, Radius (км), Sea, Seed, Origin ({Kind: generated, Options} — из чего она сделана), Size, Layers ({Height: {Type: int16, Unit: m, Depth}, Edit (изменения рельефа в метрах, плюс или минус, только там, где они есть; после Bake тайлов нет), Biome: {Type: uint8, Depth, Table — имена биомов, 0 — море}}), Tiles (имена всех тайлов). Имя тайла — слой/грань/уровень/x-y, в файле — tiles/имя.bin: заголовок в 32 байта (EPT1, тип отсчётов, грань, уровень, x, y, размер) и отсчёты строка за строкой. Первый и последний отсчёты тайла лежат на его краях, так что два соседних тайла делят отсчёты края и чтение между ними не даёт шва; отсчёты стоят на грани по равным углам.

Планета данных в ScenePlanet: не мельче самого мелкого тайла в точке её высота — из тайла (между четырьмя отсчётами), это дешевле рельефа. Мельче у планеты, сделанной из опций (Origin generated), — рельеф этих опций и поверх него Edit, так что планета, сделанная Bake, и планета её опций — одна и та же (рельеф не гладок внутри текселя: чтение между отсчётами теряло километры хребтов). У планеты из одних данных — её тайл, поверх её реки и запечённые локации. Биом — из ближайшего отсчёта его тайла.

## Методы

- `Bake(options, settings, callback)`
- `Bytes(layer, face, level, x, y, values)`
- `Tile(bytes)`
- `Save(data)`
- `Open(source, callback)`
- `Store(data, callback)`
- `Stored(id, callback)`
- `List(callback)`
- `Remove(id, callback)`

## Тесты

- [draws nothing in its place till its data comes, then its globe of the tiles of its data](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-planet-data.test.js#L76) — `tests/regression/library-scene-planet-data.test.js`
- [tells when the data of its planet is not there, and draws no other planet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-planet-data.test.js#L135) — `tests/regression/library-scene-planet-data.test.js`
- [places a direction on a face of the cube and back, by equal angles](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L41) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [bakes the planet of options into its passport and the tiles of its heights and biomes, level by level](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L60) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [keeps the heights of the planet at the samples of its tiles, and its edge samples shared by two tiles](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L79) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [saves a planet to one file and opens it again, the same](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L96) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [opens a planet of the network: a folder of its files, or its one file](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L108) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [keeps planets in the browser, lists them and lets them go](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L157) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [makes a planet of its data: as coarse as its tiles, their heights; finer, its own relief and the edits of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L196) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
