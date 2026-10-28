<!-- generated -->
# Spectrum

The spectrum of a sound as it plays: the levels of its bands, live (the Audio Service: an AnalyserNode). Source is what it hears: an <audio> or a <video>, a MediaStream of a microphone or an AudioNode; or Values, the levels of the bands from 0 to 1, given by the application (no Web Audio then). Bands is their count, Scale log (as an ear hears) or linear between MinFrequency and MaxFrequency in Hz, Smoothing (0 to 1) how slowly they move, MinDb and MaxDb the range of the analysis. Mode: bars (the default), mirror (the bars both ways from the middle), line (a filled curve) or radial (the bars around a circle). Colors are the colors of the levels from low to high ([] the accent), Gap the space between the bars in pixels, Peaks the marks of the highest levels, held then falling. Paused stops it. Levels() is what it shows now; error tells a Source it cannot hear, ready gives the component itself.

## Properties

| Property | Default |
| --- | --- |
| `Source` | `null` |
| `Values` | `null` |
| `Bands` | `48` |
| `Mode` | `'bars'` |
| `Scale` | `'log'` |
| `MinFrequency` | `30` |
| `MaxFrequency` | `16000` |
| `Smoothing` | `0.8` |
| `MinDb` | `-100` |
| `MaxDb` | `-20` |
| `Colors` | `[]` |
| `Gap` | `2` |
| `Peaks` | `true` |
| `Paused` | `false` |
| `Label` | `''` |

## Events

- `ready`: It is made: the component itself, to call Levels.
- `error`: The Source cannot be heard: the error.

## Methods

- `Levels()`

## Example

```example
<div class="docs-stack">
	<div class="docs-row">
		<Button [label]="Playing ? 'Stop' : 'Play a chord'" [icon]="Playing ? 'pause' : 'play'" (click)="Toggle" />
		<Button Label="Microphone" Icon="mic" (click)="Listen" />
		<Select Label="Mode" [value]="Mode" [options]="Modes" (change)="Moded" />
	</div>
	<Spectrum [source]="Source" [mode]="Mode" Bands="40" [colors]="['#2f8f83', '#d99a1e', '#c0392b']" Height="140" (error)="Failed" />
	<p class="elemenx-text small" [class.danger]="!!Problem">{{Problem || 'A chord of three notes, its pitch sliding: each note is a peak of the spectrum.'}}</p>
	<Spectrum [values]="Levels" Bands="12" Mode="mirror" Height="60" Gap="6" />
</div>
<script>
(function () {
	var nodes = [];
	var timer = null;

	return {
		Source: null,
		Playing: false,
		Mode: 'bars',
		Problem: '',
		Levels: [0.2, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.3, 0.5, 0.2, 0.35, 0.1],
		Modes: ['bars', 'mirror', 'line', 'radial'].map(function (name) {
			return {Value: name, Label: name};
		}),

		$OnReady: function () {
			var self = this;

			/* The levels of the second one come from the page itself, as an application gives them. */
			timer = setInterval(function () {
				self.Levels = self.Levels.map(function (level) {
					return Math.max(0.05, Math.min(1, level + (Math.random() - 0.5) * 0.3));
				});
			}, 120);
		},

		$OnDestroy: function () {
			clearInterval(timer);
			this.Silence();
		},

		Silence: function () {
			nodes.forEach(function (node) {
				node.stop();
			});

			nodes = [];
		},

		/* Three oscillators into one gain: the Source of the spectrum, and the speakers. */
		Toggle: function () {
			var audio = this.$Service('Audio');
			var context = audio.Context();
			var gain;

			if (this.Playing) {
				this.Silence();
				this.Playing = false;
				this.Source = null;

				return;
			}

			context.resume();
			gain = context.createGain();
			gain.gain.value = 0.08;
			gain.connect(context.destination);

			[220, 277.18, 329.63].forEach(function (frequency) {
				var oscillator = context.createOscillator();

				oscillator.type = 'sawtooth';
				oscillator.frequency.setValueAtTime(frequency, context.currentTime);
				oscillator.frequency.linearRampToValueAtTime(frequency * 2, context.currentTime + 6);
				oscillator.connect(gain);
				oscillator.start();
				oscillator.stop(context.currentTime + 6);
				nodes.push(oscillator);
			});

			this.Source = gain;
			this.Playing = true;
		},

		Listen: function () {
			var self = this;

			if (!navigator.mediaDevices) {
				this.Problem = 'This browser gives no microphone here.';

				return;
			}

			navigator.mediaDevices.getUserMedia({audio: true}).then(function (stream) {
				self.Silence();
				self.Playing = false;
				self.Source = stream;
			}, function (error) {
				self.Problem = error.message;
			});
		},

		Moded: function (value) {
			this.Mode = value;
		},

		Failed: function (error) {
			this.Problem = error.message;
		}
	};
})()
</script>
```
