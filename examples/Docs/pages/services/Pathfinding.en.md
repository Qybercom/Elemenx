<!-- generated -->
# Pathfinding

The ways across a map: on a grid of cells, or on a graph of your own.

- Grid(width, height, cost) returns a grid of cells, each of a cost to enter (1 by default; Infinity: blocked). Grid(rows, legend) makes it of rows of text: '.' costs 1, '#' blocks, a digit is its cost, legend {char: cost} says more. A grid: Width, Height, Get(x, y) (Infinity outside), Set(x, y, cost), Block(x, y), Free(x, y), Passable(x, y), Clone().
- Path(grid, from, to, options): the cheapest way from {X, Y} to {X, Y} (A*), [{X, Y}] from the start to the goal, or null. Options: Diagonal (true: eight ways), Corners (false: no diagonal step past a blocked side), Nearest (true: to the reachable cell nearest the goal when the goal cannot be reached: a unit sent into a building), Limit (the most cells looked at). The costs are 1 or more.
- Distances(grid, targets, options): the cost from every cell to the nearest of the targets (Dijkstra), a list of Width * Height numbers (Infinity: no way).
- Flow(grid, targets, options): a flow field to the targets, for many units at once: {Distances, Next(x, y) (the next cell, or null), Direction(x, y) ({X, Y} of the step: -1, 0 or 1)}.
- Search({Start, Goal, Key, Neighbors, Heuristic, Limit}): A* on a graph of your own (Dijkstra without a Heuristic): Goal(node) is true at the goal (or is the goal, compared by Key), Key(node) its text, Neighbors(node) [{Node, Cost}]; returns {Path: [nodes], Cost} or null.
- Smooth(grid, path): the path without the cells it passes in a straight line: its corners only.

## Methods

- `Grid(width, height, cost)`
- `Path(grid, from, to, options)`
- `Distances(grid, targets, options)`
- `Flow(grid, targets, options)`
- `Search(options)`
- `Smooth(grid, path)`
