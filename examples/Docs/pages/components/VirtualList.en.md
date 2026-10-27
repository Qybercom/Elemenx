<!-- generated -->
# VirtualList

A long list that draws only the rows in view (and Overscan more on each side): a hundred thousand items scroll as lightly as ten. Items: objects (or strings); every row is ItemHeight pixels high; Height is the height of the list. A row shows Icon, Label (LabelKey) and Hint of its item, or the content of Render(container, item, index). Value is the key (ItemKey) of the selected item. Keys: arrows, Page Up and Down, Home, End; Enter selects. ScrollTo(index) brings an item into view. Events: select (the item), range ({Start, End}: the rows drawn).

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
