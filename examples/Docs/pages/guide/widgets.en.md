# Widgets on other sites

A widget is a Component of an Application that lives on a page of another site: a cart in the header of a shop, a booking form in a hotel page, a chat button on a blog. The page is not an Elemenx application and may have any framework of its own; it loads one script and marks the places of the widgets.

`elemenx build --widget` (or `Widget: true` in `elemenx.config.js`) makes that script, `widget.js`: the framework, the Libraries the Application uses and the Application, minified and isolated.

```js
module.exports = {
	Application: 'Shop',
	Entry: 'app.js',
	Widget: true
};
```

## Isolation

- The window gets no `Elemenx`: the widget runs its own copy of the framework, and a page with an Elemenx of its own, of any version, keeps it untouched.
- Each widget renders in a shadow root of its place: the styles of the page do not reach it, and its styles (ElemenxUI included) do not reach the page. `Shadow: false` renders it in the element itself.
- The language (`lang`, `dir`) and the theme go to the host of the widget, not to the `html` and `body` of the page.
- `widget.js` loaded twice (two parts of the page that each bring it) runs once.

Limits: a URL in the widget (an image, a file) is read against the page, so give absolute URLs; a widget starts no worker.

## Defining the widgets

The Application needs no `$Component` and no `$Mount`: `Elemenx.Widgets` names its widgets.

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

/* The code of the page reaches them too. */
window.ShopWidgets = Elemenx.Widgets;
```

`Define(name, {Component, Application, Props, Events, Shadow})`: the Component of the widget, the name of its Application, the props it starts with, the events of the Component the page hears, and `Shadow: false` to render without a shadow root.

## The page

The page loads `widget.js` once, in its head, and marks the places; `data-props` holds the props as JSON:

```html
<script src="https://shop.example.com/widget.js"></script>

<header>
	<div data-elemenx-widget="Cart" data-props='{"Currency": "EUR"}'></div>
</header>

<article>
	<h2>Brass lamp</h2>
	<div data-elemenx-widget="AddToCart" data-props='{"Product": "Brass lamp", "Price": 89}'></div>
	<div data-elemenx-widget="Reviews" data-props='{"Product": "Brass lamp"}'></div>
</article>
```

`Watch(root)` mounts every place of `root` (the document by default) and the places added later, takes away the widgets of the places removed, and passes a change of `data-props` to the widget. It returns the function that stops watching. A place of a widget it does not define is left alone.

The events named in `Events` bubble from the place as DOM events, their data in `detail`:

```js
document.addEventListener('checkout', function (event) {
	console.log(event.detail.Items.length, event.detail.Total);
});
```

## From code

| Method | Meaning |
| --- | --- |
| `Mount(element, name, props)` | mounts a widget into an element; returns `{Name, Element, Update(props), On(event, callback), Unmount()}` |
| `Unmount(element)` | takes the widget of an element away; `false` when there was none |
| `Names()` | the names of the widgets defined |

```js
var reviews = ShopWidgets.Mount(document.querySelector('#reviews'), 'Reviews', {Product: 'Lamp'});

reviews.Update({Product: 'Shelf'});
reviews.Unmount();
```

## One Application

The widgets of a page are one Application: they share its Services. In the example the `Cart` Service holds the products, so the button of every product and the cart in the header show the same cart:

```js
Elemenx.Component('CartButton', {
	$TemplateURL: 'CartButton.html',
	Currency: 'EUR',
	Count: 0,

	$OnCreate: function () {
		var self = this;
		var cart = this.$Service('Cart');

		this.Read = function () {
			self.Count = cart.Count();
		};

		this.Read();

		cart.OnChange(this.Read);
	},

	$OnDestroy: function () {
		this.$Service('Cart').OffChange(this.Read);
	},

	CheckedOut: function () {
		this.$Emit('checkout', {Items: this.$Service('Cart').Items, Total: this.$Service('Cart').Total()});
	}
});
```

`examples/Widgets` is such a project: a shop of another site with its cart, the buttons of its products and their reviews (`npm run dev` there, `npm run build` for `dist/widget.js`). See also [Builds](/guide/build).
