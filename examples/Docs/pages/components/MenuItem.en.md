<!-- generated -->
# MenuItem

An item of a menu declared in the template of a Menu (its default slot) or of a ContextMenu (slot items): ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Group; Separator draws a line instead; MenuItem children make a submenu. It shows nothing by itself: the menu reads it. A press on it emits select with the item, here as well as on the menu.

## Properties

| Property | Default |
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

## Events

`select`

## Slots

default

## Example

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
