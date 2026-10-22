<!-- generated -->
# CurrencySelect

A searchable select of currencies: every ISO 4217 currency of the Currencies Service, or only the Codes given (['EUR', 'USD']), each with its code, its symbol and its name in the language of the page (Locale changes it). Value is the code ('USD' by default). Placeholder, Size, Shape, Name, Disabled and Invalid as in Select. Events: change (the code).

## Properties

| Property | Default |
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

## Events

`change`

## Example

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
