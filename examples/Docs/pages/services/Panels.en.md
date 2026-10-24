<!-- generated -->
# Panels

The panels a component declares in its template, as the tabs of a Tabs (Tab) and of a Ribbon (RibbonTab): a child component renders an element of a class (its panel) whose data-* attributes describe it, and the owner reads them. Read(root, selector, owner) returns the panels of root (an element of selector inside it, not inside another element of the owner selector inside it: the panels of a nested Tabs are its own). Data(panel) gives the data-* attributes of a panel as {Name: text}, the names in PascalCase (data-key-tip is KeyTip). Watch(root, selector, callback) calls back whenever a panel comes, goes or one of its data-* attributes changes, once a frame at most, and returns the function that stops it.

## Methods

- `Read(root, selector, owner)`
- `Data(panel)`
- `Watch(root, selector, callback)`
