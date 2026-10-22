<!-- generated -->
# NavList

A navigation list or tree. Items: [{ID, Label, Icon, Badge, Items, Disabled}]; Value is the ID of the current item. Items with Items are groups that open and close (Expanded lists the open ones). Searchable filters the tree and opens the branches that match. Collapsed shows only the icons (for a narrow sidebar). The select event carries the item. Keys: arrows move, Enter selects, Right opens a group, Left closes it.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Expanded` | `[]` |
| `Searchable` | `false` |
| `Collapsed` | `false` |
| `Label` | `''` |

## Events

`expand`, `select`

## Example

```example
<Toggle Label="Collapsed" [checked]="Narrow" (change)="Fold" />
<div class="elemenx-container" style="gap: 8px; align-items: flex-start;">
	<div [style.width]="Narrow ? '56px' : '240px'"><NavList [items]="Items" [value]="Current" [collapsed]="Narrow" Searchable="true" (select)="Selected" /></div>
	<p class="elemenx-text">Page: <strong>{{Current}}</strong></p>
</div>
<script>
({
	Current: 'inbox',
	Narrow: false,
	Items: [
		{ID: 'inbox', Label: 'Inbox', Icon: 'mail', Badge: 4},
		{ID: 'starred', Label: 'Starred', Icon: 'star'},
		{ID: 'files', Label: 'Files', Icon: 'folder', Items: [
			{ID: 'documents', Label: 'Documents'},
			{ID: 'pictures', Label: 'Pictures'},
			{ID: 'music', Label: 'Music', Disabled: true}
		]},
		{ID: 'settings', Label: 'Settings', Icon: 'settings'}
	],

	Selected: function (item) {
		this.Current = item.ID;
	},

	Fold: function (value) {
		this.Narrow = value;
	}
})
</script>
```
