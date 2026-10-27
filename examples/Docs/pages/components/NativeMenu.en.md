<!-- generated -->
# NativeMenu

The menu of a program declared as a menu of the page: <NativeMenu> with MenuItem children, as in a Menu (a MenuItem with MenuItems inside is a submenu). Target window (by default) is the menu of the window, its top-level items the menus of a bar (File, Edit...); Target tray is the menu of the icon in the tray, opened by its right button. Look: elemenx (by default) draws them with ElemenxUI: the menu of the window a MenuBar where the layout places the NativeMenu (Caret, Variant and Size as in MenuBar; a program has no menu of the system without one), the menu of the tray a window of the Application at the pointer (Native.TrayPopup, a NativeMenuPanel); system has the system draw them (Native.Menu, Native.TrayMenu). Both follow the template. A MenuItem with a Role (undo, redo, cut, copy, paste, selectAll, reload, toggleDevTools, resetZoom, zoomIn, zoomOut, togglefullscreen, minimize, close, quit) does what the system does for it (Native.Role), with the usual shortcut of the role when it names none; its Shortcut is a hotkey of the program (Ctrl+N, Mod+N for Ctrl or Cmd). A choice is the select of its MenuItem, as in the page, and the select of the NativeMenu with the item. On the web the menu of a window is the bar without the items of the system, their shortcuts hotkeys of the page; a menu of the tray shows nothing. Events: select (the item chosen), apply ({Error} when the system refused the menu).

## Properties

| Property | Default |
| --- | --- |
| `Target` | `'window'` |
| `Look` | `'elemenx'` |
| `Caret` | `false` |
| `Variant` | `'ghost'` |
| `Size` | `'small'` |

## Events

- `apply`: The menu was given to the system: {Error}, null when it went well.
- `select`: An item was chosen in the menu of the program: the item.

## Slots

default

## Example

```example
<TitleBar Title="Notes" Icon="file-text">
	<NativeMenu (select)="Selected">
		<MenuItem Label="File">
			<MenuItem ID="new" Label="New note" Shortcut="Alt+Shift+N" />
			<MenuItem ID="export" Label="Export..." />
			<MenuItem Separator="true" />
			<MenuItem Role="quit" Label="Quit" />
		</MenuItem>
		<MenuItem Label="Edit">
			<MenuItem Role="undo" Label="Undo" />
			<MenuItem ID="find" Label="Find" />
		</MenuItem>
	</NativeMenu>
</TitleBar>
<p class="elemenx-text small muted">On the web the menu is a MenuBar without the items of the system (Quit, Undo). Chosen: {{Chosen}}</p>
<script>
({
	Chosen: 'nothing yet',

	Selected: function (item) {
		this.Chosen = item.Label;
	}
})
</script>
```
