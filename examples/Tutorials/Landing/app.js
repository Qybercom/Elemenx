/*
 * The landing page of a product: one page of sections (the hero, the features, the prices, a form to sign up), no
 * router. elemenx build --single makes it one HTML file for any static hosting.
 */
Elemenx.Application('Landing', {
	$Title: 'Notely',
	$Component: 'App',
	$Root: 'Landing',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
