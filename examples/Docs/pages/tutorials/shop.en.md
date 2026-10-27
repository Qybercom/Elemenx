# A shop

A small shop: a catalogue by category, the page of a product, a cart that every page shares and keeps after a reload, and a checkout with the fields of a payment card. The finished project is `examples/Tutorials/Shop`.

What you learn: state shared by the pages through a Service, a component for each item of a list, a badge on a button, a drawer, a guard that redirects, and the fields of phones and cards.

## 1. The routes

```js
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
```

The checkout wants something in the cart; an empty cart goes back to the catalogue:

```js
Elemenx.Guard('CartNotEmpty', function () {
	return this.$Service('Cart').Count() > 0 ? true : '/';
});
```

## 2. The cart: one for every page

A Service lives as long as the Application, one instance for all of it: the button in the header, the cards of the catalogue and the checkout all ask the same `Cart`. It keeps its lines in the storage of the browser, so they live on after a reload, and tells its listeners each change.

```js
Elemenx.Service('Cart', {
	$OnCreate: function () {
		this.Store = this.$Storage.Local.Namespace('shop');
		this.Lines = this.Store.Get('cart') || [];
		this.Listeners = [];
	},

	Add: function (product, color) {
		var line = this.Find(product.ID, color);

		if (line) line.Count++;
		else this.Lines.push({ID: product.ID, Title: product.Title, Price: product.Price, Color: color || '', Count: 1});

		this.Changed();
	},

	Changed: function () {
		var self = this;

		this.Store.Set('cart', this.Lines);

		this.Listeners.slice().forEach(function (callback) {
			callback(self);
		});
	}
});
```

`Remove`, `Find`, `Count`, `Total`, `Clear`, `OnChange` and `OffChange` complete it (see the project). `Catalog`, the other Service, holds the products; a real shop loads them from its server.

## 3. The header and the cart drawer

`Layout` reads the cart into its state and reads it again at each change; the button shows the count as a badge.

```js
$OnCreate: function () {
	var self = this;
	var cart = this.$Service('Cart');

	this.Read = function () {
		self.Lines = cart.Lines.slice();
		self.Count = cart.Count();
		self.Total = cart.Total();
	};

	this.Money = function (value) {
		return '€' + Number(value).toFixed(2);
	};

	this.Read();

	cart.OnChange(this.Read);
},

$OnDestroy: function () {
	this.$Service('Cart').OffChange(this.Read);
}
```

```html
<Button Icon="cart" Label="Cart" Variant="ghost" [badge]="Count" (click)="Show" />
<main class="shop-main" *outlet="Content"></main>
<Drawer [open]="Open" Title="Your cart" Size="small" (close)="Hide">
	<EmptyState *if="!Count" Title="The cart is empty" Description="Add something you like." />
	<ul class="elemenx-list divided" *if="Count">
		<li class="shop-line" *for="line of Lines" *key="line.ID + line.Color">
			<span class="shop-line-text"><strong>{{line.Title}}</strong> <span class="elemenx-text small muted">{{line.Color}} · ×{{line.Count}}</span></span>
			<span>{{Money(line.Price * line.Count)}}</span>
			<button class="elemenx-input-action" type="button" [attribute.data-id]="line.ID" [attribute.data-color]="line.Color" [attribute.aria-label]="'Remove ' + line.Title" (click)="Remove"><Icon Name="close" /></button>
		</li>
	</ul>
	<div slot="footer" class="elemenx-container" style="gap: 12px; align-items: center;" *if="Count">
		<strong>Total {{Money(Total)}}</strong>
		<span class="elemenx-spacer"></span>
		<Button Label="Checkout" Variant="primary" (click)="Checkout" />
	</div>
</Drawer>
```

`Lines` is a copy (`slice()`): a new list each time, so the template sees the change. The handler of a native button gets the event and the element: `Remove` reads the line from its `data-` attributes.

## 4. A component for each product

The handler of an event of a Component gets what the event carries (here `{Color, Size}` of the card), not the card. So each product gets a small Component of its own, which knows its product:

```js
Elemenx.Component('ProductTile', {
	$TemplateURL: 'ProductTile.html',
	Product: null,

	$OnCreate: function () {
		var catalog = this.$Service('Catalog');

		this.Colors = function (product) {
			return catalog.Colors(product);
		};
	},

	Added: function (detail) {
		this.$Service('Cart').Add(this.Product, detail.Color || this.Product.Colors[0]);
		this.$Service('Toast').Show({Message: this.Product.Title + ' is in the cart.', Variant: 'success', Duration: 2500});
	}
});
```

```html
<ProductCard [title]="Product.Title" [price]="Product.Price" [oldPrice]="Product.OldPrice" [badge]="Product.Badge || ''" [rating]="Product.Rating" [reviews]="Product.Reviews" [colors]="Colors(Product)" Currency="EUR" [href]="'/product/' + Product.ID" Cart="true" (add)="Added" />
```

The catalogue is then a list of them, filtered by the tab of a category:

```html
<Tabs [tabs]="Categories" [value]="Category" Variant="pill" Label="Categories" (change)="Switched" />
<div class="elemenx-container grid" style="gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">
	<ProductTile *for="product of Shown(Products, Category)" *key="product.ID" [product]="product" />
</div>
```

## 5. The checkout

The fields of a card are made for it: `CardNumberInput` finds the brand and checks the number by Luhn, and hides its middle once it is typed; `CardExpiryInput` refuses a date that is past; `PhoneInput` writes the number in the mask of its country.

```html
<Form Label="Checkout" (submit)="Submitted">
	<Field Label="Name" Name="name" Required="true"><Input Placeholder="Ada Lovelace" /></Field>
	<Field Label="Phone" Name="phone" Required="true"><PhoneInput Country="GB" /></Field>
	<Field Label="Address" Name="address" Required="true"><TextArea Rows="2" /></Field>
	<Field Label="Card number" Name="card" Required="true"><CardNumberInput Conceal="xxxx ???? ???? xxxx" /></Field>
	<div class="elemenx-container" style="gap: 12px;">
		<Field Label="Expiry" Name="expiry" Required="true"><CardExpiryInput /></Field>
		<Field Label="CVV" Name="cvv" Required="true"><CVVInput /></Field>
	</div>
	<Button Type="submit" Label="Place the order" Variant="primary" />
</Form>
```

```js
Submitted: function (event) {
	this.Placed = 'A-' + String(Date.now()).slice(-6);
	this.$Service('Cart').Clear();
	this.$Service('Toast').Show({Title: 'Thank you, ' + event.Value.name + '!', Message: 'Your order ' + this.Placed + ' is placed.', Variant: 'success'});
}
```

A real shop never sends a card to its own server: the payment provider takes it (its widget, or its script with the card fields of ElemenxUI around it).

## 6. The shop on other sites

The same cart can live on the pages of another site, as widgets: [widgets](/tutorials/widget).

## Next

- [Widgets on another site](/tutorials/widget).
- [A PWA](/tutorials/pwa): the shop installed and offline.
