<!-- generated -->
# MoneyInput

Денежная сумма с валютой. Amount — число (или null) с числом знаков дробной части Currency; текст группируется по Locale, когда поле не редактируется. Fixed скрывает выбор валюты. События input и change несут {Amount, Currency}.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Amount` | `null` |
| `Currency` | `'USD'` |
| `Codes` | `null` |
| `Locale` | `''` |
| `Min` | `null` |
| `Max` | `null` |
| `Placeholder` | `'0'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Fixed` | `false` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Пример

```example
<Field Label="Price" [hint]="Note"><MoneyInput [amount]="Price" Currency="USD" (change)="Changed" /></Field>
<Field Label="Price in euros"><MoneyInput Amount="1234.5" Currency="EUR" /></Field>
<script>
({
	Price: 99.9,
	Note: '99.9',

	Changed: function (value) {
		this.Note = JSON.stringify(value);
	}
})
</script>
```
