<!-- generated -->
# Sparkline

A small chart without axes, for a line of text or a cell: Values (numbers) as a line, an area or bars (Type), Width by Height pixels. Min and Max fix the scale (by default the values set it). The last value gets a dot (Dot: false for none). Color is any CSS color (the accent by default). Label names it for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `Values` | `[]` |
| `Type` | `'line'` |
| `Width` | `120` |
| `Height` | `32` |
| `Min` | `null` |
| `Max` | `null` |
| `Dot` | `true` |
| `Color` | `''` |
| `Label` | `''` |

## Example

```example
<table class="elemenx-table">
	<thead><tr><th>Ticker</th><th>Week</th><th>Price</th></tr></thead>
	<tbody>
		<tr *for="row of Rows" *key="row.Name">
			<td>{{row.Name}}</td>
			<td><Sparkline [values]="row.Values" [type]="row.Type" [color]="row.Color" Width="120" Height="28" [label]="row.Name + ' this week'" /></td>
			<td>{{row.Values[row.Values.length - 1]}}</td>
		</tr>
	</tbody>
</table>
<script>
({
	Rows: [
		{Name: 'ELX', Values: [3, 5, 2, 8, 6, 9, 11], Type: 'line', Color: null},
		{Name: 'UIK', Values: [9, 8, 8, 6, 7, 5, 4], Type: 'area', Color: '#b4483f'},
		{Name: 'NET', Values: [4, 6, 5, 7, 6, 8, 7], Type: 'bar', Color: '#3d7a54'}
	]
})
</script>
```
