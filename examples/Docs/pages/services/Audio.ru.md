<!-- generated -->
# Audio

Звук приложения (Web Audio): один AudioContext на всё приложение, анализ того, что звучит, и чтение звуковых файлов.
- Context(): AudioContext (создаётся при первом вызове; браузер запускает его приостановленным, пока пользователь не нажмёт или не напечатает что-то на странице, потом он возобновляется сам). Supported() — false без Web Audio.
- Node(source): AudioNode источника: AudioNode как есть, <audio> или <video> (его звук по-прежнему идёт в динамики; у элемента навсегда один узел, тот же при каждом вызове), MediaStream микрофона (не в динамики: без эха).
- Analyser(source, options): AnalyserNode, который получает звук источника; options — Size (размер его БПФ, 2048), Smoothing (от 0 до 1, 0.8), MinDb (-100) и MaxDb (-20). Release(analyser) отключает его.
- Bands(analyser, count, options): уровни count полос того, что он слышит сейчас, от 0 до 1; options — Scale (log по умолчанию, как слышит ухо, или linear), MinFrequency (30) и MaxFrequency (16000) в Гц. Levels(analyser) — громкость звука сейчас, {Rms, Peak} от 0 до 1.
- Decode(source, callback): звуковой файл как AudioBuffer: callback(error, buffer); источник — адрес, Blob (File), ArrayBuffer или AudioBuffer.
- Peaks(buffer, count, from, to): форма звука в count столбцах: [{Min, Max}] от -1 до 1, каналы смешаны; from и to (секунды) берут его часть.
Ноты и инструменты:
- Midi(note): номер ноты (C4 — 60, A4 — 69; C#4, Db4, число как есть); NoteName(midi) — обратно (с диезами: C#4); Frequency(note) — её высота в Гц (A4 — 440).
- Instrument(options): синтезатор (options Wave: sine, triangle, square или sawtooth) или сэмплер (Samples: {нота: источник}, источник как для Decode; нота играет ближайший сэмпл, быстрее или медленнее), Envelope {Attack, Decay, Sustain, Release} (секунды, Sustain от 0 до 1), Gain (0.5), Destination (AudioNode: динамики). У него есть Load(callback) (callback(error), когда сэмплы прочитаны), Loaded, Play(note, {Velocity (от 0 до 1), Time (времени контекста: сейчас), Duration (секунды: без неё звучит до Release)}), Release(note, time), Stop(), Output (его GainNode: там его слушает Spectrum) и Destroy().
- Transport(options): играет Notes ([{Note, Start, Length, Velocity}], Start и Length в долях) на Instrument с темпом Bpm (120), Beats (4) долей в такте, Metronome (щелчок на каждую долю, выше на первую в такте), Loop ({Start, End} в долях или null: он останавливается после последней ноты). У него есть Play(), Pause(), Stop() (в начало), Seek(beat), Position() (доля, которая звучит сейчас), Playing, Set(options) (любые из них, пока играет), On(name, callback) и Off(name, callback) для beat ({Beat, Bar, Accent}), note (нота, когда она звучит), end; Destroy(). Он планирует немного вперёд по часам контекста, поэтому занятая страница не заставляет его опаздывать.

## Методы

- `Supported()`
- `Context()`
- `Node(source)`
- `Analyser(source, options)`
- `Release(analyser)`
- `Bands(analyser, count, options)`
- `Levels(analyser)`
- `Decode(source, callback)`
- `Peaks(buffer, count, from, to)`
- `Midi(note)`
- `NoteName(midi)`
- `Frequency(note)`
- `Instrument(options)`
- `Transport(options)`

## Пример

```example
<div class="docs-stack">
	<div class="docs-row">
		<Button [label]="Running ? 'Stop' : 'Listen to 440 Hz'" Icon="play" (click)="Toggle" />
	</div>
	<p class="elemenx-text small">{{Text}}</p>
</div>
<script>
(function () {
	var oscillator = null;
	var analyser = null;
	var timer = null;

	return {
		Running: false,
		Text: 'The Audio Service hears an oscillator: the loudest of 24 bands, and the loudness.',

		$OnDestroy: function () {
			this.Stop();
		},

		Stop: function () {
			clearInterval(timer);

			if (oscillator)
				oscillator.stop();

			this.$Service('Audio').Release(analyser);

			oscillator = null;
			analyser = null;
			this.Running = false;
		},

		Toggle: function () {
			var self = this;
			var audio = this.$Service('Audio');
			var context;

			if (this.Running) {
				this.Stop();

				return;
			}

			context = audio.Context();
			context.resume();

			oscillator = context.createOscillator();
			oscillator.frequency.value = 440;
			oscillator.start();

			/* Heard, not played: the oscillator goes to the analyser alone. */
			analyser = audio.Analyser(oscillator, {Smoothing: 0.5});
			this.Running = true;

			timer = setInterval(function () {
				var bands = audio.Bands(analyser, 24);
				var loudest = bands.indexOf(Math.max.apply(null, bands));
				var levels = audio.Levels(analyser);

				self.Text = 'The loudest band: ' + (loudest + 1) + ' of 24; RMS ' + levels.Rms.toFixed(2) + ', peak ' + levels.Peak.toFixed(2) + '.';
			}, 200);
		}
	};
})()
</script>
```
