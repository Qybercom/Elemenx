<!-- generated -->
# Screen

Screen: how the screen of the page is held and how large it is, as a page lays itself out by it.

- Orientation(): portrait or landscape (taller than wide: portrait); Angle(): the turn of the screen, 0, 90, 180 or 270 degrees; Narrow(): as narrow as a phone (its shorter side under Narrow px, 600); Coarse(): the pointer is a finger (pointer: coarse); Phone(): narrow and touched. State(): all of them at once {Orientation, Angle, Width, Height, Narrow, Coarse, Phone}.
- The page knows it of its classes too: on <html> elemenx-portrait or elemenx-landscape, elemenx-narrow and elemenx-coarse while they are so, so a layout changes of CSS alone.
- On('change', callback(state)) / Off(callback): the screen turned or another size (a window resized), once for each change; the template event (orientation) on any element gives the same state in event.detail.
- Fullscreen(element, options, callback(error)): the element over the whole screen (the browser asks for it within a press); options Landscape (true: the screen kept in landscape while it is, where the device lets a page lock it: phones in fullscreen; elsewhere it turns as it will, no error), Navigation ('hide'). Exit(callback(error)) leaves it; Full() whether something is over the whole screen now.

Where there is no page (Node, a worker): a landscape screen of 1280 by 800, none of it narrow or touched.

## Methods

- `State()`
- `Orientation()`
- `Angle()`
- `Narrow()`
- `Coarse()`
- `Phone()`
- `On(name, callback)`
- `Off(callback)`
- `Full()`
- `Fullscreen(element, options, callback)`
- `Exit(callback)`

## Example

```example
<div class="elemenx-card" style="padding: 16px;" (orientation)="Turned">
	<p class="elemenx-text">{{State.Orientation}}, {{State.Width}} × {{State.Height}}, turned {{State.Angle}}°{{State.Phone ? ', a phone' : State.Coarse ? ', touched' : ''}}</p>
	<button class="elemenx-button" (click)="Full">Fullscreen in landscape</button>
</div>
<script>
({
	State: {},

	$OnCreate: function () {
		this.State = this.$Service('Screen').State();
	},

	Turned: function (event) {
		this.State = event.detail;
	},

	Full: function (event) {
		this.$Service('Screen').Fullscreen(event.target.closest('.elemenx-card'), {Landscape: true});
	}
})
</script>
```

## Tests

- [tells its orientation, its size and its kind, and marks <html> by them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-screen.test.js#L29) — `tests/regression/library-screen.test.js`
- [tells a change of the screen once to its listeners and to the event (orientation) of templates](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-screen.test.js#L44) — `tests/regression/library-screen.test.js`
- [tells an error when nothing can be over the whole screen, and leaves it when nothing is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-screen.test.js#L89) — `tests/regression/library-screen.test.js`
- [has every component of ElemenxUI from its $Meta and the classes of its layouts on the Insert tab, with a search](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L367) — `tests/examples/designer.spec.js`
- [drops a row at the end of a screen a row fills by the bar of the containers, and the canvas is as high as its room](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L701) — `tests/examples/designer.spec.js`
