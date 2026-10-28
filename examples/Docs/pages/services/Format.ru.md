<!-- generated -->
# Format

Общие форматы карточек на языке страницы (Locale): Count(12400) — '12K', Date(value, style) — дата ('short', 'medium', 'long' или параметры Intl.DateTimeFormat), Day(value) — {Day, Month} для значка даты, Relative(value) — время от текущего момента («5 минут назад»), Money(amount, code) — сумма в валюте, Bytes(size) — размер файла ('1,5 МБ', в единицах по 1024). Значение — Date, метка времени или строка ISO; недопустимое даёт ''.

## Методы

- `Count(value)`
- `Date(value, style)`
- `Day(value)`
- `Relative(value, now)`
- `Bytes(size)`
- `Money(amount, code)`

## Пример

```example
<Properties>
	<Property Label="Count(12400)" [value]="Text.Count" />
	<Property Label="Date(now, 'long')" [value]="Text.Date" />
	<Property Label="Relative(an hour ago)" [value]="Text.Relative" />
	<Property Label="Money(1234.5, 'EUR')" [value]="Text.Money" />
	<Property Label="Day(now)" [value]="Text.Day" />
</Properties>
<script>
({
	Text: {},

	$OnCreate: function () {
		var format = this.$Service('Format');
		var day = format.Day(new Date());

		this.Text = {
			Count: format.Count(12400),
			Date: format.Date(new Date(), 'long'),
			Relative: format.Relative(Date.now() - 3600000),
			Money: format.Money(1234.5, 'EUR'),
			Day: day.Day + ' ' + day.Month
		};
	}
})
</script>
```

## Тесты

- [DateInput takes the digits of its Format, gives an ISO date, and refuses a date out of Min and Max](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L46) — `tests/regression/library-forms.test.js`
- [Format: counts in short, dates, the parts of a date badge, the time from now, and nothing of an invalid date](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L21) — `tests/regression/library-services.test.js`
