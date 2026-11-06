<!-- generated -->
# SceneLocations

SceneLocations: the locations of a planet of ScenePlanet, each a cell of its surface (ScenePlanet.CellAt) that a scene shows in detail, its neighbours beside it. They are told in the planet (the options of ScenePlanet.Make): LocationSize (km, the side of a cell, 4), Grid (cube: squares of the faces of a cube, the usual; hex: hexagons of an icosahedron, 12 of them pentagons) and Locations {ID: location}, a location {ID (of its cell), Kind (generated: of the World of the planet there; model: a file, Model its address), World (a World of its own, SceneWorld, when it was edited; else the one of the planet there), Passages ([{Side (0 to 3: +X, +Z, -X, -Z of the location, as CellNeighbours; of a hex cell 0 to 5 round it), At (0 to 1 along it), Kind (road, path, river, tunnel, gate), Width (metres), Mode (seamless: the neighbour is walked into; passage: it is gone to through it), To (the ID of the neighbour)}]), Beyond (what is past a side with no location told beside it, or with passages to it: cliff, wall, void, sea or far, the far ground of the planet; far by default)}. A cell with no location told is one of the planet as it is, generated.

- Location(planet, id): a location resolved: {ID, Cell, Place (CellPlace: Latitude, Longitude, Turn, Size, Points, Sides), Kind, Model, World (its own, or SceneWorld.Library of the planet there: a square ground round its outline (Extent), its step Border what is past the outline, its passages roads, rivers and gates out of it), Passages, Beyond, Sides ([{Side, To (the ID of the cell beside), Told (whether a location is told there), Passages}])}.
- At(planet, latitude, longitude): the ID of the location of a point.
- Open(planet, id): the sides where a location may be added beside it (no location told there): [{Side, To}].
- Tell(planet, id, changes): the planet with a location told or changed (a copy); Forget(planet, id) with it gone.
- Passage(planet, id, passage): the planet with a passage added on a side of a location, and the same on the neighbour's side facing it (its At the other way along it), so both lead to each other.
- Bake(planet, id, side, given): the planet with the ground of a location baked into it (Baked of ScenePlanet.Make): its heights, edits and all, so the globe and the surface show it as it is; Forget lets it go too.

The same functions run in workers and in Node: they read no page.

## Methods

- `At(planet, latitude, longitude)`
- `Location(planet, id)`
- `Open(planet, id)`
- `Tell(planet, id, changes)`
- `Forget(planet, id)`
- `Bake(planet, id, side, given)`
- `Passage(planet, id, passage)`

## Tests

- [finds the location of a point, its place, its sides and its World: the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L18) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [tells locations, the sides still open beside them, and passages that lead both ways](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L39) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [lays its locations out in hexagons too: six sides, passages on them both ways](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L67) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [makes what is past its outline: a cliff falls, a passage keeps its way open with a road to the middle, a wall stands with a gate, a side with a location beside and no passage stays open](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L87) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [bakes an edited location into the planet: its globe and its surface show the edit, the location beside and its own ground are as they were](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L146) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [has the settlements of its planet as settlements of its sketch, round their points and within it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L182) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [has the highways of its planet as roads of its sketch, meeting those of the location beside at their border](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L211) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L147) — `tests/regression/library-scene-landing.test.js`
- [flies down from space to a marker through the air, sets down in the location of the point, and goes up to a low orbit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L199) — `tests/regression/library-scene-landing.test.js`
- [flies on into the location beside at the same point of the planet, through a passage behind a veil, the far ground of the planet past it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L453) — `tests/regression/library-scene-landing.test.js`
- [picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L145) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [gathers the water of its land into rivers down to the sea, cuts their valleys, and gives them to the locations they cross](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L370) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
