<!-- generated -->
# MoneyInput

An amount of money with its currency. Amount is a number (or null) with the fraction digits of Currency; the text is grouped in Locale when the field is not edited. Fixed hides the currency select. Events: input and change carry {Amount, Currency}.

## Properties

| Property | Default |
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

## Example

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

## Tests

- [MoneyInput takes no more digits than its currency has, bounds the amount, and groups it when not edited](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L140) — `tests/regression/library-forms.test.js`
