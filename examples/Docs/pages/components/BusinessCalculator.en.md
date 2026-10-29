<!-- generated -->
# BusinessCalculator

A calculator of a business made of its fields and its results: a price of a renovation, a loan, a return on an investment, a delivery. Its formulas are read by the Calculations Service (no eval), each result as the fields change.

Fields: [{ID, Label, Type, Value, Min, Max, Step, Unit, Options, Hint}], ID the name the formulas read; Type number, money (in Currency), percent (typed as 15, read as 15), range (a Slider from Min to Max), select (Options [{Value, Label}], the values numbers) or toggle (1 when on, else 0). Results: [{ID, Label, Formula, Format, Precision, Unit, Primary, Hidden, Hint}], Formula of the fields and of the other results by their IDs, in any order (a result that needs itself, through others, is an error); Format number, money, percent (0.15 shows 15%) or integer; Primary is the main one, shown large first; Hidden is computed for the others alone. The same declared inside it: CalculatorField and CalculatorResult. Breakdown names results to show as the parts of a bar (the parts of a total). Currency (USD) and Locale (the language of the page) write the money. Values holds the values of the fields (given by the owner, or as they are typed). Events: change ({Values, Results}: the numbers of the results by their IDs) as the fields change. Methods: Numbers() the same numbers, Reset() the first values back.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Fields` | `[]` |
| `Results` | `[]` |
| `Values` | `null` |
| `Breakdown` | `[]` |
| `Currency` | `'USD'` |
| `Locale` | `''` |

## Events

- `change`: A field changed: {Values, Results} (the numbers of the results by their IDs).

## Slots

`actions`, default

## Methods

- `Numbers()`
- `Reset()`

## Example

```example
<BusinessCalculator Title="Renovation" Currency="EUR" [fields]="Fields" [results]="Results" [breakdown]="['Work', 'Materials']" (change)="Changed">
	<CalculatorField ID="Premium" Label="Premium materials" Type="toggle" />
	<CalculatorResult ID="Total" Label="Total" Formula="Work + Materials" Format="money" Primary="true" />
</BusinessCalculator>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Change a field.',
	Fields: [
		{ID: 'Area', Label: 'Area', Value: 50, Unit: 'm²'},
		{ID: 'Rate', Label: 'Work for 1 m²', Type: 'money', Value: 30},
		{ID: 'Rooms', Label: 'Rooms', Type: 'range', Value: 2, Min: 1, Max: 6}
	],
	Results: [
		{ID: 'Work', Label: 'Work', Formula: 'Area * Rate * (1 + Rooms / 10)', Format: 'money'},
		{ID: 'Materials', Label: 'Materials', Formula: 'Area * if(Premium, 25, 12)', Format: 'money'}
	],

	Changed: function (event) {
		this.Text = 'Total ' + event.Results.Total.toFixed(2);
	}
})
</script>
```

## Tests

- [reads formulas without eval: precedence, powers, conditions, functions, names, and tells a mistake by its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L41) — `tests/regression/library-calculators.test.js`
- [counts on its keys and on the keyboard, a percent as a shop does, and keeps its history](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L71) — `tests/regression/library-calculators.test.js`
- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
