<!-- generated -->
# SceneClusters

SceneClusters: a level of detail of clusters, the way Nanite makes one, for a large model that stands alone (a tower, a large model of a file): its triangles in clusters of Size (128), in the order of a Morton curve; four clusters a group (more higher up), each group made simpler (its corners within a cell made one, half its triangles gone), its border kept as it was so groups beside it meet it with no crack, cut into clusters again, and so on up to one. A cluster is drawn where its error on the screen is under Pixels and that of its parent is not: each part of the model at one level, finer the nearer, all of it one draw (Renderer mesh.Triangles). The same in a page, a worker and Node (it reads no page).

- Build(geometry) the clusters of a geometry ({Positions, Normals, Colors, UVs, Indices}; flat faces welded by their corners): {Positions, Normals, Colors, UVs (Float32Array: the points of all its levels, each face of the simpler ones of its own points, its UVs the mean of the corners it was made of), Indices (Uint32Array: the triangles of each cluster in turn), Clusters (Float32Array, 14 numbers a cluster: Start and Count in Indices, Level, Error, its sphere [x, y, z, radius], the Error of its parent and its sphere; a cluster with no parent Infinity), Levels, Triangles (of the finest)}.
- Select(built, matrix, eye, focal, pixels) the triangles to draw now (Uint32Array of indices) for the model standing as matrix ([x axis, y axis, z axis, place], 12 numbers), seen from eye (in the world), focal (pixels of the height of the screen over the tangent of half the view), pixels (the error allowed, 1 by default); {Indices, Clusters (how many drawn), Level (the coarsest drawn)}.
- Work(): the pool of its workers, made once.

## Methods

- `Work()`
- `Build(geometry)`
- `Select(built, matrix, eye, focal, pixels)`

## Tests

- [draws a tower near at its finest and far coarser, by its clusters](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scene-clusters.test.js#L48) — `tests/regression/scene-clusters.test.js`
- [draws a model as fine as the screen needs, part by part, with no crack where its levels meet](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js#L49) — `libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js`
- [chooses by where a model stands and how large it is](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js#L74) — `libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js`
- [builds in a worker as in the page](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js#L82) — `libraries/ElemenxGraphics/services/SceneClusters/SceneClusters.test.js`
