<!-- generated -->
# PhoneInput

Value — номер в международном формате: «+», код страны и местные цифры («+79991234567»). Поле показывает его в стране Country, а если номер начинается не с кода этой страны — в стране, которую называет его код (Value «+447911123456» показывает Великобританию, что бы ни говорил Country). Countries по умолчанию — все страны сервиса Countries, названные по Locale и отсортированные по коду; можно заменить на [{Code, Name, Dial, Mask}], где Mask описывает национальную часть (# — цифра). Guide показывает весь шаблон ('+7 (99_) ___-__-__'); Backspace 'skip' перескакивает разделитель, а не стирает цифру перед ним. Принимаются только цифры, подходящие к маске выбранной страны: при вводе, вставке, перетаскивании и автозаполнении.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Country` | `'RU'` |
| `Placeholder` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Countries` | `null` |
| `Locale` | `''` |
| `Guide` | `true` |
| `Backspace` | `'delete'` |

## События

- `input`: Номер изменился: Value, международный ('+79991234567').
- `validate`: Номер проверен: {Value, Country, Complete, Valid}.
- `change`: Номер зафиксирован: Value.
- `country`: Сменилась страна, выбранная или найденная по коду: её код.

## Пример

```example
<Field Label="Phone" [hint]="Note"><PhoneInput [value]="Phone" (input)="Typed" (country)="Country" /></Field>
<script>
({
	Phone: '+447911123456',
	Note: 'Type a number with its code, or pick the country.',

	Typed: function (value) {
		this.Phone = value;
		this.Note = 'Value: ' + value;
	},

	Country: function (code) {
		this.Note = 'Country: ' + code;
	}
})
</script>
```

## Тесты

- [PhoneInput writes the national number in the mask of its Country and gives the international one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L121) — `tests/regression/library-forms.test.js`
