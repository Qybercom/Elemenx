<!-- generated -->
# ModelBlueprints

ModelBlueprints: models made of graphs of Blueprints, declared in $Provides (Blueprints makes it when it meets such a graph or block). A graph of the kind model ends at Model: what it gives is a recipe of data of SceneModels, {Parts, Pieces}, which Models assembles into its pieces as it does any recipe of data; a recipe with Graph is made of one (SceneModels.Define(name, {Graph, Parameters, Type, Size...}).

Parts are lists of parts {Shape (box, cylinder, ball, blob, wedge, lathe), At, Size, Turn (degrees round y, then x, then z), Color, Piece, Top, Segments, Rough, Points}, in the units of the model (1 tall). Its blocks take them in and give them out, so a function graph (a generator of the resources, called by Call, Repeat or Map) may give a window, a floor or a branch, and Join puts the lists together:

- Box, Cylinder (Radius, Top: the part of it at its top, Height), Ball, Blob (Rough), Wedge and Lathe (Points [[r, y]...]): one part each, of its inputs (At, Size, Turn, Color).
- Tube: a path of points [[x, y, z]...] made a tube, Radius at its start, Tip (its part of it at its end), a ball at each joint so it bends without gaps: a branch, a pipe, a rail.
- Join (Count inputs: lists, or lists of lists, as a Repeat gives, all made one list), Move (By), Spin (Degrees round y, round Around), Grow (Factor: places and sizes), Mirrored (the parts and their copies on the other side of X), Paint (Color), Piece (the parts become of the piece ID), Instances (the parts again at each of Points).
- Pivot: a piece declared {ID, Parent, Pivot, Team}: what moves, round what, under what; a list of them.
- Model: the end, its Parts and its Pieces.
- Recipe(graph, parameters, inputs) runs a graph of the kind model (an object, its JSON, or the name of one of the resources): {Parts, Pieces}; inputs reach its Input blocks (Seed, Variant: what Models gives it). It runs its code: Compiled(graph) makes it once JavaScript (Elemenx.Compilers: blueprint, ir, js; each block its IR, the parts and their changes functions of the IR), the very parts of the graph run, many times faster; a graph of no code runs as it is.

The same functions run in Node: they read no page.

## Methods

- `Recipe(graph, parameters, inputs)`
- `Compiled(graph)`

## Tests

- [makes every class of the graph of a building, its details a piece of their own, each where its class has it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L194) — `tests/regression/buildings.test.js`
- [makes the graph of a building code: the very parts of the graph run, for every class and its variants, faster](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L248) — `tests/regression/buildings.test.js`
- [draws the parts of a material of a model of shapes by their pattern, each material and color a piece of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L658) — `tests/regression/library-material-blueprints.test.js`
- [gives the parts of its blocks: floors a function makes, a rail as a tube, a mirror, its pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L68) — `tests/regression/model-blueprints.test.js`
- [makes a graph of every block of models code, the very parts and pieces of its run](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L129) — `tests/regression/model-blueprints.test.js`
