# The planet format

Today a planet is code: `ScenePlanet.Make(options)` is one continuous function of a direction, every point reckoned from noise when it is asked for. The format turns a planet into data: what is stored is read, what is finer than what is stored is made by rules, the same way everywhere (the globe, the surface, each location). One format serves both ways a planet comes:

- **Generated**: our own offline work (tectonics, erosion, drainage, climate, settlements) written into it once (`PlanetData.Bake`).
- **Ready**: a planet made elsewhere (an editor, another tool) and written in the same format. There is no other import: the format is the only input.

Decisions of 2026-11-13: the simulation (climate, erosion) runs only at generation for now, its state kept apart so it can run in game time later; a planet comes from a local file and from the network; the size of a planet has no limit; the rules of detail end as Blueprints.

## A planet is

| Part | What it holds | Kept as |
|---|---|---|
| Passport | Format, Version, ID, Name, Radius (km), Tilt, Day (hours), Year (days), Sea level (m), Atmosphere, Seed, how it was made (Origin) | `planet.json` |
| Layers | rasters over the cube sphere: Height, Edit, Biome, Climate, Plate... each to its own depth | tiles |
| Vectors | coasts, rivers with their flow and bed, roads, settlements, borders of plates | `vectors/<name>.json` |
| Rules | how detail finer than the tiles is made, by region: mountains, dunes, meanders, woods | `rules/<name>.json` (Blueprints in the end) |
| Objects | placed things and sowing rules | `objects/...` |
| Edits | sparse changes over all the rest: today's Paint and Baked locations | `edits.json` |
| State | what a simulation in game time changes (none yet) | `state/...`, apart from the rest |

## Tiles

- Each face of the cube (0 to 5, as `ScenePlanet` and `cubeDirection` number them) is a quadtree: level 0 is the whole face, level L has 2^L by 2^L tiles.
- A tile has `Size` texels on a side (256 by default) and its first and last texels lie on its edges, as `PatchPicture` does: two tiles share their edge samples, so a bilinear read never shows a seam.
- A texel of a tile is placed by equal angles on the face (the warp `ScenePlanet` uses for cells), so texels near the corners of a face are not much smaller than in its middle.
- Each layer has its own `Depth`: the deepest level it is stored to. A layer stores only the detail it carries: Biome and Climate stop early, Height goes deep. A tile can be missing under its depth where nothing more is to be said (a flat sea); then its parent is read.
- A tile is one binary blob: a little header (magic, type, face, level, filter, x, y, size) and its samples, row by row, each kept as its difference from the one before it in its row (the first of a row from the first of the row above: filter 1), what deflate packs best of a relief. Types: `int16` (Height in metres), `uint8` (Biome: an index into the table of the manifest), `rgba8` (four bytes a sample: Climate is its warmth from -40 to 50 °C, its moisture, its wind east and north from -16 to 16 m/s; Plate is the plate, 255 for an oceanic one, the km to the next plate by tens and how the two meet, Push from -2 to 2).
- The name of a tile is `tiles/<layer>/<face>/<level>/<x>-<y>.bin`.

## Where a planet lives

- **Network**: a folder of files at a URL: `planet.json` and the tiles by their names. Tiles are fetched as they are needed and kept in IndexedDB (`elemenx-planets`) by the ID and Version of the planet.
- **Local file**: one file, a zip of the same files: `PlanetData.Save` stores them (`Archive.Zip`), `PlanetData.Pack` deflates them (`Archive.Compress`); either opens. `planet.json` and its vectors come first, then its tiles level by level, so its coarse tiles lie together; over 65535 files or past 4 GB it is a ZIP64. Opened from a `File`, a `Blob` or bytes; it can be put into IndexedDB whole, to open again without the file.
- **In memory**: what `Bake` gives, to use at once, save, or store.

- **Any store** (step 4): what is read and written is a part told by a descriptor (`{Kind: 'tile', Layer, Face, Level, X, Y}`, `{Kind: 'edits'}`, `{Kind: 'objects', ID}`...), never by a path or the name of a file; a store reads and writes parts: over `Elemenx.Network.Transfer` and the Transport the application gives (its URLs, methods and headers its own), in IndexedDB, or in one file. Only what changed is written. See `docs/SPACE-FORMAT.md`: the same parts and stores serve galaxies, systems and bodies.

## Reading

`PlanetData.Open(source, callback(error, data), settings)` gives a planet's data: its passport and all its tiles, read before the callback. With `settings.Levels` a planet of the network has its tiles to that level read then (its one file by ranges of bytes: its directory at its end, its passport, its coarse tiles in one range; a folder by its files), and `PlanetData.Need(data, direction, reach, finest, callback)` reads the finer ones round a direction, over `reach` km, as fine as `finest` km; `ScenePlanet.AddTiles` gives them to its workers. A Scene does it by itself for `Surface-Planet='{"Data": "...", "Levels": 2}'`: once a second, round the eye, over three times its height, as fine as a twentieth of it. A tile missing (not read yet, or left out) is read of its coarser one. A folder of the network, once read, is kept in IndexedDB, and the same manifest again is taken from there.

