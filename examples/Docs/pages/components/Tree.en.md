<!-- generated -->
# Tree

A tree. Items: [{ID, Label, Icon, Badge, Items, Disabled, Lazy}]; Value is the ID of the selected item; Expanded holds the open IDs. A Lazy item without Items asks for its children with the load event (the item): the owner gives it Items (Loading holds the IDs being loaded, shown with a spinner). Checkable adds check boxes: a parent is checked when all its children are, mixed when some are; checking it checks all of them. Checked holds the checked IDs (parents included). Filter (or a search field with Searchable) keeps the items that match and their parents, open. Keys: arrows (Right opens or goes to the first child, Left closes or goes to the parent), Home, End, Enter selects, Space checks, '*' opens the siblings, a letter goes to the next item that starts with it. Movable lets the pointer drag an item onto another: before it (the upper part of its row), after it (the lower part) or into it (the middle), never into itself or one of its own items. The tree does not change Items itself: the move event ({ID, Target, Position: 'before', 'after' or 'inside'}) asks the owner to. Accept names other types of drags (*draggable) the rows take the same way, a kind of a palette dropped in a structure: their move carries the Type and the Data of the drag as ID. Events: select (the item), expand (the open IDs), check (the checked IDs), load (the item), move.

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
| `Movable` | `false` |
| `Accept` | `[]` |

## Events

- `check`: The check boxes changed: the IDs of the checked items.
- `expand`: An item opened or closed: the IDs of the open items.
- `load`: A Lazy item was opened: the item, which asks for its Items.
- `select`: An item was selected: the item.
- `move`: An item was dragged onto another (Movable): {ID, Target, Position (before, after or inside), Type}.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 260px;"><Tree [items]="Items" [value]="Current" [expanded]="Open" [loading]="Loading" Checkable="true" [checked]="Checked" Searchable="true" (select)="Selected" (expand)="Expanded" (check)="Checks" (load)="Load" /></div>
	<div class="elemenx-text small">
		<p>Selected: {{Current || 'none'}}</p>
		<p>Checked: {{Checked.join(', ') || 'none'}}</p>
	</div>
</div>
<h3 class="elemenx-label">Movable: drag an item before, after or into another</h3>
<div style="width: 260px;"><Tree Movable="true" [items]="Layers" [expanded]="['page', 'header']" (move)="Moved" /></div>
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

	Layers: [
		{ID: 'page', Label: 'Page', Icon: 'file', Items: [
			{ID: 'header', Label: 'Header', Icon: 'layout', Items: [{ID: 'logo', Label: 'Logo', Icon: 'image'}]},
			{ID: 'body', Label: 'Body', Icon: 'layout'},
			{ID: 'footer', Label: 'Footer', Icon: 'layout'}
		]}
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

	/* The tree asks; the owner moves the item in Layers: out of where it was, then before, after or into the target. */
	Moved: function (move) {
		var taken = null;

		function take (items) {
			return items.filter(function (item) {
				if (item.ID === move.ID)
					taken = item;

				return item.ID !== move.ID;
			}).map(function (item) {
				return item.Items ? {ID: item.ID, Label: item.Label, Icon: item.Icon, Items: take(item.Items)} : item;
			});
		}

		function put (items) {
			var result = [];

			items.forEach(function (item) {
				if (item.ID === move.Target && move.Position === 'before')
					result.push(taken);

				result.push(item.ID === move.Target && move.Position === 'inside' ? {ID: item.ID, Label: item.Label, Icon: item.Icon, Items: (item.Items || []).concat([taken])} : item.Items ? {ID: item.ID, Label: item.Label, Icon: item.Icon, Items: put(item.Items)} : item);

				if (item.ID === move.Target && move.Position === 'after')
					result.push(taken);
			});

			return result;
		}

		this.Layers = put(take(this.Layers));
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

## Tests

- [radio groups and tab strips with their own state do not affect each other](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4368) — `tests/examples/ui-kit.spec.js`
