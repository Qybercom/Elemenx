<!-- generated -->
# CurrencySelect

Выбор валюты с поиском: каждая валюта ISO 4217 сервиса Currencies или только перечисленные в Codes (['EUR', 'USD']), каждая с кодом, символом и названием на языке страницы (Locale меняет его). Value — код (по умолчанию 'USD'). Placeholder, Size, Shape, Name, Disabled и Invalid — как в Select. События: change (код).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `'USD'` |
| `Codes` | `null` |
| `Locale` | `''` |
| `Placeholder` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

`change`

## Пример

```example
<Field Label="Currency" [hint]="Value"><CurrencySelect Value="EUR" (change)="Changed" /></Field>
<script>
({
	Value: 'EUR',

	Changed: function (value) {
		this.Value = value;
	}
})
</script>
```
