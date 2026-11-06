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
- Tunnel (Points [[x, z, y]...], Radius, Flat, Depth), Caves (natural ways and halls of noise under the ground round X, Z within Radius: Top, Bottom, Scale, Width, Halls, Seed) and Overhangs (rock jutting out of steep slopes: Amount, Scale, Slope; X, Z and Radius for a place of them): the volume of the land, cut and grown (Carves of SceneTerrainGenerator.Volume); the squares of the ground they touch are made of its density.
- Footings: the ground gives way under what stands on it: a level place under each building, Margin metres round it, at the height there (Mode mean, low, high), the ground coming to it within Edge (the trait SceneFootings of a Scene).
- Settlement: a village laid on it (X, Y, Houses, Radius, Seed, Shapes), and Scatter: things sown over it by a rule (Kind, Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps, Seed, Blocks, Biome, and Graph, a rule of its own: LibraryScatter of SceneSower starts one). Each takes the things before it (Under) and gives them with its own.

A block turned off lets what comes to it through. Any Service may add steps of its own: blocks of the kind world, declared to Blueprints in $Provides as these are, a land in and a land out, or things in and things out. The blocks of a generator (numbers, parameters) are there too, for the numbers of the steps.

- Make(graph, parameters): {Ground (the options of its ground; null with no World or no land to it), Things (the specs of the objects it makes: {ID, Kind, Values}, their IDs of their order), Problems (what keeps the graph from running)}, made once for the same graph and parameters.
- Library(options): the graph of a usual world of options (Size, Height, Water, Seed, Rock, Snow, Scale, Ridges, Noise, Relief, Planet ({Options, Latitude, Longitude, Turn}), Climate, Biomes, Sketch, Border (its properties), Tunnels and Caves (lists of the properties of such steps), Overhangs and Footings (true or their properties); and Settlements, Scatters: lists of the properties of such blocks): what an editor or a page starts from.

The same functions run in Node: they read no page.

## Methods

- `Make(graph, parameters)`
- `Library(options)`

## Tests

- [makes the land of its steps: the very ground of the same numbers, the things made on it in their order](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L20) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [lets what comes to a step turned off through, takes numbers from blocks of a generator, and tells what keeps it from running](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L39) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [takes steps of its own of any Service: a land in, a land out, typed so a land never goes where things are taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L71) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [cuts its land with steps of its volume: tunnels, caves, overhangs, each one more carve of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L97) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [makes the land of a place of a planet exactly as its globe: its heights and coasts, its lands, its neighbour meeting it at their border, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L107) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [makes the objects of the World of a ground in the scene, marked in the tree, not saved: they come again of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L734) — `tests/regression/library-scene-editor.test.js`
- [preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L146) — `tests/regression/library-scene-landing.test.js`
- [walks a hero with the feet of a body: walls stop it at any speed, it slides along them, jumps and falls, and faces the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1778) — `tests/regression/library-scene.test.js`
- [lets go of neither a hero nor the view on Escape, and takes no leap of the pointer](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2824) — `tests/regression/library-scene.test.js`
- [never lets a hero out of the view, and ends a press when the pointer is taken or given back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2890) — `tests/regression/library-scene.test.js`
- [stands the view of a walker behind it, in its eyes or over its shoulder, and V goes through them with the pointer taken](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3001) — `tests/regression/library-scene.test.js`
- [shows the axes of a view in a corner, and a press on one looks along it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3119) — `tests/regression/library-scene.test.js`

+25 more in the same files
