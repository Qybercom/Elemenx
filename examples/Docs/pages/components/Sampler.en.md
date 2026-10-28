<!-- generated -->
# Sampler

The pads of a sampler, as on a drum machine: Pads [{ID, Label, Color, Key, Sample, Note}] in Columns (4). A pad plays its Sample (a sound as the Audio Service decodes it: a URL, a Blob, an ArrayBuffer or an AudioBuffer), or its Note on the Instrument (an Instrument of the Audio Service) when it has none. A press plays it, harder near its top (or by the pressure of a pen); its Key of the keyboard plays it too. Mode oneshot (the default) plays a sample to its end, hold stops it when the pad is let go. A sound file dropped on a pad is its sample from then (load tells it). Trigger(id, velocity) plays a pad from code; Output() is the GainNode of its sound (a Spectrum hears it there). Events: play ({ID, Velocity}), release ({ID}), load ({ID, File}), error (a sample it cannot read).

## Properties

| Property | Default |
| --- | --- |
| `Pads` | `[]` |
| `Columns` | `4` |
| `Instrument` | `null` |
| `Mode` | `'oneshot'` |
| `Label` | `''` |

## Events

- `error`: A sample cannot be read: the error, its ID the pad.
- `play`: A pad was played: {ID, Velocity}.
- `release`: A pad was let go: {ID}.
- `load`: A sound file was dropped on a pad: {ID, File}.

## Methods

- `Output()`
- `Trigger(id, velocity)`

## Example

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
