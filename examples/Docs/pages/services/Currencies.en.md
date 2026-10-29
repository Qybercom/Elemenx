<!-- generated -->
# Currencies

The active ISO 4217 currencies. List(locale) returns [{Code, Name, Symbol, Digits}] with the name and the symbol of the locale (Intl), sorted by code; Find(code) returns one currency; Format(amount, code) formats an amount. Without Intl support a currency still lists with its code as the name and the symbol.

## Methods

- `List(locale)`
- `Find(code, locale)`
- `Format(amount, code, locale)`

## Example

```example
<NumberInput [value]="Amount" Precision="2" (input)="Typed" />
<ul class="elemenx-ul"><li *for="code of Codes" *key="code">{{Format(Amount, code)}} <span class="elemenx-caption">{{Name(code)}}</span></li></ul>
<script>
({
	Amount: 1234.5,
	Codes: ['EUR', 'USD', 'JPY', 'RUB', 'BHD'],

	$OnCreate: function () {
		var currencies = this.$Service('Currencies');

		this.Format = function (amount, code) {
			return currencies.Format(amount || 0, code);
		};

		this.Name = function (code) {
			var currency = currencies.Find(code);

			return currency ? currency.Name + ', ' + currency.Digits + ' digits' : '';
		};
	},

	Typed: function (value) {
		this.Amount = value;
	}
})
</script>
```

## Tests

- [Currencies: lists the ISO 4217 currencies with their names and digits, and formats an amount](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L102) — `tests/regression/library-services.test.js`
