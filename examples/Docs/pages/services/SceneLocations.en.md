<!-- generated -->
# SceneLocations

SceneLocations: the locations of a planet of ScenePlanet, each a cell of its surface (ScenePlanet.CellAt) that a scene shows in detail, its neighbours beside it. They are told in the planet (the options of ScenePlanet.Make): LocationSize (km, the side of a cell, 4) and Locations {ID: location}, a location {ID (of its cell), Kind (generated: of the World of the planet there; model: a file, Model its address), World (a World of its own, SceneWorld, when it was edited; else the one of the planet there), Passages ([{Side (0 to 3: +X, +Z, -X, -Z of the location, as CellNeighbours), At (0 to 1 along it), Kind (road, path, river, tunnel, gate), Width (metres), Mode (seamless: the neighbour is walked into; passage: it is gone to through it), To (the ID of the neighbour)}]), Beyond (what is past a side with no neighbour: cliff, wall, void, sea or far, the far ground of the planet; far by default)}. A cell with no location told is one of the planet as it is, generated.

- Location(planet, id): a location resolved: {ID, Cell, Place (CellPlace: Latitude, Longitude, Turn, Size, Points), Kind, Model, World (its own, or SceneWorld.Library of the planet there), Passages, Beyond, Sides ([{Side, To (the ID of the cell beside), Told (whether a location is told there), Passages}])}.
- At(planet, latitude, longitude): the ID of the location of a point.
- Open(planet, id): the sides where a location may be added beside it (no location told there): [{Side, To}].
- Tell(planet, id, changes): the planet with a location told or changed (a copy); Forget(planet, id) with it gone.
- Passage(planet, id, passage): the planet with a passage added on a side of a location, and the same on the neighbour's side facing it (its At the other way along it), so both lead to each other.

The same functions run in workers and in Node: they read no page.

## Methods

- `At(planet, latitude, longitude)`
- `Location(planet, id)`
- `Open(planet, id)`
- `Tell(planet, id, changes)`
- `Forget(planet, id)`
- `Passage(planet, id, passage)`

## Tests

- [finds the location of a point, its place, its sides and its World: the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L18) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [tells locations, the sides still open beside them, and passages that lead both ways](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L38) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
- [flies down from space to a marker through the air, sets down in the location of the point, and goes up to a low orbit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L44) — `tests/regression/library-scene-landing.test.js`
- [picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L145) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
