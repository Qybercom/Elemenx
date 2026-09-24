Elemenx.Application('ApplicationExample', {
	Component: 'Layout',
	Root: 'application',
	Mount: '#app',
	Router: {
		Waiting: 'PageLoading',
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/project/:id', Component: 'ProjectPage', Guard: 'Authorized', Waiting: 'PageLoading'}
		]
	}
});