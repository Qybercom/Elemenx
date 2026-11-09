<!-- generated -->
# SceneShowcase

SceneShowcase: one big world made of every primitive of the generation of a Scene, district by district, as a demo of what they make together and as a benchmark of a scene as large as a game has.

- World(options) gives the world: {Name, Seed (of its ground: a Scene of a Seed would make a star system round it), Size, Time, Weather, Objects (specs for Scene.Add, the ground first), Districts ([{ID, Name, X, Y, Radius, Shows (the primitives it shows)}]), Route (the views a tour of it goes through: [{ID, Name, Target [x, y, z], Yaw, Pitch, Distance}])}. Options: Size (of the ground, 3000 metres), Seed ('showcase'), Districts (the IDs of those wanted; all of them by default).
- Districts(): the districts it lays out: [{ID, Name, X, Y, Radius, Shows}].

The ground holds the sketch of all of them: mountains, a crater and a canyon, a river from the hills to a sea with its beach and dunes, a lake and a swamp, towns of each kind with their districts, squares, walls and a landmark, farms in rows, woods of each kind, the strokes and stamps of an editor, the triggers and zones of a game. Over it stand the roads (motorway with its bridges and tunnels, railway, a lane over the motorway, a level crossing with its barriers down, a roundabout, interchanges of every form (stack, cloverleaf, diamond, roundabout, trumpet), a country road on a viaduct, the motorway on one over the sea, a road under the big mountain with a branch ending on it in a tunnel, a race track with its barriers and a paved street bending inside it, a gallery of every type of road), a gallery of every model of SceneModels and every class of SceneBuildingGenerator, the effects and lights, a mirror and a glass, walkers, a car and a boat. Its galleries are read from the Services, so a model or a type added shows too. The same functions run in Node: they read no page (World defines the buildings of its gallery in SceneModels).

## Methods

- `Districts()`
- `World(options)`

## Tests

- [lays out its districts, each with what it shows, and a tour of them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L26) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
- [uses every type of the sketch of a ground, every type of road, every model, every class of building and every effect](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L48) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
- [makes a smaller world at its scale, and only the districts asked for](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L84) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
- [goes into a Scene as one list: its ground with the sketch, its objects](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L100) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
