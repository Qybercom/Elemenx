<!-- generated -->
# Visibility

What can be seen on a grid: lines, the line of sight, the field of view and the fog of war. opaque is a function (x, y) that is true where a cell hides what is behind it, or a grid of Pathfinding (its blocked cells hide).

- Line(x0, y0, x1, y1): the cells of the straight line between two cells, [{X, Y}] (Bresenham).
- Sight(opaque, x0, y0, x1, y1): whether one cell sees the other: nothing hides between them.
- Field(opaque, x, y, radius): the cells seen from a cell within radius (shadowcasting; the walls that hide are seen): {Cells: [{X, Y}], Count, Has(x, y)}.
- Fog(width, height): the fog of war of a map, each cell unknown (0), explored (1) or seen now (2): Get(x, y), Seen(x, y), Explored(x, y), Show(field) (the cells of a Field seen, and explored for good), Hide() (all that is seen goes back to explored: before the fields of a new frame), Reveal(opaque, x, y, radius) (Show of a Field), Reset(), Width, Height, State (the list of the states, row by row).

## Methods

- `Line(x0, y0, x1, y1)`
- `Sight(opaque, x0, y0, x1, y1)`
- `Field(opaque, x, y, radius)`
- `Fog(width, height)`
