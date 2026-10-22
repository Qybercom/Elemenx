<!-- generated -->
# ButtonGroup

Группа кнопок в ряд. Attached склеивает их в одну полосу (на узком экране она прокручивается вбок), без Attached кнопки переносятся на новую строку; Vertical ставит их в столбик. Label называет группу для экранных читалок.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Attached` | `false` |
| `Vertical` | `false` |
| `Label` | `''` |

## Слоты

по умолчанию

## Пример

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
