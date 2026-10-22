<!-- generated -->
# OTPInput

A one-time code of Length characters. Value holds the characters only. Variant: 'split' (one cell per character, Group puts a separator after every Group cells) or 'single' (one field). Both are one real <input> (the cells of 'split' are drawn over it), so typing, paste, undo, selection and the one-time codes that a phone offers from a message all work as in any field. Pattern says which characters are taken: 'digits', 'letters', 'alphanumeric' or a character class ('[0-9A-F]'); Case 'upper' or 'lower' changes letters as they come. Anything else typed or pasted is dropped ('123-456' gives '123456'), and the code never grows past Length (a character typed over a filled cell takes its place); a pasted code fills from the caret, or replaces all of it when long enough. Masked hides the characters (an eye button shows them, Revealed) and keeps them from being copied; Guarded asks before the eye shows them, HideAfter hides them again (see the Reveal Service). Events: input (Value), change (on leaving the field), complete (Value, when the last character comes), validate ({Value, Complete, Valid}). Invalid marks the field; a field left incomplete is marked too.

## Properties

| Property | Default |
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

## Events

`input`, `validate`, `complete`, `change`

## Example

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
