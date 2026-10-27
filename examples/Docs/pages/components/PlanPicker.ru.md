<!-- generated -->
# PlanPicker

Выбор тарифа: PlanCard для каждого из Plans ([{ID, Name, Description, Price, YearlyPrice, Currency, Note, Features, Popular, Color, Current, Disabled, Action}]) в сетке, один выбран (Value), как группа радиокнопок: стрелки двигают выбор. Periods показывает переключатель месячных и годовых цен (Period) с Discount рядом («Экономия 20%»). События: change ({ID, Period}), period ({Period}).

## Свойства

| Свойство | По умолчанию |
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

## События

- `change`: Выбран другой тариф: {ID, Period}.
- `period`: Выбраны месячные или годовые цены: {Period}.

## Пример

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
