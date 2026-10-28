<!-- generated -->
# FieldFormats

Форматы текстовых полей: Input с Preset="email" (url, semver, ipv4, ipv6, uuid, iban, postal-code, integer, decimal) получает нужную клавиатуру и автозаполнение, отбрасывает при вводе символы, которых формат не допускает, и проверяет и нормализует значение при подтверждении. Формат — {Type, InputMode, Autocomplete, Direction, Filter, Normalize(text, options), Validate(value, options)}: Direction ltr держит латинский текст (адрес, код) слева направо на странице с письмом справа налево; Filter — RegExp допустимых символов; Validate возвращает '' или текст ошибки. Параметры: {Country} для postal-code, {Min, Max} для integer и decimal. Check(name, text, options) возвращает {Valid, Value, Message}: Value нормализовано (IBAN без пробелов, десятичное с точкой). Display(name, value) — текст, который поле показывает для значения (IBAN группами по четыре). Register(name, format) добавляет формат приложения, Find(name) возвращает формат, Names() перечисляет их.

## Методы

- `Register(name, format)`
- `Find(name)`
- `Names()`
- `Check(name, text, options)`
- `Display(name, value)`

## Пример

```example
<Field Label="IBAN" Hint="Shown in groups of four, checked by its country"><Input Preset="iban" Value="DE89370400440532013000" /></Field>
<Field Label="Email"><Input Preset="email" Placeholder="you@example.com" /></Field>
<Field Label="Postal code of Germany"><Input Preset="postal-code" Country="DE" /></Field>
<ul class="elemenx-ul"><li *for="check of Checks" *key="check.Text">{{check.Name}} "{{check.Text}}" → {{check.Result}}</li></ul>
<script>
({
	Checks: [],

	$OnCreate: function () {
		var formats = this.$Service('FieldFormats');

		this.Checks = [['email', ' Ada@Example.COM '], ['url', 'example.com/docs'], ['ipv4', '256.1.1.1'], ['decimal', '3,14']].map(function (pair) {
			var result = formats.Check(pair[0], pair[1]);

			return {Name: pair[0], Text: pair[1], Result: result.Valid ? 'valid: ' + result.Value : result.Message};
		});
	}
})
</script>
```

## Тесты

- [has the formats of the text fields](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L50) — `tests/regression/formats.test.js`
- [checks and normalizes an email and a web address](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L54) — `tests/regression/formats.test.js`
- [checks versions, addresses and identifiers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L64) — `tests/regression/formats.test.js`
- [checks an IBAN by its country length and its check digits, and shows it in groups of four](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L80) — `tests/regression/formats.test.js`
- [checks a postal code by its country, and any country by a loose rule](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L91) — `tests/regression/formats.test.js`
- [checks whole and decimal numbers in their bounds; a comma is a decimal point](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L100) — `tests/regression/formats.test.js`
- [keeps while typing only the characters a format holds; an empty value is valid](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L109) — `tests/regression/formats.test.js`
- [takes the formats of the Application](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/formats.test.js#L117) — `tests/regression/formats.test.js`
