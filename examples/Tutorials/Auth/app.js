/*
 * Signing in, as a real application does it: a short access token in memory, a refresh token in a cookie the page
 * cannot read, a guard that restores the session after a reload, and a request that renews an expired token by itself.
 * The project of the tutorial on authentication.
 */
Elemenx.Application('Auth', {
	$Title: 'Account',
	$Component: 'Shell',
	$Root: 'Auth',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/login', Component: 'LoginPage'},
			{Path: '/account', Component: 'AccountPage', Guard: 'SignedIn'}
		]
	}
});
