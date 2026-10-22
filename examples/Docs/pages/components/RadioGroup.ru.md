<!-- generated -->
# RadioGroup

Набор радиокнопок, из которых выбрана одна. Options: [{Value, Label, Description, Disabled}]; Value — Value выбранного варианта с исходным типом. Variant: default (друг под другом), horizontal (в ряд), tile (плитки с описаниями) или segmented (полоса кнопок, как переключатель видов). Label называет группу для экранных читалок; стрелки двигают выбор. Size, Name, Disabled, Invalid. События: change (Value).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Options` | `[]` |
| `Value` | `null` |
| `Variant` | `'default'` |
| `Size` | `'medium'` |
| `Name` | `''` |
| `Label` | `''` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

`change`

## Пример

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
