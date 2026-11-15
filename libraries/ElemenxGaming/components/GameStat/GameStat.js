/*
 * A value of a game with its name: a lap, a time, gold, a speed. Value and Unit, Label (its name), Icon; Layout
 * stacked (the name over the value, as on the board of a race) or inline (the icon, the value, then the name, as
 * a count of a resource); Tone (accent, success, warning, danger, muted: a lamp that is off) its color; Size (small, medium, large). Its
 * figures are of one width, so a value that changes each frame does not shake.
 */
Elemenx.Component('GameStat', {
	$TemplateURL: 'GameStat.html',
	$StyleURL: 'GameStat.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'A value of a game with its name: a lap, a time, gold, a speed; stacked or inline.',
		Props: {
			Value: 'The value.',
			Unit: 'The unit after the value.',
			Label: 'Its name.',
			Icon: 'An icon before it.',
			Layout: {Options: ['stacked', 'inline'], Description: 'stacked (the name over the value) or inline (the icon, the value, the name).'},
			Tone: {Options: ['', 'accent', 'success', 'warning', 'danger', 'muted'], Description: 'Its color: accent, success, warning, danger, or muted (a lamp that is off).'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'}
		},
		Sample: {Label: 'Gold', Value: 1250, Icon: 'games:coin', Layout: 'inline'}
	},
	Value: '',
	Unit: '',
	Label: '',
	Icon: '',
	Layout: 'stacked',
	Tone: '',
	Size: 'medium'
});
