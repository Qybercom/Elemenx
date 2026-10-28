<!-- generated -->
# OTPInput

Одноразовый код длиной Length символов. Value хранит только символы. Variant: 'split' (ячейка на символ; Group ставит разделитель после каждых Group ячеек) или 'single' (одно поле). Оба варианта — одно настоящее <input> (ячейки 'split' рисуются поверх него), поэтому ввод, вставка, отмена, выделение и коды, которые телефон предлагает из сообщения, работают как в любом поле. Pattern задаёт допустимые символы: 'digits', 'letters', 'alphanumeric' или класс символов ('[0-9A-F]'); Case 'upper' или 'lower' меняет регистр букв при вводе. Всё остальное при вводе или вставке отбрасывается ('123-456' даёт '123456'), а код никогда не длиннее Length (символ, введённый поверх заполненной ячейки, занимает её место); вставленный код заполняет от курсора или заменяет весь, если он достаточно длинный. Masked скрывает символы (кнопка-глаз показывает их, Revealed) и не даёт их скопировать; Guarded спрашивает подтверждение, прежде чем глаз их покажет, HideAfter снова прячет их (см. сервис Reveal). События: input (Value), change (при уходе из поля), complete (Value, когда введён последний символ), validate ({Value, Complete, Valid}). Invalid помечает поле; незаполненное поле, которое покинули, тоже помечается.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Length` | `6` |
| `Pattern` | `'digits'` |
| `Case` | `''` |
| `Variant` | `'split'` |
| `Group` | `0` |
| `Masked` | `false` |
| `Revealed` | `false` |
| `Guarded` | `false` |
| `HideAfter` | `0` |
| `MaskChar` | `'•'` |
| `Placeholder` | `''` |
| `Label` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `AutoFocus` | `false` |
| `Invalid` | `false` |

## События

- `input`: Символы изменились: Value.
- `validate`: Код проверен: {Value, Complete, Valid}.
- `complete`: Введены все Length символов: Value.
- `change`: Код зафиксирован: Value.

## Пример

```example
<Field Label="The code from the message" [hint]="Note"><OTPInput Length="6" Group="3" (complete)="Completed" (input)="Typed" /></Field>
<Field Label="A key, masked"><OTPInput Length="8" Variant="single" Pattern="alphanumeric" Case="upper" Masked="true" /></Field>
<script>
({
	Note: 'Type or paste 123-456.',

	Typed: function (value) {
		this.Note = value.length + ' of 6';
	},

	Completed: function (value) {
		this.Note = 'Checking ' + value + '...';
	}
})
</script>
```

## Тесты

- [OTPInput drops what its Pattern refuses, changes the case, never grows past Length, and tells once it is complete](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-inputs.test.js#L147) — `tests/regression/library-inputs.test.js`
