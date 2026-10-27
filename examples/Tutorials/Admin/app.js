/*
 * The admin panel of a shop: a page to sign in, and behind the SignedIn guard the dashboard and the users (a table
 * that sorts, filters and pages, a drawer to edit one, a dialog before a removal). The data comes from the Api
 * Service, here in memory: a real panel asks its server there.
 */
Elemenx.Application('Admin', {
	$Title: 'Shop admin',
	$Component: 'Shell',
	$Root: 'Admin',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/login', Component: 'LoginPage'},
			{Path: '/', Component: 'DashboardPage', Guard: 'SignedIn'},
			{Path: '/users', Component: 'UsersPage', Guard: 'SignedIn'}
		]
	}
});
