# Elemenx on the pages of a server

A site of PHP, Django, Rails or any other server renders its pages itself. Elemenx can take one part of such a page and make it interactive, with no build and no change to the rest: here a table of orders that filters and sorts, and a form that posts to the server. The finished page is `examples/Tutorials/Backend/index.html`.

What you learn: Elemenx from one script, a Component defined in the page with a template of the page, data the server writes into the page, an Application mounted into one element, and a request to the server.

## 1. One script

```html
<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.10/dist/elemenx.all.min.js"></script>
```

`elemenx.all.min.js` is the framework and ElemenxUI: their components, styles and icons come with it. (The example takes `/elemenx.js` from the server of the project, which serves the sources of the repository.)

## 2. The data of the page

The server knows the data when it renders the page: it writes them into the page as JSON, and the Application reads them without a request.

```html
<script type="application/json" id="orders-data">
	[
		{"ID": 1041, "Customer": "Grace Hopper", "Total": 129, "Status": "paid", "Date": "2026-10-21"},
		{"ID": 1042, "Customer": "Alan Turing", "Total": 54.5, "Status": "sent", "Date": "2026-10-22"}
	]
</script>
```

A template of the server writes it the way it writes any text, escaped for the page (`json_encode` in PHP, `json_script` in Django).

## 3. The template in the page

The Component takes its template from a `<script type="text/html" id>` of the page:

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

A script of type `text/html` is neither run nor shown: Elemenx renders its template where the Application mounts. The servers of Elemenx write a `<template id>` of a page so themselves, but this page comes from the server of the site, and a `<template id>` the browser parses as HTML: the names of its tags in lower case (`<Table>` becomes the `table` of HTML, `<Select>` a `select`) and `<TextArea />` taking the rest of the page as its text. The script keeps the template as it is written, as the files of a project (`$TemplateURL`) do. A server in Node may keep `<template id>` in its pages and send them through `Page(html)` of `@qybercom/elemenx/tools/templates.js`.

## 4. The Component and the Application

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

`$Mount: '#orders'` renders the Component into that element alone; the header, the links and the rest of the server's HTML stay untouched. Several parts of one page are several Applications, each in its element, or the [widgets](/tutorials/widget) of one.

## 5. To the server

A form of the page sends to the server the way a page of the server would, with its cookies:

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

A server that checks a CSRF token gets it as it always does: a header the page reads from a `<meta>` the server wrote (`request.Header('X-CSRF-Token', token)`).

## When to build

A part of a page grows into an application of its own: then a project of folders, `elemenx dev` and `elemenx build` are easier ([a landing page](/tutorials/landing) shows one). The page and the server stay as they are; the build gives one script to put in place of `elemenx.all.min.js`.

## Next

- [Widgets on another site](/tutorials/widget): parts for pages that are not yours.
- [For those who know Vue, React or Angular](/tutorials/migrate).
