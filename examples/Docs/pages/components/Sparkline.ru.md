<!-- generated -->
# Sparkline

Маленький график без осей для строки текста или ячейки: Values (числа) в виде линии, области или столбиков (Type), Width на Height пикселей. Min и Max фиксируют шкалу (по умолчанию её задают значения). Последнее значение отмечено точкой (Dot: false — без неё). Color — любой цвет CSS (по умолчанию акцентный). Label называет график для экранных читалок.

## Свойства

| Свойство | По умолчанию |
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

## Пример

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
