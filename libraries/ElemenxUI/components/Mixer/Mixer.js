/*
 * An audio mixer (the look and the controls; the sound is the application's): a row of MixerChannel strips and the
 * strip of the master bus at the end. Channels: [{ID, Label, Color, Volume, Pan, Mute, Solo, Level, Peak, Knobs}];
 * Master: the same for the master bus, or null. Min and Max bound the faders in decibels. While a channel is on Solo,
 * the others are left out of the mix and dim (Silenced). The mixer keeps what its strips change in their channels.
 * Events: change ({ID, Key, Value}): ID is the ID of the channel, or 'master'.
 */
Elemenx.Component('Mixer', {
	$TemplateURL: 'Mixer.html',
	$StyleURL: 'Mixer.css',
	$Meta: {
		Group: 'music',
		Icon: 'headphones',
		Description: 'An audio mixer (the look and the controls; the sound is the application\'s): a row of MixerChannel strips and the strip of the master bus at the end.',
		Events: {
			change: 'A control of a strip changed: {ID (the channel, or \'master\'), Key, Value}.'
		},
		Props: {
			Channels: 'The strips: [{ID, Label, Color, Volume, Pan, Mute, Solo, Level, Peak, Knobs}].',
			Master: 'The strip of the master bus (null for none).',
			Min: 'The bottom of the faders, in decibels.',
			Max: 'The top of the faders, in decibels.',
			Label: 'The name of the mixer for screen readers.'
		},
		Sample: {Label: 'Studio'}
	},
	Channels: [],
	Master: null,
	Min: -60,
	Max: 6,
	Label: '',
	Version: 0,

	$OnCreate: function () {
		/* Whether a channel is on Solo: then the others are left out (again on a new Version, when a Solo turned). */
		this.Soloing = function (channels) {
			return (channels || []).some(function (channel) {
				return !!channel.Solo;
			});
		};

		this.Value = function (value, fallback) {
			return value === undefined || value === null ? fallback : value;
		};
	},

	/* A strip changed: its channel keeps it, and the mixer tells. */
	Changed: function (detail) {
		var channel = detail.ID === 'master' ? this.Master : (this.Channels || []).filter(function (entry) {
			return entry.ID === detail.ID;
		})[0];
		if (channel && /^(Volume|Pan|Mute|Solo)$/.test(detail.Key))
			channel[detail.Key] = detail.Value;

		if (detail.Key === 'Solo')
			this.Version++;

		this.$Emit('change', detail);
	}
});
