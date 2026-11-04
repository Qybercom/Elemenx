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

- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L184) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L380) — `tests/regression/library-scene.test.js`
- [keeps from the shaders what would blur, flicker or show as noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1172) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1933) — `tests/regression/library-scene.test.js`
- [burns where it is told: effects with their lamps, those of a body, bursts that end, types of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2409) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3793) — `tests/regression/library-scene.test.js`
- [A mirrored node keeps its mirror, and what a file keeps as one piece stands apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4180) — `tests/regression/library-scene.test.js`
- [Physics flies a ship: its speed comes after its throttle, its axes stay square](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4486) — `tests/regression/library-scene.test.js`
- [makes a part of a vehicle of what lies in a box of its model, moves it by degrees, and keeps what stops a wheel with the wheel](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5136) — `tests/regression/library-scene.test.js`
- [turns what the driver moves round its hinge: the steering wheel with the steering, pedals, paddles on the wheel, a pair of doors each its own way](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5244) — `tests/regression/library-scene.test.js`
- [lights a car: its lamps on at night or by L, the rear brighter as it brakes, reverse, indicators that blink and go off, hazards; a wet road holds less](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5584) — `tests/regression/library-scene.test.js`

+15 ещё в тех же файлах
