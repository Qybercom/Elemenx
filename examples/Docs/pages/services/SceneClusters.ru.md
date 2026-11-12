<!-- generated -->
# SceneClusters

SceneClusters: уровень детализации из кластеров, как его строит Nanite, для крупной модели, которая стоит одна (небоскрёб, большая модель из файла). Работает одинаково на странице, в воркере и в Node.

- Build(geometry) — кластеры геометрии {Positions, Normals, Colors, UVs, Indices} (плоские грани сшиваются по углам): {Positions, Normals, Colors, UVs (точки всех уровней, у граней упрощённых уровней свои точки, UV — среднее углов, из которых они получились), Indices (треугольники каждого кластера подряд), Clusters (Float32Array, 14 чисел на кластер: Start и Count в Indices, Level, Error, его сфера [x, y, z, радиус], Error его родителя и сфера родителя; без родителя — бесконечность), Levels, Triangles (самого тонкого уровня)}.
- Select(built, matrix, eye, focal, pixels) — треугольники для отрисовки сейчас (Uint32Array индексов) для модели, стоящей по matrix ([ось x, ось y, ось z, место], 12 чисел), если смотреть из eye (в мире): focal — пиксели высоты экрана на тангенс половины угла обзора, pixels — допустимая ошибка (1 по умолчанию). Даёт {Indices, Clusters (сколько нарисовано), Level (самый грубый из нарисованных)}.
- Work() — пул его воркеров.

Как строится: треугольники режутся на кластеры по 128 в порядке кривой Мортона; по четыре кластера (выше — по 8 и 16) собираются в группу, группа упрощается (углы в одной ячейке сводятся в один, пока не уйдёт половина треугольников; ячейка от полутора до четырёх ошибок детей), граница группы остаётся как была — поэтому соседние группы сходятся без щелей; упрощённое снова режется на кластеры, и так до одного. Ошибка группы — насколько далеко ушёл угол от точки, в которую его свели. Группа, которую не удалось упростить, поднимается на следующий уровень как есть, в группу побольше.

Как выбирается: кластер рисуется, если его ошибка на экране не больше pixels, а ошибка его родителя — больше; сферы и ошибки общие для группы, поэтому каждый участок модели рисуется ровно одним уровнем, ближние тоньше. Вся модель — одна отрисовка: сцена меняет только треугольники её меша (Renderer mesh.Triangles), когда глаз сдвинулся на двадцатую часть расстояния до неё.

Scene так рисует неподвижные модели в одном экземпляре от 3000 граней (свойство Clusters, по умолчанию true). В режиме Levels такая модель окрашена по самому грубому нарисованному уровню.

## Методы

- `Work()`
- `Build(geometry)`
- `Select(built, matrix, eye, focal, pixels)`

## Тесты

- [draws a tower near at its finest and far coarser, by its clusters](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-clusters.test.js#L48) — `tests/regression/scene-clusters.test.js`
- [draws a model as fine as the screen needs, part by part, with no crack where its levels meet](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js#L49) — `libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js`
- [chooses by where a model stands and how large it is](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js#L74) — `libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js`
- [builds in a worker as in the page](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js#L82) — `libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js`
