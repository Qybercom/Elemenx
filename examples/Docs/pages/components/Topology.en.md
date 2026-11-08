<!-- generated -->
# Topology

A graph shown, not edited: a network (hosts, routers, services) or what depends on what (modules, packages, tasks), its nodes as the blocks of a blueprint on a Board, laid out by itself (Layouts.Graph). Nodes [{ID, Label, Icon, Kind (a class of its own: kind-<Kind>), Status (ok, warning, error, off), Details ({name: value}: rows under its name)}], Links [{From, To, Label, Status, Kind}]; Layout auto (by the shape of the graph), layers, tree, star, circle, grid or force; Direction right or down; Center (the middle of a star, the root of a tree); Directed (true: arrows to where the links go; false, the cables of a network, auto lays it out in no layers). A press selects a node or a link (select {Node, Link}, their IDs or null) and lights what it is linked to; a double press or Enter on a node emits open {Node}; a node dragged by its head stays where it is let go (until the graph changes or Arrange). The arrows go from node to node, Escape lets the selection go. Methods: Arrange(layout) (laid out again, by another layout when it is given), Fit(), Select(id), Selected(), Places() ({ID: {X, Y, Width, Height}}). View isometric shows the same graph in 3D (TopologyIso): its nodes as shapes of their kinds (TopologyKinds) on a floor of cells, turned (Angle) and tilted (Tilt), with Active, Load, Size, Shape, X and Y of the nodes, Load of the links, Groups ([{ID, Title, Color, Members, Collapsed, Comment}]) and Comments; its events move, toggle and view too, its methods Rotate(degrees), Update(id, changes), Toggle(group) and Picture() as well; Search, Legend, Minimap, ReadOnly and EditCheck, the events path and denied, the methods Find(text), Show(id), Path(from, to), Snapshot() and Restore(snapshot).

## Properties

| Property | Default |
| --- | --- |
| `Nodes` | `[]` |
| `Links` | `[]` |
| `Layout` | `'auto'` |
| `Direction` | `'right'` |
| `Center` | `''` |
| `Directed` | `true` |
| `View` | `'flat'` |
| `Groups` | `[]` |
| `Comments` | `'caption'` |
| `Angle` | `45` |
| `Tilt` | `35` |
| `Search` | `''` |
| `Legend` | `false` |
| `Minimap` | `false` |
| `ReadOnly` | `false` |
| `EditCheck` | `null` |
| `Label` | `''` |

## Events

- `open`: A node was opened (a double press or Enter): {Node}.
- `select`: The selection changed: {Node, Link}, their IDs or null (and Group in 3D).

## Methods

- `Rotate(degrees)`
- `Update(id, changes)`
- `Toggle(group)`
- `Picture()`
- `Find(text)`
- `Show(id)`
- `Path(from, to)`
- `Snapshot()`
- `Restore(snapshot)`
- `Arrange(layout)`
- `Select(id)`
- `Selected()`
- `Places()`
- `Fit()`

## Tests

- [reads a topology of nodes and links, their icons, statuses and details, and Markdown draws it by Topology](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L238) — `tests/regression/rich-plugins.test.js`
- [draws each node as a block of its name, status, kind and details where its layout puts it, its links between their edges, and fits it all in the view](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Topology/Topology.test.js#L82) — `libraries/ElemenxUI/components/Topology/Topology.test.js`
- [selects a node by a press and lights it with its neighbours, a link with its ends, lets go on nothing; opens a node by a double press and Enter](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Topology/Topology.test.js#L129) — `libraries/ElemenxUI/components/Topology/Topology.test.js`
- [goes from node to node by the arrows, keeps a node where it is dragged by its head, and lays out again when the graph or its layout changes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Topology/Topology.test.js#L170) — `libraries/ElemenxUI/components/Topology/Topology.test.js`
- [draws its nodes on the canvas and lists them for a screen reader, a button each](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L73) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [is the view of a Topology with View isometric](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L88) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [selects a node pressed, telling it in select](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L97) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [turns: Rotate moves the nodes on the screen, a quarter at a time, and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L119) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [moves a node dragged by whole cells and tells it in move](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L144) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [folds a group into one node of its members, its links its own, and unfolds it; nested groups fold with the outer one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L172) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [changes what a node carries with Update, laid out as it was](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L210) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [glows round the foot of an active node; an inactive one has no glow](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L232) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`

+3 more in the same files
