<!-- generated -->
# SceneSower

SceneSower: то, что Scatter сцены сеет в квадратах земли, считается вне главного потока (Work(): воркеры Workers.Pool) или на странице — одинаково для одного и того же зерна.

- Sow(job) засевает квадраты земли по её правилам: job {Squares ([{X, Z}]), Context (общее для них: сам объект или имя, под которым его хранит воркер, Share пула)}; задание без Context само служит контекстом. Контекст: {Key (земли и правил: воркер собирает поле один раз на ключ), Options (параметры поля земли, SceneTerrainGenerator.Flat), Roads, Kept (клетки 4×4 под домами деревень), Rules (правила Scatter, биома, скетча), Free ({Areas, Lines}: где скетч держит землю свободной), Models ({имя: {Size, Keys (Key SceneModels.Make каждого из 16 вариантов)}}), Size (размер квадрата, 48) и на странице Field (само поле)}. Возвращает {Squares: [{X, Z, Lists, Center}], Blocked, Things}.
- Work() — пул его воркеров, создаётся один раз.

Scatter отправляет ближайшие квадраты пачками по шесть, по два задания на воркер; контекст поколения уходит каждому воркеру один раз. Без воркеров тот же код работает на странице по 4 мс за кадр. Мир-образец (3×3 км) засевается за ~9,5 с вместо 96.

## Методы

- `Work()`
- `Sow(job)`

## Тесты

- [sows by the rules: the things of each model in their squares, none where the sketch keeps the ground free, the way stopped where they stand](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L60) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [sows the same things in a worker as in the page, the field made there of its options, the context shared once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L97) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
