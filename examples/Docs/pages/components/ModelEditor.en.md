<!-- generated -->
# ModelEditor

An editor of a model of the Models Service made of shapes, as a recipe of data (SceneModels.Assemble): its parts in a tree by the piece each belongs to (the pieces a rig moves by their names: body, head, arm-l...), the shapes to add (box, wedge, cylinder, ball, blob, lathe), the model in a view with a gizmo, the fields of the selected part (its piece, its tags, its place, size, turn and color, a mirror on the other side of X, the chance a variant has it and how much a variant varies it) or, with none, of the model (Group, Type, Size, Speed, Variants, Rig, Smooth, Matte) and of the pieces (Parent, Pivot, Team). Variant shows one variant of its seed (0: the parts as they are). Value is its document {Version, Name, Recipe}; change emits it after each action, select {ID}. The view: the right button turns round the model, the middle one moves it aside, the wheel comes nearer; a press selects the part under it; W, E and R are the gizmo to move, turn (round the up axis) and scale, Q selects; F looks at the selected part, Delete removes it, Ctrl+D copies it, Ctrl+Z and Ctrl+Y undo and redo. Snap keeps to steps of SnapMove, SnapTurn degrees and SnapScale. Save() keeps the document in localStorage under Storage (Restore() reads it back), Export() gives its JSON text and Import(text) reads one; Model(format, variant) gives the model as a file of ModelFormats (glb, gltf, fbx, obj) and Download(format) saves it; Define(name) gives the recipe to the Models Service under a name, for a game. Generator (a function (description, callback (error, recipe))) is where a generator of models is plugged in, a neural network or an algorithm: its field asks it for a recipe, which takes the place of the one edited (Undo brings it back). Load(document), Document(), Recipe(), Select(id), Add(shape, props), Remove(id), Undo(), Redo(), Generate(description, callback) and Scene() (the Scene) are its methods.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Variant` | `0` |
| `Generator` | `null` |
| `Storage` | `'elemenx-model-editor'` |
| `SnapMove` | `0.05` |
| `SnapTurn` | `15` |
| `SnapScale` | `0.05` |
| `Label` | `''` |
| `Snap` | `true` |
| `Version` | `0` |
| `Description` | `''` |

## Events

- `change`: The document changed: {Version, Name, Recipe}.
- `select`: The selected part changed: {ID}.

## Methods

- `Scene()`
- `Document()`
- `Recipe()`
- `Load(document)`
- `Undo()`
- `Redo()`
- `Save()`
- `Restore()`
- `Export()`
- `Import(text)`
- `Define(name)`
- `Model(format, variant)`
- `Download(format)`
- `Generate(description, callback)`
- `Select(id)`
- `Add(shape, props)`
- `Remove(id)`

## Tests

- [starts as a block, adds a part over the selected one in its piece, selects a part by a press on it, and emits the document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L89) — `tests/regression/library-object-editor.test.js`
- [moves and scales a part by the gizmo along its axes, changes it by its fields, and undoes it all](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L135) — `tests/regression/library-object-editor.test.js`
- [gives its model to Models under a name, and as files of every format that read back with its pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L216) — `tests/regression/library-object-editor.test.js`
- [keeps its document when it is given the same again without a Seed: nothing loaded anew, the selection kept](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L242) — `tests/regression/library-object-editor.test.js`
- [takes a recipe of the generator plugged in for a description, which Undo takes back; and shows the variant it is told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L260) — `tests/regression/library-object-editor.test.js`
