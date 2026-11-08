<!-- generated -->
# SceneShards

SceneShards: how a solid thing breaks, as geometry. A thing is cut by the cells of points scattered in its box (a Voronoi diagram: each cell the space nearer its point than any other), more of them near where it was hit, so it breaks into smaller pieces there and larger far from it. Each piece keeps the faces of the thing inside its cell, and the faces it was broken along (where the thing was not) are the hull of its corners, of the raw color of what is inside.

- Seeds(min, max, count, hit, options): the points of the cells ([[x, y, z]...]) in the box min..max: half of them (options Near, 0.6) round hit (within options Reach of the size of the box, 0.35), the rest anywhere; options Seed (any number or text): the same points for the same seed.
- Clip(polygon, normal, offset): the part of a polygon ([[x, y, z]...]) where dot(normal, p) <= offset.
- Pieces(triangles, seeds): the pieces of triangles ([{Points: [a, b, c], Color}]) cut by the cells of seeds: [{Seed (its point), Surface: [{Points, Color}] (the faces of the thing in it, as triangles), Corners ([[x, y, z]...]: every corner of them)}], none for a cell with nothing of it.
- Hull(points): the convex hull of points, as triangles ([[a, b, c]...], their corners in turn round its outward normal); [] when they lie on a plane or are fewer than four.
- Random(seed): numbers from 0 to 1, the same for the same seed (a function).

## Methods

- `Random(seed)`
- `Seeds(min, max, count, hit, options)`
- `Clip(polygon, normal, offset)`
- `Pieces(triangles, seeds)`
- `Hull(points)`
