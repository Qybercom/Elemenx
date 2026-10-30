<!-- generated -->
# Mosaic

Элементы, разложенные в коробке сервисом Layouts по Layout: bento (сетка клеток без дыр, элементы шириной Width и высотой Height клеток), masonry (колонки одной ширины, каждый элемент — в самую короткую: Height в пикселях или Ratio его картинки), justified (ряды одной высоты на всю ширину, каждая картинка сохраняет свой Ratio) или treemap (прямоугольники с площадью по Value, Children — внутри родителя). Ширина берётся из места, которое есть у Mosaic: Columns (bento, masonry) или столько колонок, сколько помещается по ColumnWidth; CellHeight — высота клетки bento (по умолчанию её ширина), RowHeight — желаемая высота ряда justified (MaxRowHeight, LastRow), Height — высота treemap. Gap — расстояние между элементами. Items: [{ID, Title, Text, Image, Color, Width, Height, Ratio, Span, Value, Row, Column, Children, Class, Element, Render}] или объявленные внутри MosaicItem (его содержимое — содержимое элемента, MosaicItem внутри — его дети). Элемент показывает Image (на всю площадь), Title и Text поверх или своё содержимое (Element, Render(container, item), содержимое MosaicItem). Selectable делает элементы кнопками: нажатие или Enter — событие select с элементом. Когда меняется раскладка или место, элементы переезжают на новые места. Arrangement() возвращает места так, как их даёт сервис Layouts.

## Свойства

| Свойство | По умолчанию |
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

## События

- `select`

## Слоты

по умолчанию

## Методы

- `Arrangement()`

## Пример

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

## Тесты

- [packs a grid of cells without holes, keeping the items in their places](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L42) — `tests/regression/library-layouts.test.js`
- [lays masonry into the shortest column, a picture by its ratio, an item over several columns](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L59) — `tests/regression/library-layouts.test.js`
- [fills justified rows of one height, each picture keeping its shape, the last one at the wanted height](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L77) — `tests/regression/library-layouts.test.js`
- [makes a treemap of areas by value, children inside their parent, the parents first](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L98) — `tests/regression/library-layouts.test.js`
- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
- [mosaic lays its items out as a bento, masonry, justified rows and a treemap, and selects one](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L7784) — `tests/examples/ui-kit.spec.js`
