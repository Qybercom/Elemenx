<!-- generated -->
# Geometry

Geometry: what a ground and a planet find of their lines, areas and points, of one source in the kernel language of Elemenx.Compilers (Kernel), the same in the page, in a worker, in wasm and in a shader. A line or an area is a list of numbers (float[]), x and z by twos; points of space x, y and z by threes.

- Line(points, x, z): the nearest point of a line: {Distance, T (along the whole of it, 0 to 1), Side (+1 left of its way, -1 right), Segment (the index of its piece)}.
- Area(points, x, z): {Inside (whether the point is in the area), Distance (to its edge)}.
- Level(points, levels, x, z): the level of a line where it is nearest a point, between those of its points (levels: one of each point), as a river and a road are laid.
- Grid(data, side, radius, x, z): a grid of side by side numbers over the square of a radius round 0 (a stamp): {Value (between its four nearest), Inside (whether the point is on it)}.
- Tunnel(points, x, y, z, radius, flat, width, height, corner): of points of space by threes, how far a point is from the wall of a tunnel round them (under 0 inside): a round bore of radius, its floor cut level by flat, or a box of a width and height (corners round by corner); {Distance, Axis (the height of its axis by the point)}.
- Passages(packed, x, y, z, blend, crust, ground): of a graph of passages packed as numbers ([ways, halls, each way: its count of points, Radius, Flat, Width, Height, Corner, Low, its points; each hall: x, y, z, Radius, Floor]), its ways and halls joined smoothly over blend, none cut within crust of the ground over the point: {Distance, Floor (of the nearest)}.
- Fall(distance, radius): 1 at the middle, 0 at the edge and past it, smoothly (half a wave of a cosine).
- Nearest(points, x, y, z): of points of space, {Index (of the nearest), Near (its distance), Next (that of the next nearest), Other (the index of that one)}: what the plates of a planet are found by.
- Painted(packed, x, y, z): of areas of directions on a sphere packed as numbers ([count, each area: its count of points, its Edge (radians), its points by threes]), how much a point (a direction) is of them, their sum: each 1 an Edge inside its outline, a half on it, 0 an Edge out of it (what a developer drew of the land and the sea of a planet).
- Strokes(packed, x, y, z): of lines of directions drawn on a sphere packed as numbers ([count, each: its count of points, Reach in radians, Amount, Power, its points by threes]), what they give a direction, their sum: each its Amount by (1 - its angle to the line over Reach) to Power, none past Reach (the ranges, rifts and rivers a developer drew on a planet).
- Bend(record, t, width, bend): how far aside of its way a river is at t of a segment of it packed as numbers ([A, B by threes, FlowA, FlowB, LevelA, LevelB, AlongA, AlongB, PhaseA, PhaseB, Seed, End (km of its river where it ends in another, -1 else), From (1: an arm of a delta), its count of joins, the km of each]), km: bends of bend times its width (width km by the root of its flow), none at its joins. River(packed, x, y, z, radius, width, bend): of segments packed so ([count, each]), the nearest river to a direction as it bends, {Far (km, Infinity with none), Flow, Level}.
- Edits(packed, softs, x, y, z, height): a height as brushes along paths of directions leave it, in their order ([count, each: its type, 0 raise, 1 lower, 2 flatten, 3 smooth, its count of points, Reach in radians, Amount, Height, its middle, Cap, the cosine of the cap it reaches, its points]): (1 - t^2)^2 of t the angle to its path over Reach; smooth toward softs[its index]. EditWeight(packed, at, x, y, z) that of one of them packed from at.
- Code(): the functions of the Kernel as js (made in the page; a worker makes them of the text it carries, Compiled); IR(): the module of the IR (for the blocks of geometry of Blueprints.Numeric): geo_line (vec4 of Distance, T, Side, Segment), geo_area (vec2 of Inside 1 or 0, Distance), geo_level, geo_grid (vec2 of Value, Inside), geo_tunnel (vec2 of Distance, Axis), geo_passages (vec2 of Distance, Floor), geo_fall, geo_nearest (vec4 of Index, Near, Next, Other), geo_painted, geo_strokes, geo_bend, geo_river (vec3 of Far, Flow, Level), geo_path, geo_edit_weight, geo_edits.
- Source(names) gives its members to a worker of the Workers Service.

The same functions run in Node: they read no page.

## Methods

- `Source(names)`
- `Code()`
- `IR()`
- `Line(points, x, z)`
- `Area(points, x, z)`
- `Level(points, levels, x, z)`
- `Grid(data, side, radius, x, z)`
- `Tunnel(points, x, y, z, radius, flat, width, height, corner)`
- `Passages(packed, x, y, z, blend, crust, ground)`
- `Fall(distance, radius)`
- `Strokes(packed, x, y, z)`
- `EditWeight(packed, at, x, y, z)`
- `Edits(packed, softs, x, y, z, height)`
- `Bend(record, t, width, bend)`
- `River(packed, x, y, z, radius, width, bend)`
- `Painted(packed, x, y, z)`
- `Nearest(points, x, y, z)`

## Tests

- [reads what a developer drew on a planet of the kernel of Geometry and its table, as the code read it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/planet-graphs.test.js#L361) — `tests/regression/planet-graphs.test.js`
- [tells how much of areas of directions drawn on a sphere a point is, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L19) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [finds the nearest river of segments packed and how far aside it bends, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L59) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [gives what lines drawn on a sphere give a point, each by its fall to its sides, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L91) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [changes a height by brushes along paths on a sphere in their order, the same of its block of numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L114) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [finds the nearest point of a line, how far along it, its side and its piece; whether a point is in an area](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L146) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [gives the level of a line between those of its points, and the nearest of points of space and the next](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L161) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [makes a graph of its blocks a function of numbers: the points a list given, the same run, js and wasm](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L170) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [computes what a formula reads once in a branch only when that branch is taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L214) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [keeps its blocks of a cave under names of their own, beside the nodes of a world](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L236) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [finds the nearest of points and the next one, and its index (Other)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L452) — `tests/regression/blueprints-ir.test.js`
- [carves the valley of a river and bends it of its graph and the kernel, the very ground and ways the code gave](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/planet-graphs.test.js#L276) — `tests/regression/planet-graphs.test.js`
