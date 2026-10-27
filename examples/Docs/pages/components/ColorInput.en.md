<!-- generated -->
# ColorInput

A color field with its own picker. Value is '#rrggbb', or '#rrggbbaa' with Alpha. The picker has a saturation and brightness area, a hue slider, an alpha slider (Alpha), the Swatches and an eyedropper where the browser supports it. Dragging emits input; releasing emits change.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `'#000000'` |
| `Alpha` | `false` |
| `Swatches` | `[…]` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `A` | `1` |

## Events

- `input`: The color changed while dragging in the picker: Value.
- `change`: The color was committed (the drag released, a swatch or the eyedropper): Value.

## Example

```example
<Field Label="Accent" [hint]="Color"><ColorInput [value]="Color" (change)="Changed" /></Field>
<div style="height: 32px; border-radius: 6px;" [style.background]="Color"></div>
<script>
({
	Color: '#3d7be0',

	Changed: function (value) {
		this.Color = value;
	}
})
</script>
```
