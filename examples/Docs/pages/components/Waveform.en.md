<!-- generated -->
# Waveform

The shape of a sound file, to see it and to move in it: Src is the file (a URL, a Blob or a File, an ArrayBuffer or an AudioBuffer: the Audio Service reads it), or Peaks gives its shape ([{Min, Max}] from -1 to 1, or levels from 0 to 1) and Duration its length in seconds. Time is the place of the playhead in seconds: the part before it is drawn in the accent. A press moves it (seek); with Selectable, a drag selects a part ({Start, End} in seconds: Selection, and select), Escape takes it away. Keys: the arrows move by a second (Shift extends the selection), Home and End. Media is an <audio> or a <video> it follows (its time) and moves; without Src it draws the file the element plays. Mode: bars (the default; Bar and Gap their widths in pixels) or wave (a filled line). ShowTime writes the time and the selection. Seek(time), Select(selection) and Buffer() (the AudioBuffer read) are its methods. Events: load ({Duration, Channels, SampleRate}), seek (seconds), select ({Start, End} or null), error, ready (the component itself).

## Properties

| Property | Default |
| --- | --- |
| `Src` | `''` |
| `Peaks` | `null` |
| `Duration` | `0` |
| `Time` | `0` |
| `Selection` | `null` |
| `Selectable` | `true` |
| `Media` | `null` |
| `Mode` | `'bars'` |
| `Bar` | `2` |
| `Gap` | `1` |
| `ShowTime` | `true` |
| `Label` | `''` |

## Events

- `ready`: It is made: the component itself, to call Seek, Select or Buffer.
- `error`: The file cannot be read: the error.
- `load`: The file is read: {Duration, Channels, SampleRate}.
- `seek`: The playhead was moved: the time in seconds.
- `select`: A part was selected: {Start, End} in seconds, or null.

## Methods

- `Buffer()`
- `Seek(time)`
- `Select(selection)`

## Example

```example
<div class="docs-stack">
	<audio #Player [attribute.src]="Url || null"></audio>
	<Waveform [media]="Player" [selection]="Part" (select)="Selected" />
	<div class="docs-row">
		<Button [label]="Playing ? 'Pause' : 'Play'" [icon]="Playing ? 'pause' : 'play'" [disabled]="!Player" (click)="Toggle" />
		<Button Label="Play the part" Icon="play" [disabled]="!Part" (click)="PlayPart" />
	</div>
	<p class="elemenx-text small">{{Part ? 'The part: ' + Part.Start.toFixed(2) + ' s to ' + Part.End.toFixed(2) + ' s.' : 'A melody made in the page. Drag over it to select a part; a press moves the playhead.'}}</p>
	<Waveform [peaks]="Peaks" Duration="30" Time="12" Mode="wave" Height="56" ShowTime="false" Selectable="false" />
</div>
<script>
(function () {
	var stop = null;

	/* A WAV file of a little melody, made here: 16-bit mono at 22050 Hz, each note fading. */
	function melody () {
		var rate = 22050;
		var notes = [262, 330, 392, 523, 392, 330, 294, 349, 440, 587, 440, 349];
		var length = 0.35;
		var count = Math.round(notes.length * length * rate);
		var buffer = new ArrayBuffer(44 + count * 2);
		var view = new DataView(buffer);
		var i;

		function text (at, value) {
			for (var k = 0; k < value.length; k++) view.setUint8(at + k, value.charCodeAt(k));
		}

		text(0, 'RIFF');
		view.setUint32(4, 36 + count * 2, true);
		text(8, 'WAVEfmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, 1, true);
		view.setUint32(24, rate, true);
		view.setUint32(28, rate * 2, true);
		view.setUint16(32, 2, true);
		view.setUint16(34, 16, true);
		text(36, 'data');
		view.setUint32(40, count * 2, true);

		for (i = 0; i < count; i++) {
			var time = i / rate;
			var note = notes[Math.floor(time / length)];
			var fade = Math.exp(-(time % length) * 7);

			view.setInt16(44 + i * 2, Math.round(Math.sin(time * note * Math.PI * 2) * fade * (0.4 + 0.5 * Math.sin(time)) * 32767), true);
		}

		return URL.createObjectURL(new Blob([buffer], {type: 'audio/wav'}));
	}

	return {
		Url: '',
		Player: null,
		Playing: false,
		Part: null,
		/* The second one is drawn from a shape the application gives. */
		Peaks: Array.apply(null, Array(120)).map(function (nothing, index) {
			return Math.abs(Math.sin(index / 7)) * (0.3 + 0.7 * Math.abs(Math.sin(index / 31)));
		}),

		$OnReady: function () {
			var self = this;
			var player = this.$Ref('Player');

			this.Url = melody();

			player.addEventListener('play', function () {
				self.Playing = true;
			});

			player.addEventListener('pause', function () {
				self.Playing = false;
			});

			player.addEventListener('timeupdate', function () {
				if (stop !== null && player.currentTime >= stop) {
					player.pause();
					stop = null;
				}
			});

			this.Player = player;
		},

		$OnDestroy: function () {
			URL.revokeObjectURL(this.Url);
		},

		Toggle: function () {
			stop = null;

			if (this.Player.paused) this.Player.play();
			else this.Player.pause();
		},

		PlayPart: function () {
			this.Player.currentTime = this.Part.Start;
			stop = this.Part.End;
			this.Player.play();
		},

		Selected: function (part) {
			this.Part = part;
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
- [Spectrum draws the curve of an analyser with its grid and its peaks, and a spectrogram that moves to the left](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L337) — `tests/regression/library-audio.test.js`
- [Waveform reads its file, moves its playhead, selects a part by a drag and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L422) — `tests/regression/library-audio.test.js`
- [Waveform draws the Peaks it is given and follows the element of Media](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-audio.test.js#L512) — `tests/regression/library-audio.test.js`
