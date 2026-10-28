<!-- generated -->
# DateInput

Поле даты со своим календарём. Value — дата ISO ('2024-11-22') или месяц ('2024-11') в Mode 'month'; '' — пусто. Format использует DD, MM и YYYY ('DD.MM.YYYY'); по умолчанию следует Locale (языку браузера). Текст принимает только цифры Format; Min и Max (ISO) ограничивают и текст, и календарь. FirstDay — первый день недели календаря: 0 — воскресенье или 1 — понедельник (по умолчанию); 'locale' — по Locale.

## Свойства

| Свойство | По умолчанию |
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

## События

- `input`: Дата изменилась при вводе или в календаре: Value (ISO или '').
- `change`: Дата зафиксирована: Value.

## Пример

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

## Тесты

- [DateInput takes the digits of its Format, gives an ISO date, and refuses a date out of Min and Max](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L46) — `tests/regression/library-forms.test.js`
- [DateInput puts the focus on the day of its calendar as it opens, so the next key moves it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L76) — `tests/regression/library-forms.test.js`
