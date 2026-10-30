<!-- generated -->
# Piano

The keys of a piano (the look and the controls; the sound is the application's). From is the first note (C3), Octaves how many octaves follow it (and their last C). A press plays a note, a slide over the keys plays the ones it crosses, several fingers play a chord; the lower on a key the press, the louder (Velocity from 1 to 127). While it has the focus, the keys of the computer play it too: A W S E D F T G Y H U J K O L P ; ' from the first C on, Z and X shift them an octave down and up.

- Pressed: notes shown played (a song, a MIDI keyboard); Marks: {note: class} marks notes (a scale, a chord), true for the mark of the theme. Notes are written as C4, C#4, Db4 or MIDI numbers.
- Labels: what the keys show. 'none'; 'c' (the name of every C, the default); 'notes' (the name of every note, without its octave: C, C#, D...); 'all' (with its octave: C4, C#4...); 'keys' (the key of the computer that plays it, as it is now, Z and X included); 'both' (the note and that key). Size: small, medium or large.

Events: noteon ({Note, Midi, Velocity}), noteoff ({Note, Midi}).

## Properties

| Property | Default |
| --- | --- |
| `From` | `'C3'` |
| `Octaves` | `2` |
| `Pressed` | `[]` |
| `Marks` | `{}` |
| `Labels` | `'c'` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Disabled` | `false` |

## Events

- `noteon`: A note started: {Note, Midi, Velocity}.
- `noteoff`: A note ended: {Note, Midi}.

## Example

```example
<RadioGroup Variant="segmented" Label="Labels" [options]="Modes" [value]="Labels" (change)="Labelled" />
<Piano From="C4" Octaves="2" [labels]="Labels" [pressed]="Down" [marks]="Scale" (noteon)="NoteOn" (noteoff)="NoteOff" />
<p class="elemenx-text small muted">{{Note}} · the marked notes are the C major scale; with the focus, A W S E D... play it, Z and X shift an octave.</p>
<Piano From="C4" Octaves="1" Size="small" Labels="all" [pressed]="['C#4', 'F#4', 'A#4']" />
<script>
({
	Note: 'Press a key',
	Labels: 'both',
	Modes: [{Value: 'none', Label: 'none'}, {Value: 'c', Label: 'c'}, {Value: 'notes', Label: 'notes'}, {Value: 'all', Label: 'all'}, {Value: 'keys', Label: 'keys'}, {Value: 'both', Label: 'both'}],
	Down: [],
	Scale: {C4: true, D4: true, E4: true, F4: true, G4: true, A4: true, B4: true, C5: true},

	Labelled: function (value) {
		this.Labels = value;
	},

	NoteOn: function (event) {
		this.Down = this.Down.concat([event.Note]);
		this.Note = event.Note + ' (MIDI ' + event.Midi + ', velocity ' + event.Velocity + ')';
	},

	NoteOff: function (event) {
		this.Down = this.Down.filter(function (note) {
			return note !== event.Note;
		});
	}
})
</script>
```

## Tests

- [a piano plays the key pressed, louder lower on it, slides over keys, takes the keys of the computer and marks notes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3474) — `tests/examples/ui-kit.spec.js`
