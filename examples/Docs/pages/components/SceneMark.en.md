<!-- generated -->
# SceneMark

SceneMark: what it holds (any components: a card, a bar, a chart of Chart or Sparkline, a Meter) over a place of the Scene it is declared in, in its slot hud: <Scene> <SceneMark slot="hud" For="ship" Line="true"> <Card>...</Card> </SceneMark> </Scene>. Each frame the scene lays it out with its other marks (SceneMarks, the names of the objects among them): For an object (Part: a socket of its model, Up: its sizes over its middle) or Point [x, y, z] of the world, Offset [x, y, z], Shift [x, y] pixels, Align (bottom, top, center); Line (true, auto, false), Occlude, Edge (at the edge of the view with an arrow when its place is off it), Declutter, Cluster and ClusterRadius, Near and Far (faded out by how far it is, in metres), Priority. Key names it among the marks (its own one else).

## Properties

| Property | Default |
| --- | --- |
| `Key` | `''` |
| `For` | `''` |
| `Part` | `''` |
| `Point` | `null` |
| `Up` | `1.15` |
| `Offset` | `null` |
| `Shift` | `null` |
| `Align` | `'bottom'` |
| `Line` | `'auto'` |
| `Occlude` | `''` |
| `Edge` | `false` |
| `Declutter` | `true` |
| `Cluster` | `''` |
| `ClusterRadius` | `36` |
| `Near` | `''` |
| `Far` | `0` |
| `Priority` | `0` |

## Slots

default

## Tests

- [puts an element over its point, moves another off it with a line, and the names of the objects are marks too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L89) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [follows its object as it goes round its star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L136) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [hides one behind a body, one too far; one behind the eye shows at the edge with an arrow when it may](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L166) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [shows marks of a cluster near each other as one with a badge +N, a press on it told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L200) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
- [lays out what a SceneMark holds over its object, as its props say](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js#L228) — `libraries/ElemenxGraphics/traits/SceneMarks/SceneMarks.test.js`
