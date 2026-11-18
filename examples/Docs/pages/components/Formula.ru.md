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

- [reads a formula: its names its inputs, the same of the graph run and of its code, vectors part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L170) — `tests/regression/blueprints-ir.test.js`
- [turns by the own Math in the run of a graph, in its Code and in its IR, to the bit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L201) — `tests/regression/blueprints-ir.test.js`
- [makes a generator of formulas JavaScript, the same values as its interpreter, lists part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L831) — `tests/regression/blueprints.test.js`
- [computes what a formula reads once in a branch only when that branch is taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L87) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`
- [makes what is finer than the scale of its rules by the rule of the place: of its land, a painted region over it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L1450) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [raises the ground of a sketch by the graph of the type of each item, and by another graph of that type made for it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L1383) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
- [cuts a volume by the graph of each carve, and by another graph of a carve made for it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L1417) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
