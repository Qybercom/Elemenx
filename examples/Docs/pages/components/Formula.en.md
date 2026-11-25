<!-- generated -->
# Formula

A formula written as in LaTeX (the part the Formulas Service reads: fractions, roots, powers and indices, sums and integrals with their limits, Greek letters, matrices...), drawn by the browser as MathML. Value is the formula; Display puts it on a line of its own, centered and larger, instead of in the line of the text; Label is what a screen reader says of it (by default the formula as it is written).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Display` | `false` |
| `Label` | `''` |

## Example

```example
<Formula Display="true" Value="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
<Formula Display="true" Value="\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}" />
<p class="elemenx-text">Inline: the area is <Formula Value="\pi r^2" />, and <Formula Value="e^{i\pi} + 1 = 0" />.</p>
<Formula Display="true" Value="A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}" />
```

## Tests

- [bakes a body of noise by its graph: its Input blocks the uniforms of the bake, Formula and Ridge in it, a sea where the land is under 0](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js#L137) — `libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js`
- [smooths a number between two in a formula of its run, its Code and its numbers; jitters cells as Noise does](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/bark-graphs.test.js#L79) — `tests/regression/bark-graphs.test.js`
- [reads a formula: its names its inputs, the same of the graph run and of its code, vectors part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L170) — `tests/regression/blueprints-ir.test.js`
- [turns by the own Math in the run of a graph, in its Code and in its IR, to the bit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L201) — `tests/regression/blueprints-ir.test.js`
- [computes what only the Value of When needs inside its if, a When in a When, the same everywhere](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L315) — `tests/regression/blueprints-ir.test.js`
- [takes the octaves of a noise as an input, the same as a noise of that many octaves, in js, wasm and its run](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L378) — `tests/regression/blueprints-ir.test.js`
- [runs a Reduce over a list of its parameters once for each item, the same of its Code, its js and its wasm](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L415) — `tests/regression/blueprints-ir.test.js`
- [makes a generator of formulas JavaScript, the same values as its interpreter, lists part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L831) — `tests/regression/blueprints.test.js`
- [reads a minus before a name, a bracket or a call, and the parameters a run is not given as those of the graph](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L862) — `tests/regression/blueprints.test.js`
- [runs a tree of behaviour: a utility of scores choosing what to do, kept a while, the tasks of the application, the one left told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L1090) — `tests/regression/blueprints.test.js`
- [makes its ground of the graphs of its Terrain (Graphs, as a world gives them), and of the library's again with none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L180) — `tests/regression/terrain-sketch.test.js`
- [computes what a formula reads once in a branch only when that branch is taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L214) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`

+8 more in the same files
