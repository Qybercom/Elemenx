/*
 * The keys of a piano (the look and the controls; the sound is the application's). From is the first note (C3),
 * Octaves how many octaves follow it (and their last C). A press plays a note, a slide over the keys plays the ones it
 * crosses, several fingers play a chord; the lower on a key the press, the louder (Velocity from 1 to 127). While it
 * has the focus, the keys of the computer play it too: A W S E D F T G Y H U J K O L P ; ' from the first C on, Z and
 * X shift them an octave down and up.
 * - Pressed: notes shown played (a song, a MIDI keyboard); Marks: {note: class} marks notes (a scale, a chord), true
 *   for the mark of the theme. Notes are written as C4, C#4, Db4 or MIDI numbers.
 * - Labels: what the keys show. 'none'; 'c' (the name of every C, the default); 'notes' (the name of every note,
 *   without its octave: C, C#, D...); 'all' (with its octave: C4, C#4...); 'keys' (the key of the computer that plays
 *   it, as it is now, Z and X included); 'both' (the note and that key). Size: small, medium or large.
 * Events: noteon ({Note, Midi, Velocity}), noteoff ({Note, Midi}).
 */
Elemenx.Component('Piano', {
	$TemplateURL: 'Piano.html',
	$StyleURL: 'Piano.css',
	$Meta: {
		Group: 'music',
		Icon: 'volume',
		Description: 'The keys of a piano (the look and the controls; the sound is the application\'s).',
		Events: {
			noteon: 'A note started: {Note, Midi, Velocity}.',
			noteoff: 'A note ended: {Note, Midi}.'
		},
		Props: {
			From: 'The first note (C3).',
			Octaves: 'How many octaves follow it.',
			Pressed: 'The notes shown played.',
			Marks: 'Marks notes: {note: class}, true for the mark of the theme.',
			Labels: {Options: ['none', 'c', 'notes', 'all', 'keys', 'both'], Description: 'What the keys show: none, c, notes, all, keys or both.'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Label: 'The name of the piano for screen readers.',
			Disabled: 'Turns it off.'
		},
		Sample: {From: 'C4'}
	},
	From: 'C3',
	Octaves: 2,
	Pressed: [],
	Marks: {},
	Labels: 'c',
	Size: 'medium',
	Label: '',
	Disabled: false,
	Playing: [],
	Shift: 0,

	$OnCreate: function () {
		var self = this;
		var names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		var flats = {Db: 1, Eb: 3, Gb: 6, Ab: 8, Bb: 10};

		this.Fingers = {};

		/* The MIDI number of a note: C4 is 60. */
		this.Midi = function (note) {
			var match;
			var index;

			if (typeof note === 'number' || /^\d+$/.test(String(note))) return Number(note);

			match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(String(note || ''));

			if (!match)
				return null;

			index = match[2] === 'b' ? flats[match[1].toUpperCase() + 'b'] : names.indexOf(match[1].toUpperCase() + match[2]);

			if (index === undefined || index === -1) return null;

			return (Number(match[3]) + 1) * 12 + index;
		};

		this.Note = function (midi) {
			return names[midi % 12] + (Math.floor(midi / 12) - 1);
		};

		/* The keys: white ones in a row, black ones over the gaps between them, in percents of the width. */
		this.Keys = function (from, octaves) {
			var first = self.Midi(from);
			var count = Math.max(1, Math.floor(Number(octaves) || 1)) * 12 + 1;
			var whites = 0;
			var keys = [];
			var i = 0;
			var midi;

			if (first === null)
				first = 48;

			for (i = 0; i < count; i++) {
				if (!/#/.test(names[(first + i) % 12]))
					whites++;
			}

			i = 0;

			while (i < count) {
				midi = first + i;

				if (/#/.test(names[midi % 12])) keys.push({Midi: midi, Note: self.Note(midi), Black: true, Style: 'left: calc(' + (keys.filter(self.White).length * 100 / whites) + '% - ' + (30 / whites) + '%); width: ' + (60 / whites) + '%;'});
				else keys.push({Midi: midi, Note: self.Note(midi), Black: false, Style: ''});

				i++;
			}

			return keys;
		};

		/* The first C at From or after it: the key A of the computer plays it. */
		this.Base = function (from) {
			var first = self.Midi(from);
			if (first === null)
				first = 48;

			return first % 12 ? first + 12 - first % 12 : first;
		};

		this.White = function (key) {
			return !key.Black;
		};

		this.Lit = function (midi, pressed, playing) {
			return playing.indexOf(midi) !== -1 || (pressed || []).some(function (note) {
				return self.Midi(note) === midi;
			});
		};

		/* The mark of a note: the class Marks gives it, 'marked' for true. */
		this.Mark = function (midi, marks) {
			var mark = null;

			Object.keys(marks || {}).forEach(function (note) {
				if (self.Midi(note) === midi)
					mark = marks[note];
			});

			if (!mark)
				return '';

			return mark === true ? 'marked' : String(mark).split(/\s+/).filter(function (name) {
				return /^[A-Za-z][\w-]*$/.test(name);
			}).join(' ');
		};

		/* The name a key shows under Labels (see the head of this file); shift is the octave Z and X chose. */
		this.Name = function (key, labels, shift) {
			if (labels === 'all' || (labels === 'c' && key.Note.charAt(0) === 'C' && !key.Black)) return key.Note;

			if (labels === 'notes')
				return key.Note.replace(/-?\d+$/, '');

			if (labels === 'keys')
				return self.Typing(key.Midi, shift);

			return '';
		};

		/* The key of the computer that plays a note now ('' for none): the label of its code, A for KeyA, ; for Semicolon. */
		this.Typing = function (midi, shift) {
			var code = self.ComputerKeys[midi - self.Base(self.From) - (shift || 0)];
			if (!code)
				return '';

			return code === 'Semicolon' ? ';' : code === 'Quote' ? "'" : code.replace(/^Key/, '');
		};
	},

	Start: function (midi, velocity) {
		if (this.Playing.indexOf(midi) !== -1) return;

		this.Playing = this.Playing.concat([midi]);

		this.$Emit('noteon', {Note: this.Note(midi), Midi: midi, Velocity: velocity});
	},

	Stop: function (midi) {
		if (this.Playing.indexOf(midi) === -1) return;

		this.Playing = this.Playing.filter(function (note) {
			return note !== midi;
		});

		this.$Emit('noteoff', {Note: this.Note(midi), Midi: midi});
	},

	/* The key under a point, and how hard it is pressed there: the lower, the louder. */
	At: function (x, y) {
		var node = (this.$Element().ownerDocument || document).elementFromPoint(x, y);
		var key = node && node.closest && node.closest('.elemenx-piano-key');
		var rect;

		if (!key || !this.$Element().contains(key)) return null;

		rect = key.getBoundingClientRect();

		return {Midi: Number(key.getAttribute('data-midi')), Velocity: Math.max(1, Math.min(127, Math.round(40 + 87 * (y - rect.top) / rect.height)))};
	},

	Down: function (event, node) {
		var hit;

		if (this.Disabled || event.button > 0) return;

		event.preventDefault();

		node.focus();
		node.setPointerCapture(event.pointerId);

		hit = this.At(event.clientX, event.clientY);

		this.Fingers[event.pointerId] = hit ? hit.Midi : null;

		if (hit)
			this.Start(hit.Midi, hit.Velocity);
	},

	/* A finger that slides onto another key lets the first go and plays the other. */
	Move: function (event) {
		var before = this.Fingers[event.pointerId];
		var hit;

		if (before === undefined) return;

		hit = this.At(event.clientX, event.clientY);

		if ((hit ? hit.Midi : null) === before) return;

		if (before !== null)
			this.Stop(before);

		this.Fingers[event.pointerId] = hit ? hit.Midi : null;

		if (hit)
			this.Start(hit.Midi, hit.Velocity);
	},

	Up: function (event) {
		var before = this.Fingers[event.pointerId];

		delete this.Fingers[event.pointerId];

		if (before !== undefined && before !== null)
			this.Stop(before);
	},

	/* The keys of the computer: two rows from the first C on, Z and X an octave down and up. */
	ComputerKeys: ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon', 'Quote'],

	Typed: function (event) {
		var index = this.ComputerKeys.indexOf(event.code);

		if (this.Disabled || event.ctrlKey || event.metaKey || event.altKey) return;

		if (event.code === 'KeyZ' || event.code === 'KeyX') {
			event.preventDefault();

			this.Shift += event.code === 'KeyZ' ? -12 : 12;

			return;
		}

		if (index === -1 || event.repeat) return;

		event.preventDefault();

		this.Start(this.Base(this.From) + index + this.Shift, 96);
	},

	Released: function (event) {
		var index = this.ComputerKeys.indexOf(event.code);
		var self = this;

		if (index === -1) return;

		this.Playing.filter(function (midi) {
			return midi - self.Base(self.From) - self.Shift === index;
		}).forEach(function (midi) {
			self.Stop(midi);
		});
	},

	/* Asleep (Elemenx.Cache keeps it out of the page) no note keeps sounding. */
	$OnSleep: function () {
		this.Blurred();
	},

	/* Without the focus no key stays down. */
	Blurred: function () {
		var self = this;

		this.Fingers = {};

		this.Playing.slice().forEach(function (midi) {
			self.Stop(midi);
		});
	}
});
