/*
 * The values of a game in a row (or a column) on a panel of the theme: the board of a race (lap, time, best), the
 * resources of a strategy (gold, wood, food). Items [{ID, Label, Value, Unit, Icon, Tone}], each a GameStat of
 * Layout; Orientation horizontal or vertical; Size; Label names the group for screen readers.
 */
Elemenx.Component('GameStats', {
	$TemplateURL: 'GameStats.html',
	$StyleURL: 'GameStats.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The values of a game in a row or a column on a panel of the theme: the board of a race, the resources of a strategy.',
		Props: {
			Items: {Schema: {ID: 'text', Label: 'text', Value: 'text', Unit: 'text', Icon: 'icon', Tone: 'text'}, Description: 'The values: [{ID, Label, Value, Unit, Icon, Tone}].'},
			Layout: {Options: ['stacked', 'inline'], Description: 'stacked (each name over its value) or inline (icon, value, name).'},
			Orientation: {Options: ['horizontal', 'vertical'], Description: 'horizontal (a row) or vertical (a column).'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Label: 'The name of the group for screen readers.'
		},
		Sample: {Items: [{ID: 'lap', Label: 'Lap', Value: '2/3'}, {ID: 'time', Label: 'Time', Value: '1:02.4'}, {ID: 'best', Label: 'Best', Value: '0:58.1'}], Label: 'Race'}
	},
	Items: [],
	Layout: 'stacked',
	Orientation: 'horizontal',
	Size: 'medium',
	Label: ''
});
