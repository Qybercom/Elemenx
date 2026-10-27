# Widgets on another site

The shop of another site, which is not an Elemenx application, gets three widgets: the cart in its header, a button to buy under each product, and the reviews of a product. They are one Application, so they share one cart. The finished project is `examples/Widgets`.

What you learn: a build of widgets, the places a page marks for them, the props they take from it, the events the page hears, and the isolation that keeps the styles of the page and of the widgets apart.

## 1. The project

```js
module.exports = {
	Application: 'Shop',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',

	/* One widget.js for the page of another site: the framework, ElemenxUI and the Application, isolated. */
	Widget: true
};
```

`npm run build` makes `dist/widget.js`: the framework, ElemenxUI and the Application in one script, which gives the window no `Elemenx` of its own.

## 2. The Application and its widgets

The Application has no root Component and no mount: the page decides where the widgets go. `Elemenx.Widgets` names them.

```js
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
```

## 3. One cart for every widget

The widgets are one Application: the `Cart` Service is one for all of them. The button of a product puts the product into it; the cart in the header listens to it.

```js
Elemenx.Component('AddToCart', {
	$TemplateURL: 'AddToCart.html',
	$StyleURL: 'AddToCart.css',
	Product: '',
	Price: 0,
	Currency: 'EUR',
	Taken: 0,

	$OnCreate: function () {
		var self = this;
		var cart = this.$Service('Cart');

		this.Read = function () {
			self.Taken = cart.Items.filter(function (item) {
				return item.Product === self.Product;
			}).length;
		};

		this.Read();

		cart.OnChange(this.Read);
	},

	$OnDestroy: function () {
		this.$Service('Cart').OffChange(this.Read);
	},

	Added: function () {
		this.$Service('Cart').Add(this.Product, this.Price);

		this.$Emit('added', {Product: this.Product});
	}
});
```

`$OnDestroy` lets the listener go: a place removed from the page takes its widget away, and the cart must not call a widget that is gone.

## 4. The page

The page of the other site loads `widget.js` once, in its head, and marks the places; `data-props` gives each widget its props as JSON:

```html
<script src="https://shop.example.com/widget.js"></script>

<header class="shop-header">
	<h1 class="shop-title">Old Town Goods</h1>
	<div data-elemenx-widget="Cart" data-props='{"Currency": "EUR"}'></div>
</header>

<article class="shop-product">
	<h2 class="shop-name">Brass lamp</h2>
	<div data-elemenx-widget="AddToCart" data-props='{"Product": "Brass lamp", "Price": 89}'></div>
	<div data-elemenx-widget="Reviews" data-props='{"Product": "Brass lamp"}'></div>
</article>
```

A place added later (a product loaded by the page) gets its widget at once; a place removed loses it. The events named in `Events` bubble from the place as DOM events:

```js
document.addEventListener('added', function (event) {
	console.log('added', event.detail.Product);
});
```

## 5. Isolation

Each widget renders in a shadow root of its place. The page of the example has rules that would break any button (`button { text-transform: uppercase; border-radius: 0 }`): the buttons of the widgets keep their look, and the styles of the widgets do not reach the page. A page with an Elemenx of its own, of any version, keeps it: the widget runs its own copy.

## 6. Try it

```bash
npm run dev
```

The development page of the project is the shop with the widgets in their places; `npm run build` and `npm run serve` serve `dist/`, the page and `widget.js` as another site would load it.

## Next

- [Widgets on other sites](/guide/widgets): every option of `Elemenx.Widgets`.
- [A shop](/tutorials/shop): the same cart in an Application of its own.
