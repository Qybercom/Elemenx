/*
 * What the customers say: Items [{ID, Text, Name, Role, Avatar, Rating}] as quotes in a grid (Columns, 3), each with
 * the avatar (a picture, or made of the name), the name and role and the stars of a Rating. Overline, Title and Text
 * over them; the default slot adds quotes of its own.
 */
Elemenx.Component('LandingTestimonials', {
	$TemplateURL: 'LandingTestimonials.html',
	$StyleURL: 'LandingTestimonials.css',
	$Meta: {
		Group: 'landing',
		Icon: 'quote',
		Description: 'What the customers say: quotes with an avatar, a name, a role and stars.',
		Container: true,
		Props: {
			Overline: 'The line above the title.',
			Title: 'The title.',
			Text: 'The text under it.',
			Items: {Schema: {Text: 'text', Name: 'text', Role: 'text', Rating: 'number'}, Description: 'The quotes: [{ID, Text, Name, Role, Avatar, Rating}].'},
			Columns: 'How many columns at most (3).'
		},
		Sample: {Items: [{Text: 'It just works.', Name: 'Ada', Role: 'CTO', Rating: 5}]}
	},
	Overline: '',
	Title: '',
	Text: '',
	Items: [],
	Columns: 3,

	Grid: function (columns) {
		return '--elemenx-landing-columns: ' + Math.max(1, Math.min(6, Number(columns) || 3)) + ';';
	}
});
