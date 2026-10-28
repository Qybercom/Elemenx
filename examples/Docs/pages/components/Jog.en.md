<!-- generated -->
# Jog

The jog wheel of a DJ: a platter with a record on it that turns as the track plays (Playing, at Rpm turns a minute: 33.3 by default), its marker where Time is (a turn is 60 / Rpm seconds). A hand on the record holds it and scratches: touch (true, then false when it lets go) and scratch ({Delta, Time}: the seconds the record was turned, forward positive) while it turns it. The ring around it bends the pitch: a drag on it, or the wheel, emits nudge ({Delta}, from -1 to 1 for a quarter turn). Keys: the arrows nudge, with Shift they scratch by a twentieth of a turn. Title and Subtitle are written on the label of the record; Size is its width in pixels. The track is the application's: Time follows it, and the platter turns between its updates by itself while Playing.

## Properties

| Property | Default |
| --- | --- |
| `Time` | `0` |
| `Playing` | `false` |
| `Rpm` | `33.3` |
| `Title` | `''` |
| `Subtitle` | `''` |
| `Size` | `220` |
| `Disabled` | `false` |
| `Label` | `''` |

## Events

- `touch`: A hand on the record (true) or off it (false).
- `nudge`: The ring was turned: {Delta}, from -1 to 1 for a quarter turn.
- `scratch`: The record was turned by hand: {Delta (seconds, forward positive), Time}.

## Example

```example
<div class="docs-row" style="align-items: center;">
	<Jog [time]="Time" [playing]="Playing" Title="Deck A" [subtitle]="Bpm.toFixed(1) + ' BPM'" (touch)="Touched" (scratch)="Scratched" (nudge)="Nudged" />
	<div class="docs-stack">
		<Button [label]="Playing ? 'Pause' : 'Play'" [icon]="Playing ? 'pause' : 'play'" (click)="Toggle" />
		<p class="elemenx-text small">{{Held ? 'Scratching' : Playing ? 'Playing' : 'Paused'}}: {{Time.toFixed(2)}} s</p>
		<p class="elemenx-text small muted">Hold the record to scratch it; turn the ring, or the wheel, to bend the pitch.</p>
	</div>
</div>
<script>
(function () {
	var timer = null;
	var last = 0;

	return {
		Time: 0,
		Playing: false,
		Held: false,
		Bpm: 128,
		Bend: 0,

		$OnReady: function () {
			var self = this;

			/* The track of the page: its time goes on while it plays and no hand holds the record. */
			timer = setInterval(function () {
				var now = Date.now();

				if (self.Playing && !self.Held)
					self.Time += (now - last) / 1000 * (1 + self.Bend);

				/* The bend of the pitch fades back. */
				self.Bend *= 0.9;
				self.Bpm = 128 * (1 + self.Bend);
				last = now;
			}, 100);

			last = Date.now();
		},

		$OnDestroy: function () {
			clearInterval(timer);
		},

		Toggle: function () {
			this.Playing = !this.Playing;
		},

		Touched: function (held) {
			this.Held = held;
		},

		Scratched: function (move) {
			this.Time = Math.max(0, move.Time);
		},

		Nudged: function (nudge) {
			this.Bend = Math.max(-0.08, Math.min(0.08, this.Bend + nudge.Delta * 0.04));
		}
	};
})()
</script>
```

## Tests

- [puts its marker where Time is, a turn every 60 / Rpm seconds, and turns by itself while Playing](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-jog.test.js#L44) — `tests/regression/library-jog.test.js`
- [a hand on the record touches and scratches it; on the ring, the wheel and the keys it nudges](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-jog.test.js#L104) — `tests/regression/library-jog.test.js`
