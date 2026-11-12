<!-- generated -->
# Math

Math: the numbers of space, the same in a page, in a worker and in Node, for what draws (ElemenxGraphics) and what computes (Physics, Astronomy...):

- Matrices of 4 by 4 are arrays of 16 numbers, column by column, as WebGL reads them: Identity(), Multiply(a, b), Invert(m), Translation(x, y, z), Rotation(axis, angle) (radians), Scaling(x, y, z), Compose(position, rotation, scale) (rotation a matrix, or null), Perspective(fov, aspect, near, far) (fov in degrees), Orthographic(left, right, bottom, top, near, far), LookAt(eye, target, up), NormalMatrix(m) (the 3 by 3 one of the normals), Apply(m, point) (a point [x, y, z] moved by it).
- Vectors are arrays [x, y, z]: Vectors.Add(a, b), Subtract, Scale(a, k), Dot, Cross, Length, Normalize, Lerp(a, b, t), Distance.
- Hit(ray, center, radius): how far along the ray ({Origin, Direction}) it meets a ball (-1: it does not).
- Noise(seed) returns a smooth noise of space: Value(x, y, z) (0 to 1), Fbm(x, y, z, octaves) (several of it, each finer and fainter) and Ridge (the folds of mountains). Without a seed it is the very noise of the shaders of Renderer (Chunks.Noise: noise3, fbm3, ridge3), to the float: a heightmap of the CPU matches a surface the GPU baked. SeedOffset(seed): the shift of the coordinates of a seed.
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
- `SeedOffset(seed)`

## Tests

- [is Math.Noise to the bit as value noise with fbm or ridged octaves, the same seed giving the same numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L27) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [comes down in one smooth way: no stop, no step, the ship and the view going on where it comes into the air](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L568) — `tests/regression/library-scene-landing.test.js`
- [has in the sky of a location the very moon of its body](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L790) — `tests/regression/library-scene-landing.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L185) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L479) — `tests/regression/library-scene.test.js`
- [draws the Sun from a ship near a planet in real sizes, bright](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L840) — `tests/regression/library-scene.test.js`
- [keeps from the shaders what would blur, flicker or show as noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1459) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2252) — `tests/regression/library-scene.test.js`
- [burns where it is told: effects with their lamps, those of a body, bursts that end, types of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2740) — `tests/regression/library-scene.test.js`
- [draws the plants of a planet in their own frame, by the matrix of the view from it and their reach](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3497) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4363) — `tests/regression/library-scene.test.js`

+20 more in the same files
