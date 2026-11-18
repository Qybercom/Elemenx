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
- Nearest(points, x, y, z): of points of space, {Index (of the nearest), Near (its distance), Next (that of the next nearest)}: what the plates of a planet are found by.
- Code(): the functions of the Kernel as js (made in the page; a worker makes them of the text it carries, Compiled); IR(): the module of the IR (for the blocks of geometry of Blueprints.Numeric): geo_line (vec4 of Distance, T, Side, Segment), geo_area (vec2 of Inside 1 or 0, Distance), geo_level, geo_grid (vec2 of Value, Inside), geo_tunnel (vec2 of Distance, Axis), geo_passages (vec2 of Distance, Floor), geo_fall, geo_nearest (vec3 of Index, Near, Next).
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
- `Nearest(points, x, y, z)`

## Tests

- [finds the nearest point of a line, how far along it, its side and its piece; whether a point is in an area](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L19) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [gives the level of a line between those of its points, and the nearest of points of space and the next](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L34) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [makes a graph of its blocks a function of numbers: the points a list given, the same run, js and wasm](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L43) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [computes what a formula reads once in a branch only when that branch is taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L87) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [keeps its blocks of a cave under names of their own, beside the nodes of a world](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L109) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
