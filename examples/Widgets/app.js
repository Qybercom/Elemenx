/*
 * Widgets of a shop for a page of another site: the cart, a button that puts a product in it, the reviews of a
 * product. elemenx build --widget (Widget: true) makes one widget.js with the framework, ElemenxUI and the
 * Application, isolated: the page loads it once in its head and marks the places of the widgets. The widgets are one
 * Application, so they share the Cart Service.
 */
Elemenx.Application('Shop', {
	$Root: 'Shop',
	$Use: ['ElemenxUI']
});

Elemenx.Widgets
	.Define('Cart', {Component: 'CartButton', Application: 'Shop', Events: ['checkout']})
	.Define('AddToCart', {Component: 'AddToCart', Application: 'Shop', Events: ['added']})
	.Define('Reviews', {Component: 'Reviews', Application: 'Shop'});

/* Every place of the page, now and later. */
Elemenx.Widgets.Watch();

/* The code of the page reaches them too: ShopWidgets.Mount(element, 'Reviews', {Product: 'Lamp'}). */
window.ShopWidgets = Elemenx.Widgets;
