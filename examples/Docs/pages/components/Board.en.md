<!-- generated -->
# Board

An infinite canvas, as the one of Figma: its content (the default slot) lives in coordinates of its own (the world, in pixels at zoom 1: place the elements in it with position absolute, left and top) and the board shows a part of it, moved and scaled. The wheel moves it (a trackpad with two fingers too), Ctrl with the wheel or a pinch zooms at the pointer, a drag with the middle button, with Space held or on an empty place (Drag) moves it; when it has the focus, the arrows move it, + and - zoom, 0 gives zoom 1 and Shift+1 fits the content. X and Y are the point of the world at the top left corner of the view, Zoom its scale (MinZoom to MaxZoom); Grid dots, lines or none, of GridSize pixels of the world. Controls shows the buttons of the zoom and its percent. The view event tells {X, Y, Zoom} as it changes. Methods: ZoomTo(zoom, point), Pan(dx, dy), FitContent(margin), CenterOn(x, y), ToWorld(clientX, clientY), ToScreen(x, y).

## Properties

| Property | Default |
| --- | --- |
| `X` | `0` |
| `Y` | `0` |
| `Zoom` | `1` |
| `MinZoom` | `0.1` |
| `MaxZoom` | `8` |
| `Grid` | `'dots'` |
| `GridSize` | `24` |
| `Drag` | `true` |
| `Controls` | `true` |

## Events

`view`

## Slots

default

## Methods

- `ToWorld(clientX, clientY)`
- `ToScreen(x, y)`
- `ZoomTo(zoom, point)`
- `Pan(dx, dy)`
- `CenterOn(x, y)`
- `FitContent(margin)`
