<!-- generated -->
# CVVInput

Value holds the 3 or 4 security code digits (Length). The code is hidden unless Revealed; Guarded asks before the eye shows it and HideAfter hides it again (see the Reveal Service).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Length` | `3` |
| `Placeholder` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Revealed` | `false` |
| `Guarded` | `false` |
| `HideAfter` | `0` |

## Events

- `input`: The digits changed: Value.
- `validate`: The code was checked: {Value, Complete, Valid}.
- `change`: The code was committed: Value.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Field Label="CVV"><CVVInput (validate)="Validated" /></Field>
	<Field Label="CVV of Amex" Hint="Length 4"><CVVInput Length="4" Value="1234" /></Field>
</div>
<p class="elemenx-text small muted">{{State}}</p>
<script>
({
	State: '',

	Validated: function (result) {
		this.State = result.Complete ? 'Complete' : 'Type the code';
	}
})
</script>
```
