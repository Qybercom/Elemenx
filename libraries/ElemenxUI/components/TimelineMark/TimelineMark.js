/*
 * A mark of a Timeline, declared in it: a moment (At) with its Label, Text, Icon, Tone (accent, info, success,
 * warning, danger or muted) and Side (before: above the axis, or left of a vertical one; after: under it, or right).
 * What is inside it is its label instead of Label (any content). It shows nothing by itself: the Timeline draws it.
 */
Elemenx.Component('TimelineMark', {
	$TemplateURL: 'TimelineMark.html',
	$Meta: {
		Group: 'data',
		Icon: 'flag',
		Description: 'A mark of a Timeline: a moment with its label, above or under the axis; any content inside it is its label.',
		Container: true,
		Props: {
			ID: 'The ID of the mark.',
			At: 'Its moment: a date (YYYY-MM-DD, YYYY-MM-DDTHH:mm) or a number.',
			Label: 'Its label.',
			Text: 'A text under its label.',
			Icon: 'An icon in its point and its label.',
			Tone: 'Its color: accent, info, success, warning, danger or muted.',
			Side: 'before (above the axis) or after (under it, the default).'
		},
		Sample: {ID: 'release', At: '2026-11-01', Label: 'Release'}
	},
	ID: '',
	At: '',
	Label: '',
	Text: '',
	Icon: '',
	Tone: '',
	Side: '',

	$OnCreate: function () {
		/* What it declares, as the Timeline reads it (a template calls it with its props). */
		this.Value = function (id, at, label, text, icon, tone, side) {
			return JSON.stringify({ID: id, At: at, Label: label, Text: text, Icon: icon, Tone: tone, Side: side});
		};
	}
});
