/*
 * A channel strip of an audio mixer (the look and the controls; the sound is the application's): its Label, Knobs
 * (an equalizer, sends: [{Label, Value, Min, Max, Origin, Default, Unit}]), the Pan (-100 left to 100 right), the
 * buttons Mute and Solo, the fader of its Volume in decibels between Min and Max, and the meter of its Level beside
 * it: a level in decibels, or [left, right] for stereo, with the Peak held over it. Master is the strip of the master
 * bus (no Solo); Silenced dims a strip another one's Solo leaves out (the Mixer sets it); Color marks the strip.
 * Events: change ({ID, Key, Value}): Key is Volume, Pan, Mute, Solo or the Label of a knob.
 */
Elemenx.Component('MixerChannel', {
	$TemplateURL: 'MixerChannel.html',
	$StyleURL: 'MixerChannel.css',
	$Meta: {
		Group: 'music',
		Icon: 'headphones',
		Description: 'A channel strip of an audio mixer (the look and the controls; the sound is the application\'s): its Label, Knobs (an equalizer, sends: [{Label, Value, Min, Max, Origin, Default, Unit}]), the Pan (-100 left to 100 right), the buttons Mute and Solo, the fader of its Volume in decibels between Min and Max, and the meter of its Level beside it: a level in decibels, or [left, right] for stereo, with the Peak held over it.',
		Events: ['change'],
		Props: {
			ID: 'The ID of the channel, in its events.',
			Label: 'The name of the strip.',
			Color: 'A color that marks the strip.',
			Volume: 'The fader, in decibels.',
			Min: 'The bottom of the fader, in decibels.',
			Max: 'The top of the fader, in decibels.',
			Pan: 'The balance: -100 left to 100 right.',
			ShowPan: 'Shows the knob of the pan.',
			Mute: 'Silences the channel.',
			Solo: 'Leaves the other channels out of the mix.',
			Master: 'The strip of the master bus (no Solo).',
			Silenced: 'Dims a strip that the Solo of another one leaves out.',
			Level: 'The level of the meter, in decibels: a number, or [left, right].',
			Peak: 'The peak held over the meter.',
			Knobs: 'Knobs above the pan: [{Label, Value, Min, Max, Origin, Default, Unit}].',
			Disabled: 'Turns it off: it takes no input and looks so.'
		},
		Sample: {ID: 'guitar', Label: 'Guitar', Color: '#30a46c', Level: [-14, -16], Peak: [-8, -9], Knobs: [{Label: 'Gain', Value: 4, Min: 0, Max: 12, Unit: ' dB'}]}
	},
	ID: null,
	Label: '',
	Color: '',
	Volume: 0,
	Min: -60,
	Max: 6,
	Pan: 0,
	ShowPan: true,
	Mute: false,
	Solo: false,
	Master: false,
	Silenced: false,
	Level: null,
	Peak: null,
	Knobs: [],
	Disabled: false,

	$OnCreate: function () {
		var self = this;

		/* The share of the meter a level in decibels takes, from 0 to 1. */
		this.Share = function (db) {
			var min = Number(self.Min);
			var max = Number(self.Max);

			if (db === null || db === undefined || db === '' || isNaN(Number(db))) return 0;

			return Math.max(0, Math.min(1, (Number(db) - min) / (max - min)));
		};

		/* The bars of the meter: one level, or the two of a stereo channel. */
		this.Bars = function (level, peak) {
			var levels = Array.isArray(level) ? level : [level];
			var peaks = Array.isArray(peak) ? peak : levels.map(function () {
				return peak;
			});

			return levels.map(function (value, index) {
				return {Key: index, Style: '--elemenx-mixer-level: ' + self.Share(value) + '; --elemenx-mixer-peak: ' + self.Share(peaks[index]) + ';', Peak: peaks[index] !== null && peaks[index] !== undefined};
			});
		};

		/* The marks of the fader: the usual points of a scale of decibels within Min and Max. */
		this.Scale = function (min, max) {
			return [6, 0, -6, -12, -24, -40, -60].filter(function (value) {
				return value >= Number(min) && value <= Number(max);
			});
		};

		/* The volume as a mixer writes it: +3.5, 0.0, -12.0, and -∞ at the bottom of the fader. */
		this.Decibels = function (value) {
			value = Number(value);

			if (value <= Number(self.Min)) return '-∞';

			return (value > 0 ? '+' : '') + value.toFixed(1);
		};

		this.Style = function (color) {
			return color ? '--elemenx-mixer-color: ' + color + ';' : '';
		};
	},

	Changed: function (key, value) {
		this.$Emit('change', {ID: this.ID, Key: key, Value: value});
	},

	Faded: function (value) {
		this.Volume = value;

		this.Changed('Volume', value);
	},

	Panned: function (value) {
		this.Pan = value;

		this.Changed('Pan', value);
	},

	Turned: function (value, knob) {
		var label = knob && knob.Label;

		(this.Knobs || []).forEach(function (entry) {
			if (entry.Label === label)
				entry.Value = value;
		});

		this.Changed(label, value);
	},

	MuteToggled: function () {
		this.Mute = !this.Mute;

		this.Changed('Mute', this.Mute);
	},

	SoloToggled: function () {
		this.Solo = !this.Solo;

		this.Changed('Solo', this.Solo);
	}
});
