<!-- generated -->
# SceneSower

SceneSower: what the Scatter of a Scene sows in a square of a ground, worked out off the main thread (Work(): the workers of Workers.Pool) or in the page, the same things for the same seed either way.

- Sow(job) sows squares of a ground by its rules: job {Squares ([{X, Z}]), Context (what they share: itself, or the name a worker keeps it under by Share of Workers)}; a job without a Context is its context too. A context is {Key (of the ground and the rules: a worker makes the field once for it), Options (of the field of the ground, SceneTerrainGenerator.Flat), Roads (painted on it), Kept (the cells of 4 by 4 where a house of a village stands: ['x:z']), Rules (of Scatter, of a biome, of a sketch: Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps, Seed, Passability, Blocks, Reach, Grid, Area, Line, Rows, Spacing, Gap, Way, Fit, Gates, Fixed), Free ({Areas, Lines}: where the sketch keeps the ground free), Models ({name: {Size, Keys (the Key of SceneModels.Make of each of 16 variants)}}), Size (of a square, 48), and in the page Field (the field itself, not made again)}. It gives {Squares: [{X, Z, Lists ({key: {Places, Extra (Float32Array, four numbers a thing), Count, Reach}}), Center}], Blocked (the cells of 2 by 2 what was sown stops the way through), Things}.
- Work(): the pool of its workers, made once.

The same functions run in Node: they read no page.

## Methods

- `Work()`
- `Sow(job)`

## Tests

- [sows by the rules: the things of each model in their squares, none where the sketch keeps the ground free, the way stopped where they stand](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L60) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the same things in a worker as in the page, the field made there of its options, the context shared once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L97) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
