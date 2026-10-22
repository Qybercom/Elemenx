<!-- generated -->
# Properties

A list of properties: Property children, a name and its value each, in one column or two (Columns). Label names the list for screen readers. Its look comes from the --elemenx-property-* tokens of the theme.

## Properties

| Property | Default |
| --- | --- |
| `Columns` | `1` |
| `Label` | `''` |

## Slots

default

## Example

```example
<Properties Label="Battle" Columns="2">
	<Property Label="Attack" Value="1017" Tone="success" />
	<Property Label="Defense" Value="1162" />
	<Property Label="Speed" Value="4.2" Unit="m/s" />
	<Property Label="Critical" Value="12" Unit="%" Tone="warning" />
	<Property Label="Weight" [value]="Weight" Unit="kg" Tone="danger" />
	<Property Label="Level" Value="27" />
</Properties>
<Button Label="Add armor" Size="small" (click)="Armor" />
<script>
({
	Weight: 18,

	Armor: function () {
		this.Weight += 6;
	}
})
</script>
```
