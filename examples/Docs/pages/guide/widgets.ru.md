<!-- generated -->
# Виджеты на чужих сайтах

Виджет — это компонент приложения, который живёт на странице другого сайта: корзина в шапке магазина, форма бронирования на странице отеля, кнопка чата в блоге. Страница не является приложением Elemenx и может использовать любой свой фреймворк; она подключает один скрипт и размечает места виджетов.

`elemenx build --widget` (или `Widget: true` в `elemenx.config.js`) собирает этот скрипт, `widget.js`: фреймворк, библиотеки приложения и само приложение, минифицированные и изолированные.

```js
module.exports = {
	Application: 'Shop',
	Entry: 'app.js',
	Widget: true
};
```

## Изоляция

- Окно не получает `Elemenx`: виджет работает на своей копии фреймворка, а страница со своим Elemenx любой версии остаётся нетронутой.
- Каждый виджет отрисовывается в shadow root своего места: стили страницы его не задевают, а его стили (включая ElemenxUI) не задевают страницу. `Shadow: false` отрисовывает его прямо в элементе.
- Язык (`lang`, `dir`) и тема применяются к хосту виджета, а не к `html` и `body` страницы.
- `widget.js`, подключённый дважды (две части страницы приносят его каждая), выполняется один раз.

Ограничения: URL внутри виджета (картинка, файл) разрешается относительно страницы, поэтому указывайте абсолютные URL; виджет не запускает воркеры.

## Описание виджетов

Приложению не нужны `$Component` и `$Mount`: его виджеты называет `Elemenx.Widgets`.

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

`Define(name, {Component, Application, Props, Events, Shadow})`: компонент виджета, имя его приложения, начальные свойства, события компонента, которые слышит страница, и `Shadow: false`, чтобы отрисовывать без shadow root.

## Страница

Страница подключает `widget.js` один раз, в `head`, и размечает места; `data-props` хранит свойства в JSON:

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

`Watch(root)` монтирует виджеты во все места внутри `root` (по умолчанию документ) и в места, добавленные позже, убирает виджеты удалённых мест и передаёт виджету изменения `data-props`. Возвращает функцию, которая прекращает наблюдение. Места виджетов, которых он не знает, остаются нетронутыми.

События из `Events` всплывают от места как DOM-события, их данные — в `detail`:

```js
document.addEventListener('checkout', function (event) {
	console.log(event.detail.Items.length, event.detail.Total);
});
```

## Из кода

| Метод | Значение |
| --- | --- |
| `Mount(element, name, props)` | монтирует виджет в элемент; возвращает `{Name, Element, Update(props), On(event, callback), Unmount()}` |
| `Unmount(element)` | убирает виджет из элемента; `false`, если его там не было |
| `Names()` | имена описанных виджетов |

```js
var reviews = ShopWidgets.Mount(document.querySelector('#reviews'), 'Reviews', {Product: 'Lamp'});

reviews.Update({Product: 'Shelf'});
reviews.Unmount();
```

## Одно приложение

Виджеты страницы — это одно приложение: они делят его сервисы. В примере сервис `Cart` хранит товары, поэтому кнопка каждого товара и корзина в шапке показывают одну и ту же корзину:

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

`examples/Widgets` — такой проект: магазин на чужом сайте с корзиной, кнопками товаров и отзывами о них (`npm run dev` в его папке, `npm run build` для `dist/widget.js`). См. также [Сборки](/guide/build).
