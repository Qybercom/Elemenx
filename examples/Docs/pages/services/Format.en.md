<!-- generated -->
# Format

The formats the cards share, in the language of the page (Locale): Count(12400) is '12K', Date(value, style) a date ('short', 'medium', 'long', or Intl.DateTimeFormat options), Day(value) {Day, Month} for a date badge, Relative(value) the time from now ('5 minutes ago'), Money(amount, code) an amount of a currency. A value is a Date, a timestamp or an ISO string; an invalid one gives ''.

## Methods

- `Count(value)`
- `Date(value, style)`
- `Day(value)`
- `Relative(value, now)`
- `Money(amount, code)`

## Example

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
