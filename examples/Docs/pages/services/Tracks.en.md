<!-- generated -->
# Tracks

Tracks: closed race tracks of a seed. A track is its middle line and what is built along it, as data, and a model that can be laid in any scene.

- Make(seed, options) returns {Seed, Points: [{X, Y, Z, Way: [x, z], Bend}], Length, Width, Margin, Start: {X, Y, Z, Heading}, Hills}. Options: Length (the way round, metres, default 2400), Width (default 14), Corners (how many bends the way has, default 9 to 14), Wild (how far it strays from a round, 0 to 1, default 0.55), Hills (how high the land rises, default 7), Margin (from the road to the barrier, default 7).
- Near(track, x, z, hint) returns {Offset, Along, Way}: how far a place is from the middle line (the left side is below 0) and where on it. With hint, the Along of a moment ago, it looks only there: where two sections lie close a car stays on the one it is on.
- Height(track, x, z) is the height of the land.
- Under(track, x, z, hint) is what a wheel stands on, as the model has it: {Height, Grip, Drag}, smooth along the road, the land off it.
- Asset(track) is a model of it, for Models.Define(name, {URL: name, Asset, Fit: false}) and a location: land, road, kerbs where it bends, barriers, a start line with a gantry, and stands by the longest straight.

## Methods

- `Make(seed, options)`
- `Near(track, x, z, hint)`
- `Height(track, x, z)`
- `Under(track, x, z, hint)`
- `Asset(track)`

## Tests

- [Tracks makes a closed road of a seed, knows how far a place is from it, and a model of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3469) — `tests/regression/library-scene.test.js`
- [Tracks says what a wheel stands on: smooth along the road, the land beside it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4667) — `tests/regression/library-scene.test.js`
- [CastList, DiffView, MediaHero, MediaShelf and VideoTimeline are as wide as a column of flex-start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/inline-size-width.test.js#L39) — `tests/regression/inline-size-width.test.js`
- [holds a car inside the barrier by its corners, at any speed and at any angle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4733) — `tests/regression/library-scene.test.js`
- [drives a car on its track: it stands on the road, nothing shakes, and the barrier holds it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4791) — `tests/regression/library-scene.test.js`
- [stops a ship at what flies there: a craft by the box of its model, as a body by its round](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6207) — `tests/regression/library-scene.test.js`
- [draws glass last, through it what is behind, and throws no shadow of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6281) — `tests/regression/library-scene.test.js`
