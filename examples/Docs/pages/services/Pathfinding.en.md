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

## Example

```example
<pre style="font: 14px/1.2 var(--elemenx-font-mono, monospace);">{{Picture}}</pre>
<p class="elemenx-text small muted">{{Note}}</p>
<Toggle Label="Diagonal steps" [checked]="Diagonal" (change)="Toggled" />
<script>
({
	Diagonal: false,
	Picture: '',
	Note: '',
	Rows: [
		'S.....#.....',
		'.####.#.###.',
		'.#....#...#.',
		'.#.####.#.#.',
		'.#......#..G',
		'.########.##',
		'..........9.'
	],

	$OnCreate: function () {
		this.Find();
	},

	Toggled: function (checked) {
		this.Diagonal = checked;
		this.Find();
	},

	Find: function () {
		var paths = this.$Service('Pathfinding');
		var rows = this.Rows.map(function (row) {
			return row.replace('S', '.').replace('G', '.');
		});
		var grid = paths.Grid(rows);
		var path = paths.Path(grid, {X: 0, Y: 0}, {X: 11, Y: 4}, {Diagonal: this.Diagonal});
		var cells = this.Rows.map(function (row) {
			return row.split('');
		});

		(path || []).slice(1, -1).forEach(function (cell) {
			cells[cell.Y][cell.X] = '*';
		});

		this.Picture = cells.map(function (row) {
			return row.join(' ');
		}).join('\n');
		this.Note = path ? 'A way of ' + (path.length - 1) + ' steps (# blocks, 9 costs nine).' : 'No way.';
	}
})
</script>
```

## Tests

- [Random: the same numbers for the same seed, its helpers in their bounds, a fork of its own, a smooth noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L27) — `tests/regression/game-services.test.js`
- [Spatial: the things in a rectangle, within a radius the nearest first, the nearest one, as they move and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L67) — `tests/regression/game-services.test.js`
- [Pathfinding: a way round the walls, no corner cut, around costly cells, to the nearest reachable cell, on a graph of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L104) — `tests/regression/game-services.test.js`
- [Visibility: a line, the sight past a wall, the field of view and its shadows, the fog of war](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L181) — `tests/regression/game-services.test.js`
- [GameLoop: steps of the same time whatever the frames, a part of a step to draw between, its speed, pause and catch-up limit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L228) — `tests/regression/game-services.test.js`
