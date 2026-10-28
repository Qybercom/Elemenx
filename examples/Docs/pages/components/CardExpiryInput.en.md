<!-- generated -->
# CardExpiryInput

The expiry date of a payment card: Value holds the digits MMYY ('0927'), shown as MM/YY. Only digits are taken; the month is kept in 01-12 while typing, and a date already past is invalid. Placeholder (MM/YY), Size, Shape, Name, Disabled and Invalid as in Input. Events: input (Value), validate ({Value, Complete, Valid}), change (Value, when it is committed).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Placeholder` | `'MM/YY'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Events

- `input`: The digits changed: Value (MMYY).
- `validate`: The date was checked: {Value, Complete, Valid}.
- `change`: The date was committed: Value.

## Example

```example
<Field Label="Expires"><CardExpiryInput (change)="Changed" /></Field>
<p class="elemenx-text small muted">Value: {{Value || '—'}}</p>
<script>
({
	Value: '',

	Changed: function (value) {
		this.Value = value;
	}
})
</script>
```

## Tests

- [CardExpiryInput takes MMYY, keeps the month in 01-12, and finds a date already past invalid](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-inputs.test.js#L80) — `tests/regression/library-inputs.test.js`
