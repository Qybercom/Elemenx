/*
 * A home media collection: films, music and games. The home page has a featured title and shelves, each kind a page
 * to browse with facets, and each title a page of its own: its tracks for an album, its cast for a film or a game,
 * and more of the same genre. The Library Service holds the titles and the favorites (kept in the browser).
 */
Elemenx.Application('Collection', {
	$Title: 'Elemenx Collection',
	$Component: 'Layout',
	$Root: 'Collection',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/browse/:kind', Component: 'BrowsePage'},
			{Path: '/title/:id', Component: 'TitlePage'}
		]
	}
});
