<!-- generated -->
# MenuItem

An item of a menu declared in the template of a Menu (its default slot) or of a ContextMenu (slot items): ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Group; Separator draws a line instead; MenuItem children make a submenu. Role is what the system does for it in a menu of a program (NativeMenu: undo, copy, quit...). It shows nothing by itself: the menu reads it. A press on it emits select with the item, here as well as on the menu.

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
| `Role` | `''` |

## Events

- `select`: It was chosen in its menu: the item.

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

## Tests

- [gives the system the menu of its MenuItems with Look system, their shortcuts and roles, and tells a choice to its MenuItem](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L92) — `tests/regression/native-menu.test.js`
- [draws the menu of the window of a program with ElemenxUI by default: a bar, the menu of the system taken away, a role done by the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L137) — `tests/regression/native-menu.test.js`
- [draws the menu of the tray of a program in a window of its own at the right button, a choice told to its MenuItem](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L164) — `tests/regression/native-menu.test.js`
- [is a bar of menus on the web, without the items of the system, its shortcuts hotkeys of the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L250) — `tests/regression/native-menu.test.js`
- [gives the icon in the tray its menu of the system with Look system, and hears the choices of that menu only](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L286) — `tests/regression/native-menu.test.js`
- [SplitButton: the main button emits click, the arrow opens the menu of Items and declared MenuItems, an item emits select](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L33) — `tests/regression/library-new.test.js`
