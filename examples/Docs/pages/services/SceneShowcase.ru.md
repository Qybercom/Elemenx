<!-- generated -->
# SceneShowcase

SceneShowcase: один большой мир из всех примитивов генерации Scene, район за районом, — демонстрация того, что они делают вместе, и бенчмарк сцены размером с игровую.

- World(options) — мир: {Name, Seed (зерно его земли: сцена с Seed сделала бы вокруг него звёздную систему), Size, Time, Weather, Objects (описания для Scene.Add, земля первой), Districts ([{ID, Name, X, Y, Radius, Shows (какие примитивы он показывает)}]), Route (виды, через которые идёт его обход: [{ID, Name, Target [x, y, z], Yaw, Pitch, Distance}])}. Параметры: Size (размер земли, 3000 метров), Seed ('showcase'), Districts (ID нужных районов; по умолчанию все).
- Districts() — районы, которые он раскладывает: [{ID, Name, X, Y, Radius, Shows}].

На земле — скетч всех районов: горы, кратер и каньон, река с холмов к морю с пляжем и дюнами, озеро и болото, поселения каждого вида с кварталами, площадями, стенами и достопримечательностью, фермы рядами, леса каждого вида, штрихи и штампы редактора, триггеры и зоны игры. Поверх стоят дороги (автострада с мостами и тоннелями, железная дорога, гоночная трасса с ограждениями, галерея всех типов дорог), галерея всех моделей SceneModels и всех классов SceneBuildingGenerator, эффекты и свет, зеркало и стекло, пешеходы, машина и лодка. Галереи читаются из сервисов, так что новая модель или новый тип появляются в мире сами.

Демо Showcase на странице /graphics примера Advanced строит этот мир, засекает время генерации и по кнопке Benchmark облетает районы, измеряя кадры, которые сцена действительно нарисовала (Scene.Drawn, а не тики браузера), самый медленный из них, время процессора на кадр и то, что рисует кадр. Там же переключатели Levels и Proxies, размер кэша (CacheSize), кнопка Clear cache и сколько хранится. GameEditor открывает его как новую игру (кнопка «Мир-образец»).

## Методы

- `Districts()`
- `World(options)`

## Тесты

- [lays out its districts, each with what it shows, and a tour of them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L26) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
- [uses every type of the sketch of a ground, every type of road, every model, every class of building and every effect](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L48) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
- [makes a smaller world at its scale, and only the districts asked for](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L84) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
- [goes into a Scene as one list: its ground with the sketch, its objects](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js#L100) — `libraries/ElemenxGraphics/services/SceneShowcase/SceneShowcase.test.js`
