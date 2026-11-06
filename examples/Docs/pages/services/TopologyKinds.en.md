<!-- generated -->
# TopologyKinds

The kinds of the nodes of a Topology seen in 3D (View isometric) and the shapes they are drawn as: what a node is decides how it looks and how it shows what it carries.

- Define(kind, {Shape, Color, Size, Icon, Load, Active}) names a kind: Shape (a shape below), Color (#rrggbb, or a token of the theme: accent, info, success, warning, danger, muted), Size (1: a cell), Icon (on its top), Load how its load (0 to 1) shows: fill (a level inside it, as a store), pulse (its glow beats, faster and brighter with it), height (it grows with it), ring (an arc round its foot), none, or a function (context, node) that draws it (context of Shape below); Active how it shows it is active: glow (round its foot, by default) or a function. Kind(kind) gives it, made whole (an unknown kind is a server); Kinds() the names.
- Shape(name, {Draw (context)}) names a shape. context: {Canvas (2D), Project (function ([x, y, z]): [x, y] of the screen; y up, a cell of the floor 1), Prism (function (base [[x, z]...], bottom, top, color, alpha): a prism of its faces drawn, lit as the view sees it), Disc (function (x, z, y, radius, color, alpha)), Center [x, z], Size, Height, Color [r, g, b], Alpha}. Shapes() the names. Built in: cube, cylinder, hex, stack, pyramid, sphere, cloud.

A kind or a shape a Service declares ($Provides: {TopologyKinds: {Kinds: [...], Shapes: [...]}}) is made when it is asked for.

## Methods

- `Define(kind, settings)`
- `Kind(kind)`
- `Kinds()`
- `Shape(name, shape)`
- `Shapes()`

## Tests

- [knows the kinds and shapes built in; an unknown kind is drawn as a server](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L610) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
- [draws a kind defined with a shape of its own, and its load by a function](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js#L625) — `libraries/ElemenxUI/components/TopologyIso/TopologyIso.test.js`
