<!-- generated -->
# Spatial

Where things are on a plane, found fast: a grid of buckets (a spatial hash). The units of a map under a selection frame, the enemies in the range of a tower, the nearest tree.

- Create({Cell}) returns an index (Cell: the side of a bucket, 64 by default; about the size of the things): - Set(id, x, y, width, height): puts a thing in it, or moves it (width and height 0: a point); - Remove(id), Has(id), Get(id) ({ID, X, Y, Width, Height}), Count(), Clear(), Each(callback); - Rect(x, y, width, height, filter): the IDs of the things that touch the rectangle; - Radius(x, y, radius, filter): the IDs of the things within radius of the point, the nearest first; - Nearest(x, y, max, filter): {ID, Distance} of the nearest thing (within max, when given), or null. filter(id, thing) keeps a thing when it returns true.
- Distance(x, y, thing): from a point to a thing ({X, Y, Width, Height}): 0 inside it.

## Methods

- `Distance(x, y, thing)`
- `Create(options)`
