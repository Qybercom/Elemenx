<!-- generated -->
# SceneRoadGenerator

SceneRoadGenerator: roads made of a seed, the same each time. Track(seed, options) is a closed race track: the spec of a road of kind road for a Scene ({ID, Type, Closed, Points, Barriers, Marks}) with where it starts, round a middle, nearer and farther, so it never crosses itself. Options: Length (the way round, metres, 2400), Corners (how many bends, 9 to 14), Wild (how far it strays from a round, 0 to 1, 0.55), Type (of SceneRoads, track), Barrier (the kind of its barriers, tyres; none: no barriers), Gap (metres from the edge of the road to them, 2), Scenery (true: a land of mountains for it, its tunnels and bridges found). It returns {Seed, Spec, Length, Start: {X, Z, Heading, At}}: Start is on the middle of its longest straight, At metres from the start of its line; of Scenery also Sketch ({Layers} of a world for it: on its line a mountain it goes under, a canyon and a wide valley it goes over, a ridge across it; mountains round it) and Size (of a world that holds it all).

## Methods

- `Track(seed, options)`

## Tests

- [holds a car inside the barriers of a track by its corners, at any speed and at any angle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-roads.test.js#L572) — `tests/regression/library-scene-roads.test.js`
- [drives a car on its track: it stands on the road, nothing shakes, and the barrier holds it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5193) — `tests/regression/library-scene.test.js`
- [stops a ship at what flies there: a craft by the box of its model, as a body by its round](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6659) — `tests/regression/library-scene.test.js`
- [draws glass last, through it what is behind, and throws no shadow of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6733) — `tests/regression/library-scene.test.js`
- [makes a closed track of a seed, the same each time, as long as asked, starting on its longest straight](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L333) — `tests/regression/scene-roads.test.js`
- [makes the land of a track with its scenery: on its line a mountain, a canyon, a ridge and a valley, peaks round it, out of its way](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L356) — `tests/regression/scene-roads.test.js`
- [says what a wheel stands on: smooth along the road all the way round, the grass beside it, near to its line](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L396) — `tests/regression/scene-roads.test.js`
