<!-- generated -->
# Gestures

Gestures: what fingers do on an element, recognized at once for every gesture, as a page or a game reads it.

- Recognizer(options): the recognition alone, of no page (it runs in Node and in a worker): Push(kind, id, x, y, time) takes a finger going down, moving, up or cancelled (kind down, move, up, cancel; id of the finger; x and y px; time ms) and gives what it makes of it, a list of gestures; Tick(time) gives what the time alone makes (a press held long enough); Reset() forgets all fingers. A gesture is {Type, Phase (start, move or end; a tap, a double tap, a press and a swipe have none), X, Y (where it is: the middle of the fingers), Pointers} and, by its Type: tap; doubletap (the second tap of two near in place and time, after its tap); press (a finger held still Hold ms) and pressup (it lifted, no tap then); pan (one finger, or two moving together: DX, DY since it began, MoveX, MoveY since the last, Pressed after a press); swipe (a pan that ended quick: Direction left, right, up or down, VX, VY px/ms); pinch (two fingers apart or together: Scale since it began, Step since the last); rotate (two fingers turning: Angle radians since it began, clockwise on the screen +, Step); tilt (two fingers moving up or down together, as a map is tilted: DY px since it began, MoveY). Two fingers pinch, rotate and pan at once; a tilt is alone (the first of it and of a turn past its threshold takes them). A second finger down ends a pan of one. Options: Slop px a finger moves and is still (10), Hold ms of a press (500), Double ms and px between two taps of a double tap (300, 30), Fling px/ms of a swipe (0.5), Scale (0.06: the log of the scale of a pinch), Angle (0.12 rad of a rotate), Shift px of a pan of two and a tilt (12).
- Listen(element, callback(gesture, event), options): the fingers on an element (a pen too; a mouse with Mouse true, as one finger) to their gestures, as they come; options as the Recognizer's and Mouse (false), Touch ('none': the touch-action of the element while it listens, so the browser scrolls and zooms none of it; false leaves it). Returns its stop. A finger is the element's till it lifts (pointer capture).
- The events of templates (Elemenx.EventSource): (tap), (doubletap), (press), (pressup), (pan), (swipe), (pinch), (rotate), (tilt) on any element; the gesture in event.detail. The attribute data-gestures-mouse on the element takes a mouse too, as one finger (a page to try them on a computer).

## Methods

- `Recognizer(options)`
- `Listen(element, callback, options)`

## Example

```example
<div class="elemenx-card" style="height: 220px; display: flex; align-items: center; justify-content: center; user-select: none;" data-gestures-mouse (tap)="Seen" (doubletap)="Seen" (press)="Seen" (pan)="Seen" (swipe)="Seen" (pinch)="Seen" (rotate)="Seen" (tilt)="Seen">
	<div [style.transform]="'rotate(' + Turn + 'rad) scale(' + Size + ')'" style="width: 80px; height: 80px; border-radius: 12px; background: var(--elemenx-accent);"></div>
</div>
<p class="elemenx-text small muted">Tap, press, pan, swipe (a mouse too); with two fingers pinch, turn and tilt. Last: <strong>{{Last}}</strong></p>
<script>
({
	Last: '—',
	Size: 1,
	Turn: 0,

	Seen: function (event) {
		var gesture = event.detail;

		this.Last = gesture.Type + (gesture.Phase ? ' ' + gesture.Phase : '') + (gesture.Direction ? ' ' + gesture.Direction : '');

		if (gesture.Type === 'pinch')
			this.Size = Math.max(0.3, Math.min(3, this.Size * gesture.Step));

		if (gesture.Type === 'rotate')
			this.Turn += gesture.Step;

		if (gesture.Type === 'doubletap') {
			this.Size = 1;
			this.Turn = 0;
		}
	}
})
</script>
```

## Tests

- [taps, taps twice near in place and time, and presses a finger held still](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L48) — `tests/regression/library-gestures.test.js`
- [pans a finger past its slop, its moves told, and a quick one ends in a swipe](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L65) — `tests/regression/library-gestures.test.js`
- [pinches, rotates and pans two fingers at once; a second finger ends the pan of one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L79) — `tests/regression/library-gestures.test.js`
- [tilts two fingers moving up or down together, alone of the gestures of two](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L109) — `tests/regression/library-gestures.test.js`
- [gives its gestures as events of templates on any element, and lets the element go with its component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L125) — `tests/regression/library-gestures.test.js`
- [takes a mouse as one finger on an element with data-gestures-mouse](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-gestures.test.js#L178) — `tests/regression/library-gestures.test.js`
