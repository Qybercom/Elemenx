Elemenx.Application('ApplicationExample', {
	Title: 'Elemenx advanced application example',
	Component: 'Layout',
	Root: 'application',
	Mount: 'body',
	Router: {
		Waiting: 'PageLoading',
		NotFound: 'PageNotFound',
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/project/:id', Component: 'ProjectPage', Guard: 'Authorized', GuardFailed: 'AccessDenied', Waiting: 'PageLoading'}
		]
	}
});