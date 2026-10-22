/*
 * A busy indicator: a turning ring. Size: small (16 pixels), medium (24) or large (40). Label is what screen readers
 * say of it ('Loading', by default the phrase of the language); ShowLabel shows it beside the ring too.
 */
Elemenx.Component('Spinner', {
	$TemplateURL: 'Spinner.html',
	Size: 'medium',
	Label: '',
	ShowLabel: false
});