/*
 * A reading list in the button of the browser: the page of the tab saved in one click, kept in the storage of the
 * extension (synced between the browsers of the user), opened in a new tab. The project of the tutorial on extensions.
 */
Elemenx.Application('Extension', {
	$Title: 'Reading list',
	$Component: 'ReadingApp',
	$Root: 'Extension',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
