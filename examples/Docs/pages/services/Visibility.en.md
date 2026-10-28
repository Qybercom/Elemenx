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

## Example

```example
<pre style="font: 14px/1.2 var(--elemenx-font-mono, monospace);">{{Picture}}</pre>
<Slider Min="1" Max="8" [value]="Radius" (input)="Changed" />
<p class="elemenx-text small muted">What the @ sees within {{Radius}} cells: the walls (#) hide what is behind them; the rest is fog (~).</p>
<script>
({
	Radius: 5,
	Picture: '',
	Rows: [
		'..............',
		'....###.......',
		'..........#...',
		'......@...#...',
		'..##......#...',
		'..............',
		'.......####...'
	],

	$OnCreate: function () {
		this.See();
	},

	Changed: function (value) {
		this.Radius = value;
		this.See();
	},

	See: function () {
		var rows = this.Rows;
		var field = this.$Service('Visibility').Field(function (x, y) {
			return !rows[y] || rows[y].charAt(x) === '#';
		}, 6, 3, this.Radius);

		this.Picture = rows.map(function (row, y) {
			return row.split('').map(function (cell, x) {
				return field.Has(x, y) ? cell : '~';
			}).join(' ');
		}).join('\n');
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
