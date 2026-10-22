<!-- generated -->
# TextArea

A field of several lines of text. Value, Placeholder, Rows (the height in lines), MaxLength. Resize: vertical (the bottom edge, the default), both (the corner) or none; AutoSize grows the field with its text instead. Shape, Name, Disabled, ReadOnly and Invalid as in Input. Events: input (Value, while typing), change (Value, when it is committed).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Placeholder` | `''` |
| `Rows` | `3` |
| `MaxLength` | `null` |
| `AutoSize` | `false` |
| `Resize` | `'vertical'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `ReadOnly` | `false` |
| `Invalid` | `false` |

## Events

`input`, `change`

## Example

```example
<Field Label="A message" [hint]="Text.length + ' / 200'"><TextArea Placeholder="Write something" Rows="3" MaxLength="200" [value]="Text" (input)="Typed" /></Field>
<Field Label="Grows with its text"><TextArea AutoSize="true" Rows="1" Placeholder="Type several lines" /></Field>
<Field Label="Resizes by the corner"><TextArea Resize="both" Rows="2" /></Field>
<Field Label="Read only"><TextArea ReadOnly="true" Value="This text cannot change." Rows="1" /></Field>
<script>
({
	Text: '',

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```
