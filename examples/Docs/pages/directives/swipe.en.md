<!-- generated -->
# *swipe

*swipe makes an element follow a finger (a pen, or a mouse with Mouse) along an axis and tells the end of the move: *swipe, *swipe="'y'" or *swipe="{Axis: 'x' or 'y', Threshold: 40, Mouse: false}". The page still scrolls along the other axis (touch-action). While the finger moves the element dispatches swipemove with {DX, DY} (the move along its axis, the other one 0); when it lifts, swipe with {Direction (left, right, up or down), DX, DY} if it went past Threshold pixels (or flicked), or swipecancel if not (and when the browser takes the gesture). An owner listens with (swipe)="Handler" (event.detail). A move that began on a field, a slider or anything marked data-no-swipe is left to it. With Mouse a mouse drags the element too: the click that ends a move is no press (a link, a picture that opens), and a picture inside is not dragged away by the browser. What the finger does is told by the Recognizer of the Gestures Service, as (pan) and (swipe) of templates are.

## Example

```example
<div class="elemenx-card" style="padding: 16px; touch-action: pan-y; user-select: none;" *swipe="{Axis: 'x', Threshold: 60, Mouse: true}" (swipemove)="Moving" (swipe)="Swiped" (swipecancel)="Cancelled" [style.transform]="'translateX(' + Offset + 'px)'">
	<strong>Card {{Index + 1}}</strong>
	<p class="elemenx-text small">Swipe me left or right (a mouse drags it too here).</p>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Index: 0,
	Offset: 0,
	Note: '',

	Moving: function (event) {
		this.Offset = event.detail.DX;
	},

	Swiped: function (event) {
		this.Offset = 0;
		this.Index = event.detail.Direction === 'left' ? this.Index + 1 : Math.max(0, this.Index - 1);
		this.Note = 'Swiped ' + event.detail.Direction;
	},

	Cancelled: function () {
		this.Offset = 0;
		this.Note = 'Not far enough';
	}
})
</script>
```

## Tests

- [follows a finger along x and swipes past its threshold, the way it went](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/directive-swipe.test.js#L79) — `tests/regression/directive-swipe.test.js`
- [cancels a short slow move, swipes a short flick, and up along y](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/directive-swipe.test.js#L90) — `tests/regression/directive-swipe.test.js`
- [leaves a move across its axis to the page, a field and a mouse (but with Mouse) alone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/directive-swipe.test.js#L110) — `tests/regression/directive-swipe.test.js`
