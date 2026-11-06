<!-- generated -->
# SceneSower

SceneSower: what the Scatter of a Scene sows in a square of a ground, worked out off the main thread (Work(): the workers of Workers.Pool) or in the page, the same things for the same seed either way.

- Sow(job) sows squares of a ground by its rules: job {Squares ([{X, Z}]), Context (what they share: itself, or the name a worker keeps it under by Share of Workers)}; a job without a Context is its context too. A context is {Key (of the ground and the rules: a worker makes the field once for it), Options (of the field of the ground, SceneTerrainGenerator.Flat), Roads (painted on it), Kept (the cells of 4 by 4 where a house of a village stands: ['x:z']), Rules (of Scatter, of a biome, of a sketch: Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps, Seed, Passability, Blocks, Reach, Grid, Area, Line, Rows, Spacing, Gap, Way, Fit, Gates ([{X, Z, Radius}]: a line is open there), Fixed, Biome (the land of a ground of lands by their climate it grows in), Source (of a graph, below), Parameters (of its graph)), Free ({Areas, Lines}: where the sketch keeps the ground free), Models ({name: {Size, Keys (the Key of SceneModels.Make of each of 16 variants)}}), Size (of a square, 48), and in the page Field (the field itself, not made again)}. It gives {Squares: [{X, Z, Lists ({key: {Places, Extra (Float32Array, four numbers a thing), Count, Reach}}), Center}], Blocked (the cells of 2 by 2 what was sown stops the way through), Things}.
- A rule of a graph: Graph, a generator of Blueprints that tells where a thing grows and how, in place of MinHeight, MaxHeight, MaxSlope, Cover and Clumps. Inputs X, Z, Height, Slope, Moisture, Temperature (of the climate of the ground), Random and Other (numbers of 0 to 1 of the place); results Grow (true, or a number over 0.5), Size (in sizes of its model), Turn (radians), Shape (the index of one of its Shapes), each left to the rule when it is not there. Compile(rules), in the page, makes each graph JavaScript (Source) for a worker; LibraryScatter(rule) the graph of a rule as it is sown with none, the very same things: what an editor starts from.
- Work(): the pool of its workers, made once.

The same functions run in Node: they read no page.

## Methods

- `Work()`
- `Compile(rules)`
- `LibraryScatter(rule)`
- `Sow(job)`

## Tests

- [sows by the rules: the things of each model in their squares, none where the sketch keeps the ground free, the way stopped where they stand](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L60) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the same things in a worker as in the page, the field made there of its options, the context shared once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L97) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the rules of a land by its climate only in that land, mingled where lands meet, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L118) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows a rule of a graph: its library graph the very same things as the rule, a graph of its own its sizes, turns and shapes, in a worker too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L172) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [places the things of a line every step of it, whatever its pieces, the same from its start in every square](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L241) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [makes what is past its outline: a cliff falls, a passage keeps its way open with a road to the middle, a wall stands with a gate, a side with a location beside and no passage stays open](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L87) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
