<!-- generated -->
# Menu

A button that opens a multi-level MenuList. Items, and the items its MenuItem children declare after them (a MenuItem with MenuItems inside is a submenu). The select event carries the chosen leaf item (a declared one emits select on its MenuItem too). Sheet: true, or 'auto' (on a narrow or a touch screen), shows the list as a sheet from the bottom of the screen, as on a phone. Caret false takes away the arrow by the label of the button.

Menu is the button and the menu it opens; MenuList is one level of a menu alone (the list, its submenus, its sheet): Menu, ContextMenu and the Ribbon are made of it, and it can be placed under any element of your own.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Label` | `''` |
| `Icon` | `''` |
| `Title` | `''` |
| `Variant` | `'secondary'` |
| `Size` | `'medium'` |
| `Placement` | `'bottom-start'` |
| `Sheet` | `false` |
| `Caret` | `true` |
| `Disabled` | `false` |
| `Open` | `false` |

## Events

- `select`: A leaf item was chosen: the item.

## Slots

default

## Example

```example
<div class="elemenx-container" style="gap: 8px;">
	<Menu Label="Edit" Icon="edit" (select)="Chose">
		<MenuItem ID="undo" Label="Undo" Icon="undo" Shortcut="Ctrl+Z" />
		<MenuItem ID="redo" Label="Redo" Icon="redo" Shortcut="Ctrl+Y" Disabled="true" />
		<MenuItem Separator="true" />
		<MenuItem ID="paste" Label="Paste special" Icon="paste">
			<MenuItem ID="text" Label="Text only" />
			<MenuItem ID="html" Label="With formatting" />
		</MenuItem>
		<MenuItem ID="wrap" Label="Word wrap" [checked]="Wrap" />
		<MenuItem Separator="true" />
		<MenuItem ID="delete" Label="Delete" Icon="delete" Danger="true" />
	</Menu>
	<Menu Label="Sheet" Sheet="true" [items]="[{ID: 'share', Label: 'Share', Icon: 'share'}, {ID: 'copy', Label: 'Copy the link', Icon: 'link'}]" (select)="Chose" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Open a menu; the arrows move, Right opens a submenu.',
	Wrap: false,

	Chose: function (item) {
		if (item.ID === 'wrap')
			this.Wrap = !this.Wrap;

		this.Note = 'Chosen: ' + item.Label;
	}
})
</script>
```

## Tests

- [Menu: its first item](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L74) — `tests/regression/focus-on-open.test.js`
- [Menu lets its owner take it away in its select (a sign out) without an error](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L211) — `tests/regression/library-overlays.test.js`
- [a drawer is a side menu from either side, and drawers stack: Escape closes the top one](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8802) — `tests/examples/ui-kit.spec.js`
