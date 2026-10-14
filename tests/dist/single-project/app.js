Elemenx.Application('SingleFile', {
	$Component: 'SingleRoot',
	$Root: 'application',
	$Mount: '#app',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'SinglePage'},
			{Path: '/about', Component: 'SinglePage'}
		]
	}
});
