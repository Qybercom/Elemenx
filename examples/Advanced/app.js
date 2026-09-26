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
			{Path: '/authorized', Component: 'AuthorizedPage', Guard: 'Authorized', GuardFailed: 'LoginRequired'},
			{Path: '/redirect-protected', Component: 'RedirectProtectedPage', Guard: 'AuthorizedRedirect'},
			{
				Path: '/project/:id',
				Component: 'ProjectPage',
				Guards: ['Authorized', 'ProjectAccess'],
				GuardFailed: {
					Authorized: 'LoginRequired',
					ProjectAccess: 'AccessDenied'
				},
				Waiting: 'PageLoading'
			}
		]
	}
});