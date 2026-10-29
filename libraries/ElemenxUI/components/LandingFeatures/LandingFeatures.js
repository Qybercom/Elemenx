/*
 * The features of a product: an Overline, a Title and its Text over a grid of Items [{ID, Icon, Image, Title, Text,
 * Href}] (an Href makes the card a link), Columns of them (3; fewer on a narrow room). Variant: cards (in frames) or
 * plain. Align: start or center. The default slot adds cards of its own to the grid.
 */
Elemenx.Component('LandingFeatures', {
	$TemplateURL: 'LandingFeatures.html',
	$StyleURL: 'LandingFeatures.css',
	$Meta: {
		Group: 'landing',
		Icon: 'grid',
		Description: 'The features of a product: a title and a grid of cards of an icon, a title and a text.',
		Container: true,
		Props: {
			Overline: 'The line above the title.',
			Title: 'The title.',
			Text: 'The text under it.',
			Items: {Schema: {Icon: 'text', Title: 'text', Text: 'text'}, Description: 'The features: [{ID, Icon, Image, Title, Text, Href}].'},
			Columns: 'How many columns at most (3).',
			Variant: {Options: ['cards', 'plain'], Description: 'cards (in frames) or plain.'},
			Align: {Options: ['start', 'center'], Description: 'The header and the cards: start or center.'}
		},
		Sample: {Title: 'Why it', Items: [{Icon: 'star', Title: 'Fast', Text: 'No build step.'}, {Icon: 'lock', Title: 'Safe', Text: 'No eval.'}]}
	},
	Overline: '',
	Title: '',
	Text: '',
	Items: [],
	Columns: 3,
	Variant: 'cards',
	Align: 'start',

	Grid: function (columns) {
		return '--elemenx-landing-columns: ' + Math.max(1, Math.min(6, Number(columns) || 3)) + ';';
	}
});
