<!-- generated -->
# VirtualList

A long list that draws only the rows in view (and Overscan more on each side): a hundred thousand items scroll as lightly as ten. Items: objects (or strings); every row is ItemHeight pixels high; Height is the height of the list. A row shows Icon, Label (LabelKey) and Hint of its item, or the content of Render(container, item, index). Value is the key (ItemKey) of the selected item. Keys: arrows, Page Up and Down, Home, End; Enter selects. ScrollTo(index) brings an item into view. Events: select (the item), range ({Start, End}: the rows drawn), more ({Count}: its last rows are drawn; once for each length of Items, so a list that grows asks again).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `ItemHeight` | `32` |
| `Height` | `'320px'` |
| `Overscan` | `6` |
| `ItemKey` | `'ID'` |
| `LabelKey` | `'Label'` |
| `Render` | `null` |
| `Value` | `null` |
| `Label` | `''` |
| `Empty` | `''` |
| `Start` | `0` |

## Events

- `range`: The rows drawn changed: {Start, End}.
- `more`: Its last rows are drawn, once for each length of Items: {Count}.
- `select`: An item was chosen: the item.

## Methods

- `ScrollTo(index)`

## Example

```example
<VirtualList [items]="Items" Height="300px" ItemHeight="36" Label="A hundred thousand rows" (select)="Picked" (range)="Ranged" />
<p class="elemenx-text small muted">{{Note}} · drawn rows {{Range}}</p>
<script>
({
	Note: 'Pick a row',
	Range: '',
	Items: [],

	$OnCreate: function () {
		var items = [];
		var i = 0;

		while (i < 100000) {
			items.push({ID: i, Label: 'Row ' + (i + 1), Hint: '#' + (i * 7919 % 100000), Icon: i % 3 ? 'file' : 'folder'});

			i++;
		}

		this.Items = items;
	},

	Picked: function (item) {
		this.Note = 'Picked: ' + item.Label;
	},

	Ranged: function (range) {
		this.Range = range.Start + '–' + range.End;
	}
})
</script>
```

## Tests

- [*infinite asks once near the end, again when the list grew, never while Busy or Done, and at once when too short](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L387) — `tests/regression/library-directives.test.js`
- [*infinite up asks at the start, and keeps what the reader sees when rows come above](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L495) — `tests/regression/library-directives.test.js`
- [InfiniteList shows a spinner while busy and a word at its end, and tells more; up its spinner takes no room](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L536) — `tests/regression/library-directives.test.js`
- [VirtualList asks for more when its last rows are drawn, once for each length; Chat asks for its history at its start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L580) — `tests/regression/library-directives.test.js`
- [VirtualList draws only the rows in view of a long list, tells their range, and selects one with the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pickers.test.js#L243) — `tests/regression/library-pickers.test.js`
