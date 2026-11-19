<!-- generated -->
# Formula

Формула, записанная как в LaTeX (то, что читает сервис Formulas: дроби, корни, степени и индексы, суммы и интегралы с пределами, греческие буквы, матрицы...), нарисованная браузером как MathML. Value — формула; Display ставит её на отдельную строку, по центру и крупнее, вместо строки текста; Label — то, что о ней скажет экранная читалка (по умолчанию — сама запись формулы).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Display` | `false` |
| `Label` | `''` |

## Пример

```example
<Formula Display="true" Value="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
<Formula Display="true" Value="\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}" />
<p class="elemenx-text">Inline: the area is <Formula Value="\pi r^2" />, and <Formula Value="e^{i\pi} + 1 = 0" />.</p>
<Formula Display="true" Value="A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}" />
```

## Тесты

- [bakes a body of noise by its graph: its Input blocks the uniforms of the bake, Formula and Ridge in it, a sea where the land is under 0](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js#L136) — `libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js`
- [reads a formula: its names its inputs, the same of the graph run and of its code, vectors part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L170) — `tests/regression/blueprints-ir.test.js`
- [turns by the own Math in the run of a graph, in its Code and in its IR, to the bit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L201) — `tests/regression/blueprints-ir.test.js`
- [computes what only the Value of When needs inside its if, a When in a When, the same everywhere](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L315) — `tests/regression/blueprints-ir.test.js`
- [takes the octaves of a noise as an input, the same as a noise of that many octaves, in js, wasm and its run](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L378) — `tests/regression/blueprints-ir.test.js`
- [makes a generator of formulas JavaScript, the same values as its interpreter, lists part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L831) — `tests/regression/blueprints.test.js`
- [makes its ground of the graphs of its Terrain (Graphs, as a world gives them), and of the library's again with none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L180) — `tests/regression/terrain-sketch.test.js`
- [computes what a formula reads once in a branch only when that branch is taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L87) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [opens the graph of a model of the library, shows each change of it on the model, gives it to the library and takes it back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/ModelEditor/ModelEditor.test.js#L369) — `libraries/ElemenxGraphics/components/ModelEditor/ModelEditor.test.js`
- [makes its land and its relief by the graphs of the library, or by a LandGraph and a ReliefGraph of its own, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L785) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [gives a ground of a place of it its graphs of its own (Site): their code made in the page, the same squares in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L838) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [makes its winds and its climate by the graphs of the library, or by a WindGraph, a RoughGraph and a ClimateGraph of its own, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L867) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`

+4 ещё в тех же файлах
