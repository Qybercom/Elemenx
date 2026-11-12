<!-- generated -->
# SceneWorld

SceneWorld: the world of a ground as a graph of its steps, the one place a ground and what grows on it are told. A graph of the kind world of Blueprints (declared in $Provides: Blueprints makes it when such a graph or one of its blocks is met), its steps blocks with typed inputs and outputs: a land (type land, the options of a flat ground, SceneTerrainGenerator.Flat) goes from step to step, and the things made on it (type things, objects of a Scene) gather along a chain of their own; Terrain is the end, taking both (a World is the graph of a ground).

- Ground: the land, Size, Height, Water, Seed, Rock and Snow (numbers may come to its inputs).
- Planet: a place of a planet of ScenePlanet (Planet: its options; Latitude, Longitude, Turn): the land is the ground of its globe there, exactly: its coasts, heights, climate and lands (SceneTerrainGenerator.Site).
- Relief: its hills, Scale and Ridges, a graph of its own (Graph, a generator of Blueprints: X, Z to Height, Moisture, Temperature; LibraryRelief of SceneTerrainGenerator starts one) or a spec of the Noise Service (Noise).
- Climate: the numbers of its climate (Warmth, Lapse, Spread, Stretch: ClimateOf of SceneTerrainGenerator).
- Biomes: its lands by their climate (List: names of SceneBiomes, or {Biome, Ground, Grass, Climate, Scatter}).
- Sketch: a sketch over it (Sketch: {Layers}, as SceneEditor draws it).
- Border: the outline of a location (Points, Sides), what is past it (Beyond: far, cliff, void, sea, wall; Edge, Depth) and its passages (Passages of SceneLocations: roads, rivers and gates out of it).
- Tunnel (Points [[x, z, y]...], Radius, Flat, Depth), Caves (natural ways and halls of noise under the ground round X, Z within Radius: Top, Bottom, Scale, Width, Halls, Seed), Passages (a graph of ways and of halls where they part: Nodes, Ways, Radius, Flat, Depth, Rough, Seed: SceneTerrainGenerator.Passages) and Overhangs (rock jutting out of steep slopes: Amount, Scale, Slope; X, Z and Radius for a place of them): the volume of the land, cut and grown (Carves of SceneTerrainGenerator.Volume); the squares of the ground they touch are made of its density.
- Footings: the ground gives way under what stands on it: a level place under each building, Margin metres round it, at the height there (Mode mean, low, high), the ground coming to it within Edge (the trait SceneFootings of a Scene).
- Roads: its settlements and the passages of its Border joined by roads along the ground (Main, Minor, Paths: the types of SceneRoads of each class; Rail: a railway beside the main ones), roads among its things.
- Settlement: a village laid on it (X, Y, Houses, Radius, Seed, Shapes), and Scatter: things sown over it by a rule (Kind, Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps, Seed, Blocks, Biome, and Graph, a rule of its own: LibraryScatter of SceneSower starts one). Each takes the things before it (Under) and gives them with its own.

A block turned off lets what comes to it through. Any Service may add steps of its own: blocks of the kind world, declared to Blueprints in $Provides as these are, a land in and a land out, or things in and things out. The blocks of a generator (numbers, parameters) are there too, for the numbers of the steps.

- Make(graph, parameters): {Ground (the options of its ground; null with no World or no land to it), Things (the specs of the objects it makes: {ID, Kind, Values}, their IDs of their order), Problems (what keeps the graph from running)}, made once for the same graph and parameters.
- Library(options): the graph of a usual world of options (Size, Height, Water, Seed, Rock, Snow, Scale, Ridges, Noise, Relief, Planet ({Options, Latitude, Longitude, Turn}), Climate, Biomes, Sketch, Border (its properties), Tunnels, Caves and Passages (lists of the properties of such steps), Overhangs, Footings and Roads (true or their properties); and Settlements, Scatters: lists of the properties of such blocks): what an editor or a page starts from. It is the template of the resource ElemenxGraphics/world (blueprints/world.json: every step in its order, those not asked for turned off) with what is told put in, a step for each item of a list.

The same functions run in Node: they read no page.

## Methods

- `Make(graph, parameters)`
- `Library(options)`

## Tests

- [starts Flat, LibraryRelief and the blocks of SceneWorld from FlatOf and TunnelRadius](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L845) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
- [makes the land of its steps: the very ground of the same numbers, the things made on it in their order](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L20) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [lets what comes to a step turned off through, takes numbers from blocks of a generator, and tells what keeps it from running](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L39) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [takes steps of its own of any Service: a land in, a land out, typed so a land never goes where things are taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L71) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [cuts its land with steps of its volume: tunnels, caves, overhangs, each one more carve of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L97) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [makes the land of a place of a planet exactly as its globe: its heights and coasts, its lands, its neighbour meeting it at their border, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L107) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [joins its settlements and passages by roads along the ground, the class of each by what it joins](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L170) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [makes the world of options of the template of its resource, a step for each item of a list, the others turned off](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L878) — `tests/regression/blueprints.test.js`
- [passes on what comes to a block turned off by the name and the type of each output](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L899) — `tests/regression/blueprints.test.js`
- [stops what comes to a collider of its own outline, of a model or of the sketch, and never moves it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-rigid.test.js#L175) — `tests/regression/library-rigid.test.js`
- [makes the objects of the World of a ground in the scene, marked in the tree, not saved: they come again of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L734) — `tests/regression/library-scene-editor.test.js`
- [preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L158) — `tests/regression/library-scene-landing.test.js`

+35 more in the same files
