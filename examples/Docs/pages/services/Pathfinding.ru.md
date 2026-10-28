<!-- generated -->
# Pathfinding

Пути по карте: по сетке клеток или по своему графу.

- Grid(width, height, cost) возвращает сетку клеток, у каждой своя цена входа (по умолчанию 1; Infinity — преграда). Grid(rows, legend) строит её из строк текста: '.' стоит 1, '#' — преграда, цифра — её цена, legend {символ: цена} добавляет свои. У сетки: Width, Height, Get(x, y) (Infinity за её краем), Set(x, y, cost), Block(x, y), Free(x, y), Passable(x, y), Clone().
- Path(grid, from, to, options): самый дешёвый путь от {X, Y} до {X, Y} (A*), [{X, Y}] от начала до цели, или null. Options: Diagonal (true — восемь направлений), Corners (false — без шага по диагонали мимо закрытой стороны), Nearest (true — до достижимой клетки, ближайшей к цели, когда цель недостижима: юнит, посланный в здание), Limit (сколько клеток осмотреть самое большее). Цены — 1 и больше.
- Distances(grid, targets, options): цена пути от каждой клетки до ближайшей из целей (Дейкстра), список из Width * Height чисел (Infinity — пути нет).
- Flow(grid, targets, options): поле потока к целям, для многих юнитов сразу: {Distances, Next(x, y) (следующая клетка или null), Direction(x, y) ({X, Y} шага: -1, 0 или 1)}.
- Search({Start, Goal, Key, Neighbors, Heuristic, Limit}): A* на своём графе (без Heuristic — Дейкстра): Goal(node) истинно у цели (или это сама цель, сравниваемая по Key), Key(node) — её текст, Neighbors(node) — [{Node, Cost}]; возвращает {Path: [узлы], Cost} или null.
- Smooth(grid, path): путь без клеток, которые он проходит по прямой: только его углы.

## Методы

- `Grid(width, height, cost)`
- `Path(grid, from, to, options)`
- `Distances(grid, targets, options)`
- `Flow(grid, targets, options)`
- `Search(options)`
- `Smooth(grid, path)`

## Пример

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

## Тесты

- [Random: the same numbers for the same seed, its helpers in their bounds, a fork of its own, a smooth noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L27) — `tests/regression/game-services.test.js`
- [Spatial: the things in a rectangle, within a radius the nearest first, the nearest one, as they move and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L67) — `tests/regression/game-services.test.js`
- [Pathfinding: a way round the walls, no corner cut, around costly cells, to the nearest reachable cell, on a graph of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L104) — `tests/regression/game-services.test.js`
- [Visibility: a line, the sight past a wall, the field of view and its shadows, the fog of war](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L181) — `tests/regression/game-services.test.js`
- [GameLoop: steps of the same time whatever the frames, a part of a step to draw between, its speed, pause and catch-up limit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L228) — `tests/regression/game-services.test.js`
