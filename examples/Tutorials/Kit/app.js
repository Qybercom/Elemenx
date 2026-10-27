/*
 * Acme, a library of components of its own (libraries/Acme), and its showcase: each component live, and its reference
 * made of what it declares ($Meta). The project of the tutorial on libraries.
 */
Elemenx.Library('Acme', {
	$Root: 'libraries/Acme',
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}
});

Elemenx.Application('Kit', {
	$Title: 'Acme kit',
	$Component: 'Showcase',
	$Root: 'Kit',
	$Mount: 'body',
	$Use: ['ElemenxUI', 'Acme']
});
