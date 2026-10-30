<!-- generated -->
# Board

An infinite canvas, as the one of Figma: its content (the default slot) lives in coordinates of its own (the world, in pixels at zoom 1: place the elements in it with position absolute, left and top) and the board shows a part of it, moved and scaled. The wheel moves it (a trackpad with two fingers too; over an element of the content that scrolls that way, a list, it scrolls that element), Ctrl with the wheel or a pinch zooms at the pointer, a drag with the middle button, with Space held or on an empty place (Drag) moves it; when it has the focus, the arrows move it, + and - zoom, 0 gives zoom 1 and Shift+1 fits the content. X and Y are the point of the world at the top left corner of the view, Zoom its scale (MinZoom to MaxZoom); Grid dots, lines or none, of GridSize pixels of the world. Controls shows the buttons of the zoom and its percent. The view event tells {X, Y, Zoom} as it changes. Bounds keeps the view to a part of the world: none (anywhere, by default), content (the content with BoundsMargin pixels of the world around) or frame (the element of the content with data-frame="Frame", the first one without a Frame, BoundsMargin around it); a part smaller than the view stays in its middle, and the view follows the part as it changes. Methods: ZoomTo(zoom, point), Pan(dx, dy), FitContent(margin) (the frame alone with Bounds frame), CenterOn(x, y), ToWorld(clientX, clientY), ToScreen(x, y), Limits() (the part of the world the view is kept to, {Left, Top, Right, Bottom}, or null).

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
| `Bounds` | `'none'` |
| `BoundsMargin` | `40` |
| `Frame` | `''` |

## Events

- `view`: The view moved or zoomed: {X, Y, Zoom}.

## Slots

default

## Methods

- `Limits()`
- `ToWorld(clientX, clientY)`
- `ToScreen(x, y)`
- `ZoomTo(zoom, point)`
- `Pan(dx, dy)`
- `CenterOn(x, y)`
- `FitContent(margin)`

## Example

```example
<div style="height: 320px; border: 1px solid var(--elemenx-border); border-radius: 8px; overflow: hidden;">
	<Board Grid="dots" Controls="true" (view)="Viewed">
		<div class="elemenx-card" style="position: absolute; left: 40px; top: 40px; width: 180px; padding: 12px;">Drag the empty place to move</div>
		<div class="elemenx-card" style="position: absolute; left: 320px; top: 160px; width: 180px; padding: 12px;">Ctrl and the wheel zoom</div>
		<div class="elemenx-card" style="position: absolute; left: 900px; top: 600px; width: 180px; padding: 12px;">Far away: Shift+1 fits all</div>
	</Board>
</div>
<p class="elemenx-text small muted">X {{View.X}}, Y {{View.Y}}, zoom {{View.Zoom}}</p>
<script>
({
	View: {X: 0, Y: 0, Zoom: 1},

	Viewed: function (view) {
		this.View = {X: Math.round(view.X), Y: Math.round(view.Y), Zoom: Math.round(view.Zoom * 100) / 100};
	}
})
</script>
```

## Tests

- [moves its world by the wheel, zooms at the pointer with Ctrl, and keeps the point of the world under it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/board.test.js#L54) — `tests/regression/board.test.js`
- [moves by a drag on an empty place, keeps its zoom in bounds, converts its points and fits its content](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/board.test.js#L94) — `tests/regression/board.test.js`
- [leaves the wheel to an element of its content that scrolls that way, and zooms over it with Ctrl](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/board.test.js#L146) — `tests/regression/board.test.js`
- [keeps the view to its content with Bounds content: a margin around it, a smaller part in the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/board.test.js#L184) — `tests/regression/board.test.js`
- [keeps the view to one frame with Bounds frame, follows the Frame named and its size, and fits it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/board.test.js#L215) — `tests/regression/board.test.js`
- [asks for a device, opens and claims it, and transfers data in, out and by control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L178) — `tests/regression/devices.test.js`
- [knows the Components, Services and Directives of the Libraries and of the project](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L48) — `tests/regression/language-server.test.js`
- [goes from $T to elemenx.js and from its key to the phrase of the nearest locales, and tells the phrase in each language](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L257) — `tests/regression/language-server.test.js`
- [tells of a Component, a prop, a directive and a Service on hover, and finds their definitions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L106) — `tests/regression/language-server.test.js`
- [goes from a directive to its definition (the core ones in elemenx.js), and from a prop or an event to its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L187) — `tests/regression/language-server.test.js`
