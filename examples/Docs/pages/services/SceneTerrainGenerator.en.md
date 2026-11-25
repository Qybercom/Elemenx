<!-- generated -->
# SceneTerrainGenerator

The ground of a game, continuous: heights of noise anywhere (no cells), its meshes in chunks, and ways over it.

- FlatOf(options): the numbers of a flat map told or its defaults, {Seed, Size, Height, Water, Scale, Ridges}: what Flat, its climate, LibraryRelief and the blocks of SceneWorld start from (Regression: each told them again).
- Flat(options) returns a field of a flat map: options Size (of the map, 1000), Height (of its highest hills, 60), Water (the level of the sea, 0 to 1, 0.35), Scale (the size of its hills, 180), Ridges (0 to 1: how much of it is folded into mountains, 0.4), Rock and Snow (the parts of its Height where rock and snow begin, 0.45 and 0.75; false: none, a land of low hills all of grass), Seed, Noise (a spec of the Noise Service: its hills of that noise, in metres, in place of those of Scale and Ridges), Relief (a graph of blocks, a generator of Blueprints: its hills of it, below); it has Size, Top (its Height), Rock, Snow (those heights) and Water. Its methods: Height(x, z) (the height of the ground; below 0 under the sea), Normal(x, z), Slope(x, z) (0 flat, 1 a wall), Walkable(x, z, options) (MaxSlope 0.45; Swim: the sea too; Blocked(x, z): true where a thing stands in the way; Over(x, z): the floor of a bridge there, or null), Prefetch(x, z, step, side) (the heights of a square of points made at once by wasm, read by Height and Climate; null: none; Compute of the options js: never, auto or wasm: where it is made, the very same numbers; ReliefWasm makes it, WasmShare gives it to the workers of a pool with the options of the ground, WasmRun runs it in the page or in a worker), Chunk(x, z, size, resolution) (a geometry of a square of it, its positions relative to its middle, with Colors of its heights and slopes and a skirt under its edges so chunks of other sizes leave no gap) and Path(from, to, options) (a way of points {X, Y, Z} round what cannot be walked, made straight where it can be; null when there is none; options Step, the finest it looks, MaxSlope, Swim). Palette gives it the colors of a biome; Roads ([[x, z]...]) set on a field are painted on it, and OnRoad(field, x, z, width) tells whether a point is on one. Sketch: a sketch over it (below); the field then has Sketch, its Height after it, and its colors (Paint) after what it lays. Border: the outline of a location and what is past it (Border(options)); the field then has Border.
- A sketch is {Layers: [{ID, Name, Visible, Strength, Items}]}, each item {ID, Type, Strength} changing the height left by the items before it. Strokes (Points, Radius): raise and lower (Amount), flatten (Height), smooth. Lines (Points, Width): ridge (Height, Sharp), valley and canyon (Depth), river (Depth, Bank, Flow: how fast it runs; its bed under the levels of its way, never rising as it flows; a point [x, z, y] gives its level), road (Shoulder: level across), cliff (Height, Reach: up on the left of its way). Areas (Points, Edge): plateau (Height), basin (Depth), lake (Level, Depth), terraces (Step), swamp (Level), beach, floodplain (Level), dunes (Height, Length, Way), erosion (Amount), biome (Palette: only its colors) and mask (what comes after it is held back in it; with Heights {Bounds, Side, Data} it holds those heights). Circles (At, Radius): mountain (Height, Ridged), crater (Depth, Rim), stamp (Data {Side, Heights from 0 to 1}, Height, Turn). What changes no height and only places things (SketchPlaced, sown by the Scatter of a Scene): areas of growth forest, meadow, bushes, thicket, jungle, sequoia (Density, Passability, Shapes), clearing (nothing grows), fields and orchard (in rows: Spacing, Gap, Way); lines of things a step apart row, fence, hedge, wall, powerline (Shapes, Spacing); the circle marker (Role, Team, Name); the triggers of a game, trigger an area, triggerpoint a circle, triggerline a line (Height, Team, Kinds, Once, Blueprint), and the area zone (Tags, Team), objects of the scene of a Scene (the trait Triggers); and what cuts its volume (SketchCarves): the line cave (Width, Depth, Rough, Mouth), the circles hall (Radius, Depth) and overhang (Radius, Amount). Sketched(sketch, base, seed) makes one ({Height(x, z, h), Look(x, z), Waters(), Items}: Waters the rivers, a strip at their levels, and the lakes); SketchChanged(before, after) gives the bounds [x0, z0, x1, z1] where two differ, for a ground made again only there.
- Sphere(options) returns the ground of a planet, the very one its baked surface shows: its land the land of the graph the shader of a Scene bakes it of (blueprints/shader/bake, what comes to its block BakeLand) made code in the page (BakeRun, BakeMake(graph), BakeCodeOf(graph); given to the workers by ShareGround): options Radius (units), Height (its relief), Seed (the number of its pattern), Ocean (0 to 1), Type (rocky, desert, terran, ocean, ice, lava, dwarf, moon), BakeSource (the code of a graph of its own, BakeCodeOf). Its methods: Land(direction) (the ground of the noise: below 0 the sea), Elevation(direction) (above the radius), Point(direction) (on the ground), Altitude(point) (above the ground under it), Patch(face, u, v, size, resolution) (a geometry of a square of a face of its cube, from u and v of -1 to 1, its positions relative to its Center, the land in UV.x, the sea in UV.y).
- A Relief graph has inputs X and Z and results Height (0 to 1, as the hills of noise are), Moisture and Temperature (0 to 1); its parameters Scale, Ridges, Water and Height are those of the options. LibraryRelief(options) makes the one of the hills of noise of those options, the very same heights and climate: what an editor starts from. Relief(settings) gives its function (x, z) of results, made JavaScript once (Blueprints.Code) and its source kept in the options (ReliefSource), so a worker makes it again with no graph; null with none. A field has Climate(x, z) ({Moisture, Temperature}): of its graph, else Climate(settings) of its height and a noise of moisture.
- Carves of the options cut its volume and grow it (Volume: tunnels, holes dug, natural caves of ways and halls, overhangs of rock on steep slopes): the field has Density(x, y, z) (solid over 0) and Volume; the squares they touch are made of the density (Volumetric, surface nets), and it is walked as a place of floors (Underground: Height(x, z, y), Blocked, CanStep, Stands), as a location is. Daylight(field, x0, z0, x1, z1, low, options): how much of the light of the sky comes to each point under it round a square (At(x, y, z, normal), 0 to 1), the same in every square.
- Work(): the workers of the ground (Workers.Pool), that run Piece and Grid off the main thread.
- Piece(shape, options, roads, args): a square of a ground of a shape (Flat or Sphere) of its options, as a worker makes it: of Flat, args [x, z, size, resolution] and the geometry of Chunk; of Sphere, args [face, u, v, size, resolution] and {Geometry, Center} of Patch; its lists of numbers Float32Array and Uint32Array. A field of Flat or Sphere keeps its options (Options) for it; Field(shape, options) makes it once for the same options.
- Grid(options, side, top, steep): the heights of a flat ground of its options over all its size, side by side points, four numbers each (a Float32Array): the height, and 1 where it is over 1 and under top and its slope under steep (where grass grows), 0 elsewhere.
- Floor(options, side): the heights of a flat ground of its options, as Grid lays them, nothing else (the floor of a sea).
- Free(size, side, lines, areas, edge): where things may grow on a field of size, side by side bytes (a Uint8Array, row by row along Z): 0 within Reach of each line ({Points, Reach}: a road and its shoulders, a river and its banks) and inside each area (Points: a clearing, a lake), 255 farther than edge (1.5) from them, between them in between.
- Heights(field, side): the heights of a flat field in a grid of side by side points over all its size (a Float32Array, row by row along Z); FromGrid(options, heights, side) a field of Flat whose heights are such a grid (a field baked or painted; out of the grid, of its noise): it has Grid and Side, and no Options.
- SketchTable (resources/terrain/sketch-types.json): the types of a sketch, {type: {Kind, Placed, Defaults, Look {Color, Material}}}, '*' the values of every type; SketchDefaults(type) the values an item of it takes where it tells none (an editor starts an item with them). SketchTypes, SketchPlaced and LookMaterials are of it. What each type does to the ground is its graph (blueprints/sketch/<type>: inputs X, Z, H the height so far, S its strength there, O the shift of the noise of the sketch, Points, Levels, Data, CX, CZ, Around the ground round the point, Target, the values of the item, <value>Told; its result Height): SketchRun(type) its function {Main, Inputs, Parameters}, made once in the page and given to workers by ShareGround; SketchMake(type, graph) makes a type of another graph. The shape of each carve of a volume is its graph too (blueprints/carve/<type>: tunnel, sphere, caves, passages, overhangs; inputs X, Y, Z, G the ground over the point, Steep, Points, Packed and the values of the carve; result Density, of overhangs Share, WX, WZ): CarveRun(type), CarveMake(type, graph). A ground of graphs of its own (Graphs: {'sketch/<type>' or 'carve/<type>': a graph}, as a world gives them) has their code made in the page (GraphCode, GraphCodeOf(graphs): {name: its code}; ShareGround makes it before a worker has the options); SketchRun(type, own) and CarveRun(type, own) are of that code when it has one of the type.
- PlainRelief(settings): the library relief of a ground of no graph, no planet and no noise of its own, by its code made in the page: {Height, Climate(x, z)}. ShareGround(pool, options, made): what its options take with them to the workers of a pool (the code and the wasm of its relief), once; made: make its code first if it was not yet. WasmExports(made): the functions of the wasm of a relief, on the memory it shares.
- Source(names): the source of its members, for a worker.

