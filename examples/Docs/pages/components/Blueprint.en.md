<!-- generated -->
# Blueprint

The editor of a blueprint (the Blueprints Service: a graph in the JSON of Flowprint) on a Board: blocks with their pins, links drawn between them, the types of blocks of its graph to add (Palette) and its parameters, set from outside it. Value is the graph (an object or the text of its file); without one it is an empty graph of Type. change emits the graph after each action, select {Block, Link} (their ids, or null), problems what Check finds (each block it names is marked wrong, with its message as its title). Errors are the ones its owner found as it used the graph ([{Block, Line, Message}]: the errors of a shader made of it, as a Scene tells them in its event shader): marked wrong the same way. A drag of the head of a block moves it; a drag from a pin to another draws a link (an input takes one link of values, an output of flow goes one way: a new link takes the place of the old one); a drag from an input with a link, let go on no pin, takes the link away. A press on a link selects it; Delete removes the block or the link selected. The properties of a block are edited in it. ReadOnly shows the graph alone: blocks still move, nothing else changes. EditCheck (action, target), false for what the reader may not do: add {Type}, remove {Blocks, Link, Group, Content}, link {From, To}, unlink {Pin}, edit {Block, Property}, move {Blocks}, group {Blocks}, ungroup {Group}, rename {Group}, comment {Target}, paste {}, parameter {Change, Index, Field}; a refusal is told in denied {Action, ...its target}. Methods: Graph(), Write() (the text of its file), Add(type, x, y), Remove(id), Select(id), Selected(), Check(), Compile(options), Arrange() (the blocks in columns, each after what it reads; a graph whose blocks all stand at 0, 0 is arranged when shown) and Fit().

Many blocks are chosen at once: Shift or Ctrl and a press adds one or takes it away, Shift and a drag on an empty place frames them, Ctrl+A chooses all (SelectMany(ids), Chosen()); a drag of the head of one moves all that are chosen, Delete removes them. Ctrl+Z and Ctrl+Y (Ctrl+Shift+Z) undo and redo every change (Undo(), Redo()); Ctrl+C, Ctrl+V and Ctrl+D copy, paste and duplicate the chosen blocks with the links between them (Copy(), Paste()). Groups (the key groups of the graph: [{id, title, color, members (the ids of blocks and of groups), comment}]): a frame round its members with a title, nested in another as a member of it. Ctrl+G groups what is chosen (Group(ids, title)), a drag of the title moves the frame with all in it, a press on it chooses the group: Delete takes the frame away and leaves its members, Shift+Delete takes them too (RemoveGroup(id, content)), Ctrl+Shift+G does the same as Delete (Ungroup(id)); a double press on its title renames it. Comments (comment of blocks, links and groups, in Markdown) are shown as Comments says: caption (a line in a small muted text under a block, in a frame under its title, by the middle of a link), icon (a mark with the text as its title) or hidden. A double press on the head of a block or on a comment edits it (Comment(id, text) from code). select tells {Block, Link, Group, Blocks}.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Type` | `'flow'` |
| `Palette` | `true` |
| `ReadOnly` | `false` |
| `EditCheck` | `null` |
| `Errors` | `null` |
| `Comments` | `'caption'` |
| `Label` | `''` |

## Events

- `problems`: What is wrong with the graph: [{Block, Pin, Link, Message}].
- `denied`: EditCheck refused what the reader did: {Action, ...its target}.
- `select`: The selection changed: {Block, Link, Group} (their ids or null) and Blocks, all the blocks chosen.
- `change`: The graph changed: the graph.

## Methods

- `Graph()`
- `Write()`
- `Add(type, x, y)`
- `Remove(id)`
- `Select(id)`
- `SelectMany(ids)`
- `Selected()`
- `Chosen()`
- `Undo()`
- `Redo()`
- `Copy()`
- `Paste()`
- `Group(ids, title)`
- `Ungroup(id)`
- `RemoveGroup(id, content)`
- `Comment(id, text)`
- `Check()`
- `Compile(options)`
- `Fit()`
- `Arrange()`

## Tests

- [burns an effect of a Blueprint, its parameters the values of its layers, one graph for many effects](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L147) — `tests/regression/library-effect-blueprints.test.js`
- [burns nothing of a Blueprint that cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-effect-blueprints.test.js#L190) — `tests/regression/library-effect-blueprints.test.js`
- [draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L73) — `tests/regression/library-material-blueprints.test.js`
- [draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L199) — `tests/regression/library-material-blueprints.test.js`
- [draws a material as it is when its Blueprint cannot be made, and tells it once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L264) — `tests/regression/library-material-blueprints.test.js`
- [shows the parameters of the Blueprint of an effect, sets them on it, and edits its graph under the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L241) — `tests/regression/library-scene-editor.test.js`
- [tells a wind, a ground and a pass of its own that do not compile, draws the ones of the library, and goes on](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-shader-errors.test.js#L26) — `tests/regression/library-shader-errors.test.js`
- [marks on a block of a Blueprint the errors its owner gives it, with their lines](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-shader-errors.test.js#L126) — `tests/regression/library-shader-errors.test.js`
- [shows the blocks where they stand with their pins, the links between the pins, and the file it keeps](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L79) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`
- [draws a link by a drag from a pin to another, takes the place of the one there, and takes one away let go on nothing](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L115) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`
- [fits all of its blocks into the view, not the corner of its canvas (regression: it fitted a canvas 1 pixel large)](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L158) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`
- [moves a block by its head, and the links follow it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Blueprint/Blueprint.test.js#L188) — `libraries/ElemenxUI/components/Blueprint/Blueprint.test.js`

+10 more in the same files
