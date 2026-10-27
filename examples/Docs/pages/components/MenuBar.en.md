<!-- generated -->
# MenuBar

A bar of menus, as at the top of the window of a program: File, Edit, View... Items are the menus ([{ID, Label, Icon, Disabled, Items}]), then the ones its MenuItem children declare (a MenuItem with MenuItems inside is a menu of the bar, its MenuItems the items of that menu). It behaves as the bar of a program: while a menu is open, the pointer on another one opens that one in its place; the left and right arrows go from menu to menu (and between the buttons of the closed bar), the down arrow opens one; F10, or Alt pressed alone, takes the first bar of the page to its first menu and gives the focus back. Caret shows the arrow of a menu by its label (none by default, as in a program). The select event carries the chosen leaf item (a declared one emits select on its MenuItem too).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Variant` | `'ghost'` |
| `Size` | `'small'` |
| `Caret` | `false` |
| `Disabled` | `false` |

## Events

- `select`: A leaf item of a menu was chosen: the item.

## Slots

default

## Example

```example
<MenuBar (select)="Selected">
	<MenuItem Label="File">
		<MenuItem ID="new" Label="New" Shortcut="Ctrl+N" />
		<MenuItem ID="open" Label="Open..." Shortcut="Ctrl+O" />
		<MenuItem Separator="true" />
		<MenuItem ID="quit" Label="Quit" Danger="true" />
	</MenuItem>
	<MenuItem Label="Edit">
		<MenuItem ID="copy" Label="Copy" Shortcut="Ctrl+C" />
		<MenuItem Label="Paste special">
			<MenuItem ID="paste-text" Label="Text only" />
		</MenuItem>
	</MenuItem>
	<MenuItem Label="Help">
		<MenuItem ID="about" Label="About" />
	</MenuItem>
</MenuBar>
<p class="elemenx-text small muted">Chosen: {{Chosen}}</p>
<script>
({
	Chosen: 'nothing yet',

	Selected: function (item) {
		this.Chosen = item.Label;
	}
})
</script>
```
