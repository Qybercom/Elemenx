/*
 * The strength of a signal: bars that grow from left to right, as many lit as it is strong (a connection of a call, a
 * network, the ping of a game). Value from 0 to 1, or Quality good, fair or poor (the bars of each: all of them, about
 * two thirds, one); Bars is how many there are (3). The lit bars take a color of their level: success when strong,
 * warning when fair, danger when poor (Tone of its own: accent, success, warning, danger or muted). Size small or
 * medium. An image for screen readers, named by Label or by the phrase of its level.
 */
Elemenx.Component('Signal', {
	$TemplateURL: 'Signal.html',
	$StyleURL: 'Signal.css',
	$Meta: {
		Group: 'display',
		Icon: 'chart',
		Description: 'The strength of a signal: bars that grow from left to right, as many lit as it is strong.',
		Props: {
			Value: 'How strong it is, from 0 to 1.',
			Quality: {Options: ['', 'good', 'fair', 'poor'], Description: 'good, fair or poor, in place of Value.'},
			Bars: 'How many bars (3).',
			Tone: {Options: ['', 'accent', 'success', 'warning', 'danger', 'muted'], Description: 'The color of the lit bars; by default the one of its level.'},
			Size: {Options: ['small', 'medium'], Description: 'small or medium.'},
			Label: 'Its name for screen readers (the phrase of its level by default).'
		},
		Sample: {Quality: 'fair'}
	},
	Value: 1,
	Quality: '',
	Bars: 3,
	Tone: '',
	Size: 'medium',
	Label: '',

	$OnCreate: function () {
		var self = this;

		/* Its strength, 0 to 1: of its Quality when it has one, else its Value. */
		this.Level = function (value, quality) {
			var levels = {good: 1, fair: 0.66, poor: 0.33};
			if (levels[quality] !== undefined) return levels[quality];

			return Math.max(0, Math.min(1, Number(value) || 0));
		};

		/* The bars: each a height of its place, lit up to the strength (a strength above 0 lights one at least). */
		this.Lines = function (count, value, quality) {
			var total = Math.max(1, Math.round(Number(count) || 3));
			var level = self.Level(value, quality);
			var lit = level > 0 ? Math.max(1, Math.round(level * total)) : 0;
			var lines = [];
			var i;

			for (i = 0; i < total; i++) {
				lines.push({Key: i, On: i < lit, Height: Math.round((i + 1) / total * 100) + '%'});
			}

			return lines;
		};

		this.ToneOf = function (tone, value, quality) {
			var level = self.Level(value, quality);

			if (tone)
				return tone;

			/* Above two thirds strong, above a third fair (fair is two thirds, poor a third), else poor. */
			return level > 0.67 ? 'success' : level > 0.34 ? 'warning' : 'danger';
		};

		this.Name = function (label, value, quality) {
			var level = self.Level(value, quality);

			if (label)
				return label;

			if (quality === 'good' || quality === 'fair' || quality === 'poor') return Elemenx.Locale.Text('ui.signal.' + quality);

			return Elemenx.Locale.Text('ui.signal.level', {percent: Math.round(level * 100)});
		};
	}
});
