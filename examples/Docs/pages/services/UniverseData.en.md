<!-- generated -->
# UniverseData

UniverseData: a universe as data (docs/UNIVERSE-FORMAT.md, docs/SPACE-FORMAT.md): its passport, its galaxies made of its seed cube by cube with no end (as many as a real universe has, at random places, with no voids), the galaxies of its author at their places, the galaxy one starts in (Home), what was changed of it, and the galaxies written in it (GalaxyData). Units: megaparsecs (Mpc; Units.ly the light-years of one).

- Make(options): the data of a universe of options {Seed, ID, Name, Cube (the edge of a cube, Mpc: 10), Density ({kind: galaxies a cubic Mpc}: Densities by default, of real counts), Near (Mpc: no galaxy of the seed nearer than this to one of the author, 0.5), Galaxies (those of the author: {ID, Name, Seed, Kind, Coordinates [x, y, z] Mpc, and what else GalaxyData.Make takes}), Home (the ID of the galaxy one starts in: of the author or of the seed)}. data is {Manifest, Edits {Overrides: {id: {Name}}, Removed: [id], Added: [galaxies of the author added]}, Galaxies: {id: galaxy data written}}.
- Cube(data, x, y, z): the galaxies of a cube (x, y, z whole numbers: its place in the grid) made of the seed, the same each time, and those of the author in it: {Key, Count (of the seed, before what is left out), Galaxies: [{ID, Name, Seed, Kind, Radius (ly), Place [x, y, z] (Mpc), Cube, Offset (Mpc in its cube), Author (one of the author)}]}.
- Densities: galaxies a cubic Mpc of each kind, of the near universe (some 0.02 large ones, four times as many small).
- CubeOf(data, place): the cube of a place [x, y, z] (Mpc).
- Near(data, place, radius, limit): the galaxies within radius Mpc of a place, the nearest first (Distance, Mpc), at most limit of them.
- Find(data, id): one galaxy of the list (as Cube has them) of its ID: 'x.y.z-n' of the seed, or one of the author.
- Galaxy(data, id): the data of a galaxy (GalaxyData): written in the universe (Galaxies), else made of its seed and kind at its place (Coordinates), kept once made.
- Home(data): the galaxy one starts in (Find of Manifest.Home; when none is told, the spiral one nearest the origin).
- Distance(a, b): between two places, Mpc.
- Pole(galaxy): the north of a galaxy (of the list) in the universe, of its seed; Frame(galaxy): its axes [X, Y (its north), Z] in the universe, what a way of the universe is in the galaxy (Into(frame, way)).
- SkyFrom(data, place, count): the same seen from a place between them (Mpc; out of a warp there), ways of the universe.
- Sky(data, id, count): the galaxies seen from one (its ID), those that look the largest first, count (16) of them, as a backdrop has them (SceneCosmos Far): {ID, Name, Kind, Distance (Mpc), Size (radians: half across, as it is), Way and Pole (in the frame of the galaxy seen from), Shape (the seed of its look for the shader: its kind, arms, bar)}.
- Rename(data, id, name), Remove(data, id), Add(data, galaxy) (one of the author), SetGalaxy(data, id, galaxy): what is changed of it.
- Use(key, data), DataOf(key); Open(source, callback), Write(data, store, callback, whole), Save(data), Pack(data, callback): as GalaxyData (parts {Kind: 'universe'}, {Kind: 'edits'}, those of a galaxy written with Galaxy: id). Open of the address of a folder (ending in /) reads the layout of elemenx universe bake and serve (tools/universe.js): its universe.json and edits.json; Fetch(data, x, y, z, callback(error, cube)) reads a cube of it there (kept, as Cube gives it then), made here when it is not.

Its numbers are only the exact ones (docs/UNIVERSE-FORMAT.md): its sequences, sums, products and square roots.

## Methods

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

## Tests

- [bakes the cubes round its home, the passport and the sky of its galaxies, as UniverseData makes them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js#L26) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js`
- [makes the galaxies of a cube of its seed, the same each time, as many as a real universe has, anywhere however far](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js#L27) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js`
- [puts the galaxies of the author at their places with none of the seed close to them, its home one of them or else a spiral near the origin](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js#L70) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js`
- [keeps what was changed of it (renamed, removed, added, a galaxy written) through its file](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js#L114) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.test.js`
- [serves the same layout made as it is asked for, the stars of a sector of a galaxy too, anywhere](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js#L42) — `libraries/ElemenxGraphics/services/UniverseData/UniverseData.node.test.js`
- [enters a galaxy (the data of its seed at its place), a system of it sees the galaxies round it in its sky, and leaves again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js#L124) — `libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js`
- [jumps to a galaxy of its sky at the steps between galaxies, out at its edge in the system of a star there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js#L252) — `libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js`
- [cannot go between galaxies with steps of a galaxy alone; out of the way on it, it stands between them with them all round it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js#L310) — `libraries/ElemenxGraphics/traits/SceneUniverse/SceneUniverse.test.js`
