/*
 * A busy indicator: a turning ring. Size: small (16 pixels), medium (24) or large (40). Label is what screen readers
 * say of it ('Loading', by default the phrase of the language); ShowLabel shows it beside the ring too.
 */
Elemenx.Component('Spinner', {
	$TemplateURL: 'Spinner.html',
	$Meta: {
		Group: 'feedback',
		Icon: 'loader',
		Description: 'A busy indicator: a turning ring.',
		Props: {
			Size: {Options: ['small', 'medium', 'large'], Description: 'small (16px), medium (24px) or large (40px).'},
			Label: 'What screen readers say of it (Loading by default).',
			ShowLabel: 'Shows the label beside the ring.'
		},
		Sample: {Size: 'small'}
	},
	Size: 'medium',
	Label: '',
	ShowLabel: false
});