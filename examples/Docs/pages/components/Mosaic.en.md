<!-- generated -->
# Mosaic

Items laid out in a box by the Layouts Service, as Layout says: bento (a grid of cells packed without holes, the items of Width and Height cells), masonry (columns of one width, each item into the shortest one: Height in pixels, or the Ratio of its picture), justified (rows of one height filling the width, each picture keeping its Ratio) or treemap (rectangles of areas by their Value, Children inside their parent). The width comes from the room the Mosaic has: Columns (bento, masonry) or as many columns as fit ColumnWidth; CellHeight is the height of a cell of a bento (its width by default), RowHeight the wanted height of a justified row (MaxRowHeight, LastRow), Height the one of a treemap. Gap is the room between the items.

Items: [{ID, Title, Text, Image, Color, Width, Height, Ratio, Span, Value, Row, Column, Children, Class, Element, Render}], or declared inside it: MosaicItem (its content is the content of the item, a MosaicItem in it a child). An item shows its Image (covering it), its Title and Text over it, or its own content (Element, Render(container, item), the content of its MosaicItem). Selectable makes the items buttons: a press or Enter emits select with the item. The items move to their new places when the layout or the room changes. Arrangement() returns the places as the Layouts Service gives them.

## Properties

| Property | Default |
| --- | --- |
| `Layout` | `'bento'` |
| `Items` | `[]` |
| `Columns` | `0` |
| `ColumnWidth` | `0` |
| `CellHeight` | `0` |
| `RowHeight` | `200` |
| `MaxRowHeight` | `0` |
| `LastRow` | `'left'` |
| `Height` | `360` |
| `Gap` | `8` |
| `Selectable` | `false` |
| `Label` | `''` |

## Events

- `select`: A Selectable item was pressed: the item.

## Slots

default

## Methods

- `Arrangement()`

## Example

```example
<RadioGroup Variant="segmented" [options]="Layouts" [value]="Layout" (change)="Laid" />
<Mosaic ColumnWidth="90" RowHeight="110" Height="260" Selectable="true" [layout]="Layout" [items]="Items" (select)="Chosen">
	<MosaicItem ID="declared" Title="Declared" Width="2" Ratio="2" Value="20" Color="#2f8f83" />
</Mosaic>
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Layout: 'bento',
	Layouts: [{Value: 'bento', Label: 'Bento'}, {Value: 'masonry', Label: 'Masonry'}, {Value: 'justified', Label: 'Justified'}, {Value: 'treemap', Label: 'Treemap'}],
	Text: 'Press an item.',
	Items: [
		{ID: 'a', Title: 'Wide', Width: 2, Height: 2, Ratio: 1.5, Value: 40, Color: '#3f6c9e'},
		{ID: 'b', Title: 'One', Ratio: 0.8, Value: 25, Color: '#c2477f'},
		{ID: 'c', Title: 'Tall', Height: 2, Ratio: 1, Value: 15, Color: '#d99a1e'},
		{ID: 'd', Title: 'Two', Ratio: 1.7, Value: 10, Color: '#7a4fb0'},
		{ID: 'e', Title: 'Three', Ratio: 1.2, Value: 8, Color: '#d25f3a'}
	],

	Laid: function (value) {
		this.Layout = value;
	},

	Chosen: function (item) {
		this.Text = 'Chosen: ' + (item.Title || item.ID);
	}
})
</script>
```

## Tests

- [packs a grid of cells without holes, keeping the items in their places](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L42) — `tests/regression/library-layouts.test.js`
- [lays masonry into the shortest column, a picture by its ratio, an item over several columns](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L59) — `tests/regression/library-layouts.test.js`
- [fills justified rows of one height, each picture keeping its shape, the last one at the wanted height](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L77) — `tests/regression/library-layouts.test.js`
- [makes a treemap of areas by value, children inside their parent, the parents first](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L98) — `tests/regression/library-layouts.test.js`
- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
- [mosaic lays its items out as a bento, masonry, justified rows and a treemap, and selects one](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L7843) — `tests/examples/ui-kit.spec.js`
