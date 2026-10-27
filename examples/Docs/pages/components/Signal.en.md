<!-- generated -->
# Signal

The strength of a signal: bars that grow from left to right, as many lit as it is strong (a connection of a call, a network, the ping of a game). Value from 0 to 1, or Quality good, fair or poor (the bars of each: all of them, about two thirds, one); Bars is how many there are (3). The lit bars take a color of their level: success when strong, warning when fair, danger when poor (Tone of its own: accent, success, warning, danger or muted). Size small or medium. An image for screen readers, named by Label or by the phrase of its level.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `1` |
| `Quality` | `''` |
| `Bars` | `3` |
| `Tone` | `''` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 24px; align-items: center;">
	<Signal Quality="good" Label="Good connection" />
	<Signal Quality="fair" Label="Fair connection" />
	<Signal Quality="poor" Label="Poor connection" />
	<Signal Bars="5" [value]="Strength" Label="Strength" />
</div>
<p class="elemenx-text small muted">Good, fair and poor; then five bars at {{Math.round(Strength * 100)}}%.</p>
<Slider Min="0" Max="1" Step="0.05" [value]="Strength" (input)="Changed" />
<script>
({
	Strength: 0.6,

	Changed: function (value) {
		this.Strength = value;
	}
})
</script>
```
