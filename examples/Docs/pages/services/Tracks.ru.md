<!-- generated -->
# Tracks

Замкнутые гоночные трассы из сида: средняя линия, земля, дорога, поребрики, отбойники и трибуны, как данные и как модель. Make(seed, options), Near(track, x, z), Height(track, x, z), Asset(track).

## Методы

- `Make(seed, options)`
- `Near(track, x, z, hint)`
- `Height(track, x, z)`
- `Under(track, x, z, hint)`
- `Asset(track)`

## Тесты

- [Tracks makes a closed road of a seed, knows how far a place is from it, and a model of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3469) — `tests/regression/library-scene.test.js`
- [Tracks says what a wheel stands on: smooth along the road, the land beside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4667) — `tests/regression/library-scene.test.js`
- [CastList, DiffView, MediaHero, MediaShelf and VideoTimeline are as wide as a column of flex-start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/inline-size-width.test.js#L39) — `tests/regression/inline-size-width.test.js`
- [holds a car inside the barrier by its corners, at any speed and at any angle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4733) — `tests/regression/library-scene.test.js`
- [drives a car on its track: it stands on the road, nothing shakes, and the barrier holds it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4791) — `tests/regression/library-scene.test.js`
- [stops a ship at what flies there: a craft by the box of its model, as a body by its round](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6207) — `tests/regression/library-scene.test.js`
- [draws glass last, through it what is behind, and throws no shadow of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6281) — `tests/regression/library-scene.test.js`
