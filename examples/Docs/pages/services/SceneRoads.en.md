<!-- generated -->
# SceneRoads

SceneRoads: the roads of a scene, of any kind, and what they are made of: motorways, streets, country roads, tracks of a race, paths, runways and railways. A road is a line through its points and a type: its cross-section, strips from its left edge to its right one.

- Surfaces: what a strip is made of, by name (asphalt, concrete, cobbles, paving, gravel, dirt, sand, grass, ballast, runoff, rumble, cycle, steel, wood): {Color, Rough, Metal, Grip (1 holds as dry asphalt does), Drag (0: none), Material (its pattern: a material of SceneMaterials, none: plain)}. Surface(name, surface) adds one or replaces it, Surface(name) gives it.
- Types: Define(name, type) adds one or replaces it, Type(name) gives it, Types() lists the names. A type is {Title, Group (road, street, path, race, air, rail), Strips: [{Kind (lane, shoulder, verge, kerb, sidewalk, median, parking, cycle, runoff, rumble, bed, ditch...), Width (m), Surface, Height (over the level of the road; a kerb, a sidewalk, the bed of a railway), Way (of a lane: 1 the way of the line, -1 back, 0 both), Left and Right (the marking of its edge: solid, dashed, double, dotted or none), Marking (its color)}], Rails ([{Offset (from the middle), Gauge (m)}]: rails on sleepers), Sleepers ({Step, Length, Surface}), Speed (km/h), Catenary (wires over it: a railway or a tram)}. Types of any Library come declared in $Provides ({SceneRoads: {Types: [...]}}).
- Line(points, options): a road's line made smooth and even: points [[x, z] or [x, z, y]] through which it goes (Closed: a ring), sampled every Step metres (2): [{X, Y, Z, Way [x, z], Along (metres from its start), Bend}]; Height(x, z), when given, is the height of a point with none of its own.
- Road(spec): a road made of {ID, Type, Points, Closed, Width (in place of the width of the type: its strips scaled), Height} with its Line, its Width and its strips at their offsets ({Left, Right} from the middle).
- Near(road, x, z, hint): {Offset (from the middle, left below 0, across the way), Far (how far the point is from the line: past an end, more than its Offset), Along (the index of the point nearest), At (the metres from its start), Way, Y (of the road there)}; hint, the Along of a moment ago, looks only round it.
- Under(roads, x, z, hints): what is under a point, the road on top: {Road (its ID), Strip (its kind), Surface, Height, Grip, Drag, Offset, Along} or null off every road.
- Sketch(roads): the lines a ground is made level under ({Type: road, Points, Width, Shoulder}).
- Asset(roads): the roads as a model of SceneModels (Define(name, {URL: name, Asset, Fit: false})): their strips, the sides of what is raised, the markings, the rails and sleepers.
- AssetOf(roads, options) is the same in a worker (Work(): the pool of its workers, made once, with the surfaces there are then): options {Ground (the options of the flat ground the piers of its bridges stand on, SceneTerrainGenerator.Flat, or the name a worker keeps them under by Share of Workers), Junctions}.

The same functions run in Node: they read no page.

## Methods

- `Surface(name, surface)`
- `Define(name, type)`
- `Type(name)`
- `Types()`
- `Line(given, options)`
- `Road(spec, options)`
- `Near(road, x, z, hint)`
- `Under(roads, x, z, hints)`
- `Sketch(roads, junctions)`
- `Asset(roads, options)`
- `AssetOf(roads, options)`
- `Work()`

## Tests

- [knows roads, streets, paths, tracks, runways and railways, each a cross-section of strips](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L20) — `tests/regression/scene-roads.test.js`
- [takes a type of its own and a surface of its own, and refuses a type of no strips](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L42) — `tests/regression/scene-roads.test.js`
- [makes a line smooth and even through its points, with its ways, metres and heights](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L56) — `tests/regression/scene-roads.test.js`
- [closes a ring on itself, and finds where a point is on it, near a hint](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L86) — `tests/regression/scene-roads.test.js`
- [tells what is under a point: its strip, surface, height and grip, the higher of two roads, none off them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L100) — `tests/regression/scene-roads.test.js`
- [scales the strips of a type to a width given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L120) — `tests/regression/scene-roads.test.js`
- [gives the lines a ground is made level under](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L128) — `tests/regression/scene-roads.test.js`
- [takes bridges and tunnels given, or finds them where the road leaves the ground, and levels no ground there](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L137) — `tests/regression/scene-roads.test.js`
- [makes a model of the roads: their surfaces, markings, and the rails and sleepers of a railway](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L181) — `tests/regression/scene-roads.test.js`
- [hangs the wires of a railway or a tram on masts, and lays the rails of a tram in the road, with no sleepers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L211) — `tests/regression/scene-roads.test.js`
- [has barriers only where asked, of their kinds, sides and stretches, and they stop what drives into them from either side](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L233) — `tests/regression/scene-roads.test.js`
- [finds the junctions of a network where roads cross or end on one another, brings the roads to one level there and stops their paint](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-roads.test.js#L261) — `tests/regression/scene-roads.test.js`

+12 more in the same files
