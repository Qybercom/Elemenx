<!-- generated -->
# PlanetData

PlanetData: a planet as data (docs/PLANET-FORMAT.md): its passport and its layers as tiles over the faces of a cube, each face a quadtree, what ScenePlanet reads in place of its noise (Make({Data: key}), ScenePlanet.UseData).

- Bake(options, settings, callback(error, data)): the planet of ScenePlanet options written as data, in the workers of the planet: settings {ID, Name, Depth (the deepest level of Height, 3), Size (samples a side of a tile, 129), Biomes (the deepest level of Biome, 2), Progress(done, total)}.
- Open(source, callback(error, data)): the data of a planet from what Bake gave, the bytes of its file (Save; a Blob, a File, an ArrayBuffer or a Uint8Array) or the URL of a folder of its files (planet.json and its tiles), all its tiles read before the callback.
- Save(data): the bytes of its file: a zip of planet.json and its tiles (Archive.Zip).
- Store(data, callback(error)), Stored(id, callback(error, data)), List(callback(error, [manifest])), Remove(id, callback(error)): planets kept in the browser (IndexedDB, elemenx-planets), to open again without their file.
- Tile(bytes), Bytes(layer, face, level, x, y, values): a tile from the bytes of its file and back.

data is {Manifest, Tiles: {name: Int16Array or Uint8Array}}; a tile is named layer/face/level/x-y and kept in its file as tiles/<name>.bin.

## Methods

- `Bake(options, settings, callback)`
- `Bytes(layer, face, level, x, y, values)`
- `Tile(bytes)`
- `Save(data)`
- `Open(source, callback)`
- `Store(data, callback)`
- `Stored(id, callback)`
- `List(callback)`
- `Remove(id, callback)`

## Tests

- [draws nothing in its place till its data comes, then its globe of the tiles of its data](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-planet-data.test.js#L76) — `tests/regression/library-scene-planet-data.test.js`
- [tells when the data of its planet is not there, and draws no other planet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-planet-data.test.js#L135) — `tests/regression/library-scene-planet-data.test.js`
- [places a direction on a face of the cube and back, by equal angles](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L41) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [bakes the planet of options into its passport and the tiles of its heights and biomes, level by level](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L60) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [keeps the heights of the planet at the samples of its tiles, and its edge samples shared by two tiles](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L79) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [saves a planet to one file and opens it again, the same](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L96) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [opens a planet of the network: a folder of its files, or its one file](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L108) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [keeps planets in the browser, lists them and lets them go](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L157) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
- [makes a planet of its data: as coarse as its tiles, their heights; finer, its own relief and the edits of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js#L196) — `libraries/ElemenxGraphics/services/PlanetData/PlanetData.test.js`
