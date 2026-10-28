/*
 * The pads of a sampler, as on a drum machine: Pads [{ID, Label, Color, Key, Sample, Note}] in Columns (4). A pad
 * plays its Sample (a sound as the Audio Service decodes it: a URL, a Blob, an ArrayBuffer or an AudioBuffer), or its
 * Note on the Instrument (an Instrument of the Audio Service) when it has none. A press plays it, harder near its top
 * (or by the pressure of a pen); its Key of the keyboard plays it too. Mode oneshot (the default) plays a sample to its
 * end, hold stops it when the pad is let go. A sound file dropped on a pad is its sample from then (load tells it).
 * Trigger(id, velocity) plays a pad from code; Output() is the GainNode of its sound (a Spectrum hears it there).
 * Events: play ({ID, Velocity}), release ({ID}), load ({ID, File}), error (a sample it cannot read).
 */
Elemenx.Component('Sampler', {
	$TemplateURL: 'Sampler.html',
	$StyleURL: 'Sampler.css',
	$Meta: {
		Group: 'music',
		Icon: 'grid',
		Description: 'The pads of a sampler, as on a drum machine: each plays its sample (or a note of an instrument), by a press or a key.',
		Events: {
			play: 'A pad was played: {ID, Velocity}.',
			release: 'A pad was let go: {ID}.',
			load: 'A sound file was dropped on a pad: {ID, File}.',
			error: 'A sample cannot be read: the error, its ID the pad.'
		},
		Methods: ['Trigger(id, velocity)', 'Output()'],
		Props: {
			Pads: 'The pads: [{ID, Label, Color, Key, Sample, Note}].',
			Columns: 'The pads in a row (4).',
			Instrument: 'An Instrument of the Audio Service: it plays the Note of a pad without a Sample.',
			Mode: {Options: ['oneshot', 'hold'], Description: 'A sample plays to its end, or while the pad is held.'},
			Gain: 'The loudness of the samples, from 0 to 1 (0.8).',
			Label: 'Its name for screen readers.'
		},
		Sample: {Pads: [{ID: 'kick', Label: 'Kick', Key: 'Q'}, {ID: 'snare', Label: 'Snare', Key: 'W'}, {ID: 'hat', Label: 'Hat', Key: 'E'}, {ID: 'clap', Label: 'Clap', Key: 'R'}]}
	},
	Pads: [],
	Columns: 4,
	Instrument: null,
	Mode: 'oneshot',
	Gain: 0.8,
	Label: '',
	Lit: [],
	Over: null,
	/* The IDs of the pads whose sample is read. */
	Loaded: [],

	$OnCreate: function () {
		/* What renders nothing: the buffers of the pads (by ID, and the source each was read from), the sounds playing. */
		var own = {Buffers: {}, Sources: {}, Dropped: {}, Voices: {}, Output: null, Held: {}};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		this.Read();
	},

	$OnProps: function () {
		this.Read();
	},

	$OnDestroy: function () {
		var own = this.Own();

		Object.keys(own.Voices).forEach(function (id) {
			try {
				own.Voices[id].Source.stop();
			}
			catch (error) {
				/* Ended already. */
			}
		});

		if (own.Output)
			own.Output.disconnect();
	},

	/* The GainNode of the samples, made on the first sound. */
	Output: function () {
		var own = this.Own();
		var audio = this.$Service('Audio');

		if (!own.Output) {
			own.Output = audio.Context().createGain();

			own.Output.connect(audio.Context().destination);
		}

		own.Output.gain.value = this.Gain === undefined || this.Gain === null ? 0.8 : Number(this.Gain);

		return own.Output;
	},

	/* The samples of the pads, each read once for its source (a file dropped on a pad wins over its Sample). */
	Read: function () {
		var self = this;
		var own = this.Own();
		var audio = this.$Service('Audio');

		(this.Pads || []).forEach(function (pad) {
			var source = own.Dropped[pad.ID] || pad.Sample;
			if (!source || own.Sources[pad.ID] === source) return;

			own.Sources[pad.ID] = source;

			audio.Decode(source, function (error, buffer) {
				if (own.Sources[pad.ID] !== source) return;

				self.Loaded = self.Loaded.filter(function (each) {
					return each !== pad.ID;
				});

				if (error) {
					error.ID = pad.ID;
					own.Buffers[pad.ID] = null;

					self.$Emit('error', error);

					return;
				}

				own.Buffers[pad.ID] = buffer;
				self.Loaded = self.Loaded.concat([pad.ID]);
			});
		});
	},

	/* A pad that can sound: its sample read (loaded, the IDs of those), or a note and an Instrument. */
	Ready: function (pad, loaded) {
		return (loaded || this.Loaded).indexOf(pad.ID) !== -1 || (pad.Note !== undefined && pad.Note !== null && !!this.Instrument);
	},

	Pad: function (id) {
		return (this.Pads || []).filter(function (pad) {
			return String(pad.ID) === String(id);
		})[0] || null;
	},

	Light: function (id, on) {
		var lit = this.Lit.filter(function (each) {
			return each !== id;
		});

		this.Lit = on ? lit.concat([id]) : lit;
	},

	Trigger: function (id, velocity) {
		var self = this;
		var own = this.Own();
		var pad = this.Pad(id);
		var level = velocity === undefined || velocity === null ? 0.8 : Math.max(0, Math.min(1, Number(velocity)));
		var buffer;
		var context;
		var source;
		var gain;

		if (!pad)
			return false;

		buffer = own.Buffers[pad.ID];

		if (buffer) {
			context = this.$Service('Audio').Context();

			if (context.state === 'suspended')
				context.resume();

			/* The pad again: the sound before it stops (a choke, as on a drum machine). */
			this.Choke(pad.ID);

			source = context.createBufferSource();
			gain = context.createGain();
			source.buffer = buffer;
			gain.gain.value = level;

			source.connect(gain);
			gain.connect(this.Output());

			source.start();

			own.Voices[pad.ID] = {Source: source, Gain: gain};

			source.onended = function () {
				if (own.Voices[pad.ID] && own.Voices[pad.ID].Source === source)
					delete own.Voices[pad.ID];

				gain.disconnect();
			};
		}
		else if (pad.Note !== undefined && pad.Note !== null && this.Instrument) {
			this.Instrument.Play(pad.Note, {Velocity: level, Duration: this.Mode === 'hold' ? null : 0.3});
		}
		else {
			return false;
		}

		this.Light(pad.ID, true);

		/* A one-shot lights a moment; a held pad until it is let go. */
		if (!own.Held[pad.ID]) {
			setTimeout(function () {
				if (!own.Held[pad.ID])
					self.Light(pad.ID, false);
			}, 120);
		}

		this.$Emit('play', {ID: pad.ID, Velocity: level});

		return true;
	},

	Choke: function (id) {
		var voice = this.Own().Voices[id];
		if (!voice) return;

		try {
			voice.Gain.gain.setTargetAtTime(0, voice.Gain.context.currentTime, 0.01);
			voice.Source.stop(voice.Gain.context.currentTime + 0.05);
		}
		catch (error) {
			/* Ended already. */
		}

		delete this.Own().Voices[id];
	},

	/* Harder near the top of the pad, or as hard as a pen presses. */
	Velocity: function (event) {
		var rect = event.currentTarget.getBoundingClientRect();

		if (event.pointerType === 'pen' && event.pressure > 0) return Math.max(0.1, Math.min(1, event.pressure));

		return Math.max(0.2, Math.min(1, 1 - (event.clientY - rect.top) / (rect.height || 1) * 0.7));
	},

	Down: function (event) {
		var id = event.currentTarget.getAttribute('data-id');
		var pad = this.Pad(id);
		if (!pad || (event.button !== undefined && event.button !== 0)) return;

		this.Own().Held[pad.ID] = true;

		this.Trigger(pad.ID, this.Velocity(event));
	},

	Up: function (event) {
		var id = event.currentTarget.getAttribute('data-id');
		var pad = this.Pad(id);
		var own = this.Own();
		if (!pad || !own.Held[pad.ID]) return;

		this.Let(pad);
	},

	/* A pad let go: unlit, stopped in hold, release. */
	Let: function (pad) {
		var own = this.Own();

		delete own.Held[pad.ID];

		this.Light(pad.ID, false);

		if (this.Mode === 'hold') {
			this.Choke(pad.ID);

			if (!own.Buffers[pad.ID] && this.Instrument && pad.Note !== undefined && pad.Note !== null)
				this.Instrument.Release(pad.Note);
		}

		this.$Emit('release', {ID: pad.ID});
	},

	/* The pad of a key of the keyboard (its Key, in any case). */
	PadOfKey: function (event) {
		var key = String(event.key || '').toLowerCase();

		return (this.Pads || []).filter(function (pad) {
			return pad.Key && String(pad.Key).toLowerCase() === key;
		})[0] || null;
	},

	KeyDown: function (event) {
		var pad = this.PadOfKey(event);
		if (!pad || event.ctrlKey || event.metaKey || event.altKey) return;

		event.preventDefault();

		if (event.repeat) return;

		this.Own().Held[pad.ID] = true;

		this.Trigger(pad.ID, 0.8);
	},

	KeyUp: function (event) {
		var pad = this.PadOfKey(event);
		if (!pad || !this.Own().Held[pad.ID]) return;

		this.Let(pad);
	},

	DragOver: function (event) {
		if (!event.dataTransfer) return;

		event.preventDefault();

		this.Over = event.currentTarget.getAttribute('data-id');
	},

	DragLeave: function () {
		this.Over = null;
	},

	Drop: function (event) {
		var id = event.currentTarget.getAttribute('data-id');
		var pad = this.Pad(id);
		var file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;

		event.preventDefault();

		this.Over = null;

		if (!pad || !file) return;

		this.Own().Dropped[pad.ID] = file;

		this.Read();

		this.$Emit('load', {ID: pad.ID, File: file});
	}
});
