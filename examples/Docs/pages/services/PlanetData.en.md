<!-- generated -->
# PlanetData

PlanetData: a planet as data (docs/PLANET-FORMAT.md): its passport and its layers as tiles over the faces of a cube, each face a quadtree, what ScenePlanet reads in place of its noise (Make({Data: key}), ScenePlanet.UseData).

- Bake(options, settings, callback(error, data)): the planet of ScenePlanet options written as data, in the workers of the planet: settings {ID, Name, Depth (the deepest level of Height, 3), Size (samples a side of a tile, 129), Biomes (the deepest level of Biome, 2), Climate and Plates (the deepest levels of Climate and of Plate, as Biomes), Vectors (true: its rivers, settlements and highways made and kept too, as a Scene makes them: of heights of VectorSize, 256, a side of a face, and Towns places tried, 20000), Tolerance (adaptive depth: {layer: how much a sample may differ from its coarser tile read there for the tile to be left out}: {Height: 2 (m), Climate: 1, Plate: 0, Biome: 0} by default, false keeps them all; Prune(data, tolerance)), Progress(done, total)}.
- Open(source, callback(error, data), settings): the data of a planet from what Bake gave, the bytes of its file (Save or Pack; a Blob, a File, an ArrayBuffer or a Uint8Array) or the URL of its file or of a folder of its files (planet.json and what it lists), all its tiles read before the callback; with settings.Levels a planet of the network has its tiles to that level read then, its finer ones as they are needed: Need(data, direction, reach, finest, callback(error, names)) reads those round a direction (its file by ranges of bytes, a folder by its files).
- Save(data): the bytes of its file: a zip of planet.json, its vectors and its tiles (Archive.Zip), the coarse tiles first; Pack(data, callback(error, bytes)): the same zip, deflated (Archive.Compress).
- Store(data, callback(error)), Stored(id, callback(error, data)), List(callback(error, [manifest])), Remove(id, callback(error)): planets kept in the browser (IndexedDB, elemenx-planets), to open again without their file.
- Tile(bytes), Bytes(layer, face, level, x, y, values, type): a tile from the bytes of its file and back (its samples kept as their differences, what deflate packs best).

data is {Manifest, Tiles: {name: Int16Array or Uint8Array}, Vectors: {Rivers, Settlements, Highways}, Edits: {Edits, Baked}}; a tile is named layer/face/level/x-y and kept in its file as tiles/<name>.bin (its samples of four bytes for a layer of rgba8: Climate, Plate), a vector as vectors/<name>.json (the paths its Manifest.Vectors names), its edits as edits.json (Manifest.Edits): what was changed of it after it was made, the brushes of its relief (ScenePlanet Edits) and the grounds of its locations baked into it (Baked), not of the options it was made of (its Origin).

- Retile(data, edits, callback(error, names)): its edits changed (brushes of PlanetEditor): the tiles they touch made again, in the workers, of the options it was made of (a planet of data alone keeps its tiles).
- Parts and stores (docs/SPACE-FORMAT.md): what is read and written is a part told by a descriptor, never a path: {Kind: 'manifest'}, {Kind: 'tile', Layer, Face, Level, X, Y}, {Kind: 'vector', Name}, {Kind: 'edits'}, {Kind: 'objects', ID}. A store is {Read(part, callback(error, bytes or null)), Write(part, bytes, callback(error)), and maybe ReadMany(parts, callback(error, list)), WriteMany(parts, list, callback(error)), Remove(part, callback(error)), Watch(callback(part)) (a part changed elsewhere: returns its stop)}; Open(store, callback, settings) reads a planet of one (its tiles to settings.Levels; the finer ones by Need, its objects as they are asked for), Write(data, store, callback, whole) writes what changed of it since it was read or written (all of it with whole). Browser(name): a store of the browser (IndexedDB), a key for each part. Remote(settings): a store of the network, its parts carried by Elemenx.Network.Transfer over the Transport the application gives. Key(part) and Path(part): the key of a part, and its path in a file.
- Objects(data, id, callback(error, document)): the document of a location (what SceneEditor edits there), read as it is asked for; SetObjects(data, id, document): it changed (null: none there now).

## Methods

- `Bake(options, settings, callback)`
- `Retile(data, edits, callback)`
- `Bytes(layer, face, level, x, y, values, type)`
- `Tile(bytes)`
- `Key(part)`
- `Path(part, manifest)`
- `Objects(data, id, callback)`
- `SetObjects(data, id, document)`
- `Write(data, store, callback, whole)`
- `Remote(settings)`
- `Browser(name)`
- `Save(data)`
- `Pack(data, callback)`
- `Read(files, callback)`
- `Open(source, callback, settings)`
- `Need(data, direction, reach, finest, callback)`
- `Prune(data, tolerance)`
- `Store(data, callback)`
- `Stored(id, callback)`
- `List(callback)`
- `Remove(id, callback)`

## Tests

- [draws nothing in its place till its data comes, then its globe of the tiles of its data](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-planet-data.test.js#L76) — `tests/regression/library-scene-planet-data.test.js`
- [tells when the data of its planet is not there, and draws no other planet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-planet-data.test.js#L135) — `tests/regression/library-scene-planet-data.test.js`
- [places a direction on a face of the cube and back, by equal angles](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L113) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [bakes the planet of options into its passport and the tiles of its heights and biomes, level by level](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L132) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [keeps the heights of the planet at the samples of its tiles, and its edge samples shared by two tiles](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L151) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [saves a planet to one file and opens it again, the same](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L168) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [opens a planet of the network: a folder of its files, or its one file](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L180) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [keeps planets in the browser, lists them and lets them go](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L229) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [makes a planet of its data: as coarse as its tiles, their heights; finer, its own relief and the edits of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L268) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [bakes its climate and its plates as tiles, and a planet of data reads them, of data alone its plates too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L306) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [bakes its rivers, settlements and highways, keeps them in its file, and a planet of data has them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L348) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [bakes its settlements with what was changed of them, and keeps the changes of its rivers to lay them again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L376) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`

+6 more in the same files
