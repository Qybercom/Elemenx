<!-- generated -->
# Layouts

The places of tiles, cards and pictures in a box: four ways of laying them out, as numbers (nothing is drawn here).

- Pack(items, options): a grid of cells packed without holes (a bento, a start screen). An item is {ID, Width, Height} in cells (1 by default, no wider than the grid), with Row and Column to keep it in its place (when it fits and is free); the others take the first free place, row by row (Dense false: never before the place of the one before). Options: Columns (the width of the grid in cells). Returns {Items: [{ID, Item, Row, Column, Width, Height}] in the order of the items, Rows}.
- Masonry(items, options): columns of one width, each item into the shortest one (a wall of cards). An item is {ID, Height} in pixels, or {ID, Ratio} (its width over its height), with Span (columns it takes, 1 by default). Options: Width (of the box), Columns, or ColumnWidth (the least width of a column: as many columns as fit), Gap. Returns {Items: [{ID, Item, Column, X, Y, Width, Height}], Columns, ColumnWidth, Height}.
- Justified(items, options): rows of one height filling the width, each picture keeping its shape (a gallery of photographs). An item is {ID, Ratio}. Options: Width, RowHeight (wanted, 200), MaxRowHeight (a row of few items grows no taller: 1.5 times RowHeight), Gap, LastRow ('left': at RowHeight, the default; 'justify': filling the width; 'hide'). Returns {Items: [{ID, Item, Row, X, Y, Width, Height}], Rows: [{Y, Height, Count}], Height}.
- Treemap(items, options): rectangles of areas by their Value (squarified: as square as they can be), Children in the rectangle of their parent (Value the sum of theirs without one). An item is {ID, Value, Children}. Options: Width, Height, Gap (between siblings), Padding (inside a parent around its children), Header (room on top of a parent for its name). Returns {Items: [{ID, Item, Depth, Parent, X, Y, Width, Height, Value, Leaf}], Width, Height}, the parents before their children.

The same functions run in Node: they read no page.

## Methods

- `Pack(items, options)`
- `Masonry(items, options)`
- `Justified(items, options)`
- `Treemap(items, options)`

## Tests

- [packs a grid of cells without holes, keeping the items in their places](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L42) — `tests/regression/library-layouts.test.js`
- [lays masonry into the shortest column, a picture by its ratio, an item over several columns](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L59) — `tests/regression/library-layouts.test.js`
- [fills justified rows of one height, each picture keeping its shape, the last one at the wanted height](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L77) — `tests/regression/library-layouts.test.js`
- [makes a treemap of areas by value, children inside their parent, the parents first](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L98) — `tests/regression/library-layouts.test.js`
- [draws a Mosaic of items given and declared, follows its width, and selects an item by a press or Enter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-layouts.test.js#L124) — `tests/regression/library-layouts.test.js`
- [compares signatures and lays out items with the Services of ElemenxUI](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L25) — `tests/regression/headless.test.js`
- [themes switch the tokens and the rules of the Components, keep to their schemes and are remembered](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L469) — `tests/examples/ui-kit.spec.js`
- [layouts: dashboard, settings, master-detail and centered pages](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L10213) — `tests/examples/ui-kit.spec.js`
