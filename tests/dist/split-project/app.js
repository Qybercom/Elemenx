/* A fixture of a build split by its routes: the page of /about, with what it alone uses, goes into a part of its own. */
Elemenx.Application('Split', {
	$Component: 'SplitShell',
	$Root: 'application',
	$Mount: '#app',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'SplitHome'},
			{Path: '/about', Component: 'SplitAbout'}
		]
	}
});
