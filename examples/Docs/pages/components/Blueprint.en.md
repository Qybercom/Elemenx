<!-- generated -->
# Blueprint

The editor of a blueprint (the Blueprints Service: a graph in the JSON of Flowprint) on a Board: blocks with their pins, links drawn between them, the types of blocks of its graph to add (Palette) and its parameters, set from outside it. Value is the graph (an object or the text of its file); without one it is an empty graph of Type. change emits the graph after each action, select {Block, Link} (their ids, or null), problems what Check finds (each block it names is marked wrong, with its message as its title). A drag of the head of a block moves it; a drag from a pin to another draws a link (an input takes one link of values, an output of flow goes one way: a new link takes the place of the old one); a drag from an input with a link, let go on no pin, takes the link away. A press on a link selects it; Delete removes the block or the link selected. The properties of a block are edited in it. ReadOnly shows the graph alone: blocks still move, nothing else changes. Methods: Graph(), Write() (the text of its file), Add(type, x, y), Remove(id), Select(id), Selected(), Check(), Compile(options), Arrange() (the blocks in columns, each after what it reads; a graph whose blocks all stand at 0, 0 is arranged when shown) and Fit().

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Type` | `'flow'` |
| `Palette` | `true` |
| `ReadOnly` | `false` |
| `Label` | `''` |

## Events

- `problems`: What is wrong with the graph: [{Block, Pin, Link, Message}].
- `select`: The selection changed: {Block, Link}, their ids or null.
- `change`: The graph changed: the graph.

## Methods

- `Graph()`
- `Write()`
- `Add(type, x, y)`
- `Remove(id)`
- `Select(id)`
- `Selected()`
- `Check()`
- `Compile(options)`
- `Fit()`
- `Arrange()`

## Tests

- [shows the blocks where they stand with their pins, the links between the pins, and the file it keeps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L79) — `tests/regression/library-blueprint.test.js`
- [draws a link by a drag from a pin to another, takes the place of the one there, and takes one away let go on nothing](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L115) — `tests/regression/library-blueprint.test.js`
- [fits all of its blocks into the view, not the corner of its canvas (regression: it fitted a canvas 1 pixel large)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L158) — `tests/regression/library-blueprint.test.js`
- [moves a block by its head, and the links follow it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L188) — `tests/regression/library-blueprint.test.js`
- [adds a block of the palette, edits its properties, and Delete removes what is selected with its links](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L209) — `tests/regression/library-blueprint.test.js`
- [marks the blocks Check finds wrong, edits the parameters of the graph, and arranges a graph made in code](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L264) — `tests/regression/library-blueprint.test.js`
- [read-only shows the graph alone: no palette, no new links, no edits](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-blueprint.test.js#L310) — `tests/regression/library-blueprint.test.js`
- [burns an effect of a Blueprint, its parameters the values of its layers, one graph for many effects](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L96) — `tests/regression/library-effect-blueprints.test.js`
- [burns nothing of a Blueprint that cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L139) — `tests/regression/library-effect-blueprints.test.js`
- [draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L72) — `tests/regression/library-material-blueprints.test.js`
- [draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L198) — `tests/regression/library-material-blueprints.test.js`
- [draws a material as it is when its Blueprint cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L263) — `tests/regression/library-material-blueprints.test.js`

+1 more in the same files
