<!-- generated -->
# Topology

A graph shown, not edited: a network (hosts, routers, services) or what depends on what (modules, packages, tasks), its nodes as the blocks of a blueprint on a Board, laid out by itself (Layouts.Graph). Nodes [{ID, Label, Icon, Kind (a class of its own: kind-<Kind>), Status (ok, warning, error, off), Details ({name: value}: rows under its name)}], Links [{From, To, Label, Status, Kind}]; Layout auto (by the shape of the graph), layers, tree, star, circle, grid or force; Direction right or down; Center (the middle of a star, the root of a tree); Directed (true: arrows to where the links go; false, the cables of a network, auto lays it out in no layers). A press selects a node or a link (select {Node, Link}, their IDs or null) and lights what it is linked to; a double press or Enter on a node emits open {Node}; a node dragged by its head stays where it is let go (until the graph changes or Arrange). The arrows go from node to node, Escape lets the selection go. Methods: Arrange(layout) (laid out again, by another layout when it is given), Fit(), Select(id), Selected(), Places() ({ID: {X, Y, Width, Height}}).

## Properties

| Property | Default |
| --- | --- |
| `Nodes` | `[]` |
| `Links` | `[]` |
| `Layout` | `'auto'` |
| `Direction` | `'right'` |
| `Center` | `''` |
| `Directed` | `true` |
| `Label` | `''` |

## Events

- `open`: A node was opened (a double press or Enter): {Node}.
- `select`: The selection changed: {Node, Link}, their IDs or null.

## Methods

- `Arrange(layout)`
- `Select(id)`
- `Selected()`
- `Places()`
- `Fit()`

## Tests

- [draws each node as a block of its name, status, kind and details where its layout puts it, its links between their edges, and fits it all in the view](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Topology/Topology.test.js#L82) — `libraries/ElemenxUI/components/Topology/Topology.test.js`
- [selects a node by a press and lights it with its neighbours, a link with its ends, lets go on nothing; opens a node by a double press and Enter](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Topology/Topology.test.js#L129) — `libraries/ElemenxUI/components/Topology/Topology.test.js`
- [goes from node to node by the arrows, keeps a node where it is dragged by its head, and lays out again when the graph or its layout changes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/Topology/Topology.test.js#L170) — `libraries/ElemenxUI/components/Topology/Topology.test.js`
