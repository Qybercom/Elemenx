<!-- generated -->
# SceneEditor

An editor of the scene of a game (a Scene) as Unreal edits a level: the objects of the scene in a tree, the kinds to add, the view with a gizmo, the fields of the selected object, the parameters of its Blueprint (an effect graph or a material graph of the Blueprints Service: the values a level gives one graph) and the graph itself under the view. Under the view too, as tabs: the relief of a ground (Relief, a generator graph; From the library starts it as the ground is) and the rule of a Scatter (Graph); the inspector tells what the lands by climate of a ground (Biomes) leave bare (SceneBiomes.Check). Value is its document {Version, Scene (the recipe of Scene.Save), Name}; change emits it after each action, select {ID}, play {Playing}. A document with no Scene starts as a ground under a sun. Kinds lists the kinds to add (by default those of objects that stand on a ground). The view (as Unreal): the right button held looks round, with W A S D going and Q E going down and up (Shift faster); Alt with the left button turns round what it looks at; the middle button moves it aside; the wheel comes nearer. A press selects (any object, not only units); W, E and R are the gizmo to move, turn and scale, Q selects; F looks at the selected object, End sets it on the ground, Delete removes it, Ctrl+D copies it, Ctrl+Z and Ctrl+Y undo and redo. The gizmo moves along an axis (the red X and the blue Z over the ground, the green one up: its Lift) or over the ground (its middle square), turns round the up axis (its Facing) and scales (its Size); Snap keeps to steps of SnapMove metres, SnapTurn degrees and SnapScale. Play runs the scene as it is (its time, its hero, if one object has Hero); Stop brings back what it was before. Save() keeps the document in localStorage under Storage (Restore() reads it back), Export() gives its JSON text and Import(text) reads one; Load(document), Document(), Select(id), Selected, Add(kind, props), Remove(id), Undo(), Redo(), Play(), Stop() and Scene() (the Scene) are its methods.

Space: a document of Setting space (the prop, for a new one) starts as a star with a planet, and a scene with no ground is edited as a star system. SpaceKinds are the kinds to add there, each round the selected body or the one that fits (a planet round the star, a moon round a planet, a station round a body), on an orbit of its own farther out. Moving a body moves it on its orbit: the middle square carries it in the plane of its parent (its Distance and Anomaly, Scene.OrbitAt), the green axis tilts its orbit (Inclination); the ring turns its axis (Tilt), scaling changes its Radius. Time sets the day the system is drawn at.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Setting` | `'ground'` |
| `Kinds` | `['unit', 'effect', 'glass', 'mirror', 'camera', 'screen', 'tree', 'rock', 'house']` |
| `SpaceKinds` | `['star', 'planet', 'moon', 'belt', 'ring', 'station', 'outpost', 'craft', 'fleet']` |
| `Storage` | `'elemenx-scene-editor'` |
| `SnapMove` | `0.5` |
| `SnapTurn` | `15` |
| `SnapScale` | `0.1` |
| `Label` | `''` |
| `Snap` | `true` |
| `Selected` | `''` |
| `Playing` | `false` |
| `Version` | `0` |

## Events

- `change`: The document changed: {Version, Name, Scene}.
- `select`: The selection changed: {ID}.
- `play`: Play or Stop: {Playing}.

## Methods

- `Scene()`
- `Document()`
- `Load(document)`
- `Undo()`
- `Redo()`
- `Save()`
- `Restore()`
- `Export()`
- `Import(text)`
- `Select(id)`
- `Add(kind, props)`
- `Remove(id)`
- `Play()`
- `Stop()`

## Tests

- [adds an object where the view looks, shows it in the tree, selects it by a press and emits the document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L74) — `tests/regression/library-scene-editor.test.js`
- [offers the models it is given that Models has, and places each as the kind its Type fits, as large as it is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L108) — `tests/regression/library-scene-editor.test.js`
- [moves along an axis of the gizmo, turns, scales, and undoes and redoes each drag as one action](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L141) — `tests/regression/library-scene-editor.test.js`
- [looks round from the eye with the right button, and flies with W while it is held](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L209) — `tests/regression/library-scene-editor.test.js`
- [shows the parameters of the Blueprint of an effect, sets them on it, and edits its graph under the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L241) — `tests/regression/library-scene-editor.test.js`
- [sketches over the ground: strokes, lines, areas, circles and stamps into layers, their fields edited, undone as one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L274) — `tests/regression/library-scene-editor.test.js`
- [draws a road point by point, bends a part into an arc, adds and takes away points, rounds a corner, undone as one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L425) — `tests/regression/library-scene-editor.test.js`
- [keeps the document in the browser and in a JSON file, and Play runs it then Stop brings it back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L565) — `tests/regression/library-scene-editor.test.js`
- [edits the World of a ground under the view: its steps, the relief of its step Relief from the library, and what its lands by climate leave bare](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L621) — `tests/regression/library-scene-editor.test.js`
- [makes the objects of the World of a ground in the scene, marked in the tree, not saved: they come again of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L734) — `tests/regression/library-scene-editor.test.js`
- [makes a new document anew in the scene: a star system in place of the ground, a ground in place of the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L775) — `tests/regression/library-scene-editor.test.js`
- [starts as a star and a planet, offers the kinds of space and no sketch, and keeps its setting in the document](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/SceneEditor/SceneEditor.test.js#L76) — `libraries/ElemenxGraphics/components/SceneEditor/SceneEditor.test.js`

+4 more in the same files
