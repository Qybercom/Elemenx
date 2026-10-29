/*
 * The Designer of pages of ElemenxUI: components taken from a palette onto a canvas, arranged, given their props, and
 * the result exported as a template of Elemenx (and imported back). This first version is visual only: it builds the
 * layout and the props of a page, not its bindings or its handlers.
 */
Elemenx.Application('ElemenxDesigner', {
	$Title: 'Elemenx Designer',
	$Component: 'DesignerLayout',
	$Root: 'application',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}
});
