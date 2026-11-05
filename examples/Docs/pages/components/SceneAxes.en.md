<!-- generated -->
# SceneAxes

The three axes of a view: how a world stands to the eye. Yaw and Pitch are the turn of the view as a Scene has them: the eye looks from Z at a yaw of 0 and from above at a pitch over 0. X is red, Y green, Z blue, each with a dot for its other end; the end nearest the eye lies over the others. A press on one tells it: axis ({Axis, Sign}). Labels writes their letters, Size is its side in pixels.

## Properties

| Property | Default |
| --- | --- |
| `Yaw` | `0` |
| `Pitch` | `0` |
| `Size` | `72` |
| `Labels` | `true` |
| `Label` | `'Axes'` |

## Events

- `axis`: An end of an axis was pressed: {Axis, Sign}.

## Tests

- [Axes draws each end where the view has it, the nearest over the others](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3036) — `tests/regression/library-scene.test.js`
