<!-- generated -->
# Countries

Countries and territories with their dialling code, the mask of the national number (# is a digit) and currency. List(locale) returns [{Code, Name, Dial, Mask, Currency}] with names in the locale (Intl.DisplayNames, English otherwise), sorted by code. Find(code) returns one country; Match(digits, preferred) the country of an international number: the longest dialling code, then the preferred country, then the main country of a shared code.

## Methods

- `List(locale)`
- `Find(code, locale)`
- `Match(digits, preferred, locale)`

## Example

```example
<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Digits" placeholder="An international number" /></span>
<p class="elemenx-text">The number belongs to: <strong>{{Match(Digits)}}</strong></p>
<ul class="elemenx-ul"><li *for="country of First" *key="country.Code">{{country.Code}} · {{country.Name}} · +{{country.Dial}} · {{country.Currency}}</li></ul>
<script>
({
	Digits: '74951234567',
	First: [],

	$OnCreate: function () {
		var countries = this.$Service('Countries');

		this.First = countries.List().slice(0, 6);

		this.Match = function (digits) {
			var country = countries.Match(String(digits).replace(/\D/g, ''), '');

			return country ? country.Name + ' (+' + country.Dial + ')' : '—';
		};
	}
})
</script>
```

## Tests

- [Countries: finds a country, and the country of an international number by the longest code, then the preferred one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L90) — `tests/regression/library-services.test.js`
