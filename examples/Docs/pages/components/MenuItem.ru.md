<!-- generated -->
# MenuItem

Пункт меню, объявленный в шаблоне Menu (в слоте по умолчанию) или ContextMenu (в слоте items): ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Group; Separator рисует вместо него линию; дочерние MenuItem образуют подменю. Сам по себе ничего не показывает: меню его читает. Нажатие отправляет select с пунктом — и здесь, и на меню.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Icon` | `''` |
| `Shortcut` | `''` |
| `Disabled` | `false` |
| `Danger` | `false` |
| `Checked` | `null` |
| `Separator` | `false` |
| `Group` | `''` |

## События

`select`

## Слоты

по умолчанию

## Пример

```example
<Menu Label="Edit" Icon="edit">
	<MenuItem ID="undo" Label="Undo" Icon="undo" Shortcut="Ctrl+Z" (select)="Picked" />
	<MenuItem ID="redo" Label="Redo" Icon="redo" Shortcut="Ctrl+Y" [disabled]="!CanRedo" (select)="Picked" />
	<MenuItem Separator="true" />
	<MenuItem ID="wrap" Label="Word wrap" [checked]="Wrap" (select)="Wrapped" />
	<MenuItem ID="convert" Label="Convert" Icon="refresh">
		<MenuItem ID="upper" Label="To upper case" (select)="Picked" />
		<MenuItem ID="lower" Label="To lower case" (select)="Picked" />
	</MenuItem>
</Menu>
<span class="elemenx-text small muted">{{Note}}</span>
<script>
({
	CanRedo: false,
	Wrap: true,
	Note: '',

	Picked: function (item) {
		this.Note = 'Picked: ' + item.ID;
		this.CanRedo = item.ID === 'undo';
	},

	Wrapped: function () {
		this.Wrap = !this.Wrap;
		this.Note = 'Word wrap ' + (this.Wrap ? 'on' : 'off');
	}
})
</script>
```
