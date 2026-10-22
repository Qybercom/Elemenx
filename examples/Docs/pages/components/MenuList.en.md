<!-- generated -->
# MenuList

One level of a Menu. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}]. Open shows it: a popup under the closest elemenx-popup-anchor around it (a button of your own and the list in one element of that class), placed by Placement ('bottom-start'; 'right-start' for a submenu), as wide as the anchor with MatchWidth. A press outside it or Escape emits "dismiss" with the reason: the owner sets Open back to false. An item with Items opens a nested MenuList to the right; a leaf item emits "select" with the item. Sheet shows the menu as on a phone: a sheet from the bottom of the screen over a shade, with large rows, its Title, and a Cancel row; an item with Items opens its items in the same sheet, with a row back. The sheet follows a finger that drags its top (the grabber and the title) down, and a swipe down there closes it. Sheet: false (the default), true, or 'auto' (a sheet on a narrow screen or a touch screen, a popup otherwise).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Open` | `false` |
| `Placement` | `'bottom-start'` |
| `MatchWidth` | `false` |
| `Sheet` | `false` |
| `Title` | `''` |

## Events

`select`, `dismiss`

## Example

```example
<span class="elemenx-popup-anchor">
	<Button Label="Actions" Icon="more" (click)="Toggle" />
	<MenuList [items]="Items" [open]="Open" (select)="Picked" (dismiss)="Closed" />
</span>
<span class="elemenx-popup-anchor">
	<Button Label="As a sheet" (click)="ToggleSheet" />
	<MenuList [items]="Items" [open]="Sheet" Sheet="true" Title="Actions" (select)="Picked" (dismiss)="SheetClosed" />
</span>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Open: false,
	Sheet: false,
	Note: 'One level of a menu under any element of your own: Share opens a level of its own.',
	Items: [
		{ID: 'open', Label: 'Open', Icon: 'external', Shortcut: 'Enter'},
		{ID: 'rename', Label: 'Rename', Icon: 'edit', Shortcut: 'F2'},
		{ID: 'share', Label: 'Share', Icon: 'share', Items: [
			{ID: 'link', Label: 'Copy a link', Icon: 'link'},
			{ID: 'mail', Label: 'By email', Icon: 'mail'}
		]},
		{ID: 'pin', Label: 'Pinned', Icon: 'pin', Checked: true},
		{Separator: true, ID: 'separator'},
		{ID: 'delete', Label: 'Delete', Icon: 'delete', Danger: true}
	],

	Toggle: function () {
		this.Open = !this.Open;
	},

	ToggleSheet: function () {
		this.Sheet = !this.Sheet;
	},

	Closed: function () {
		this.Open = false;
	},

	SheetClosed: function () {
		this.Sheet = false;
	},

	Picked: function (item) {
		this.Open = false;
		this.Sheet = false;
		this.Note = 'Chosen: ' + item.Label;
	}
})
</script>
```
