<!-- generated -->
# Meshes

Meshes: the shapes of three dimensions made of triangles, the same in a page, a worker and Node (they read no page): what Renderer draws, what a model is built of.

- Geometry() is an empty one; a geometry is {Positions, Normals, UVs, Colors, Indices} (flat arrays: 3, 3, 2 and 3 numbers a vertex): Sphere({Radius, Segments, Rings}), Icosphere({Radius, Detail}), Ring({Inner, Outer, Segments}) (flat, round the axis Y), Box({Width, Height, Depth}), Cylinder({Radius, Top, Height, Segments, Caps}) (a cone when Top is 0), Torus({Radius, Tube, Segments, Sides}), Plane({Width, Depth, Segments}), Lathe({Points: [[radius, y]...], Segments}) (a line turned round the axis Y), Wedge({Width, Height, Depth}) (a roof of two slopes); Transform(geometry, matrix), Merge(parts) (each a geometry or {Geometry, Matrix, Color}), Displace(geometry, amount) (each vertex moved along its normal by amount(position, normal)), Normals(geometry) (made again from the faces), Facets(geometry) (each face flat, of vertices of its own), Simplify(geometry, cell) (the corners within a cell of a grid made one, for a simpler level).

## Methods

- `Geometry()`
- `Sphere(options)`
- `Icosphere(options)`
- `Ring(options)`
- `Box(options)`
- `Cylinder(options)`
- `Torus(options)`
- `Plane(options)`
- `Lathe(options)`
- `Wedge(options)`
- `Transform(geometry, matrix)`
- `Merge(parts)`
- `Displace(geometry, amount)`
- `Facets(geometry)`
- `Simplify(geometry, cell)`
- `Normals(geometry)`

## Tests

- [merges the geometries of a model as large as a building of glass without running out of the stack](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Meshes/Meshes.node.test.js#L25) — `libraries/ElemenxGraphics/services/Meshes/Meshes.node.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of the system Libraries](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [draws what moves together of a model of a file as one for each material: all that stands still, each wheel, each opening](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-frames.test.js#L175) — `tests/regression/library-scene-frames.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L185) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L479) — `tests/regression/library-scene.test.js`
- [keeps from the shaders what would blur, flicker or show as noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1459) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2252) — `tests/regression/library-scene.test.js`
- [burns where it is told: effects with their lamps, those of a body, bursts that end, types of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2740) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4363) — `tests/regression/library-scene.test.js`
- [A mirrored node keeps its mirror, and what a file keeps as one piece stands apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4765) — `tests/regression/library-scene.test.js`
- [Physics flies a ship: its speed comes after its throttle, its axes stay square](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5071) — `tests/regression/library-scene.test.js`
- [makes a part of a vehicle of what lies in a box of its model, moves it by degrees, and keeps what stops a wheel with the wheel](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5721) — `tests/regression/library-scene.test.js`

+11 more in the same files
