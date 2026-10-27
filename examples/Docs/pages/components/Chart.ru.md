<!-- generated -->
# Chart

График в SVG шириной с контейнер. Type: line, area, bar, pie или donut. Labels называют точки оси X (или доли круговой диаграммы); Series: [{Name, Values, Color}] (круговая показывает первую серию). Stacked складывает столбцы и области серий друг на друга. Ось Y берёт круглые шаги по значениям (Min и Max фиксируют её). Указатель показывает значения у подписи во всплывающей подсказке; легенда выключает и включает серию (или долю) (Hidden хранит их имена). Format(value) пишет значение (по умолчанию в локали, с Unit). Height — высота в пикселях. Таблица данных остаётся на странице для экранных читалок. События: hover ({Index, Label}), toggle (Hidden).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Type` | `'line'` |
| `Labels` | `[]` |
| `Series` | `[]` |
| `Height` | `240` |
| `Stacked` | `false` |
| `Legend` | `true` |
| `Min` | `null` |
| `Max` | `null` |
| `Unit` | `''` |
| `Format` | `null` |
| `Label` | `''` |
| `Hidden` | `[]` |
| `Width` | `600` |
| `Palette` | `['#3f6c9e', '#c2477f', '#2f8f83', '#d99a1e', '#7a4fb0', '#d25f3a', '#5f7d2e', '#0f8fae']` |

## События

- `hover`: Указатель перешёл к другой подписи: {Index, Label}.
- `toggle`: Ряд или сектор выключен или включён в легенде: Hidden, имена выключенных.

## Пример

```example
<RadioGroup Variant="segmented" [options]="Types" [value]="Type" (change)="Typed" />
<Chart [type]="Type" [labels]="Labels" [series]="Series" Label="Visits and sign-ups" (hover)="Hovered" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Type: 'line',
	Note: 'Point at the chart; press a name of the legend to hide its series.',
	Types: [{Value: 'line', Label: 'Line'}, {Value: 'area', Label: 'Area'}, {Value: 'bar', Label: 'Bar'}, {Value: 'pie', Label: 'Pie'}, {Value: 'donut', Label: 'Donut'}],
	Labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
	Series: [
		{Name: 'Visits', Values: [120, 132, 101, 154, 190, 230]},
		{Name: 'Sign-ups', Values: [12, 18, 9, 21, 30, 41]}
	],

	Typed: function (value) {
		this.Type = value;
	},

	Hovered: function (event) {
		this.Note = 'Week ' + event.Label;
	}
})
</script>
```