`ScenePlanet.Make({Data: key})` makes the planet of data that was given a key (`ScenePlanet.UseData(key, data)`, shared with the workers as `UseRivers` shares rivers). A Scene opens it by itself: `Surface-Planet='{"Data": "/data/planets/terra.planet"}'`, and draws no other planet in its place while it comes. A point is then:

- **as coarse as its finest tile there, or coarser** (the globe, far squares): its Height read between the samples of the tile, its Biome of the nearest sample. Cheaper than the relief: the Orbit globe is ready in 28 s instead of 40.
- **finer**, for a planet made of options (`Origin` generated): the relief and the lands of those options, and over the relief the tiles of `Edit` (metres more or less) where there are any. The relief is not smooth within a texel (ranges, peaks): samples read between them lost up to 4.7 km of it, and the borders of the lands became squares of tens of kilometres. So a baked planet and the planet of its options are the same planet, and what was changed of it (erosion, an editor) lives in `Edit`.
- **finer**, for a planet of data alone: its tile, its rivers and its baked locations over it (rules of detail come with step 4).

Its climate (warmth, moisture, wind) is that of its tiles of `Climate` as coarse as they are; finer, a planet made of options has the climate of those options. A planet of data alone has its plates of its tiles of `Plate`. Its rivers, settlements and highways are its vectors unless the options give their own (`ScenePlanet.DataVectors(key)`, `Vectored(options)`): a Scene makes none of them again.

## Writing

`PlanetData.Bake(options, settings, callback)` samples the planet of `ScenePlanet` options into tiles (Depth, Size, Biomes, Climate, Plates of settings), tile by tile in the workers of planets; with `Vectors: true` it makes its rivers (heights of `VectorSize` a side of a face, then their drainage), its settlements by them (`Towns` places tried) and its highways between those, as a Scene makes them, and keeps them as `vectors/<name>.json` (named by `Manifest.Vectors`). The height of a tile of a level is the relief no finer than its texel. Adaptive depth: a tile that says nothing more than its coarser one read where it lies, to `Tolerance` of the settings of Bake (`{Height: 2, Climate: 1, Plate: 0, Biome: 0}`: metres, steps of a byte; `PlanetData.Prune(data, tolerance)`), is left out. `PlanetData.Save(data)` gives the bytes of its file, `PlanetData.Pack(data, callback)` its file deflated; `PlanetData.Store(data, callback)` keeps it in IndexedDB.

In Node: `node scripts/planet-bake.js '{"Seed": "terra", "Ocean": 0.62, "Radius": 6371}' examples/Advanced/data/planets/terra.planet --id terra --name Terra` (depth 3, 65 samples a side, biomes, climate and plates to level 2, its vectors; `--vectors false` leaves them out).

## Steps

1. The first slice (done 2026-11-13): the passport, Height, Edit and Biome tiles, Bake, Open (memory, file, network), the IndexedDB store, `ScenePlanet.Make({Data})` reading them, a Scene opening `Data` by itself, the planet of `/gaming` Orbit opened from a baked file.
2. Climate and Plate as layers; vectors (rivers, settlements, highways) as files instead of the `Use*` keys (done 2026-11-13).
3. Tiles streamed round the eye (`Need`), detail stored only where it is (adaptive depth), tiles compressed, ZIP64 for files over 4 GB or 65535 tiles (done 2026-11-13).
4. Edits: the brushes of PlanetEditor (raise, lower, flatten, smooth) as `Edits` of the options, applied at every point, kept in `edits.json` with the baked locations, the tiles they touch made again (`PlanetData.Retile`) (done 2026-11-13). Objects: the documents of its locations in it, and the stores of parts (next). The rules of detail as Blueprints (done 2026-11-13): what is finer than `Rules.Scale` (20 km) is the detail of the rule of the place in the place of the relief it was made with: the rule of its biome (`Rules.Biomes`), a region painted over it first (`Regions`, kept in `edits.json`); the rules of the library are generator graphs (`blueprints/rules/*.json`: hills, mountains, dunes, mesas, badlands, plains, volcanoes, craters, glacial, karst), a planet's own in `Rules.Graphs`; PlanetEditor draws the regions, sets the rule of each biome and edits the graph of a rule (Blueprint), a rule of the library edited becoming the planet's own. Next: the whole generator of a planet as a graph of kind `planet`, step by step.
5. The far-ground and colour items left for after the format: snow and rock as a layer, the far blur, clouds by the terminator.
6. State and a simulation that steps in game time.
