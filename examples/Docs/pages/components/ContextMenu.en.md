<!-- generated -->
# ContextMenu

A context menu over its content: a right click, the Menu key or Shift+F10 inside the default slot opens a multi-level MenuList at the pointer (or under the focused element). Items: as in MenuList. Before it opens, the open event carries {Target (the element pressed), X, Y}: the owner may change Items for that target then. The select event carries {Item, Target}. MenuItems in its slot items declare items after Items (a declared one emits select on its MenuItem too). Disabled leaves the browser menu alone. Sheet: true, or 'auto' (on a narrow or a touch screen), shows the menu as a sheet from the bottom of the screen with its Title, as on a phone. On a touch screen a press held for Hold milliseconds in place opens it (iOS sends no contextmenu event for a long press).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Disabled` | `false` |
| `Sheet` | `false` |
| `Title` | `''` |
| `Open` | `false` |
| `X` | `0` |
| `Y` | `0` |
| `Target` | `null` |
| `Hold` | `500` |

## Events

- `open`: It is about to open: {Target, X, Y}; the owner may change Items for that target.
- `select`: A leaf item was chosen: {Item, Target}.

## Slots

default, `items`

## Example

```example
<ContextMenu [items]="Menu" (open)="Opened" (select)="Picked">
	<ul class="elemenx-list divided">
		<li *for="file of Files" *key="file" class="docs-file" [attribute.data-file]="file" tabindex="0"><Icon Name="file" /> {{file}}</li>
	</ul>
</ContextMenu>
<p class="elemenx-text small muted">Right click a file (or press the Menu key on it): {{Note}}</p>
<script>
({
	File: '',
	Note: '—',
	Files: ['README.md', 'app.js', 'styles.css'],
	Menu: [
		{ID: 'open', Label: 'Open', Icon: 'external', Shortcut: 'Enter'},
		{ID: 'rename', Label: 'Rename', Icon: 'edit', Shortcut: 'F2'},
		{ID: 'share', Label: 'Share', Icon: 'share', Items: [
			{ID: 'link', Label: 'Copy a link', Icon: 'link'},
			{ID: 'mail', Label: 'By email', Icon: 'mail'}
		]},
		{Separator: true, ID: 'separator'},
		{ID: 'delete', Label: 'Delete', Icon: 'delete', Danger: true, Shortcut: 'Delete'}
	],

	Opened: function (event) {
		var row = event.Target && event.Target.closest ? event.Target.closest('[data-file]') : null;

		this.File = row ? row.getAttribute('data-file') : '';
	},

	Picked: function (event) {
		this.Note = event.Item.Label + (this.File ? ' ' + this.File : '');
	}
})
</script>
```
