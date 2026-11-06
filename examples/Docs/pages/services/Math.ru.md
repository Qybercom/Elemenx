<!-- generated -->
# Math

Числа пространства — для того, что рисует, и того, что считает; одни и те же на странице, в воркере и в Node. Матрицы 4×4 — массивы из 16 чисел по столбцам: Identity(), Multiply(a, b), Invert(m), Translation(x, y, z), Rotation(axis, angle) (радианы), Scaling(x, y, z), Compose(position, rotation, scale), Perspective(fov, aspect, near, far) (fov в градусах), Orthographic(left, right, bottom, top, near, far), LookAt(eye, target, up), NormalMatrix(m), Apply(m, point). Векторы [x, y, z]: Vectors.Add, Subtract, Scale, Dot, Cross, Length, Normalize, Lerp, Distance. Hit(ray, center, radius) — где луч встречает шар (-1 — не встречает). Noise(seed) — гладкий шум пространства (Value, Fbm, Ridge); без зерна это ровно шум шейдеров Renderer (Chunks.Noise). SeedOffset(seed) — сдвиг координат зерна; Source(names) отдаёт исходник членов воркеру.

## Методы

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

## Тесты

- [is Math.Noise to the bit as value noise with fbm or ridged octaves, the same seed giving the same numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L27) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [comes down in one smooth way: no stop, no step, the ship and the view going on where it comes into the air](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L556) — `tests/regression/library-scene-landing.test.js`
- [has in the sky of a location the very moon of its body](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L768) — `tests/regression/library-scene-landing.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L184) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L380) — `tests/regression/library-scene.test.js`
- [draws the Sun from a ship near a planet in real sizes, bright](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L716) — `tests/regression/library-scene.test.js`
- [keeps from the shaders what would blur, flicker or show as noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1327) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2088) — `tests/regression/library-scene.test.js`
- [burns where it is told: effects with their lamps, those of a body, bursts that end, types of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2576) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3960) — `tests/regression/library-scene.test.js`
- [A mirrored node keeps its mirror, and what a file keeps as one piece stands apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4350) — `tests/regression/library-scene.test.js`

+19 ещё в тех же файлах
