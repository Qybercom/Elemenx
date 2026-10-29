<!-- generated -->
# BusinessCalculator

Бизнес-калькулятор из полей и результатов: стоимость ремонта, кредит, окупаемость, доставка. Fields: [{ID, Label, Type, Value, Min, Max, Step, Unit, Options, Hint}], ID — имя, которое читают формулы; Type — number, money (в Currency), percent (вводится 15, читается 15), range (ползунок от Min до Max), select (Options [{Value, Label}], значения — числа) или toggle (1, когда включён). Results: [{ID, Label, Formula, Format, Precision, Unit, Primary, Hidden, Hint}]: Formula читает поля и другие результаты по их ID в любом порядке (результат, который через другие нужен сам себе, — ошибка, показывается «—» с подсказкой); Format — number, money, percent (0.15 — 15%) или integer; Primary — главный, крупно и первым; Hidden — считается только для других. То же можно объявить внутри: CalculatorField и CalculatorResult. Breakdown — ID результатов, показанных частями полосы. Currency (USD) и Locale (язык страницы) пишут деньги; Values — значения полей от владельца; Layout — side (результаты сбоку на широком экране) или stack. Событие change ({Values, Results}) при изменении поля; методы Numbers() — числа результатов по ID, Reset() — первые значения.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Fields` | `[]` |
| `Results` | `[]` |
| `Values` | `null` |
| `Breakdown` | `[]` |
| `Currency` | `'USD'` |
| `Locale` | `''` |

## События

- `change`

## Слоты

`actions`, по умолчанию

## Методы

- `Numbers()`
- `Reset()`

## Пример

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

## Тесты

- [reads formulas without eval: precedence, powers, conditions, functions, names, and tells a mistake by its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L41) — `tests/regression/library-calculators.test.js`
- [counts on its keys and on the keyboard, a percent as a shop does, and keeps its history](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L71) — `tests/regression/library-calculators.test.js`
- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
