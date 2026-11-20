<!-- generated -->
# Math

Math: the numbers of space, the same in a page, in a worker and in Node, for what draws (ElemenxGraphics) and what computes (Physics, Astronomy...):

- Matrices of 4 by 4 are arrays of 16 numbers, column by column, as WebGL reads them: Identity(), Multiply(a, b), Invert(m), Translation(x, y, z), Rotation(axis, angle) (radians), Scaling(x, y, z), Compose(position, rotation, scale) (rotation a matrix, or null), Perspective(fov, aspect, near, far) (fov in degrees), Orthographic(left, right, bottom, top, near, far), LookAt(eye, target, up), NormalMatrix(m) (the 3 by 3 one of the normals), Apply(m, point) (a point [x, y, z] moved by it).
- Vectors are arrays [x, y, z]: Vectors.Add(a, b), Subtract, Scale(a, k), Dot, Cross, Length, Normalize, Lerp(a, b, t), Distance.
- Hit(ray, center, radius): how far along the ray ({Origin, Direction}) it meets a ball (-1: it does not).
- Noise(seed) returns a smooth noise of space: Value(x, y, z) (0 to 1), Fbm(x, y, z, octaves) (several of it, each finer and fainter) and Ridge (the folds of mountains). Without a seed it is the very noise of the shaders of Renderer (Chunks.Noise: noise3, fbm3, ridge3), to the float: a heightmap of the CPU matches a surface the GPU baked. SeedOffset(seed): the shift of the coordinates of a seed.
- PlaceRandom(x, z, other): a number of 0 to 1 of a place, the same for the same place (other: a second one of it): what sows things, lays caves and picks the land of a place. Spiral(index, count, turn): the point index of count spread evenly over a sphere along a spiral of the golden angle, turned by turn radians. Queue(): a heap that gives back the least F first (Push(item), Pop(), Size()): the ways and the rivers.
- Source(names) gives the source of members (Noise, SeedOffset, Vectors) to a worker of the Workers Service.

## Methods

- `Identity()`
- `Multiply(a, b)`
- `Invert(m)`
- `Translation(x, y, z)`
- `Rotation(axis, angle)`
- `Scaling(x, y, z)`
- `Compose(position, rotation, scale)`
- `Perspective(fov, aspect, near, far)`
- `Orthographic(left, right, bottom, top, near, far)`
- `LookAt(eye, target, up)`
- `NormalMatrix(m)`
- `Apply(m, point)`
- `Hit(ray, center, radius)`
- `Noise(seed)`
- `Source(names)`
- `Queue()`
- `Spiral(index, count, turn)`
- `PlaceRandom(x, z, other)`
- `SeedOffset(seed)`

## Tests

- [turns by the own Math in the run of a graph, in its Code and in its IR, to the bit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L201) — `tests/regression/blueprints-ir.test.js`
- [reads the kernel language into the IR: constants, declarations, for, ?:, the operators of bits; what is wrong by its line and column](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L71) — `tests/regression/compilers-wasm.test.js`
- [wraps whole numbers round as the hash of the Noise Service does](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L94) — `tests/regression/compilers-wasm.test.js`
- [has its own Math, as near as a unit of the last place to the browser's, its edges as js has them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L123) — `tests/regression/compilers-wasm.test.js`
- [makes wasm of the IR that gives the very numbers of its js](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L159) — `tests/regression/compilers-wasm.test.js`
- [runs a function over many points in one call (Batch): the numbers of each run one after another](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L181) — `tests/regression/compilers-wasm.test.js`
- [keeps a function that calls itself from going deeper than MaxDepth, as its js does](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L221) — `tests/regression/compilers-wasm.test.js`
- [says what of a module is not of numbers: its js runs it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L230) — `tests/regression/compilers-wasm.test.js`
- [makes its module off the thread when given a callback](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L246) — `tests/regression/compilers-wasm.test.js`
- [makes as many modules as it is asked, all of one memory](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L262) — `tests/regression/compilers-wasm.test.js`
- [takes lists of numbers (float\[\]): in js arrays, in wasm the memory, the same numbers; a vector by an index](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L273) — `tests/regression/compilers-wasm.test.js`
- [says a list of numbers of a module is not for wasm, and keeps it once in js](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L322) — `tests/regression/compilers-wasm.test.js`

+43 more in the same files
