<!-- generated -->
# ModelRoles

ModelRoles: what the parts of a model are, by name: its wheels, its steering wheel and pedals, its doors, its lamps, the door of a house, a lever, a hatch, a fan. A role is set on parts of a model picked in an editor (ModelEditor, its tab Roles): pieces of it (a node, a mesh, a material of a file) and, of a piece, the triangles a brush painted. A Scene moves them as their role says, on any object that has the model, and lights its lamps.

- A role is {ID, Kind, Name, Parts: [{Piece (the ID of a piece of the model), Vertices ([[from, to]...]: of the piece, only the triangles all of whose corners are in them; none: all of it)}], Both (it stands on both sides of the model, mirrored on x: a pair of doors), Motion: {Type (hinge, slide, spin, glow or none), Pivot ([x, y, z] of the model, the hinge), Axis, Angle (degrees at 1), Aside and AsideAngle (a second axis: a gear lever), Way and Reach (a slide), Speed (turns a second at 1: a spin)}, Drive (what a driver moves: steer, gas, brake, hand, gear, sequential, paddle, indicator, wipers), Sign, Pace (how fast it comes, a second), Open (where it stands, 0 to 1), Follow (the ID of the role it is carried by: a paddle on the steering wheel, the glass of a door), Light ({Kind (head, rear, brake, reverse, indicator; glow: lit as far as it is set), Color, Glow, Power, Radius, Spot, Aim, At}), Corner (of a wheel: FL, FR, RL, RR) and Held (a wheel's: what stops it, which steers and rides with it but does not spin)}.
- Kinds() lists the kinds of roles by group, each with what a new role of it starts as; Kind(id) is one: {ID, Group, Icon, Motion, Drive, Light, Corner, Held, Pace}. Make(kind, props) is a new role of a kind.
- The roles of a model: Get(model) (those kept for it, else those of its recipe in SceneModels, Roles), Set(model, roles), Remove(model), Models() (the names of those kept); they are kept in the storage of the browser (StorageKey). Export() is all of them as the text of a file, Import(text) reads one in (over what is kept, model by model).
- Rig(roles) is what a Scene takes of them, as the settings of a vehicle name them: {Openings (what moves: hinge, slide, spin), Lamps (what glows), Wheels ([{Parts, Corner, Held}])}; each opening named role:<ID>.
- Ranges(indices) packs a list of vertices into ranges, Within(ranges, index) tells whether one is in them.
- Version() changes with every change; OnChange(listener) and OffChange(listener).

The same functions run in Node: they read no page (with no storage nothing is kept).

## Methods

- `Version()`
- `Kinds()`
- `Kind(id)`
- `Make(kind, props)`
- `Get(model)`
- `Set(model, roles)`
- `Remove(model)`
- `Models()`
- `Export()`
- `Import(text)`
- `Rig(roles)`
- `Ranges(indices)`
- `Within(ranges, index)`
- `OnChange(listener)`
- `OffChange(listener)`

## Tests

- [edits the roles of another model, kept by ModelRoles, and undoes them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/ModelEditor/ModelEditor.test.js#L185) — `libraries/ElemenxGraphics/components/ModelEditor/ModelEditor.test.js`
- [lists its kinds by group and makes a role of a kind, what the kind starts as under what is given](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L70) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [keeps the roles of a model in the storage of the browser, writes them into a file and reads them back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L83) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [gives a Scene its rig: what moves, what glows and the wheels, each of its parts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L114) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [packs the vertices a brush painted into ranges and finds one in them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L132) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [cuts what a role names out of a model of a file: a whole piece, or only the painted triangles of one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L142) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [moves the door of a house as its role says: Part(id, role) sets it, it comes by degrees, the scene tells it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L159) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [lights a lamp of a role as far as it is set, turns a fan while it is on, and remakes the model when the roles change](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L215) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
