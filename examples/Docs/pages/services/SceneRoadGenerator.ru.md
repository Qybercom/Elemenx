<!-- generated -->
# SceneRoadGenerator

Дороги из сида, каждый раз одни и те же. Track(seed, options) — замкнутая гоночная трасса: спецификация дороги вида road для Scene ({ID, Type, Closed, Points, Barriers, Marks}) и место старта, по кругу вокруг середины, ближе и дальше, поэтому она никогда не пересекает себя. Параметры: Length (длина круга в метрах, 2400), Corners (сколько поворотов, от 9 до 14), Wild (насколько она уходит от круга, от 0 до 1, 0.55), Type (тип SceneRoads, track), Barrier (вид ограждений, tyres; none — без ограждений), Gap (метры от края дороги до них, 2), Scenery (true — горная земля для неё, а её тоннели и мосты находятся сами: Structures). Возвращает {Seed, Spec, Length, Start: {X, Z, Heading, At}}: старт — на середине самой длинной прямой, At — метры от начала её линии. Со Scenery ещё Sketch — {Layers} эскиза мира для неё: на её линии гора, под которой она идёт тоннелем, каньон и широкая долина, над которыми мосты и виадук, гряда поперёк; вокруг — горы для вида; и Size — размер мира, в который всё это помещается.

## Методы

- `Track(seed, options)`

## Тесты

- [holds a car inside the barriers of a track by its corners, at any speed and at any angle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-roads.test.js#L572) — `tests/regression/library-scene-roads.test.js`
- [drives a car on its track: it stands on the road, nothing shakes, and the barrier holds it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5193) — `tests/regression/library-scene.test.js`
- [stops a ship at what flies there: a craft by the box of its model, as a body by its round](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6659) — `tests/regression/library-scene.test.js`
- [draws glass last, through it what is behind, and throws no shadow of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6733) — `tests/regression/library-scene.test.js`
- [makes a closed track of a seed, the same each time, as long as asked, starting on its longest straight](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L333) — `tests/regression/scene-roads.test.js`
- [makes the land of a track with its scenery: on its line a mountain, a canyon, a ridge and a valley, peaks round it, out of its way](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L356) — `tests/regression/scene-roads.test.js`
- [says what a wheel stands on: smooth along the road all the way round, the grass beside it, near to its line](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L396) — `tests/regression/scene-roads.test.js`
