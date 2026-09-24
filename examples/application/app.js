var Router = null;

var Application = Elemenx.Application('ApplicationExample', {
	Component: 'Layout',
	Root: 'components',
	Mount: '#app',

	ElemenxOnComponentReady: function () {
		if (Router) return;

		Router = Elemenx.Router({
			Root: this.Component(),
			Routes: [
				{Path: '/', Component: 'HomePage'},
				{Path: '/project/:id', Component: 'ProjectPage', Guard: 'Authorized'}
			]
		});

		Router.Start();
	}
});