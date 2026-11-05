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

- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L184) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L380) — `tests/regression/library-scene.test.js`
- [keeps from the shaders what would blur, flicker or show as noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1172) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1933) — `tests/regression/library-scene.test.js`
- [burns where it is told: effects with their lamps, those of a body, bursts that end, types of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2421) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3805) — `tests/regression/library-scene.test.js`
- [A mirrored node keeps its mirror, and what a file keeps as one piece stands apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4195) — `tests/regression/library-scene.test.js`
- [Physics flies a ship: its speed comes after its throttle, its axes stay square](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4501) — `tests/regression/library-scene.test.js`
- [makes a part of a vehicle of what lies in a box of its model, moves it by degrees, and keeps what stops a wheel with the wheel](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5151) — `tests/regression/library-scene.test.js`
- [turns what the driver moves round its hinge: the steering wheel with the steering, pedals, paddles on the wheel, a pair of doors each its own way](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5259) — `tests/regression/library-scene.test.js`
- [lights a car: its lamps on at night or by L, the rear brighter as it brakes, reverse, indicators that blink and go off, hazards; a wet road holds less](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5601) — `tests/regression/library-scene.test.js`

+15 more in the same files
