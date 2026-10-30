<!-- generated -->
# Layouts

Места плиток, карточек и картинок в коробке — четыре способа раскладки, числами (здесь ничего не рисуется).
- Pack(items, options): сетка клеток без дыр (bento, стартовый экран). Элемент — {ID, Width, Height} в клетках (по умолчанию 1, не шире сетки), с Row и Column он остаётся на своём месте (если помещается и место свободно); остальные занимают первое свободное место по рядам (Dense false: никогда не раньше места предыдущего). Options: Columns. Возвращает {Items: [{ID, Item, Row, Column, Width, Height}] в порядке элементов, Rows}.
- Masonry(items, options): колонки одной ширины, каждый элемент — в самую короткую. Элемент — {ID, Height} в пикселях или {ID, Ratio} (ширина к высоте), Span — сколько колонок он занимает. Options: Width, Columns или ColumnWidth (наименьшая ширина колонки), Gap. Возвращает {Items: [{ID, Item, Column, X, Y, Width, Height}], Columns, ColumnWidth, Height}.
- Justified(items, options): ряды одной высоты на всю ширину, каждая картинка сохраняет форму. Элемент — {ID, Ratio}. Options: Width, RowHeight (желаемая, 200), MaxRowHeight, Gap, LastRow (left, justify, hide). Возвращает {Items: [{ID, Item, Row, X, Y, Width, Height}], Rows, Height}.
- Treemap(items, options): прямоугольники с площадью по Value (squarified: как можно ближе к квадрату), Children — внутри родителя. Options: Width, Height, Gap, Padding, Header. Возвращает {Items: [{ID, Item, Depth, Parent, X, Y, Width, Height, Value, Leaf}], Width, Height}, родители — перед детьми.
Те же функции работают в Node: страницу они не читают.

## Методы

- `Pack(items, options)`
- `Masonry(items, options)`
- `Justified(items, options)`
- `Treemap(items, options)`

## Тесты

- [packs a grid of cells without holes, keeping the items in their places](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L42) — `tests/regression/library-layouts.test.js`
- [lays masonry into the shortest column, a picture by its ratio, an item over several columns](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L59) — `tests/regression/library-layouts.test.js`
- [fills justified rows of one height, each picture keeping its shape, the last one at the wanted height](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L77) — `tests/regression/library-layouts.test.js`
- [makes a treemap of areas by value, children inside their parent, the parents first](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L98) — `tests/regression/library-layouts.test.js`
- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
- [compares signatures and lays out items with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L25) — `tests/regression/headless.test.js`
- [themes switch the tokens and the rules of the Components, keep to their schemes and are remembered](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L469) — `tests/examples/ui-kit.spec.js`
- [layouts: dashboard, settings, master-detail and centered pages](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L10218) — `tests/examples/ui-kit.spec.js`
