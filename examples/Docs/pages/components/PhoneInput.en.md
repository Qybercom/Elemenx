<!-- generated -->
# PhoneInput

Value is the international number: "+" with the dialling code and the local digits ("+79991234567"). The field shows it in the country of Country, or, when the code of that country does not start it, in the country its code names (Value "+447911123456" shows the United Kingdom whatever Country says). Countries defaults to every country of the Countries Service, named in Locale and sorted by code; it may be replaced by [{Code, Name, Dial, Mask}], where Mask describes the national part (# is a digit). Guide keeps the whole template visible ('+7 (99_) ___-__-__'); Backspace 'skip' moves over a separator instead of deleting the digit before it. Only digits that fit the mask of the selected country are accepted, by typing, paste, drop or autofill.

## Properties

| Property | Default |
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

## Events

- `input`: The number changed: Value, international ('+79991234567').
- `validate`: The number was checked: {Value, Country, Complete, Valid}.
- `change`: The number was committed: Value.
- `country`: The country changed, picked or found by the dialling code: its code.

## Example

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
