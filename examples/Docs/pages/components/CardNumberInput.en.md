<!-- generated -->
# CardNumberInput

Value holds digits only. Brand, mask and validity follow from it; Valid is the Luhn check of a complete number. Conceal hides the middle of the number: in its template x is a shown digit and ? a hidden one ('xxxx ???? ???? xxxx' shows the first four and the last four digits); the groups follow the brand. The number stays hidden while it is edited; an eye button, as in a password field, shows it (Revealed). ConcealChar is the character of a hidden digit. Value is never changed by concealing. Guarded asks before the eye shows the number, HideAfter hides it again (see the Reveal Service).

## Properties

| Property | Default |
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

## Events

- `input`: The digits changed: Value.
- `validate`: The number was checked: {Value, Brand, Complete, Valid}.
- `change`: The number was committed: Value.

## Example

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
