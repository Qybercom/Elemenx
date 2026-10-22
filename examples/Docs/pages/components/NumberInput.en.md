<!-- generated -->
# NumberInput

A number field. Value is a number or null. Min and Max bound it, Step is the step of the arrows (Shift: ten steps) and of the buttons beside the field (Controls false hides them), Precision the number of decimals it keeps. Only digits, one point (a comma becomes one) and a leading minus can be typed; the value is bounded and rounded when it is committed. Prefix and Suffix stand inside the field ('$', 'kg'). Size, Shape, Placeholder, Name, Disabled, ReadOnly and Invalid as in Input. Events: input (Value, while typing), change (Value, when committed).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Min` | `null` |
| `Max` | `null` |
| `Step` | `1` |
| `Precision` | `null` |
| `Placeholder` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Prefix` | `''` |
| `Suffix` | `''` |
| `Name` | `null` |
| `Controls` | `true` |
| `Disabled` | `false` |
| `ReadOnly` | `false` |
| `Invalid` | `false` |

## Events

`input`, `change`

## Example

```example
<Field Label="Price"><NumberInput [value]="Price" Prefix="$" Precision="2" Step="0.5" Min="0" (change)="Priced" /></Field>
<Field Label="Weight"><NumberInput Value="70" Suffix="kg" Min="1" Max="300" /></Field>
<Field Label="Quantity" Hint="Without the buttons"><NumberInput Value="3" Controls="false" /></Field>
<p class="elemenx-text small muted">Price: {{Price === null ? 'empty' : Price}} · the arrows step, Shift ten steps.</p>
<script>
({
	Price: 19.99,

	Priced: function (value) {
		this.Price = value;
	}
})
</script>
```