The same functions run in Node: they read no page.

## Methods

- `Relief(settings)`
- `FlatOf(options)`
- `Climate(settings)`
- `LibraryRelief(options)`
- `Flat(options)`
- `Border(options)`
- `OnRoad(field, x, z, width)`
- `Daylight(field, x0, z0, x1, z1, low, options)`
- `Sphere(options)`
- `WasmExports(made)`
- `Work()`
- `ShareGround(pool, options, made)`
- `PlainRelief(settings)`
- `Sketched(sketch, base, seed, own)`
- `SketchRun(type, own)`
- `CarveRun(type, own)`
- `CarveMake(type, graph)`
- `BakeMake(graph)`
- `BakeCodeOf(graph)`
- `SketchMake(type, graph)`
- `GraphCodeOf(graphs)`
- `SketchDefaults(type)`
- `SketchChanged(before, after)`
- `FromGrid(options, heights, side)`
- `Heights(field, side)`
- `Field(shape, options, name)`
- `Piece(shape, options, roads, args)`
- `Free(size, side, lines, areas, edge)`
- `Floor(options, side)`
- `Grid(options, side, top, steep)`
- `Source(names)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var terrain = this.$Service('SceneTerrainGenerator');
		var field = terrain.Flat({Size: 400, Height: 40, Seed: 7});
		var way = field.Path({X: 20, Z: 20}, {X: 180, Z: 160});
		var planet = terrain.Sphere({Radius: 6371, Height: 8, Seed: 3, Ocean: 0.6, Type: 'terran'});

		this.Text = 'Height(100, 100): ' + field.Height(100, 100).toFixed(2) + ', Slope: ' + field.Slope(100, 100).toFixed(2) + ', Walkable: ' + field.Walkable(100, 100) + '\n\nPath: ' + (way ? way.length + ' points, ' + way.map(function (point) {
			return Math.round(point.X) + ',' + Math.round(point.Z);
		}).join(' → ') : 'none') + '\n\nSphere: Elevation at the pole ' + planet.Elevation([0, 1, 0]).toFixed(3) + ', at the equator ' + planet.Elevation([1, 0, 0]).toFixed(3);
	}
})
</script>
```

