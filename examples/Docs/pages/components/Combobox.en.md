<!-- generated -->
# Combobox

A field that suggests: typing filters Options ([{Value, Label, Hint, Icon, Group, Disabled}]) in a list under it, the labels that start with the text first; arrows and Enter pick, Escape closes and then restores the text. Value is the Value of the picked option. AllowCustom also takes a text that is no option: a "Create" row offers it, and Value becomes the text (create emits it). The search event carries every text typed, so the owner may load Options from a server (Loading shows a spinner; Filter: false keeps the Options as they come). Clearable adds a cross. A text left without a pick goes back to the label of Value (or is taken, with AllowCustom). Events: change (Value), search (the text), create (the text).

## Properties

| Property | Default |
| --- | --- |
| `Options` | `[]` |
| `Value` | `null` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `CreateLabel` | `''` |
| `AllowCustom` | `false` |
| `Filter` | `true` |
| `Loading` | `false` |
| `Clearable` | `false` |
| `Icon` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Events

`search`, `create`, `change`

## Example

```example
<Field Label="A fruit" [hint]="Note"><Combobox Placeholder="Type to search" [options]="Fruits" [value]="Fruit" AllowCustom="true" (change)="Changed" (create)="Created" /></Field>
<script>
({
	Fruit: 'pear',
	Note: 'Type a name that is not in the list to add it.',
	Fruits: [{Value: 'apple', Label: 'Apple'}, {Value: 'pear', Label: 'Pear'}, {Value: 'plum', Label: 'Plum'}, {Value: 'peach', Label: 'Peach'}],

	Changed: function (value) {
		this.Fruit = value;
		this.Note = 'Chosen: ' + value;
	},

	Created: function (text) {
		this.Fruits = this.Fruits.concat([{Value: text.toLowerCase(), Label: text}]);
		this.Fruit = text.toLowerCase();
		this.Note = 'Added: ' + text;
	}
})
</script>
```
