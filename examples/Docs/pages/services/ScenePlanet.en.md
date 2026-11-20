<!-- generated -->
# ScenePlanet

ScenePlanet: a planet as one continuous function of a direction from its centre, the same at any distance: the globe of the space of a Scene, the map an editor paints and each location of its surface read the very same numbers, so a coast seen from orbit is the coast walked on. Nothing is baked: a point is reckoned when it is asked for, as fine as it is asked.

- Make(options): a planet of options {Radius (km, 6371), Seed, Ocean (the part of it under the sea, 0.65), Relief (metres of its highest mountains, 8000), Mountains (how mountainous, 0 to 1: a flat world, the Earth at 0.5, ranges everywhere at 1), Depth (metres of its deepest sea, 6000), Plates (how many tectonic plates, 14), Detail (km: the finest the coasts are told by the globe; finer, the land and the sea are never turned one into the other, 2), Paint (what a developer drew, below), Biomes (names of SceneBiomes, the usual nine: temperate, taiga, tundra, desert, savanna, swamp, rainforest, semidesert, steppe), Baked (the grounds of locations baked into it, SceneLocations.Bake: {ID: {Latitude, Longitude, Turn, Size, Side, Heights, Edge}}; there its heights are theirs, edits and all, its own again over Edge metres at their edge)}. It gives {Options, Radius, Sample(direction, finest), Elevation(direction, finest) (finest: km, the finest asked; all by default), Land(direction), Plate(direction), Wind(direction), Climate(direction), Biome(direction), Point(direction), Direction(latitude, longitude), LatLon(direction), Slope(direction, reach) (how steep its ground is, rise over run of reach km, 0.3; 0 over the sea)}. Sample gives all of a point at once: {Direction (its unit direction), Elevation (metres over the sea), Land (true over it), Plate {ID, Oceanic, Boundary (km to the next plate), Push (how the two meet: over 0 they close, mountains and trenches; under 0 they part, rifts and ridges)}, Wind [east, north] (m/s), Celsius, Temperature and Moisture (0 to 1), Biome (a name; '' under the sea)}.
- Paint: strokes over the globe, each of points [latitude, longitude] in degrees: land and sea (areas: Points, Edge km: continents and oceans where they are drawn), mountains (a line: Width km, Height metres), rift (a line: Width, Depth), river (a line: Width km), climate (an area: Temperature in °C more or less, Moisture more or less, Edge) and biome (an area: Biome, Edge).
- Rules (of detail): {Biomes: {biome: rule, '*': any land}, Graphs: {name: a generator graph of its own}, Parameters: {rule: values}, Scale (km, 20)} and Regions [{Rule, Points, Edge}] (areas painted, over the rule of their land): what is finer than Scale is the detail of the rule of the place (a generator of Blueprints: inputs X, Y, Z, East, North (km), Height (its coarse height), Scale, Finest, Latitude, Celsius, Temperature, Moisture, WindEast, WindNorth, River; result Height, metres) in the place of its own; generated (no rule) is its own. The rules of the library are resources <Library>/rules/<name> (ScenePlanet.Rules: hills, mountains, dunes, mesas, badlands, plains, volcanoes, craters, glacial, karst); Ruled(options) makes their code in the page for the workers.
- Its land and its relief are graphs of Blueprints, blueprints/planet/land (inputs PX, PY, PZ, Oceanic, Level, WLand, WSea, Octaves, SShape; result Land) and blueprints/planet/relief (inputs the point, its east and north EX.. NX.., Land, Boundary, Push, Oceanic, Small (km, the finest asked: what is finer is skipped by When), Relief, Mountains, Depth, Radius, Octaves, PaintRaise, PaintRift, PaintRiver and the shifts of its noises SFolds.. SGrain; result Height, metres, before its rivers, edits and locations). Its climate (of options; its data keeps its own) is of three more: blueprints/planet/wind (inputs the point, Band, degrees of latitude, Latitude, radians, SWeather; results East and North, m/s), blueprints/planet/rough (its land roughly where the wind comes from, of fewer octaves: the point, Oceanic, Level, WLand, WSea, SShape; result Rough) and blueprints/planet/climate (the point, Latitude, Band, Height, Upwind, of the lands and seas six samples up the wind, PaintTemperature, PaintMoisture, SWeather; results Celsius and Moisture). LandGraph, ReliefGraph, RoughGraph, WindGraph and ClimateGraph: graphs of its own; ReliefRun(name) the library's as a function {Main, Inputs, Keys}, ReliefMake(graph) the code of one {Source, Inputs, Keys}, ReliefOf(name, graph, code) its function; GraphSources(options) the code of its own (ReliefSources) for the workers, as Ruled(options) and SceneTerrainGenerator.Site give it them.
- Edits: what was changed of its relief after it was made, brushes along a path, in their order: [{Type (raise, lower, flatten, smooth), Points [[latitude, longitude]...], Radius (km), Amount (metres; of smooth 0 to 1), Height (metres, of flatten)}]; the nearer the path the more, none past Radius. Paint makes the planet, Edits change what it made.
- Project(view, direction) and Unproject(view, x, y): a globe in a view {Yaw, Pitch, Zoom, Width, Height}; Picture(options, view, rect, step, overlay) a piece of its picture (RGBA), each pixel reckoned of the planet, so it is sharp however near: overlay relief, plates, wind, temperature, moisture or biomes (Color); Work() the workers that paint it.
- Sphere(options): its ground as SceneTerrainGenerator.Sphere gives one (Land, Elevation, Point, Altitude, Patch with the colors of the globe): what a Scene lands on and draws near, square by square, as fine as the eye needs.
- Cells, CellAt, CellOf, CellCenter, CellCorners, CellNeighbours, CellPlace: the locations of a planet as cells, squares of the faces of a cube or hexagons of an icosahedron (12 of them pentagons), each a place for the step Planet of a World (its latitude, longitude, turn, size, outline and sides).
- Data (a key of UseData): a planet of data (PlanetData): as coarse as its tiles, its heights and biomes of them; finer, the relief and the lands of the options it was made of, its Edit over the relief; its climate and plates of its tiles (Climate, Plate) as coarse as they are; its rivers, settlements and highways of its vectors unless they are given (DataVectors(key): their keys; Vectored(options): options with them; TownsFor(options): its settlements). UseData(key, data), DataOf(key), TileName, TileDirection, TilePlace (the tiles on the faces of the cube, by equal angles) and TileValues (the samples of a tile, what PlanetData.Bake makes).
- Defaults and Rivers: the settings of a planet made of none and the numbers of its rivers (resources/planet). Kind(kind): the numbers of a kind of settlement on a planet (Share, Apart, Core, Fields, Lights, Glow, Use); KindByShare(share): the kind of a place by its share of all of them, the best first; Warmth(celsius): the warmth of a temperature, 0 at -25 degrees to 1 at 35, what its lands are chosen by.

