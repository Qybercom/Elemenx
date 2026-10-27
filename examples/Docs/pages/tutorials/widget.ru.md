<!-- generated -->
# Виджеты на чужом сайте

Магазин другого сайта, который не является приложением Elemenx, получает три виджета: корзину в шапке, кнопку покупки под каждым товаром и отзывы о товаре. Это одно приложение, поэтому корзина у них общая. Готовый проект — `examples/Widgets`.

Чему вы научитесь: сборка виджетов, места, которые размечает для них страница, свойства, которые они берут из неё, события, которые слышит страница, и изоляция, которая разделяет стили страницы и виджетов.

## 1. Проект

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

`npm run build` собирает `dist/widget.js`: фреймворк, ElemenxUI и приложение в одном скрипте, который не даёт окну своего `Elemenx`.

## 2. Приложение и его виджеты

У приложения нет корневого компонента и места монтирования: где будут виджеты, решает страница. Их называет `Elemenx.Widgets`.

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

## 3. Одна корзина на все виджеты

Виджеты — одно приложение: сервис `Cart` у них общий. Кнопка товара кладёт в него товар; корзина в шапке слушает его.

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

`$OnDestroy` снимает слушателя: место, убранное со страницы, забирает свой виджет, и корзина не должна вызывать исчезнувший виджет.

## 4. Страница

Страница другого сайта подключает `widget.js` один раз, в `head`, и размечает места; `data-props` передаёт каждому виджету его свойства в JSON:

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

Место, добавленное позже (товар, который загрузила страница), сразу получает свой виджет; убранное место его теряет. События из `Events` всплывают от места как DOM-события:

```js
document.addEventListener('added', function (event) {
	console.log('added', event.detail.Product);
});
```

## 5. Изоляция

Каждый виджет рисуется в shadow root своего места. У страницы примера есть правила, которые испортили бы любую кнопку (`button { text-transform: uppercase; border-radius: 0 }`): кнопки виджетов сохраняют свой вид, а стили виджетов не задевают страницу. Страница со своим Elemenx любой версии сохраняет его: виджет работает на своей копии.

## 6. Попробуйте

```bash
npm run dev
```

Страница разработки проекта — магазин с виджетами на своих местах; `npm run build` и `npm run serve` отдают `dist/` — страницу и `widget.js` так, как их загрузил бы другой сайт.

## Дальше

- [Виджеты на чужих сайтах](/guide/widgets): все возможности `Elemenx.Widgets`.
- [Магазин](/tutorials/shop): та же корзина в собственном приложении.
