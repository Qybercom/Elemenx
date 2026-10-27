/*
 * A shop: the catalogue by category, the page of a product, a cart that every page shares (the Cart Service, kept in
 * the browser), and the checkout behind a guard that wants something in the cart.
 */
Elemenx.Application('Shop', {
	$Title: 'Old Town Goods',
	$Component: 'Layout',
	$Root: 'Shop',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'CatalogPage'},
			{Path: '/product/:id', Component: 'ProductPage'},
			{Path: '/checkout', Component: 'CheckoutPage', Guard: 'CartNotEmpty'}
		]
	}
});
