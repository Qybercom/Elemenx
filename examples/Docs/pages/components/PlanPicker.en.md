<!-- generated -->
# PlanPicker

A choice of a plan: a PlanCard for each of Plans ([{ID, Name, Description, Price, YearlyPrice, Currency, Note, Features, Popular, Color, Current, Disabled, Action}]) in a grid, one of them chosen (Value), as a group of radios: the arrows move the choice. Periods shows the switch of the monthly and the yearly prices (Period), with Discount beside it ('Save 20%'). Events: change ({ID, Period}), period ({Period}).

## Properties

| Property | Default |
| --- | --- |
| `Plans` | `[]` |
| `Value` | `null` |
| `Period` | `'month'` |
| `Periods` | `true` |
| `Discount` | `''` |
| `Currency` | `'USD'` |
| `Variant` | `'outlined'` |
| `Action` | `''` |
| `Label` | `''` |
| `MonthlyLabel` | `''` |
| `YearlyLabel` | `''` |

## Events

- `change`: Another plan was chosen: {ID, Period}.
- `period`: The monthly or yearly prices were chosen: {Period}.

## Example

```example
<PlanPicker [plans]="Plans" [value]="Plan" [period]="Period" Periods="true" Discount="Save 20%" (change)="Chosen" (period)="PeriodChosen" />
<p class="elemenx-text small muted">{{Plan}} · {{Period}}</p>
<script>
({
	Plan: 'pro',
	Period: 'month',
	Plans: [
		{ID: 'free', Name: 'Basic', Description: 'For a start', Price: 0, Features: ['3 projects', '1 GB of storage', {Label: 'Custom themes', Included: false}], Current: true, Color: '#3f6c9e'},
		{ID: 'pro', Name: 'Standard', Description: 'For a team', Price: 12, YearlyPrice: 115, Features: ['Unlimited projects', '100 GB of storage', 'Custom themes'], Popular: 'Most popular', Color: '#b4483f'},
		{ID: 'team', Name: 'Premium', Description: 'For a company', Price: 29, YearlyPrice: 278, Features: ['Unlimited projects', '1 TB of storage', {Label: 'Priority support', Hint: 'An answer within an hour'}], Color: '#3d7a54'}
	],

	Chosen: function (event) {
		this.Plan = event.ID;
	},

	PeriodChosen: function (event) {
		this.Period = event.Period;
	}
})
</script>
```

## Tests

- [PlanPicker chooses a plan as a group of radios, tells it with its period, and switches the yearly prices](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L416) — `tests/regression/library-controls.test.js`
