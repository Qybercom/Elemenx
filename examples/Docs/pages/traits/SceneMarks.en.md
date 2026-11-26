<!-- generated -->
# SceneMarks

SceneMarks: elements of the page over places of the scene, laid out each frame, the names of the objects (Labels) among them. Mark(key, options) puts one (again: changes it; options null: Unmark), Unmark(key) takes it away, MarksOnScreen() tells where each is: [{Key, X, Y, Shown, Why (off, behind, hidden, far, crowded, clustered, filtered), Edge, Moved, Cluster, Count, Opacity}]. options:

- Element: the element put there (any component's: a card, a bar, a chart); it stays where it is in the page, moved by a transform from the top left corner of the scene (the slot hud of a Scene is such a place, SceneMark puts it so);
- where: Object (an ID; its middle, Up of its sizes over it, a socket of its model by Part, as Socket gives it), Point ([x, y, z] of the world) or At (a function giving such a point, or null: not shown); Offset [x, y, z] added, Shift [x, y] pixels; or Screen (a function giving [x, y] on the scene itself, null: not shown; a view of its own, as the map of a galaxy is, Distance0 how far it is); Align bottom (its foot on the point, by default), top (its head), center, left or right (its middle of that side);
- Line: true draws a line from the point to it always, auto (by default) when it was moved off its point to make room;
- Occlude (true for an Object): not shown behind a body (a sphere of Radius of another object) or the ground (Visible);
- Edge: shown at the edge of the view when the point is off it or behind, with an arrow toward it (data-edge on it);
- Declutter (true): moved up or down, as little as it can, off the marks laid out before it (Priority, larger first, then the nearer); with no room it is not shown, or joins its Cluster;
- Cluster: a name: marks of it whose points are within ClusterRadius (36) pixels of each other show as the first, a badge +N beside it (pressed: the scene emits markcluster {Cluster, Keys}, the view goes to them);
- Near and Far: metres: fully seen nearer than Near, gone at Far (faded between); Shown(mark): false hides it (a game's own rule); Priority (0).

The point of each frame is of the camera of that frame; the bodies that hide one are asked 5 times a second.

## Methods

- `Mark(key, options)`
- `Unmark(key)`
- `MarksOnScreen()`

## Tests

- [puts an element over its point, moves another off it with a line, and the names of the objects are marks too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L89) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [follows its object as it goes round its star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L136) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [hides one behind a body, one too far; one behind the eye shows at the edge with an arrow when it may](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L166) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [shows marks of a cluster near each other as one with a badge +N, a press on it told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L200) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [lays out what a SceneMark holds over its object, as its props say](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L228) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
