var Router = null;

var Application = Elemenx.Application('ApplicationExample', {
	Component: 'Layout',
	Root: 'application',
	Mount: '#app',

	ElemenxOnComponentReady: function () {
		if (Router) return;

		Router = Elemenx.Router({
			Root: this.Component(),
			Waiting: 'PageLoading',
			Routes: [
				{Path: '/', Component: 'HomePage'},
				{Path: '/project/:id', Component: 'ProjectPage', Guard: 'Authorized', Waiting: 'PageLoading'}
			]
		});

		Router.Start();
	}
});