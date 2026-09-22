var Application = Elemenx.Application('ApplicationExample', {
	Component: 'Layout',
	Mount: '#app'
});

var Router = Elemenx.Router({
	Root: Application.Component(),
	Routes: [
		{Path: '/', Component: 'HomePage'},
		{Path: '/project/:id', Component: 'ProjectPage', Guard: 'Authorized'}
	]
});

Router.Start();