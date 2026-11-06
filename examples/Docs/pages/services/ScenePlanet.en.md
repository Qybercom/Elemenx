<!-- generated -->
# ScenePlanet

ScenePlanet: a planet as one continuous function of a direction from its centre, the same at any distance: the globe of the space of a Scene, the map an editor paints and each location of its surface read the very same numbers, so a coast seen from orbit is the coast walked on. Nothing is baked: a point is reckoned when it is asked for, as fine as it is asked.

- Make(options): a planet of options {Radius (km, 6371), Seed, Ocean (the part of it under the sea, 0.65), Relief (metres of its highest mountains, 8000), Depth (metres of its deepest sea, 6000), Plates (how many tectonic plates, 14), Detail (km: the finest the coasts are told by the globe; finer, the land and the sea are never turned one into the other, 2), Paint (what a developer drew, below), Biomes (names of SceneBiomes, the usual six), Baked (the grounds of locations baked into it, SceneLocations.Bake: {ID: {Latitude, Longitude, Turn, Size, Side, Heights, Edge}}; there its heights are theirs, edits and all, its own again over Edge metres at their edge)}. It gives {Options, Radius, Sample(direction, finest), Elevation(direction, finest) (finest: km, the finest asked; all by default), Land(direction), Plate(direction), Wind(direction), Climate(direction), Biome(direction), Point(direction), Direction(latitude, longitude), LatLon(direction)}. Sample gives all of a point at once: {Elevation (metres over the sea), Land (true over it), Plate {ID, Oceanic, Boundary (km to the next plate), Push (how the two meet: over 0 they close, mountains and trenches; under 0 they part, rifts and ridges)}, Wind [east, north] (m/s), Celsius, Temperature and Moisture (0 to 1), Biome (a name; '' under the sea)}.
- Paint: strokes over the globe, each of points [latitude, longitude] in degrees: land and sea (areas: Points, Edge km: continents and oceans where they are drawn), mountains (a line: Width km, Height metres), rift (a line: Width, Depth), river (a line: Width km), climate (an area: Temperature in °C more or less, Moisture more or less, Edge) and biome (an area: Biome, Edge).
- Project(view, direction) and Unproject(view, x, y): a globe in a view {Yaw, Pitch, Zoom, Width, Height}; Picture(options, view, rect, step, overlay) a piece of its picture (RGBA), each pixel reckoned of the planet, so it is sharp however near: overlay relief, plates, wind, temperature, moisture or biomes (Color); Work() the workers that paint it.
- Sphere(options): its ground as SceneTerrainGenerator.Sphere gives one (Land, Elevation, Point, Altitude, Patch with the colors of the globe): what a Scene lands on and draws near, square by square, as fine as the eye needs.
- Cells, CellAt, CellOf, CellCenter, CellCorners, CellNeighbours, CellPlace: the locations of a planet as cells, squares of the faces of a cube or hexagons of an icosahedron (12 of them pentagons), each a place for the step Planet of a World (its latitude, longitude, turn, size, outline and sides).

The same functions run in workers and in Node: they read no page.

## Methods

- `Direction(latitude, longitude)`
- `LatLon(direction)`
- `Make(options)`
- `Project(view, direction)`
- `Unproject(view, px, py)`
- `Picture(options, view, rect, step, overlay)`
- `Sphere(options)`
- `Work()`

## Tests

- [draws a planet of ScenePlanet from space of the lands of its globe](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L34) — `tests/regression/library-scene-landing.test.js`
- [turns a latitude and a longitude into a direction and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L31) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [keeps as much of it under the sea as Ocean says, warm at the equator and cold at the poles, its winds by their belts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L42) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [raises what was painted: a continent where it is drawn, a sea, a range of mountains, a climate and a biome of its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L64) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [tells its coasts at any scale alike: what is finer than Detail never turns the land into the sea](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L80) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [has tectonic plates whose borders close into mountains and part into rifts, each plate its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L104) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [paints a face of the globe as texels of a cube, each of its direction, strips of it alike, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L127) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [paints a piece of a globe in a worker byte for byte as in the page, and turns a pixel into a direction and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L154) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [gives its ground to land on as the Sphere of SceneTerrainGenerator does: its heights, squares with its colors, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L176) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [lays its surface out in cells of locations: each found of its points, its neighbours over the edges of the faces too, its place and outline a location takes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L198) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [lays its surface out in hexagons of an icosahedron too: 12 pentagons, each cell found of its points and of its ID, its neighbours round it, its sides shared with them the other way](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L246) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [makes land of plains, hills and ranges, its heights spread as on the Earth](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L306) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`

+7 more in the same files
