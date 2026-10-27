<!-- generated -->
# Visibility

Что видно на сетке: прямые, линия взгляда, поле зрения и туман войны. opaque — функция (x, y), истинная там, где клетка закрывает то, что за ней, или сетка Pathfinding (её преграды закрывают обзор).

- Line(x0, y0, x1, y1): клетки прямой между двумя клетками, [{X, Y}] (Брезенхэм).
- Sight(opaque, x0, y0, x1, y1): видит ли одна клетка другую — ничто между ними не закрывает обзор.
- Field(opaque, x, y, radius): клетки, видимые из клетки в пределах radius (shadowcasting; стены, которые закрывают обзор, видны): {Cells: [{X, Y}], Count, Has(x, y)}.
- Fog(width, height): туман войны карты, каждая клетка неизвестна (0), разведана (1) или видна сейчас (2): Get(x, y), Seen(x, y), Explored(x, y), Show(field) (клетки поля видны и разведаны навсегда), Hide() (всё видимое снова только разведано — перед полями нового кадра), Reveal(opaque, x, y, radius) (Show поля Field), Reset(), Width, Height, State (список состояний, строка за строкой).

## Методы

- `Line(x0, y0, x1, y1)`
- `Sight(opaque, x0, y0, x1, y1)`
- `Field(opaque, x, y, radius)`
- `Fog(width, height)`

## Пример

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
