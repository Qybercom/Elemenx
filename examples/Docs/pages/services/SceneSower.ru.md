<!-- generated -->
# SceneSower

SceneSower: то, что Scatter сцены сеет в квадратах земли, считается вне главного потока (Work(): воркеры Workers.Pool) или на странице — одинаково для одного и того же зерна.

- Sow(job) засевает квадраты земли по её правилам: job {Squares ([{X, Z}]), Context (общее для них: сам объект или имя, под которым его хранит воркер, Share пула)}; задание без Context само служит контекстом. Контекст: {Key (земли и правил: воркер собирает поле один раз на ключ), Options (параметры поля земли, SceneTerrainGenerator.Flat), Roads, Kept (клетки 4×4 под домами деревень), Rules (правила Scatter, биома, скетча), Free ({Areas, Lines}: где скетч держит землю свободной), Models ({имя: {Size, Keys (Key SceneModels.Make каждого из 16 вариантов)}}), Size (размер квадрата, 48) и на странице Field (само поле)}. Возвращает {Squares: [{X, Z, Lists, Center}], Blocked, Things}.
- Work() — пул его воркеров, создаётся один раз.

Scatter отправляет ближайшие квадраты пачками по шесть, по два задания на воркер; контекст поколения уходит каждому воркеру один раз. Без воркеров тот же код работает на странице по 4 мс за кадр. Мир-образец (3×3 км) засевается за ~9,5 с вместо 96.

Правило-граф. Graph правила — граф-генератор Blueprints, который решает, где и как растёт вещь, вместо MinHeight, MaxHeight, MaxSlope, Cover и Clumps. Входы: X, Z, Height, Slope, Moisture, Temperature (климат земли), Random и Other (числа 0–1 от места, одинаковые для одного места). Результаты: Grow (true или число больше 0.5), Size (в размерах модели), Turn (радианы), Shape (номер в Shapes); чего граф не говорит, решает правило. Compile(rules) на странице превращает графы в JavaScript (Source) для воркеров. LibraryScatter(rule) строит граф правила таким, каким оно сеется без графа: те же вещи до бита — с него начинает редактор.

Biome правила — биом земли по климату, где оно растёт; на стыке биомов вещи перемешиваются по весам (Land).

LibraryScatter(rule) берёт граф ресурса `ElemenxGraphics/scatter` (blueprints/scatter.json) и заполняет его параметры (MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps) и зерно `{Seed}` через Blueprints.Fill; приложение может подложить свой граф под тем же именем.

## Методы

- `Work()`
- `Compile(rules)`
- `LibraryScatter(rule)`
- `Sow(job)`

## Тесты

- [sows by the rules: the things of each model in their squares, none where the sketch keeps the ground free, the way stopped where they stand](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L60) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the same things in a worker as in the page, the field made there of its options, the context shared once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L97) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the rules of a land by its climate only in that land, mingled where lands meet, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L118) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows a rule of a graph: its library graph the very same things as the rule, a graph of its own its sizes, turns and shapes, in a worker too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L172) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [keeps the whole of a large thing off a road, not only its place](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L242) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [places the things of a line every step of it, whatever its pieces, the same from its start in every square](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L267) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [reads the graphs of the library from its resources, one of the same name of an Application in their place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L853) — `tests/regression/blueprints.test.js`
- [makes what is past its outline: a cliff falls, a passage keeps its way open with a road to the middle, a wall stands with a gate, a side with a location beside and no passage stays open](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L87) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
