<!-- generated -->
# PianoRoll

The notes of a part, to see and to edit: the keys of a piano down the left (Low to High, MIDI numbers: C3 to C6 by default), the beats across (Bars of Beats). Notes: [{ID, Note (MIDI), Start, Length (beats), Velocity (0 to 1)}]. A press on the grid puts a note there (as long as the last one, drag to make it longer), a drag moves the notes selected (in time and in pitch), a drag of the end of a note resizes it; a double press takes a note away. Times snap to Snap beats (a quarter: a sixteenth note). A press selects a note, Shift adds to the selection. Keys: Delete takes the selected notes away, the arrows move them (a Snap, a semitone; Shift and Up or Down an octave), Shift and Left or Right resize them, Mod+A selects every note, Escape none. Position is the playhead (beats; -1 for none), Loop ({Start, End}) is marked on the ruler; a press on the ruler seeks. A press on a key of the piano emits key. Events: change (Notes), select (the IDs selected), key (its MIDI number), seek (a beat).

## Properties

| Property | Default |
| --- | --- |
| `Notes` | `[]` |
| `Low` | `48` |
| `High` | `84` |
| `Bars` | `4` |
| `Beats` | `4` |
| `Snap` | `0.25` |
| `Position` | `-1` |
| `Loop` | `null` |
| `ReadOnly` | `false` |
| `Label` | `''` |

## Events

- `change`: The notes changed: Notes.
- `select`: The selection changed: the IDs of the notes.
- `key`: A key of the piano was pressed: its MIDI number.
- `seek`: The ruler was pressed: the beat.

## Example

```example
<div class="docs-stack">
	<div class="docs-row">
		<Button [label]="Playing ? 'Stop' : 'Play'" [icon]="Playing ? 'pause' : 'play'" (click)="Toggle" />
		<Checkbox Label="Metronome" [checked]="Metronome" (change)="Clicked" />
		<Checkbox Label="Loop" [checked]="Looping" (change)="Looped" />
	</div>
	<PianoRoll [notes]="Notes" Bars="2" [position]="Position" [loop]="Looping ? {Start: 0, End: 8} : null" Height="260" (change)="Changed" (key)="Preview" (seek)="Seek" />
	<p class="elemenx-text small muted">Press the grid to put a note, drag it to move it, drag its end to resize it; a double press takes it away. Delete, the arrows and Shift edit the notes selected.</p>
</div>
<script>
(function () {
	var transport = null;
	var synth = null;
	var frame = 0;

	return {
		Notes: [
			{ID: 'a', Note: 60, Start: 0, Length: 1}, {ID: 'b', Note: 64, Start: 1, Length: 1}, {ID: 'c', Note: 67, Start: 2, Length: 1},
			{ID: 'd', Note: 72, Start: 3, Length: 1}, {ID: 'e', Note: 71, Start: 4, Length: 0.5}, {ID: 'f', Note: 67, Start: 4.5, Length: 0.5},
			{ID: 'g', Note: 64, Start: 5, Length: 1}, {ID: 'h', Note: 62, Start: 6, Length: 2}
		],
		Playing: false,
		Metronome: false,
		Looping: true,
		Position: -1,

		/* The instrument and the transport of the Audio Service, made at the first sound (after a press: the browser asks it). */
		Audio: function () {
			var audio = this.$Service('Audio');

			if (!transport) {
				synth = audio.Instrument({Wave: 'triangle', Envelope: {Attack: 0.01, Decay: 0.2, Sustain: 0.5, Release: 0.3}, Gain: 0.3});
				transport = audio.Transport({Bpm: 110, Instrument: synth});
				transport.On('end', this.Ended.bind(this));
			}

			transport.Set({Notes: this.Notes, Metronome: this.Metronome, Loop: this.Looping ? {Start: 0, End: 8} : null});

			return transport;
		},

		$OnDestroy: function () {
			cancelAnimationFrame(frame);

			if (transport)
				transport.Destroy();

			if (synth)
				synth.Destroy();
		},

		/* The playhead follows the transport, a frame at a time. */
		Follow: function () {
			var self = this;

			cancelAnimationFrame(frame);

			(function step () {
				if (!transport || !transport.Playing) return;

				self.Position = transport.Position();
				frame = requestAnimationFrame(step);
			})();
		},

		Toggle: function () {
			if (this.Playing) {
				transport.Stop();
				this.Ended();

				return;
			}

			this.Audio().Play();
			this.Playing = true;
			this.Follow();
		},

		Ended: function () {
			this.Playing = false;
			this.Position = -1;
		},

		Changed: function (notes) {
			this.Notes = notes;

			if (transport)
				transport.Set({Notes: notes});
		},

		Preview: function (note) {
			this.Audio();
			synth.Play(note, {Duration: 0.3});
		},

		Seek: function (beat) {
			this.Audio().Seek(beat);
			this.Position = beat;
		},

		Clicked: function (value) {
			this.Metronome = value;

			if (transport)
				transport.Set({Metronome: value});
		},

		Looped: function (value) {
			this.Looping = value;

			if (transport)
				transport.Set({Loop: value ? {Start: 0, End: 8} : null});
		}
	};
})()
</script>
```

## Tests

- [names notes, their MIDI numbers and their pitches](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L94) — `tests/regression/library-music.test.js`
- [a synth plays a note at its pitch and lets it go; a sampler plays its sample faster for a higher note](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L112) — `tests/regression/library-music.test.js`
- [a transport plays its notes and its beats on time, goes round its loop, and stops after its last note](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L177) — `tests/regression/library-music.test.js`
- [PianoRoll puts, moves, resizes and takes away notes by the pointer and by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L247) — `tests/regression/library-music.test.js`
- [PianoRoll opens on its notes, also when it is put in the page after it is made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L359) — `tests/regression/library-music.test.js`
- [PianoRoll is as wide as its place, its grid scrolling inside it: it does not widen a column of a grid (a phone)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L390) — `tests/regression/library-music.test.js`
- [Sampler plays a pad by a press (harder near its top) and by its key, holds it in hold mode, and takes a file dropped on it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-music.test.js#L400) — `tests/regression/library-music.test.js`
