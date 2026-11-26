<!-- generated -->
# Math

Числа пространства — для того, что рисует, и того, что считает; одни и те же на странице, в воркере и в Node. Матрицы 4×4 — массивы из 16 чисел по столбцам: Identity(), Multiply(a, b), Invert(m), Translation(x, y, z), Rotation(axis, angle) (радианы), Scaling(x, y, z), Compose(position, rotation, scale), Perspective(fov, aspect, near, far) (fov в градусах), Orthographic(left, right, bottom, top, near, far), LookAt(eye, target, up), NormalMatrix(m), Apply(m, point). Векторы [x, y, z]: Vectors.Add, Subtract, Scale, Dot, Cross, Length, Normalize, Lerp, Distance. Hit(ray, center, radius) — где луч встречает шар (-1 — не встречает). Noise(seed) — гладкий шум пространства (Value, Fbm, Ridge); без зерна это ровно шум шейдеров Renderer (Chunks.Noise). SeedOffset(seed) — сдвиг координат зерна; Source(names) отдаёт исходник членов воркеру. PlaceRandom(x, z, other) — число от 0 до 1 места, одно и то же для одного места (other — второе такое число): по нему сеются вещи, ложатся пещеры и выбирается земля. Spiral(index, count, turn) — точка номер index из count, ровно разложенных по сфере спиралью золотого угла и повёрнутых на turn радиан. Queue() — куча, отдающая сначала наименьшее F (Push(item), Pop(), Size()): на ней ищутся пути и стекают реки.

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
- `Queue()`
- `Spiral(index, count, turn)`
- `PlaceRandom(x, z, other)`
- `SeedOffset(seed)`

## Тесты

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

+52 ещё в тех же файлах
