<!-- generated -->
# Магазин

Небольшой магазин: каталог по категориям, страница товара, корзина, общая для всех страниц и живущая после перезагрузки, и оформление заказа с полями платёжной карты. Готовый проект — `examples/Tutorials/Shop`.

Чему вы научитесь: состояние, общее для страниц, через сервис, компонент на каждый элемент списка, бейдж на кнопке, выдвижная панель, охранник с перенаправлением и поля телефона и карты.

## 1. Маршруты

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

Оформлению заказа нужно что-то в корзине; пустая корзина возвращает в каталог:

```js
Elemenx.Guard('CartNotEmpty', function () {
	return this.$Service('Cart').Count() > 0 ? true : '/';
});
```

## 2. Корзина: одна на все страницы

Сервис живёт столько же, сколько приложение, и он один на всё приложение: кнопка в шапке, карточки каталога и оформление заказа обращаются к одному и тому же `Cart`. Он хранит строки в хранилище браузера, поэтому они переживают перезагрузку, и сообщает слушателям о каждом изменении.

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

`Remove`, `Find`, `Count`, `Total`, `Clear`, `OnChange` и `OffChange` дополняют его (см. проект). `Catalog`, второй сервис, хранит товары; настоящий магазин загружает их со своего сервера.

## 3. Шапка и выдвижная корзина

`Layout` читает корзину в своё состояние и перечитывает её при каждом изменении; кнопка показывает количество бейджем.

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

`Lines` — копия (`slice()`): каждый раз новый список, поэтому шаблон видит изменение. Обработчик нативной кнопки получает событие и элемент: `Remove` читает строку из её атрибутов `data-`.

## 4. Компонент на каждый товар

Обработчик события компонента получает то, что несёт событие (здесь `{Color, Size}` карточки), а не саму карточку. Поэтому каждый товар получает свой маленький компонент, который знает свой товар:

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

Каталог — это список таких компонентов, отфильтрованный вкладкой категории:

```html
<Tabs [tabs]="Categories" [value]="Category" Variant="pill" Label="Categories" (change)="Switched" />
<div class="elemenx-container grid" style="gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">
	<ProductTile *for="product of Shown(Products, Category)" *key="product.ID" [product]="product" />
</div>
```

## 5. Оформление заказа

Поля карты сделаны для неё: `CardNumberInput` определяет платёжную систему, проверяет номер по Луну и скрывает его середину после ввода; `CardExpiryInput` не принимает прошедшую дату; `PhoneInput` записывает номер в маске своей страны.

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

Настоящий магазин никогда не отправляет карту на свой сервер: её принимает платёжный провайдер (его виджет или его скрипт с полями карты ElemenxUI вокруг).

## 6. Магазин на других сайтах

Та же корзина может жить на страницах другого сайта в виде виджетов: [виджеты](/tutorials/widget).

## Дальше

- [Виджеты на чужом сайте](/tutorials/widget).
- [PWA](/tutorials/pwa): магазин, установленный и работающий офлайн.
