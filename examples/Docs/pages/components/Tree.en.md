<!-- generated -->
# Tree

A tree. Items: [{ID, Label, Icon, Badge, Items, Disabled, Lazy}]; Value is the ID of the selected item; Expanded holds the open IDs. A Lazy item without Items asks for its children with the load event (the item): the owner gives it Items (Loading holds the IDs being loaded, shown with a spinner). Checkable adds check boxes: a parent is checked when all its children are, mixed when some are; checking it checks all of them. Checked holds the checked IDs (parents included). Filter (or a search field with Searchable) keeps the items that match and their parents, open. Keys: arrows (Right opens or goes to the first child, Left closes or goes to the parent), Home, End, Enter selects, Space checks, '*' opens the siblings, a letter goes to the next item that starts with it. Events: select (the item), expand (the open IDs), check (the checked IDs), load (the item).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Expanded` | `[]` |
| `Checkable` | `false` |
| `Checked` | `[]` |
| `Loading` | `[]` |
| `Searchable` | `false` |
| `Filter` | `''` |
| `Label` | `''` |
| `Empty` | `''` |

## Events

`check`, `expand`, `load`, `select`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 260px;"><Tree [items]="Items" [value]="Current" [expanded]="Open" [loading]="Loading" Checkable="true" [checked]="Checked" Searchable="true" (select)="Selected" (expand)="Expanded" (check)="Checks" (load)="Load" /></div>
	<div class="elemenx-text small">
		<p>Selected: {{Current || 'none'}}</p>
		<p>Checked: {{Checked.join(', ') || 'none'}}</p>
	</div>
</div>
<script>
({
	Current: 'app',
	Open: ['src'],
	Checked: [],
	Loading: [],
	Items: [
		{ID: 'src', Label: 'src', Icon: 'folder', Items: [
			{ID: 'app', Label: 'app.js', Icon: 'file'},
			{ID: 'router', Label: 'router.js', Icon: 'file', Badge: 'M'}
		]},
		{ID: 'remote', Label: 'remote (loads)', Icon: 'cloud', Lazy: true},
		{ID: 'readme', Label: 'README.md', Icon: 'file'}
	],

	Selected: function (item) {
		this.Current = item.ID;
	},

	Expanded: function (ids) {
		this.Open = ids;
	},

	Checks: function (ids) {
		this.Checked = ids;
	},

	Load: function (item) {
		var self = this;

		this.Loading = [item.ID];

		setTimeout(function () {
			self.Items = self.Items.map(function (entry) {
				return entry.ID === item.ID ? {ID: entry.ID, Label: entry.Label, Icon: entry.Icon, Items: [{ID: 'r1', Label: 'one.txt'}, {ID: 'r2', Label: 'two.txt'}]} : entry;
			});
			self.Loading = [];
		}, 800);
	}
})
</script>
```
