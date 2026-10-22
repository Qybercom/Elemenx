<!-- generated -->
# TagInput

A field of tags. Value: the tags (strings). Typing and Enter (or a Separator: ',' and ';' by default) adds a tag; a pasted list ('a, b; c' or one per line) adds each one; Backspace in an empty field removes the last tag; the cross of a tag removes it. Suggestions (strings) open under the field while typing (arrows and Enter pick one); AllowNew: false takes suggestions only. Pattern (a regular expression a tag must match, as '^[^@]+@[^@]+$'), Unique (true) and Max limit what is taken; a refused text stays in the field, marked, and emits invalid with {Text, Reason: 'pattern', 'duplicate', 'max' or 'unknown'}. Case 'lower' or 'upper' changes the tags. Events: change (the tags), add (a tag), remove (a tag), invalid.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `[]` |
| `Suggestions` | `[]` |
| `Placeholder` | `''` |
| `Separators` | `[',', ';']` |
| `AllowNew` | `true` |
| `Unique` | `true` |
| `Max` | `0` |
| `Pattern` | `''` |
| `Case` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Text` | `''` |

## Events

`invalid`, `add`, `change`, `remove`

## Example

```example
<Field Label="Topics" Hint="Enter or a comma adds a tag; Backspace removes the last one"><TagInput [value]="Tags" [suggestions]="['elemenx', 'es5', 'ui', 'components', 'reactivity', 'router']" Case="lower" (change)="Changed" (invalid)="Refused" /></Field>
<Field Label="Emails" Hint="Only addresses, at most 3"><TagInput Pattern="^[^@]+@[^@]+$" Max="3" (invalid)="Refused" /></Field>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Tags: ['elemenx', 'ui'],
	Note: '',

	Changed: function (value) {
		this.Tags = value;
		this.Note = 'Tags: ' + value.join(', ');
	},

	Refused: function (event) {
		this.Note = 'Refused "' + event.Text + '": ' + event.Reason;
	}
})
</script>
```
