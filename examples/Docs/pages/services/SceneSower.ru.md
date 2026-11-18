<!-- generated -->
# SceneSower

SceneSower: то, что Scatter сцены сеет в квадратах земли, считается вне главного потока (Work(): воркеры Workers.Pool) или на странице — одинаково для одного и того же зерна.

- Sow(job) засевает квадраты земли по её правилам: job {Squares ([{X, Z}]), Context (общее для них: сам объект или имя, под которым его хранит воркер, Share пула)}; задание без Context само служит контекстом. Контекст: {Key (земли и правил: воркер собирает поле один раз на ключ), Options (параметры поля земли, SceneTerrainGenerator.Flat), Roads, Kept (клетки 4×4 под домами деревень), Rules (правила Scatter, биома, скетча), Free ({Areas, Lines}: где скетч держит землю свободной), Models ({имя: {Size, Keys (Key SceneModels.Make каждого из 16 вариантов)}}), Size (размер квадрата, 48) и на странице Field (само поле)}. Возвращает {Squares: [{X, Z, Lists, Center}], Blocked, Things}.
- Work() — пул его воркеров, создаётся один раз.

Scatter отправляет ближайшие квадраты пачками по шесть, по два задания на воркер; контекст поколения уходит каждому воркеру один раз. Без воркеров тот же код работает на странице по 4 мс за кадр. Мир-образец (3×3 км) засевается за ~9,5 с вместо 96.

Правило-граф. Graph правила — граф-генератор Blueprints, который решает, где и как растёт вещь, вместо MinHeight, MaxHeight, MaxSlope, Cover и Clumps. Входы: X, Z, Height, Slope, Moisture, Temperature (климат земли), Random и Other (числа 0–1 от места, одинаковые для одного места). Результаты: Grow (true или число больше 0.5), Size (в размерах модели), Turn (радианы), Shape (номер в Shapes); чего граф не говорит, решает правило. Compile(rules) на странице превращает графы в JavaScript (Source) для воркеров. LibraryScatter(rule) строит граф правила таким, каким оно сеется без графа: те же вещи до бита — с него начинает редактор.

Biome правила — биом земли по климату, где оно растёт; на стыке биомов вещи перемешиваются по весам (Land).

LibraryScatter(rule) берёт граф ресурса `ElemenxGraphics/scatter` (blueprints/scatter.json) и заполняет его параметры (MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps) и зерно `{Seed}` через Blueprints.Fill; приложение может подложить свой граф под тем же именем.

Under правила (floor или ceiling) сеет вещи на пол или свод пещеры под скалой земли с объёмом, под открытым небом — ничего; Under(field, place, ceiling) — высота этого пола или свода в точке, null, если его нет.

## Методы

- `Work()`
- `Compile(rules)`
- `LibraryScatter(rule)`
- `Under(field, place, ceiling)`
- `Sow(job)`

## Тесты

- [sows by the rules: the things of each model in their squares, none where the sketch keeps the ground free, the way stopped where they stand](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L60) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows a rule Under on the floor and the roof of a tunnel under a hill, none on the hill over it nor under the sky](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L101) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sets a tree a little into the ground where it slopes, as far as its roots reach; level ground and a line as they were](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L143) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the same things in a worker as in the page, the field made there of its options, the context shared once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L169) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the rules of a land by its climate only in that land, mingled where lands meet, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L190) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows a rule of a graph: its library graph the very same things as the rule, a graph of its own its sizes, turns and shapes, in a worker too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L244) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows a rule of no graph by its library graph only: Compile gives it its code, Chance has no tests of its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L313) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [keeps the whole of a large thing off a road, not only its place](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L332) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [places the things of a line every step of it, whatever its pieces, the same from its start in every square](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L357) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [reads the graphs of the library from its resources, one of the same name of an Application in their place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L884) — `tests/regression/blueprints.test.js`
- [gives the very numbers it gave, in a range too, the same in each Service that had its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Random/Random.test.js#L27) — `libraries/ElemenxCommon/services/Random/Random.test.js`
- [makes what is past its outline: a cliff falls, a passage keeps its way open with a road to the middle, a wall stands with a gate, a side with a location beside and no passage stays open](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js#L87) — `libraries/ElemenxGraphics/services/SceneLocations/SceneLocations.test.js`
