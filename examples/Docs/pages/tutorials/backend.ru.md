<!-- generated -->
# Elemenx на страницах сервера

Сайт на PHP, Django, Rails или любом другом сервере сам рисует свои страницы. Elemenx может взять одну часть такой страницы и сделать её интерактивной без сборки и без изменений в остальном: здесь — таблица заказов, которая фильтруется и сортируется, и форма, которая отправляет данные на сервер. Готовая страница — `examples/Tutorials/Backend/index.html`.

Чему вы научитесь: Elemenx из одного скрипта, компонент, описанный в странице, с шаблоном из страницы, данные, которые сервер пишет в страницу, приложение, смонтированное в один элемент, и запрос к серверу.

## 1. Один скрипт

```html
<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.10/dist/elemenx.all.min.js"></script>
```

`elemenx.all.min.js` — это фреймворк и ElemenxUI: их компоненты, стили и иконки приходят вместе с ним. (Пример берёт `/elemenx.js` с сервера проекта, который отдаёт исходники репозитория.)

## 2. Данные страницы

Сервер знает данные, когда рисует страницу: он пишет их в страницу как JSON, и приложение читает их без запроса.

```html
<script type="application/json" id="orders-data">
	[
		{"ID": 1041, "Customer": "Grace Hopper", "Total": 129, "Status": "paid", "Date": "2026-10-21"},
		{"ID": 1042, "Customer": "Alan Turing", "Total": 54.5, "Status": "sent", "Date": "2026-10-22"}
	]
</script>
```

Шаблон сервера пишет их так же, как любой текст, экранированными для страницы (`json_encode` в PHP, `json_script` в Django).

## 3. Шаблон в странице

Компонент берёт шаблон из `<script type="text/html" id>` страницы:

```html
<script type="text/html" id="orders-table">
	<section style="display: flex; flex-direction: column; gap: 16px;">
		<div class="elemenx-container wrappable" style="gap: 12px; align-items: center;">
			<RadioGroup Variant="segmented" Label="Status" [options]="Statuses" [value]="Status" (change)="Filtered" />
			<span class="elemenx-text muted">{{Shown(Orders, Status).length}} orders · €{{Sum(Shown(Orders, Status))}}</span>
		</div>
		<Table Label="Orders" [columns]="Columns" [rows]="Shown(Orders, Status)" RowKey="ID" SortLocal="true" Striped="true" />
		<Form Label="A note to the team" (submit)="Sent">
			<Field Label="A note to the team" Name="note" Required="true" MinLength="3"><TextArea Rows="2" /></Field>
			<Button Type="submit" Label="Send" Variant="primary" [loading]="Sending" />
		</Form>
		<div class="elemenx-callout success" *if="Done">{{Done}}</div>
	</section>
</script>
```

Скрипт с типом `text/html` не выполняется и не показывается: Elemenx рисует его шаблон там, где монтируется приложение. Серверы Elemenx сами так записывают `<template id>` страницы, но эту страницу отдаёт сервер сайта, а `<template id>` браузер разбирает как HTML: имена тегов приводятся к нижнему регистру (`<Table>` становится `table` из HTML, `<Select>` — `select`), а `<TextArea />` забирает остаток страницы как свой текст. Скрипт хранит шаблон таким, каким он написан, как и файлы проекта (`$TemplateURL`). Сервер на Node может оставить в страницах `<template id>` и отдавать их через `Page(html)` из `@qybercom/elemenx/tools/templates.js`.

## 4. Компонент и приложение

```js
Elemenx.Component('OrdersTable', {
	$TemplateID: 'orders-table',
	Orders: [],
	Status: 'all',

	$OnCreate: function () {
		this.Orders = JSON.parse(document.getElementById('orders-data').textContent);

		this.Shown = function (orders, status) {
			return orders.filter(function (order) {
				return status === 'all' || order.Status === status;
			});
		};
	},

	Filtered: function (value) {
		this.Status = value;
	}
});

Elemenx.Application('Orders', {
	$Component: 'OrdersTable',
	$Mount: '#orders',
	$Use: ['ElemenxUI']
});
```

`$Mount: '#orders'` рисует компонент только в этом элементе; шапка, ссылки и остальной HTML сервера остаются нетронутыми. Несколько частей одной страницы — это несколько приложений, каждое в своём элементе, или [виджеты](/tutorials/widget) одного.

## 5. На сервер

Форма страницы отправляет данные на сервер так же, как это сделала бы страница сервера, с его cookie:

```js
Sent: function (event) {
	var self = this;
	var request = this.$Network().XHR({Method: 'POST', URL: '/notes', Headers: {'Content-Type': 'application/json'}, Data: JSON.stringify(event.Value)});

	this.Sending = true;

	request.On('Transport.Success', function () {
		self.Sending = false;
		self.Done = 'Sent: ' + event.Value.note;
	});

	request.Execute();
}
```

Сервер, который проверяет CSRF-токен, получает его как обычно: заголовок, который страница читает из `<meta>`, записанного сервером (`request.Header('X-CSRF-Token', token)`).

## Когда собирать

Часть страницы вырастает в отдельное приложение: тогда проще проект из папок, `elemenx dev` и `elemenx build` ([лендинг](/tutorials/landing) показывает такой). Страница и сервер остаются как есть; сборка даёт один скрипт вместо `elemenx.all.min.js`.

## Дальше

- [Виджеты на чужом сайте](/tutorials/widget): части для страниц, которые вам не принадлежат.
- [Для знающих Vue, React или Angular](/tutorials/migrate).
