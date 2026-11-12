<!-- generated -->
# SceneProxies

SceneProxies: то, что стоит далеко, — много вещей одной упрощённой формой (прокси плитки, как Voxy для Minecraft рисует дальнюю землю). Работает одинаково на странице, в воркере и в Node.

- Shape(geometry) — данные формы, из которой делается прокси, один раз: {Positions, Colors, Indices} (Float32Array и Uint32Array), Box [minX, minY, minZ, maxX, maxY, maxZ], Radius (насколько она тянется вокруг своего начала), Color (цвет её верхней части: кроны, крыши).
- Merge(job) — прокси плитки: job {Shapes ({ключ: Shape или имя, под которым воркер хранит её через Share сервиса Workers}), Lists ([{Shape, Places, Extra (четыре числа на копию: x, y, z, размер; поворот вокруг вертикали и оттенок r, g, b — как их хранит Scatter), Count}]), Origin ([x, y, z]: позиции относительно него), Cell (шаг сетки)}. Отдаёт {Positions, Normals, Colors (по три числа на вершину, у каждой грани свои вершины: плоско), Triangles, Copies, Bodies}.
- Pack(made) — прокси, ужатый для хранения (SceneCache): {Positions (Int16Array в рамке прокси), Box, Colors (Uint8Array, цвета до 4 — светящееся окно ярче 1), Triangles}, вчетверо меньше, без нормалей. Unpack(packed) — прокси обратно, нормали из граней (он плоский): то же, что дал Merge, с точностью до сантиметра.
- Work() — пул его воркеров, один на страницу.

Углы копий притягиваются к сетке Cell, углы одной ячейки становятся одним (средним по месту и цвету), грань, потерявшая угол, уходит, одна и та же грань двух копий — один раз. Вещь меньше четырёх ячеек так исчезла бы или стала бы тонкой (её углы стягиваются внутрь): вместо неё — маленькое тело из шестнадцати граней по её рамке, цвета её верхней части, чуть темнее (тень внутри кроны).

Scatter сцены рисует им дальние плитки посева (свойство Proxies сцены). Режим Levels сцены показывает плитки цветом их уровня.

## Методы

- `Work()`
- `Shape(geometry)`
- `Merge(job)`
- `Pack(made)`
- `Unpack(packed)`

## Тесты

- [draws the far tiles as proxies, each one shape of their things, and none with Proxies false](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L53) — `tests/regression/scatter-proxies.test.js`
- [takes the proxies of the same world from the cache of the browser the next time](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L98) — `tests/regression/scatter-proxies.test.js`
- [makes its streams again at most each 400 ms while a ground is sown, not in every frame](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L163) — `tests/regression/scatter-proxies.test.js`
- [shows the numbers of a frame in a corner while Levels is on, turned on and off by Ctrl+Shift+L](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L250) — `tests/regression/scatter-proxies.test.js`
- [draws into the voxels only what is sown in the box of their grid](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L294) — `tests/regression/scatter-proxies.test.js`
- [makes the data of a shape: its box, how far it reaches, the color of its upper part](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L32) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
- [merges the copies of a tile into one shape of fewer faces, the small ones as small bodies](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L47) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
- [packs a proxy small to be kept and unpacks it as it was](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L75) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
- [makes the same proxy in a worker, its shapes sent once by Share](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L101) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
