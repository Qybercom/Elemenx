<!-- generated -->
# Spectrum

Спектр звука, пока он звучит: уровни его полос вживую (сервис Audio: AnalyserNode). Source — то, что он слушает: <audio> или <video>, MediaStream микрофона или AudioNode; или Values — уровни полос от 0 до 1, которые даёт приложение (тогда Web Audio не нужен). Bands — число полос, Scale — log (как слышит ухо) или linear между MinFrequency и MaxFrequency в Гц, Smoothing (от 0 до 1) — насколько медленно они меняются, MinDb и MaxDb — диапазон анализа.
Mode: bars (по умолчанию), mirror (столбцы в обе стороны от середины), line (залитая кривая полос), radial (столбцы по кругу), curve (анализатор студии: точка каждые два пикселя, прочитанная из бинов анализа, по логарифмической шкале частот и линейной шкале дБ; Tilt в дБ на октаву поднимает верха, Grid — линии частот и дБ, Fill — заливка под кривой, Peaks — линия наибольших уровней) или spectrogram (спектр во времени: каждый кадр — столбец цветов, низкие частоты внизу, всё сдвигается влево). Colors — цвета уровней от низких к высоким ([] — акцентный; для спектрограммы — от тихого к самому громкому, поверх прозрачной тишины: [] — акцентный, danger, warning, белый), Gap — промежуток между столбцами в пикселях, Peaks — отметки наибольших уровней: держатся, потом опускаются. Paused останавливает его. Levels() — то, что он показывает сейчас; error сообщает, что Source не слышно, ready отдаёт сам компонент.

## Свойства

| Свойство | По умолчанию |
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

## События

- `ready`
- `error`

## Методы

- `Levels()`

## Пример

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

## Тесты

- [hears a tone: its band is the loudest, its loudness is there, one node for an element for good](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L127) — `tests/regression/library-audio.test.js`
- [reads a sound file from an ArrayBuffer, a Blob and a URL, and gives its shape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L165) — `tests/regression/library-audio.test.js`
- [Spectrum draws levels given, or hears its Source live, and stops while Paused](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L193) — `tests/regression/library-audio.test.js`
- [Curve reads the spectrum at points on a log scale of frequency, its loudest point at the tone, Tilt raising the highs](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L289) — `tests/regression/library-audio.test.js`
- [Spectrum draws the curve of an analyser with its grid and its peaks, and a spectrogram that moves to the left](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L337) — `tests/regression/library-audio.test.js`
- [Waveform reads its file, moves its playhead, selects a part by a drag and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L422) — `tests/regression/library-audio.test.js`
- [Waveform draws the Peaks it is given and follows the element of Media](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L512) — `tests/regression/library-audio.test.js`
