/*
 * A live dashboard: the visitors, the orders and the revenue of a shop as the server streams them (server-sent
 * events), a chart of the last minute, the newest orders, and the state of the connection. The project of the tutorial
 * on live data.
 */
Elemenx.Application('Dashboard', {
	$Title: 'Live',
	$Component: 'LiveBoard',
	$Root: 'Dashboard',
	$Mount: 'body',
	$Use: ['ElemenxUI']
});
