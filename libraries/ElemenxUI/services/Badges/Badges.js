/*
 * The badges of *badge and of the Badge of a Button. Describe(value) reads a value: a number (a count: 0 shows none,
 * more than Max (99) shows 99+), 'dot' (something new), 'busy' (a task that runs), another text, or {Value, Tone, Max,
 * Label}. It returns {Shown, Kind (count, dot, busy, text), Tone (accent, info, success, warning, danger: danger for a
 * count by default, accent otherwise), Text (what the badge shows), Label (what a screen reader says instead: Label,
 * or the phrase of a dot or a ring)}. Classes(value) are the classes of the badge for it.
 */
Elemenx.Service('Badges', {
	$Meta: {
		Description: 'The badges of *badge and of the Badge of a Button.',
		Methods: ['Describe(value)', 'Classes(value)']
	},
	Describe: function (value) {
		var options = value && typeof value === 'object' ? value : {Value: value};
		var shown = options.Value;
		var max = Number(options.Max) || 99;
		var count = typeof shown === 'number' || /^\d+$/.test(String(shown));
		var kind = shown === 'dot' || shown === 'busy' ? shown : count ? 'count' : 'text';

		return {
			Shown: !(shown === null || shown === undefined || shown === false || shown === '' || (count && !Number(shown))),
			Kind: kind,
			Tone: /^(accent|info|success|warning|danger)$/.test(options.Tone) ? options.Tone : count ? 'danger' : 'accent',
			Text: count ? (Number(shown) > max ? max + '+' : String(Number(shown))) : kind === 'text' ? String(shown) : '',
			Label: options.Label || (kind === 'dot' ? Elemenx.Locale.Text('ui.badge.new') : kind === 'busy' ? Elemenx.Locale.Text('ui.badge.busy') : '')
		};
	},

	Classes: function (value) {
		var badge = this.Describe(value);

		return ['elemenx-badge', 'overlay', badge.Kind, badge.Tone];
	}
});
