<!-- generated -->
# MultiSelect

A select of several options. Options: [{Value, Label, Hint, Icon, Group, Disabled}]; Value is the list of the Values selected. Display: chips (the chosen options as removable tags in the field) or count ("3 selected"). Searchable (on by default) adds a filter field; SelectAll adds an option that toggles every enabled option. The list stays open while options are toggled. Placeholder, Empty, Size, Shape, Disabled and Invalid as in Select. Events: change (the list).

## Properties

| Property | Default |
| --- | --- |
| `Options` | `[]` |
| `Value` | `[]` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `Display` | `'chips'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Searchable` | `true` |
| `SelectAll` | `false` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Events

`change`

## Example

```example
<Field Label="Colors" [hint]="Colors.join(', ') || 'None'"><MultiSelect Placeholder="Pick colors" [options]="Options" [value]="Colors" SelectAll="true" (change)="Changed" /></Field>
<Field Label="As a count"><MultiSelect Display="count" [options]="Options" [value]="Colors" (change)="Changed" /></Field>
<script>
({
	Colors: ['red', 'blue'],
	Options: [
		{Value: 'red', Label: 'Red', Group: 'Warm'},
		{Value: 'orange', Label: 'Orange', Group: 'Warm'},
		{Value: 'yellow', Label: 'Yellow', Group: 'Warm'},
		{Value: 'green', Label: 'Green', Group: 'Cold'},
		{Value: 'blue', Label: 'Blue', Group: 'Cold'},
		{Value: 'violet', Label: 'Violet', Group: 'Cold', Disabled: true}
	],

	Changed: function (value) {
		this.Colors = value;
	}
})
</script>
```
