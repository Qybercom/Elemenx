<!-- generated -->
# SceneAxes

Три оси вида: как мир стоит к глазу. Yaw и Pitch — поворот вида, как в Scene: при yaw 0 глаз смотрит со стороны Z, при pitch больше 0 сверху. X красная, Y зелёная, Z синяя, у каждой точка на другом конце; ближний к глазу конец лежит поверх остальных. Нажатие на конец сообщает о нём: axis ({Axis, Sign}). Labels пишет буквы осей, Size — сторона в пикселях.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Yaw` | `0` |
| `Pitch` | `0` |
| `Size` | `72` |
| `Labels` | `true` |
| `Label` | `'Axes'` |

## События

- `axis`

## Тесты

- [Axes draws each end where the view has it, the nearest over the others](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3029) — `tests/regression/library-scene.test.js`
