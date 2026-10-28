<!-- generated -->
# Audio

The sound of the Application (Web Audio): one AudioContext for every part of it, the analysis of what plays and the reading of sound files.

- Context(): the AudioContext (made on the first call; a browser starts it suspended until the user presses or types in the page, then it is resumed by itself). Supported() is false without Web Audio.
- Node(source): the AudioNode of a source: an AudioNode as it is, an <audio> or a <video> (its sound still goes to the speakers; an element has one node for good, the same at every call), a MediaStream of a microphone (not to the speakers: no echo).
- Analyser(source, options): an AnalyserNode fed by the source; options Size (the size of its FFT, 2048), Smoothing (0 to 1, 0.8), MinDb (-100) and MaxDb (-20). Release(analyser) disconnects it.
- Bands(analyser, count, options): the levels of count bands of what it hears now, from 0 to 1; options Scale (log, the default, as an ear hears, or linear), MinFrequency (30) and MaxFrequency (16000) in Hz. Levels(analyser) is the loudness of the sound now, {Rms, Peak} from 0 to 1.
- Curve(analyser, count, options): the spectrum at count points spread from MinFrequency (20) to MaxFrequency (20000; Scale log or linear), each from 0 to 1 between the MinDb and the MaxDb of the analyser, as the analysers of the studios draw it: between two bins a point takes the line between them, over several bins the loudest; Tilt (dB by octave around 1 kHz, 0) raises the highs, which a mix has quieter.
- Decode(source, callback): a sound file as an AudioBuffer: callback(error, buffer); the source is a URL, a Blob (a File), an ArrayBuffer or an AudioBuffer.
- Peaks(buffer, count, from, to): the shape of a sound in count columns: [{Min, Max}] from -1 to 1, the channels mixed; from and to (seconds) take a part of it.

Notes and instruments:

- Midi(note): the number of a note (C4 is 60, A4 69; C#4, Db4, a number as it is); NoteName(midi) the other way (sharps: C#4); Frequency(note) its pitch in Hz (A4 is 440).
- Instrument(options): a synth (options Wave: sine, triangle, square or sawtooth) or a sampler (Samples: {note: source}, a source as Decode takes it; a note plays its nearest sample, faster or slower), Envelope {Attack, Decay, Sustain, Release} (seconds, Sustain from 0 to 1), Gain (0.5), Destination (an AudioNode: the speakers). It has Load(callback) (callback(error) once its samples are read), Loaded, Play(note, {Velocity (0 to 1), Time (of the context: now), Duration (seconds: held until Release when none)}), Release(note, time), Stop(), Output (its GainNode: a Spectrum hears it there) and Destroy().
- Transport(options): plays Notes ([{Note, Start, Length, Velocity}], Start and Length in beats) on an Instrument at Bpm (120), Beats (4) to a bar, Metronome (a click on each beat, higher on the first of a bar), Loop ({Start, End} in beats, or null: it stops after its last note). It has Play(), Pause(), Stop() (back to the start), Seek(beat), Position() (the beat it plays now), Playing, Set(options) (any of them, while it plays), On(name, callback) and Off(name, callback) for beat ({Beat, Bar, Accent}), note (a note as it sounds), end; Destroy(). It schedules a little ahead on the clock of the context, so a busy page does not make it late.

## Methods

- `Supported()`
- `Context()`
- `Node(source)`
- `Analyser(source, options)`
- `Release(analyser)`
- `Bands(analyser, count, options)`
- `Curve(analyser, count, options)`
- `Levels(analyser)`
- `Decode(source, callback)`
- `Peaks(buffer, count, from, to)`
- `Midi(note)`
- `NoteName(midi)`
- `Frequency(note)`
- `Instrument(options)`
- `Transport(options)`

## Example

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

## Tests

- [hears a tone: its band is the loudest, its loudness is there, one node for an element for good](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L127) — `tests/regression/library-audio.test.js`
- [reads a sound file from an ArrayBuffer, a Blob and a URL, and gives its shape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L165) — `tests/regression/library-audio.test.js`
- [Spectrum draws levels given, or hears its Source live, and stops while Paused](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L193) — `tests/regression/library-audio.test.js`
- [Curve reads the spectrum at points on a log scale of frequency, its loudest point at the tone, Tilt raising the highs](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L289) — `tests/regression/library-audio.test.js`
- [Spectrum draws the curve of an analyser with its grid and its peaks, and a spectrogram that moves to the left](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L321) — `tests/regression/library-audio.test.js`
- [Waveform reads its file, moves its playhead, selects a part by a drag and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L406) — `tests/regression/library-audio.test.js`
- [Waveform draws the Peaks it is given and follows the element of Media](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L496) — `tests/regression/library-audio.test.js`
- [names notes, their MIDI numbers and their pitches](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L94) — `tests/regression/library-music.test.js`
- [a synth plays a note at its pitch and lets it go; a sampler plays its sample faster for a higher note](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L112) — `tests/regression/library-music.test.js`
- [a transport plays its notes and its beats on time, goes round its loop, and stops after its last note](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L177) — `tests/regression/library-music.test.js`
- [PianoRoll puts, moves, resizes and takes away notes by the pointer and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L247) — `tests/regression/library-music.test.js`
- [PianoRoll opens on its notes, also when it is put in the page after it is made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L359) — `tests/regression/library-music.test.js`

+2 more in the same files
