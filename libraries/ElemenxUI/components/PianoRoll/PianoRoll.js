/*
 * The notes of a part, to see and to edit: the keys of a piano down the left (Low to High, MIDI numbers: C3 to C6 by
 * default), the beats across (Bars of Beats). Notes: [{ID, Note (MIDI), Start, Length (beats), Velocity (0 to 1)}].
 * A press on the grid puts a note there (as long as the last one, drag to make it longer), a drag moves the notes
 * selected (in time and in pitch), a drag of the end of a note resizes it; a double press takes a note away. Times
 * snap to Snap beats (a quarter: a sixteenth note). A press selects a note, Shift adds to the selection. Keys: Delete
 * takes the selected notes away, the arrows move them (a Snap, a semitone; Shift and Up or Down an octave), Shift and
 * Left or Right resize them, Mod+A selects every note, Escape none. Position is the playhead (beats; -1 for none), Loop
 * ({Start, End}) is marked on the ruler; a press on the ruler seeks. A press on a key of the piano emits key. Events:
 * change (Notes), select (the IDs selected), key (its MIDI number), seek (a beat).
 */
Elemenx.Component('PianoRoll', {
	$TemplateURL: 'PianoRoll.html',
	$StyleURL: 'PianoRoll.css',
	$Meta: {
		Group: 'music',
		Icon: 'grid',
		Description: 'The notes of a part on the keys of a piano, to see and to edit: put, move, resize and take away notes.',
		Events: {
			change: 'The notes changed: Notes.',
			select: 'The selection changed: the IDs of the notes.',
			key: 'A key of the piano was pressed: its MIDI number.',
			seek: 'The ruler was pressed: the beat.'
		},
		Props: {
			Notes: 'The notes: [{ID, Note (MIDI), Start, Length (beats), Velocity}].',
			Low: 'The lowest key (MIDI: 48, C3).',
			High: 'The highest key (MIDI: 84, C6).',
			Bars: 'The count of bars (4).',
			Beats: 'The beats of a bar (4).',
			Snap: 'The step of the times in beats (0.25).',
			BeatWidth: 'The width of a beat in pixels (48).',
			KeyHeight: 'The height of a key in pixels (16).',
			Position: 'The playhead in beats (-1: none).',
			Loop: 'The loop marked on the ruler: {Start, End} in beats, or null.',
			Selected: 'The IDs of the notes selected.',
			ReadOnly: 'Shows the notes without letting them change.',
			Height: 'The height in pixels (320).',
			Label: 'Its name for screen readers.'
		},
		Sample: {Notes: [{ID: 'a', Note: 60, Start: 0, Length: 1}, {ID: 'b', Note: 64, Start: 1, Length: 1}, {ID: 'c', Note: 67, Start: 2, Length: 2}], Bars: 2, Height: 220}
	},
	Notes: [],
	Low: 48,
	High: 84,
	Bars: 4,
	Beats: 4,
	Snap: 0.25,
	BeatWidth: 48,
	KeyHeight: 16,
	Position: -1,
	Loop: null,
	Selected: [],
	ReadOnly: false,
	Height: 320,
	Label: '',

	$OnCreate: function () {
		/* What renders nothing: a drag, the length of the last note put, the count of the IDs made. */
		var own = {Drag: null, Length: 1, Made: 0};

		this.Own = function () {
			return own;
		};
	},

	/* The notes in sight at first: the middle of their pitches (C4 without notes) in the middle of the roll. */
	$OnReady: function () {
		var scroll = this.$Element().querySelector('.elemenx-piano-roll-scroll');
		var notes = this.Notes || [];
		var middle = notes.length ? notes.reduce(function (sum, note) {
			return sum + Number(note.Note);
		}, 0) / notes.length : 60;

		if (scroll)
			scroll.scrollTop = Math.max(0, (Number(this.High) - middle) * Number(this.KeyHeight) - scroll.clientHeight / 2);
	},

	Editable: function () {
		return !(this.ReadOnly === true || this.ReadOnly === 'true');
	},

	Width: function () {
		return Math.max(1, Number(this.Bars) || 4) * Math.max(1, Number(this.Beats) || 4) * Number(this.BeatWidth);
	},

	BarList: function () {
		var list = [];
		var k;

		for (k = 0; k < Math.max(1, Number(this.Bars) || 4); k++) list.push(k);

		return list;
	},

	KeyList: function () {
		var audio = this.$Service('Audio');
		var keys = [];
		var midi;

		for (midi = Number(this.High); midi >= Number(this.Low); midi--) {
			keys.push({Midi: midi, Name: audio.NoteName(midi), Black: [1, 3, 6, 8, 10].indexOf((midi % 12 + 12) % 12) !== -1, C: (midi % 12 + 12) % 12 === 0});
		}

		return keys;
	},

	/* A beat to the step of Snap, down (or to the nearest). */
	Snapped: function (beat, nearest) {
		var snap = Number(this.Snap) > 0 ? Number(this.Snap) : 0.25;

		return (nearest ? Math.round(beat / snap) : Math.floor(beat / snap + 1e-9)) * snap;
	},

	/* The beat and the key under a point of the screen. */
	Cell: function (event) {
		var grid = this.$Element().querySelector('.elemenx-piano-roll-grid');
		var rect = grid.getBoundingClientRect();

		return {Beat: Math.max(0, (event.clientX - rect.left) / Number(this.BeatWidth)), Note: Number(this.High) - Math.floor((event.clientY - rect.top) / Number(this.KeyHeight)), X: event.clientX - rect.left};
	},

	/* The notes as new objects (a change is a new list), each with an ID. */
	Copy: function () {
		var own = this.Own();

		return (this.Notes || []).map(function (note) {
			return {ID: note.ID === undefined || note.ID === null ? 'n' + ++own.Made : note.ID, Note: Number(note.Note), Start: Number(note.Start), Length: Number(note.Length), Velocity: note.Velocity === undefined ? 0.8 : Number(note.Velocity)};
		});
	},

	Commit: function (notes) {
		this.Notes = notes;

		this.$Emit('change', notes);
	},

	Choose: function (ids) {
		this.Selected = ids;

		this.$Emit('select', ids);
	},

	Down: function (event) {
		var own = this.Own();
		var target = event.target.closest ? event.target.closest('.elemenx-piano-roll-note') : null;
		var cell;
		var id;
		var notes;
		var note;
		var selected;

		this.$Element().focus();

		if (!this.Editable() || (event.button !== undefined && event.button !== 0)) return;

		cell = this.Cell(event);
		notes = this.Copy();

		try {
			event.target.setPointerCapture(event.pointerId);
		}
		catch (error) {
			/* A pointer the browser does not know (made by a script): the drag works without the capture. */
		}

		if (target) {
			id = target.getAttribute('data-id');
			note = notes.filter(function (each) {
				return String(each.ID) === id;
			})[0];

			if (!note) return;

			selected = this.Selected.map(String);

			if (event.shiftKey) {
				selected = selected.indexOf(String(note.ID)) === -1 ? selected.concat([String(note.ID)]) : selected.filter(function (each) {
					return each !== String(note.ID);
				});
			}
			else if (selected.indexOf(String(note.ID)) === -1) {
				selected = [String(note.ID)];
			}

			this.Choose(this.IdsOf(notes, selected));

			/* The end of the note (its last 6 pixels): a resize; elsewhere a move of the selection. */
			own.Drag = {
				Kind: cell.X >= (note.Start + note.Length) * Number(this.BeatWidth) - 6 ? 'resize' : 'move',
				From: cell,
				Notes: notes,
				Moved: false
			};

			return;
		}

		note = {ID: 'n' + ++own.Made, Note: Math.max(Number(this.Low), Math.min(Number(this.High), cell.Note)), Start: this.Snapped(cell.Beat), Length: own.Length, Velocity: 0.8};

		while (notes.some(function (each) {
			return each.ID === note.ID;
		})) {
			note.ID = 'n' + ++own.Made;
		}

		notes.push(note);

		this.Notes = notes;

		this.Choose([note.ID]);

		own.Drag = {Kind: 'resize', From: {Beat: note.Start + note.Length, Note: note.Note, X: (note.Start + note.Length) * Number(this.BeatWidth)}, Notes: notes, Moved: true};

		this.$Emit('key', note.Note);
	},

	/* The IDs of the notes, as they are in the notes (a number stays a number). */
	IdsOf: function (notes, ids) {
		return notes.filter(function (note) {
			return ids.indexOf(String(note.ID)) !== -1;
		}).map(function (note) {
			return note.ID;
		});
	},

	Move: function (event) {
		var self = this;
		var drag = this.Own().Drag;
		var cell;
		var beats;
		var keys;
		var selected;

		if (!drag) return;

		cell = this.Cell(event);
		beats = cell.Beat - drag.From.Beat;
		keys = cell.Note - drag.From.Note;
		selected = this.Selected.map(String);

		if (!beats && !keys) return;

		drag.Moved = true;

		this.Notes = drag.Notes.map(function (note) {
			if (selected.indexOf(String(note.ID)) === -1) return note;

			if (drag.Kind === 'resize')
				return Object.assign({}, note, {Length: Math.max(self.Snap > 0 ? Number(self.Snap) : 0.25, self.Snapped(note.Length + beats, true))});

			return Object.assign({}, note, {Start: Math.max(0, self.Snapped(note.Start + beats, true)), Note: Math.max(Number(self.Low), Math.min(Number(self.High), note.Note + keys))});
		});
	},

	Up: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var resized;

		if (!drag) return;

		own.Drag = null;

		if (event.type === 'pointercancel') {
			this.Notes = drag.Notes;

			return;
		}

		if (!drag.Moved) return;

		/* The next note put is as long as the last one resized. */
		if (drag.Kind === 'resize') {
			resized = this.Notes.filter(function (note) {
				return note.ID === this.Selected[0];
			}, this)[0];

			if (resized)
				own.Length = resized.Length;
		}

		this.Commit(this.Notes.slice());
	},

	Double: function (event) {
		var target = event.target.closest ? event.target.closest('.elemenx-piano-roll-note') : null;
		var id;

		if (!target || !this.Editable()) return;

		id = target.getAttribute('data-id');

		this.Commit(this.Copy().filter(function (note) {
			return String(note.ID) !== id;
		}));

		this.Choose([]);
	},

	RulerDown: function (event) {
		var ruler = this.$Element().querySelector('.elemenx-piano-roll-ruler');
		var rect = ruler.getBoundingClientRect();

		this.$Emit('seek', Math.max(0, this.Snapped((event.clientX - rect.left) / Number(this.BeatWidth), true)));
	},

	KeyDown: function (event) {
		var note = Number(event.currentTarget.getAttribute('data-note'));

		this.$Emit('key', note);
	},

	Key: function (event) {
		var self = this;
		var selected = this.Selected.map(String);
		var snap = Number(this.Snap) > 0 ? Number(this.Snap) : 0.25;
		var notes;
		var change = null;

		if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
			event.preventDefault();

			this.Choose(this.Copy().map(function (note) {
				return note.ID;
			}));

			return;
		}

		if (event.key === 'Escape') {
			this.Choose([]);

			return;
		}

		if (!this.Editable() || !selected.length) return;

		notes = this.Copy();

		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();

			this.Commit(notes.filter(function (note) {
				return selected.indexOf(String(note.ID)) === -1;
			}));

			this.Choose([]);

			return;
		}

		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			var step = event.key === 'ArrowLeft' ? -snap : snap;

			change = event.shiftKey ? function (note) {
				return {Length: Math.max(snap, note.Length + step)};
			} : function (note) {
				return {Start: Math.max(0, note.Start + step)};
			};
		}
		else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			var keys = (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 12 : 1);

			change = function (note) {
				return {Note: Math.max(Number(self.Low), Math.min(Number(self.High), note.Note + keys))};
			};
		}

		if (!change) return;

		event.preventDefault();

		this.Commit(notes.map(function (note) {
			return selected.indexOf(String(note.ID)) === -1 ? note : Object.assign({}, note, change(note));
		}));
	}
});
