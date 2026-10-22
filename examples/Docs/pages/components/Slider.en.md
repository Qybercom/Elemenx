<!-- generated -->
# Slider

A slider. Value is a number, or [low, high] with Range. Min, Max and Step bound it; Marks shows ticks at every Marks units (or at the listed values). ShowValue: always, active (while dragged or focused) or never. The thumbs follow the pointer and the keys: arrows (Step), Page Up/Down (ten steps), Home and End. Orientation 'vertical' stands the slider upright, its minimum at the bottom, as the vertical Meter. Events: input while moving, change on release.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `0` |
| `Range` | `false` |
| `Min` | `0` |
| `Max` | `100` |
| `Step` | `1` |
| `Marks` | `null` |
| `ShowValue` | `'active'` |
| `Unit` | `''` |
| `Size` | `'medium'` |
| `Orientation` | `'horizontal'` |
| `Label` | `''` |
| `Disabled` | `false` |

## Events

`input`, `change`

## Example

```example
<Field Label="Volume" [hint]="Volume + '%'"><Slider [value]="Volume" Min="0" Max="100" ShowValue="always" (input)="Moved" /></Field>
<Field Label="Price" [hint]="Range[0] + ' – ' + Range[1] + ' €'"><Slider Range="true" [value]="Range" Min="0" Max="500" Step="10" Marks="100" (change)="Ranged" /></Field>
<Slider Orientation="vertical" Value="30" Label="Level" />
<script>
({
	Volume: 40,
	Range: [100, 300],

	Moved: function (value) {
		this.Volume = value;
	},

	Ranged: function (value) {
		this.Range = value;
	}
})
</script>
```
