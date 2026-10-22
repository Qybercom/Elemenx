# Getting started

Elemenx is a framework for applications in the browser. It is one file, `elemenx.js`, written in ES5 with no dependencies: components with reactive state and templates, a router, services, a network layer (requests, streams, sockets, WebRTC, transfers), storage, messaging between tabs, frames and workers, and languages. Its library, ElemenxUI, brings about 130 components, 36 services and 13 directives with themes. The command line makes projects, serves them while they are written, and builds them into a site, one file, a widget, a browser extension or native programs.

A few rules run through all of it:

- **Names.** Components, services, guards and the members of their definitions are written in PascalCase: `Elemenx.Component('UserCard', {Name: '', Save: function () {...}})`. Every name that starts with `$` belongs to Elemenx: `$Template`, `$OnCreate`, `this.$Emit(...)`.
- **No Promises.** What takes time reports through callbacks `(error, result)` or events. The code of an Application stays plain ES5 and runs in any browser.
- **State is plain data.** A field of a component is its state: assign it, push into its list, and the template follows. There is nothing to declare.

## A page with the framework

Without a build and without a server step, a page can load the framework and ElemenxUI from the files of the distribution (`npm run dist` makes them; `elemenx.all.min.js` holds both):

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<script src="elemenx.all.min.js"></script>
</head>
<body>
	<div id="app"></div>
	<script>
		Elemenx.Component('Hello', {
			$Template: '<h1>Hello, {{Name}}</h1><Button Label="Again" Variant="primary" (click)="Again" />',
			Name: 'world',

			Again: function () {
				this.Name = this.Name + '!';
			}
		});

		Elemenx.Application('HelloApp', {$Use: ['ElemenxUI'], $Component: 'Hello', $Mount: '#app'});
	</script>
</body>
</html>
```

The same component runs here; its code is under it, as in every example of this reference:

```example
<h3>Hello, {{Name}}</h3>
<Button Label="Again" Variant="primary" (click)="Again" />
<script>
({
	Name: 'world',

	Again: function () {
		this.Name = this.Name + '!';
	}
})
</script>
```

## A project

A project keeps every component in files of its own, which the page loads when a template first names them. The package `@qybercom/elemenx` has the framework, ElemenxUI and the command line:

```bash
npm install @qybercom/elemenx
npx elemenx generate application Shop
npx elemenx dev
```

`generate application` makes the project: `index.html`, `app.js` (the declaration of the Application), `elemenx.config.js`, `package.json`, and the folder of the sources, `Shop/`, with its graph: `Shop/index.js` lists the files and the folders of the sources, and the root component `App` (`Shop/App/App.js` and `App.html`). `elemenx dev` serves it on `http://127.0.0.1:4173` as it is, with the framework of the package: a reload of the page shows every change.

A project that has grown may look like this (the folders are yours to choose: an `index.js` in a folder lists what is in it):

```text
Shop/
├── index.html
├── app.js
├── elemenx.config.js
├── package.json
└── Shop/
    ├── index.js              ['components', 'services']
    ├── components/
    │   ├── index.js          ['Layout/Layout.js', 'HomePage/HomePage.js']
    │   ├── Layout/
    │   │   ├── Layout.js
    │   │   ├── Layout.html
    │   │   └── Layout.css
    │   └── HomePage/...
    └── services/
        ├── index.js          ['Cart.js']
        └── Cart.js
```

```js
/* app.js */
Elemenx.Application('Shop', {
	$Title: 'Shop',
	$Root: 'Shop',
	$Component: 'Layout',
	$Mount: 'body',
	$Use: ['ElemenxUI'],
	$Router: {
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/product/:id', Component: 'ProductPage'}
		]
	}
});
```

```js
/* Shop/components/HomePage/HomePage.js */
Elemenx.Component('HomePage', {
	$TemplateURL: 'HomePage.html',
	$StyleURL: 'HomePage.css',
	Products: [],

	$OnReady: function () {
		var self = this;

		this.$Network().XHR({URL: '/api/products', ResponseType: 'json'})
			.On('Transport.Success', function (event) {
				self.Products = event.Data.Response;
			})
			.Execute();
	}
});
```

New parts come from the command line too: `npx elemenx g component components/ProductPage`, `npx elemenx g service services/Cart`, `npx elemenx g guard SignedIn`, `npx elemenx g directive Tooltip` write their files under the root of the sources and add them to the nearest `index.js` (see [The CLI](/guide/cli)).

`npx elemenx build` makes the site in `dist/`: the templates and styles inlined, only the components and the parts of the framework the Application uses. See [Builds](/guide/build) for one file, widgets, extensions and native programs.

## What to read next

1. [Applications](/guide/applications), [Components](/guide/components) and [Templates](/guide/templates): the core of every page.
2. [State and reactivity](/guide/reactivity) and [Lifecycle](/guide/lifecycle): how the page follows the data, and when the code runs.
3. [Directives](/guide/directives), [Services](/guide/services), the [Router](/guide/router) and its [guards](/guide/guards).
4. [Network](/network/overview) and [Data and messaging](/data/storage): talking to servers, storing data, other tabs and workers.
5. [ElemenxUI](/guide/library), [Themes](/guide/theming) and the pages of every component, service and directive in the sections below.
