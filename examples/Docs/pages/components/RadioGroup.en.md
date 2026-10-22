<!-- generated -->
# RadioGroup

A set of radio buttons, one of them chosen. Options: [{Value, Label, Description, Disabled}]; Value is the Value of the chosen option, with its original type. Variant: default (one under another), horizontal (in a row), tile (tiles with their descriptions) or segmented (a strip of buttons, as a switch between views). Label names the group for screen readers; the arrows move the choice. Size, Name, Disabled, Invalid. Events: change (Value).

## Properties

| Property | Default |
| --- | --- |
| `Options` | `[]` |
| `Value` | `null` |
| `Variant` | `'default'` |
| `Size` | `'medium'` |
| `Name` | `''` |
| `Label` | `''` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Events

`change`

## Example

```example
<RadioGroup Label="View" Variant="segmented" [options]="Views" [value]="View" (change)="Changed" />
<RadioGroup Label="View" Variant="horizontal" [options]="Views" [value]="View" (change)="Changed" />
<RadioGroup Label="Plan" Variant="tile" [options]="Plans" Value="pro" />
<RadioGroup Label="Size" [options]="[{Value: 1, Label: 'Small'}, {Value: 2, Label: 'Medium'}, {Value: 3, Label: 'Large', Disabled: true}]" Value="2" (change)="Sized" />
<p class="elemenx-text small muted">View: {{View}} · size: {{Size}} (a number)</p>
<script>
({
	View: 'week',
	Size: 2,
	Views: [{Value: 'day', Label: 'Day'}, {Value: 'week', Label: 'Week'}, {Value: 'month', Label: 'Month'}],
	Plans: [{Value: 'free', Label: 'Free', Description: 'One project'}, {Value: 'pro', Label: 'Pro', Description: 'Every project'}],

	Changed: function (value) {
		this.View = value;
	},

	Sized: function (value) {
		this.Size = value;
	}
})
</script>
```
