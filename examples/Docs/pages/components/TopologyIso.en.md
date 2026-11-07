<!-- generated -->
# TopologyIso

A Topology seen in 3D (the View isometric of Topology, or alone): its nodes as shapes standing on a floor of cells, seen from above at an angle that turns. Drawn on a canvas, so thousands of nodes stay fluid; a list of them, out of sight, is there for the keys and for screen readers.

Nodes [{ID, Label, Kind (of TopologyKinds: its shape, its color, its size, its icon and how it shows its load), Shape, Color, Size, Icon (over its kind), Status (ok, warning, error, off: the color of its pad), Active (a glow round its foot; without it the node is dimmed a little), Load (0 to 1, as its kind shows it), X and Y (its cell; else laid out), Comment (Markdown)}]; Links [{From, To, Label, Status, Kind (dashed: a dashed line), Load (0 to 1: how fast its dashes run, how thick and how warm it is), Comment}]; Groups [{ID, Title, Color, Members (IDs of nodes and groups), Collapsed (one node of them all), Comment}]: zones on the floor round their members, nested.

Angle (degrees round, 45) and Tilt (degrees down, 35) set the view; a drag with the right button (or Alt) turns it, Q and E turn it a quarter, the wheel zooms by the pointer, a drag of the floor moves it. A press selects a node, a link or a group (by its title) and lights what is linked to it; a node dragged goes to the cell it is let go on (move {Node, X, Y}), a group dragged by its title takes its members along; a double press (or Enter) opens a node (open {Node}) or folds and unfolds a group. Comments show as Comments says: caption (a muted line of Markdown under the name), icon (a mark, the text when the pointer is over it) or hidden. A group is laid out in one piece, its groups inside it, so its zone holds its own and no other.

Search lights the nodes whose name, ID, kind or comment has its text (Find(text) gives their IDs, Show(id) brings the view over one); Legend shows the kinds of the nodes, a press on one lights its nodes; Minimap shows the floor from above in a corner, the view a frame on it that a press or a drag there moves. Shift with a press on a node, one chosen, lights the shortest way between them (Path(from, to); path {From, To, Nodes, Links}); Escape lets it go. ReadOnly keeps all where it is; EditCheck (action, target), false for what may not be done: move {Node}, group {Group} (dragged by its title), toggle {Group}; a refusal is told in denied {Action, Node or Group}. Snapshot() keeps the view, the nodes dragged and the groups folded, Restore(snapshot) brings them back. Methods: Arrange(layout), Fit(), Select(id) (a node, link:<index> or group:<id>), Selected(), Places() ({ID: {X, Y}} in cells), Rotate(degrees), Update(id, changes) (what a node shows, as it changes, with no new layout; link:<index> for a link), Toggle(group), ToScreen(id) ({X, Y} of the page), Picture() (a PNG data URL), Find(text), Show(id), Path(from, to), Snapshot(), Restore(snapshot).

## Properties

| Property | Default |
| --- | --- |
| `Nodes` | `[]` |
| `Links` | `[]` |
| `Groups` | `[]` |
| `Angle` | `45` |
| `Tilt` | `35` |
| `Comments` | `'caption'` |
| `Search` | `''` |
| `Legend` | `false` |
| `Minimap` | `false` |
| `ReadOnly` | `false` |
| `EditCheck` | `null` |
| `Label` | `''` |

## Events

- `path`: The shortest way between two nodes was lit: {From, To, Nodes, Links} (Nodes empty: there is none).
- `denied`: ReadOnly or EditCheck refused what was done: {Action (move, group, toggle), Node or Group}.
- `move`: A node was dragged to a cell: {Node, X, Y}.
- `open`: A node was opened (a double press or Enter): {Node}.
- `view`: The view turned, tilted or zoomed: {Angle, Tilt, Zoom}.
- `select`: The selection changed: {Node, Link, Group}, their IDs or null.
- `toggle`: A group was folded or unfolded: {Group, Collapsed}.

## Methods

- `Arrange(layout)`
- `Find(text)`
- `Path(from, to)`
- `Show(id)`
- `Snapshot()`
- `Restore(snapshot)`
- `Select(id)`
- `Selected()`
- `Places()`
- `Rotate(degrees)`
- `Update(id, changes)`
- `Toggle(id)`
- `Fit()`
- `ToScreen(id)`
- `Picture()`

## Tests

- [draws its nodes on the canvas and lists them for a screen reader, a button each](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L73) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [is the view of a Topology with View isometric](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L85) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [selects a node pressed, telling it in select](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L94) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [turns: Rotate moves the nodes on the screen, a quarter at a time, and back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L116) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [moves a node dragged by whole cells and tells it in move](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L141) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [folds a group into one node of its members, its links its own, and unfolds it; nested groups fold with the outer one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L169) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [changes what a node carries with Update, laid out as it was](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L207) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [glows round the foot of an active node; an inactive one has no glow](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L229) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [fits what it shows once it has a size, when it was hidden at first](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L247) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [draws a thousand nodes in a hundred groups in a frame of the screen or so](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L264) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [lays out a group in one piece: the zones of two groups linked across hold none of the other](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L318) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [finds nodes by a text in their name, ID, kind or comment; Search lights them and dims the others; Show brings one in view](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L367) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`

+7 more in the same files
