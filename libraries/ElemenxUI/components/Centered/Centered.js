/*
 * A centered page for sign-in forms, errors and empty states, built on elemenx-screen and elemenx-column.
 * Slots: brand (above the content), default (the content), actions (buttons under it), footer (at the bottom).
 * Icon, Code, Title and Description draw a standard state (Code is a large number such as 404).
 * Width: small (360px), medium (480px) or large (640px). Card puts the content on a surface.
 */
Elemenx.Component('Centered', {
	$TemplateURL: 'Centered.html',
	$StyleURL: 'Centered.css',
	$Meta: {
		Group: 'layout',
		Icon: 'align-center-vertical',
		Description: 'A centered page for sign-in forms, errors and empty states, built on elemenx-screen and elemenx-column.',
		Container: true,
		Slots: ['brand', 'actions', 'footer'],
		Props: {
			Icon: 'The icon of a standard state.',
			Code: 'A large number of a standard state (404).',
			Title: 'The title of a standard state.',
			Description: 'The text under the title.',
			Width: {Options: ['small', 'medium', 'large'], Description: 'The width of the content: small (360px), medium (480px) or large (640px).'},
			Card: 'Puts the content on a surface.'
		},
		Sample: {Title: 'Sign in', Description: 'Use your work account', Width: 'small', Card: true}
	},
	Icon: '',
	Code: '',
	Title: '',
	Description: '',
	Width: 'medium',
	Card: false
});