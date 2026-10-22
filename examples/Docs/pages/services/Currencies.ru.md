<!-- generated -->
# Currencies

Действующие валюты ISO 4217. List(locale) возвращает [{Code, Name, Symbol, Digits}] с названием и символом для locale (Intl), отсортированные по коду; Find(code) возвращает одну валюту; Format(amount, code) форматирует сумму. Без поддержки Intl валюта всё равно в списке, с кодом вместо названия и символа.

## Методы

- `List(locale)`
- `Find(code, locale)`
- `Format(amount, code, locale)`

## Пример

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
