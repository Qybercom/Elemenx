<!-- generated -->
# LayoutBlueprints

LayoutBlueprints: layouts made of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets such a graph or block): where the streets, lots and walls of a settlement go. A graph of the kind layout ends at Layout, what it gives a plan of a settlement {ID, Kind, Streets: [{Points, Width, Road (a type of road), Closed}], Lots: [{X, Z, Turn, Width, Depth, Class, District}], Walls: [[[x, z]...]], Gates: [{X, Z, Turn}], Towers: [{X, Z}]} (Plan of it). Its blocks are its stages, each an algorithm of code told by its properties, a layout in and a layout out (what is laid so far, and its numbers: its middle, how far it reaches, the way of its longest side, its random numbers, which go on from where the stage before left them, so a graph draws them as one code did). A graph of it is made code (Blueprints.Code, each block a call of this Service): it runs in a page and in a worker that carries this Service.

- Make(graph, parameters, inputs): runs one (an object, its JSON, or the name of a resource) and gives its plan.
- Code(graph): its code ({Source, Run, Keys}: Run(parameters, inputs) gives {Layout}); Source is what a worker makes Run of.
- Area(item, others, kind, sizes, properties): where a settlement lies, its first layout: item {ID, Points, Kind, Density, Seed, Street, Block, Layout, Slope, Contour, Walls} of a sketch, others the other items of it, kind its row of SceneTerrainGenerator.SettlementKinds, sizes(name) the [Width, Depth] of a building of a class (null: none); Layout the name of its layout (of it, else of its kind; districts with less than Districts metres round its middle, 450, radial, and a radial one of less than Radial, 180, grid).
- Next(layout): a copy of a layout a stage changes. Plan(layout): its plan. Drawing(graph, parameters): what it gives, to be seen (BlueprintPreview), of a sample ({Lines: [{Points, Width, Class}], Boxes: [{X, Z, Width, Depth, Turn, Class}]}).
- Its blocks (and the functions of this Service of the same names, of (layout, properties)): Area (Item, Others, Kind, Sizes; Least and Share: the step of its streets of its kind, at least Least metres, at most Share of its reach), Drawn (the streets drawn in it, street items of the sketch: no stage of streets after it lays its own), Grid, Main, Road, Radial and Districts (its streets as each lays them, their numbers its properties), Lots, Walls, and Layout, the end; of a village on a ground (SceneBiomes.Village): Site (Field, X, Y, Seed, Radius: its place, or the nearest level and dry one), Houses (Count, Shapes: round its middle on a spiral, a way to each) and Out (the road out of it); of an interchange (SceneRoads.Interchanges: its frame {One, RoadA, RoadB, WayA, WayB, HalfA, HalfB, Sine, Quadrants, Ramps, Lasts, ID, At, Ramp, JunctionOn, Dot, Sign}, its ramps made by its Ramp): Diamond (Ring: a roundabout), Cloverleaf, Stack and Trumpet, their numbers their properties, Places the metres from the crossing along the roads no tunnel may be.

The library's layouts (ElemenxGraphics/layout/<name>): grid, main, road, radial, districts (SceneTerrainGenerator.SettlementPlan runs the one of the layout of a settlement), village (SceneBiomes.Village), diamond, roundabout, cloverleaf, stack and trumpet (SceneRoads.Interchanges). The same functions run in Node.

## Methods

- `Make(graph, parameters, inputs)`
- `Code(graph)`
- `Area(item, others, kind, sizes, properties)`
- `Next(layout)`
- `Plan(layout)`
- `Drawing(graph, parameters)`

## Tests

- [declares the kind layout and its stages to Blueprints, made code](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js#L43) — `libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js`
- [lays out a settlement stage by stage, each of its numbers a property](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js#L58) — `libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js`
- [lays the settlements of a ground of graphs of its own by them (layout/<name> of its Graphs)](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js#L93) — `libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js`
- [draws what a layout gives, of a settlement, a village and an interchange, and BlueprintPreview shows it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js#L117) — `libraries/ElemenxGraphics/services/LayoutBlueprints/LayoutBlueprints.test.js`