## Tests

- [gives its ground to land on as the Sphere of SceneTerrainGenerator does: its heights, squares with its colors, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L260) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [makes the very results of its Code, its parameters fixed, in js and in wasm](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L234) — `tests/regression/blueprints-ir.test.js`
- [makes another function of the same blocks with other values of its parameters](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L294) — `tests/regression/blueprints-ir.test.js`
- [makes the buildings of a town of their own shapes, each as tall as its Size, its wings within its width and depth](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L120) — `tests/regression/buildings.test.js`
- [makes a graph of numbers of Blueprints a function of a shader: the relief of a ground as near as floats hold it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-glsl.test.js#L209) — `tests/regression/compilers-glsl.test.js`
- [gives each ground the very climate it had, of one graph](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-climate.test.js#L59) — `tests/regression/ground-climate.test.js`
- [gives a ground of its own noise in a worker the climate of the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-climate.test.js#L80) — `tests/regression/ground-climate.test.js`
- [paints the very bytes the code painted before](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-far.test.js#L49) — `tests/regression/ground-far.test.js`
- [paints a planet of a graph of its own, its code carried to its workers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-far.test.js#L87) — `tests/regression/ground-far.test.js`
- [asks first for the squares of a cave under a mountain the eye is in, before the low ground round the mountain](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-lod.test.js#L146) — `tests/regression/ground-lod.test.js`
- [asks for as many squares a frame as the workers take, however long the walk over them took](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/ground-lod.test.js#L198) — `tests/regression/ground-lod.test.js`
- [draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L73) — `tests/regression/library-material-blueprints.test.js`

+71 more in the same files
