<!-- generated -->
# Meshes

Фигуры трёхмерного пространства из треугольников, одни и те же на странице, в воркере и в Node (страницу они не читают): то, что рисует Renderer, и то, из чего строятся модели. Geometry() — пустая геометрия; геометрия — {Positions, Normals, UVs, Colors, Indices} (плоские массивы: 3, 3, 2 и 3 числа на вершину): Sphere({Radius, Segments, Rings}), Icosphere({Radius, Detail}), Ring({Inner, Outer, Segments}) (плоское, вокруг оси Y), Box({Width, Height, Depth}), Cylinder({Radius, Top, Height, Segments, Caps}) (конус при Top 0), Torus({Radius, Tube, Segments, Sides}), Plane({Width, Depth, Segments}), Lathe({Points: [[radius, y]...], Segments}) (линия, повёрнутая вокруг оси Y), Wedge({Width, Height, Depth}) (крыша из двух скатов); Transform(geometry, matrix), Merge(parts) (каждая — геометрия или {Geometry, Matrix, Color}), Displace(geometry, amount) (каждая вершина сдвинута вдоль нормали на amount(position, normal)), Normals(geometry) (заново по граням), Facets(geometry) (каждая грань плоская, со своими вершинами), Simplify(geometry, cell) (углы в одной клетке сетки сводятся в один, для более простого уровня).

## Методы

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

## Тесты

- [merges the geometries of a model as large as a building of glass without running out of the stack](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/Meshes/Meshes.node.test.js#L25) — `libraries/ElemenxGraphics/services/Meshes/Meshes.node.test.js`
- [puts planets on their orbits and makes shapes of three dimensions with the Services of the system Libraries](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L48) — `tests/regression/headless.test.js`
- [draws what moves together of a model of a file as one for each material: all that stands still, each wheel, each opening](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-frames.test.js#L175) — `tests/regression/library-scene-frames.test.js`
- [turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L184) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L380) — `tests/regression/library-scene.test.js`
- [keeps from the shaders what would blur, flicker or show as noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1172) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1933) — `tests/regression/library-scene.test.js`
- [burns where it is told: effects with their lamps, those of a body, bursts that end, types of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2421) — `tests/regression/library-scene.test.js`
- [Renderer makes programs behind the page for who is patient, and sets in a program only what changed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3805) — `tests/regression/library-scene.test.js`
- [A mirrored node keeps its mirror, and what a file keeps as one piece stands apart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4195) — `tests/regression/library-scene.test.js`
- [Physics flies a ship: its speed comes after its throttle, its axes stay square](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4501) — `tests/regression/library-scene.test.js`
- [makes a part of a vehicle of what lies in a box of its model, moves it by degrees, and keeps what stops a wheel with the wheel](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L5151) — `tests/regression/library-scene.test.js`

+11 ещё в тех же файлах
