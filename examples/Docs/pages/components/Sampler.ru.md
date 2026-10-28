<!-- generated -->
# Sampler

Пэды сэмплера, как на драм-машине: Pads [{ID, Label, Color, Key, Sample, Note}] по Columns (4) в ряд. Пэд играет свой Sample (звук, как его читает сервис Audio: адрес, Blob, ArrayBuffer или AudioBuffer) или, если его нет, свою Note на Instrument (инструменте сервиса Audio). Нажатие играет его, сильнее ближе к верху (или с силой нажатия пера); его Key на клавиатуре тоже. Mode oneshot (по умолчанию) играет сэмпл до конца, hold останавливает его, когда пэд отпускают. Звуковой файл, брошенный на пэд, становится его сэмплом (об этом сообщает load). Trigger(id, velocity) играет пэд из кода; Output() — GainNode его звука (там его слушает Spectrum). События: play ({ID, Velocity}), release ({ID}), load ({ID, File}), error (сэмпл, который не удаётся прочитать).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Pads` | `[]` |
| `Columns` | `4` |
| `Instrument` | `null` |
| `Mode` | `'oneshot'` |
| `Label` | `''` |

## События

- `error`
- `play`
- `release`
- `load`

## Методы

- `Output()`
- `Trigger(id, velocity)`

## Пример

```example
<div class="docs-stack">
	<Sampler [pads]="Pads" (play)="Played" (load)="Loaded" />
	<p class="elemenx-text small">{{Text}}</p>
</div>
<script>
(function () {
	/* The sounds of a little drum kit, made in the page: a kick, a snare, a hat and a clap, as WAV files. */
	function sound (seconds, shape) {
		var rate = 22050;
		var count = Math.round(seconds * rate);
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

		for (i = 0; i < count; i++) view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, shape(i / rate))) * 30000), true);

		return buffer;
	}

	var kick = sound(0.4, function (t) {
		return Math.sin(2 * Math.PI * (50 * t + 60 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 8);
	});
	var snare = sound(0.25, function (t) {
		return ((Math.random() * 2 - 1) * 0.7 + Math.sin(2 * Math.PI * 190 * t) * 0.4) * Math.exp(-t * 18);
	});
	var hat = sound(0.08, function (t) {
		return (Math.random() * 2 - 1) * Math.exp(-t * 60) * 0.6;
	});
	var clap = sound(0.3, function (t) {
		return (Math.random() * 2 - 1) * (Math.exp(-t * 25) + (t > 0.01 ? Math.exp(-(t - 0.01) * 40) * 0.6 : 0)) * 0.7;
	});

	return {
		Text: 'Press a pad (harder near its top), or Q, W, E, R, A, S, D, F while it has the focus. Drop a sound file on a pad to make it its sound.',
		Pads: [
			{ID: 'kick', Label: 'Kick', Key: 'Q', Sample: kick, Color: '#c0392b'},
			{ID: 'snare', Label: 'Snare', Key: 'W', Sample: snare, Color: '#d99a1e'},
			{ID: 'hat', Label: 'Hat', Key: 'E', Sample: hat, Color: '#2f8f83'},
			{ID: 'clap', Label: 'Clap', Key: 'R', Sample: clap, Color: '#7a4fb0'},
			{ID: 'p5', Label: 'Pad 5', Key: 'A'},
			{ID: 'p6', Label: 'Pad 6', Key: 'S'},
			{ID: 'p7', Label: 'Pad 7', Key: 'D'},
			{ID: 'p8', Label: 'Pad 8', Key: 'F'}
		],

		Played: function (hit) {
			this.Text = hit.ID + ', velocity ' + hit.Velocity.toFixed(2);
		},

		Loaded: function (drop) {
			this.Text = drop.File.name + ' is the sound of ' + drop.ID + ' now.';
		}
	};
})()
</script>
```

## Тесты

- [names notes, their MIDI numbers and their pitches](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L94) — `tests/regression/library-music.test.js`
- [a synth plays a note at its pitch and lets it go; a sampler plays its sample faster for a higher note](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L112) — `tests/regression/library-music.test.js`
- [a transport plays its notes and its beats on time, goes round its loop, and stops after its last note](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L177) — `tests/regression/library-music.test.js`
- [a transport late on its timers (a busy page) still tells every note and beat, in order, before its end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L247) — `tests/regression/library-music.test.js`
- [PianoRoll puts, moves, resizes and takes away notes by the pointer and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L286) — `tests/regression/library-music.test.js`
- [PianoRoll opens on its notes, also when it is put in the page after it is made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L398) — `tests/regression/library-music.test.js`
- [PianoRoll is as wide as its place, its grid scrolling inside it: it does not widen a column of a grid (a phone)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L429) — `tests/regression/library-music.test.js`
- [Sampler plays a pad by a press (harder near its top) and by its key, holds it in hold mode, and takes a file dropped on it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L439) — `tests/regression/library-music.test.js`
