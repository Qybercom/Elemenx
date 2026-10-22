<!-- generated -->
# ButtonGroup

Buttons in a row. Attached joins them into one strip (it scrolls sideways on a narrow screen); without Attached they wrap onto a new line. Vertical stacks them. Label names the group for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `Attached` | `false` |
| `Vertical` | `false` |
| `Label` | `''` |

## Slots

default

## Example

```example
<ButtonGroup Attached="true" Label="Alignment">
	<Button Icon="text-align-left" Title="Left" [pressed]="Align === 'left'" (click)="Left" />
	<Button Icon="text-align-center" Title="Center" [pressed]="Align === 'center'" (click)="Center" />
	<Button Icon="text-align-right" Title="Right" [pressed]="Align === 'right'" (click)="Right" />
</ButtonGroup>
<ButtonGroup>
	<Button Label="Copy" Icon="copy" />
	<Button Label="Paste" Icon="paste" />
	<Button Label="Delete" Icon="delete" Variant="danger" />
</ButtonGroup>
<ButtonGroup Vertical="true" Attached="true">
	<Button Label="Up" Icon="arrow-up" />
	<Button Label="Down" Icon="arrow-down" />
</ButtonGroup>
<p class="elemenx-text" [style.text-align]="Align">Aligned {{Align}}.</p>
<script>
({
	Align: 'left',

	Left: function () {
		this.Align = 'left';
	},

	Center: function () {
		this.Align = 'center';
	},

	Right: function () {
		this.Align = 'right';
	}
})
</script>
```
