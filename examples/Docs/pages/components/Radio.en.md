<!-- generated -->
# Radio

A single radio button, for layouts of your own; RadioGroup renders a whole set from Options. Checked marks it, Value is what it stands for, Name groups it with the radio buttons of the same name (the browser keeps one checked), Label and Description stand beside it. Variant: default or tile (a selectable tile with its description); Size: small, medium or large; Disabled, Invalid. Events: change (Value, when it is checked).

## Properties

| Property | Default |
| --- | --- |
| `Checked` | `false` |
| `Label` | `''` |
| `Description` | `''` |
| `Variant` | `'default'` |
| `Size` | `'medium'` |
| `Name` | `null` |
| `Value` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Events

- `change`: It was checked: Value.

## Slots

default

## Example

```example
<div class="docs-stack">
	<Radio Name="docs-ship" Value="post" Label="By post" Description="5 to 7 days" [checked]="Ship === 'post'" (change)="Picked" />
	<Radio Name="docs-ship" Value="courier" Label="By courier" Description="Tomorrow" [checked]="Ship === 'courier'" (change)="Picked" />
	<Radio Name="docs-ship" Value="pickup" Label="Pick it up" Disabled="true" />
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Radio Name="docs-plan" Value="free" Label="Free" Description="One project" Variant="tile" Checked="true" />
	<Radio Name="docs-plan" Value="pro" Label="Pro" Description="Every project" Variant="tile" />
</div>
<p class="elemenx-text small muted">Delivery: {{Ship}}</p>
<script>
({
	Ship: 'post',

	Picked: function (value) {
		this.Ship = value;
	}
})
</script>
```
