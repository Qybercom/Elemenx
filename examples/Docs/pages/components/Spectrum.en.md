<!-- generated -->
# Spectrum

The spectrum of a sound as it plays: the levels of its bands, live (the Audio Service: an AnalyserNode). Source is what it hears: an <audio> or a <video>, a MediaStream of a microphone or an AudioNode; or Values, the levels of the bands from 0 to 1, given by the application (no Web Audio then). Bands is their count, Scale log (as an ear hears) or linear between MinFrequency and MaxFrequency in Hz, Smoothing (0 to 1) how slowly they move, MinDb and MaxDb the range of the analysis. Mode: bars (the default), mirror (the bars both ways from the middle), line (a filled curve of the bands), radial (the bars around a circle), curve (the analyser of a studio: a point every two pixels, read from the bins of the analysis on a log scale of frequency, a linear one of dB, with Tilt in dB by octave raising the highs, the lines of the Grid and the Fill under it; Peaks a line of the highest levels) or spectrogram (the spectrum in time: a column of colors each frame, the low frequencies at the bottom, scrolling to the left). Colors are the colors of the levels from low to high ([] the accent; for a spectrogram from the quiet to the loudest, over a clear silence: [] the accent, danger, warning, white), Gap the space between the bars in pixels, Peaks the marks of the highest levels, held then falling. Paused stops it. Levels() is what it shows now; error tells a Source it cannot hear, ready gives the component itself.

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
| `Tilt` | `3` |
| `Grid` | `true` |
| `Fill` | `true` |
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
		Modes: ['bars', 'mirror', 'line', 'radial', 'curve', 'spectrogram'].map(function (name) {
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

## Tests

- [hears a tone: its band is the loudest, its loudness is there, one node for an element for good](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L127) — `tests/regression/library-audio.test.js`
- [reads a sound file from an ArrayBuffer, a Blob and a URL, and gives its shape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L165) — `tests/regression/library-audio.test.js`
- [Spectrum draws levels given, or hears its Source live, and stops while Paused](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L193) — `tests/regression/library-audio.test.js`
- [Curve reads the spectrum at points on a log scale of frequency, its loudest point at the tone, Tilt raising the highs](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L289) — `tests/regression/library-audio.test.js`
- [Spectrum draws the curve of an analyser with its grid and its peaks, and a spectrogram that moves to the left](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L321) — `tests/regression/library-audio.test.js`
- [Waveform reads its file, moves its playhead, selects a part by a drag and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L406) — `tests/regression/library-audio.test.js`
- [Waveform draws the Peaks it is given and follows the element of Media](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L496) — `tests/regression/library-audio.test.js`
