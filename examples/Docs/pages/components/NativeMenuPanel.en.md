<!-- generated -->
# NativeMenuPanel

The menu of the tray of a program drawn by ElemenxUI: the list a NativeMenu of the tray puts in its window (Platform.TrayPopup), as a MenuList draws it. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}]; an item with Items opens them in its place, with a row back; Choose(item) is called with a leaf chosen, and the window hides. The window is see-through and takes the size of the list, so the list has the corners and the shadow of a menu of the page. The pointer and the arrows light an item (Enter or the right arrow takes it, the left arrow goes back a level); Escape hides the window, or goes back a level.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Choose` | `null` |

## Example

```example
<div style="max-width: 260px;">
	<NativeMenuPanel [items]="Items" [choose]="Choose" />
</div>
<p class="elemenx-text small muted">The menu of the tray of a program, as its window shows it. Chosen: {{Chosen}}</p>
<script>
({
	Chosen: 'nothing yet',
	Items: [
		{ID: 'show', Label: 'Show the window', Icon: 'layout'},
		{Label: 'Status', Items: [{ID: 'online', Label: 'Online', Checked: true}, {ID: 'away', Label: 'Away'}]},
		{Separator: true},
		{ID: 'quit', Label: 'Quit', Danger: true}
	],

	$OnCreate: function () {
		var self = this;

		this.Choose = function (item) {
			self.Chosen = item.Label;
		};
	}
})
</script>
```
