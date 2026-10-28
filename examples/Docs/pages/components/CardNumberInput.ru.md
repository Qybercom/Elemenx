<!-- generated -->
# CardNumberInput

Value хранит только цифры. Платёжная система, маска и корректность выводятся из него; Valid — проверка Луна для полного номера. Conceal скрывает середину номера: в его шаблоне x — видимая цифра, ? — скрытая ('xxxx ???? ???? xxxx' показывает первые и последние четыре цифры); группы следуют платёжной системе. Номер остаётся скрытым при редактировании; кнопка-глаз, как у поля пароля, показывает его (Revealed). ConcealChar — символ скрытой цифры. Сокрытие никогда не меняет Value. Guarded спрашивает подтверждение, прежде чем глаз покажет номер, HideAfter снова прячет его (см. сервис Reveal).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Placeholder` | `'0000 0000 0000 0000'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Conceal` | `''` |
| `ConcealChar` | `'•'` |
| `Revealed` | `false` |
| `Guarded` | `false` |
| `HideAfter` | `0` |
| `Brands` | `[…]` |

## События

- `input`: Цифры изменились: Value.
- `validate`: Номер проверен: {Value, Brand, Complete, Valid}.
- `change`: Номер зафиксирован: Value.

## Пример

```example
<Field Label="Card number" [hint]="State || 'Try 4242 4242 4242 4242'"><CardNumberInput (validate)="Validated" /></Field>
<Field Label="A saved card" Hint="Concealed; the eye shows it"><CardNumberInput Value="5555555555554444" Conceal="xxxx ???? ???? xxxx" /></Field>
<script>
({
	State: '',

	Validated: function (result) {
		this.State = (result.Brand || 'Unknown brand') + (result.Valid ? ', valid' : result.Complete ? ', not a valid number' : '');
	}
})
</script>
```

## Тесты

- [CardNumberInput keeps the digits, finds the brand, checks the number by Luhn, and conceals its middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-inputs.test.js#L48) — `tests/regression/library-inputs.test.js`