The same functions run in workers and in Node: they read no page.

## Methods

- `Direction(latitude, longitude)`
- `LatLon(direction)`
- `Make(options)`
- `Project(view, direction)`
- `Unproject(view, px, py)`
- `Picture(options, view, rect, step, overlay)`
- `Kind(kind)`
- `KindByShare(share)`
- `Warmth(celsius)`
- `ReliefRun(name)`
- `ReliefMake(graph)`
- `GraphSources(options)`
- `ReliefOf(name, graph, code)`
- `Ruled(options)`
- `TownsFor(options)`
- `UseData(key, data)`
- `DataVectors(key)`
- `Vectored(options)`
- `DataOf(key)`
- `Sphere(options)`
- `Work()`

## Tests

- [draws a planet of ScenePlanet from space of the lands of its globe](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L35) — `tests/regression/library-scene-landing.test.js`
- [stands houses where a settlement is, woods where trees grow, and nothing on the sea](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/planet-things.test.js#L45) — `tests/regression/planet-things.test.js`
- [gives the numbers of a kind of settlement, the kind of a place by its share, and the warmth of a temperature](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L32) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [turns a latitude and a longitude into a direction and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L46) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [keeps as much of it under the sea as Ocean says, warm at the equator and cold at the poles, its winds by their belts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L57) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [raises what was painted: a continent where it is drawn, a sea, a range of mountains, a climate and a biome of its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L79) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [tells its coasts at any scale alike: what is finer than Detail never turns the land into the sea](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L95) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [has tectonic plates whose borders close into mountains and part into rifts, each plate its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L119) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [paints a face of the globe as texels of a cube, each of its direction, strips of it alike, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L142) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [gives how the ground of a face leans: level over the sea, down its slopes on land, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L173) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [paints a piece of a globe in a worker byte for byte as in the page, and turns a pixel into a direction and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L238) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [gives its ground to land on as the Sphere of SceneTerrainGenerator does: its heights, squares with its colors, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L260) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`

+40 more in the same files
