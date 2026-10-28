<!-- generated -->
# Chart

A chart in SVG, as wide as its container. Type: line, area, bar, pie or donut. Labels name the points of the x axis (or the slices of a pie); Series: [{Name, Values, Color}] (a pie shows the first series). Stacked piles the bars and areas of the series. The y axis takes round steps from the values (Min and Max fix it). The pointer shows the values at a label in a tooltip; the legend turns a series (or a slice) off and on (Hidden holds their names). Format(value) writes a value (by default in the locale, with Unit). Height is the height in pixels. A table of the data stays in the page for screen readers. Events: hover ({Index, Label}), toggle (Hidden).

## Properties

| Property | Default |
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

## Events

- `hover`: The pointer moved to another label: {Index, Label}.
- `toggle`: A series or a slice was turned off or on in the legend: Hidden, the names turned off.

## Example

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

## Tests

- [builds the Libraries of $Discovery: a folder with its index.js and a graph file of any name, with their dictionaries](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L257) — `tests/regression/builder-multi-application.test.js`
