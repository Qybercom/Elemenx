<!-- generated -->
# DateInput

A date field with its own calendar. Value is an ISO date ('2024-11-22'), or a month ('2024-11') in Mode 'month'; '' when empty. Format uses DD, MM and YYYY ('DD.MM.YYYY'); by default it follows Locale (the browser language). The text accepts only the digits of Format; Min and Max (ISO) limit both the text and the calendar. FirstDay: the first day of the week of the calendar, 0 Sunday or 1 Monday (the default); 'locale' for the one of Locale.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Mode` | `'date'` |
| `Format` | `''` |
| `Locale` | `''` |
| `FirstDay` | `null` |
| `Min` | `''` |
| `Max` | `''` |
| `Placeholder` | `''` |
| `TodayLabel` | `''` |
| `ClearLabel` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `ReadOnly` | `false` |
| `Invalid` | `false` |

## Events

`input`, `change`

## Example

```example
<Field Label="A date" [hint]="Date || 'Type it or pick it'"><DateInput [value]="Date" (change)="Changed" /></Field>
<Field Label="A month"><DateInput Mode="month" /></Field>
<Field Label="Only the next 30 days"><DateInput [min]="Today" [max]="Later" /></Field>
<script>
({
	Date: '',
	Today: new Date().toISOString().slice(0, 10),
	Later: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),

	Changed: function (value) {
		this.Date = value;
	}
})
</script>
```
