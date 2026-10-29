<!-- generated -->
# Countries

Страны и территории с телефонным кодом, маской национального номера (# — цифра) и валютой. List(locale) возвращает [{Code, Name, Dial, Mask, Currency}] с названиями на языке locale (Intl.DisplayNames, иначе по-английски), отсортированные по коду. Find(code) возвращает одну страну; Match(digits, preferred) — страну международного номера: самый длинный код, затем предпочтительная страна, затем главная страна общего кода.

## Методы

- `List(locale)`
- `Find(code, locale)`
- `Match(digits, preferred, locale)`

## Пример

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

## Тесты

- [Countries: finds a country, and the country of an international number by the longest code, then the preferred one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L90) — `tests/regression/library-services.test.js`
