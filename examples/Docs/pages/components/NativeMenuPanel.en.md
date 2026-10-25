<!-- generated -->
# NativeMenuPanel

The menu of the tray of a program drawn by ElemenxUI: the list a NativeMenu of the tray puts in its window (Native.TrayPopup), as a MenuList draws it. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}]; an item with Items opens them in its place, with a row back; Choose(item) is called with a leaf chosen, and the window hides. The window is see-through and takes the size of the list, so the list has the corners and the shadow of a menu of the page. The pointer and the arrows light an item (Enter or the right arrow takes it, the left arrow goes back a level); Escape hides the window, or goes back a level.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Choose` | `null` |
