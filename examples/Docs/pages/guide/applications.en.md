# Applications

An Application is the root of a page made with Elemenx: its root component and where it renders, the folder of its sources, the libraries it uses, its routes, its languages and the services it owns. A page may hold several Applications, each in its own element, each with its own services and router.

```js
Elemenx.Application('Shop', {
	$Title: 'Shop',
	$Component: 'Layout',
	$Mount: '#app',
	$Root: 'application',
	$Use: ['ElemenxUI'],
	$Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']},
	$Pending: '<p class="loading">Loading the shop...</p>',
	$Error: '#shop-error',
	$State: {Region: 'EU'},
	$Router: {
		Waiting: 'PageLoading',
		NotFound: 'PageNotFound',
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/product/:id', Component: 'ProductPage'}
		]
	},

	$Bootstrap: function () {
		this.$Network('API', {Protocol: 'JSON'});
	},

	$OnReady: function () {
		console.log('The shop is on the page');
	},

	$OnError: function (error) {
		console.error('The shop could not start', error);
	}
});
```

## The definition

| Key | Meaning |
| --- | --- |
| `$Component` | the name of the root component |
| `$Mount` | where it renders: a selector (`'#app'`, `'body'`) or an element |
| `$Root` | the folder of the sources, relative to the script of the definition; its `index.js` starts the graph of files Elemenx loads from (see below) |
| `$Use` | a library or a list of them: `'ElemenxUI'`, or libraries declared with `Elemenx.Library` (see [Libraries](/guide/library)) |
| `$Locales` | the dictionaries of its phrases: `'locales/{language}.json'` or `{URL, Languages}` (see [Languages](/guide/locale)); the root renders once the dictionaries of the language are in |
| `$Router` | its routes (see [Router](/guide/router)); the router belongs to the root component, whose template has the outlet |
| `$Title` | the title of the document |
| `$State` | the first values of the state of the root component |
| `$Shadow` | `true`, `'open'` or `'closed'`: the root renders in a shadow root of the mount (see [Styles and shadow DOM](/guide/styles)) |
| `$Pending` | what the mount shows while the Application loads: HTML, or `'#name'` of a registered template or of a `<template id>` of the page |
| `$Error` | what the mount shows when the Application cannot start, in the same forms |
| `$Bootstrap()` | called first, with the Application as `this`: the place to declare its contexts, services and workers |
| `$OnPending()`, `$OnReady()`, `$OnError(error)` | the start began, ended, or failed (a missing component, a template that does not load) |
| `$Events`, `$OnEvent`, `$Messaging`, `$OnMessage` | its channels of [events](/data/events) and [messages](/data/messaging) |

The definition is read once: `Elemenx.Application(name, definition)` creates the Application and starts it as soon as the page and its graph allow; `Elemenx.Application(name)` returns a created one.

## The Application object

| Member | Meaning |
| --- | --- |
| `$Name()`, `$Root()`, `$Mount()` | its name, the folder of its sources, its mount element |
| `$Component()` | the root component, once rendered |
| `$Router()` | its router |
| `$Service(name)` | its instance of a service: every Application has its own (see [Services](/guide/services)); `$Service(name, definition)` declares a service |
| `$Template(name, value)` | the template registry (`Elemenx.Template`) |
| `$Network(context)`, `$Storage(context)`, `$Messaging(context)` | owned facades; with two arguments `(name, definition)` they declare a context |
| `$Events()` | an owned socket of [events](/data/events) |
| `$WebWorker(name, definition)`, `$ServiceWorker(name, definition)` | workers its components share |
| `$Libraries()` | the libraries it uses |
| `$Reload(type, name, callback)` | loads a `'Component'` or a `'Service'` again and renews its live instances, without a reload of the page (for tools that swap an edited file) |
| `$Title(text)` | sets the title of the document |
| `$StartedAt()` | when it was created |
| `$Destroy()` | takes it off the page: its router, its components, its services and everything they own end |

A component reaches its Application by `this.$Application()`, and through it the router, the services and the shared workers.

## The graph of the sources

In development, Elemenx loads the files of an Application when they are first needed: a component when a template first names it, a service when it is first asked for. `$Root` names the folder; its `index.js` is a list of what is in it, folders (which have an `index.js` of their own) and files:

```js
/* application/index.js */
['components', 'services', 'guards', 'directives'];

/* application/components/index.js */
['Layout/Layout.js', 'HomePage/HomePage.js', 'cart'];

/* application/components/cart/index.js */
['CartPage/CartPage.js', 'CartLine/CartLine.js', 'cart.css'];
```

A file declares its entity, and the paths of a component (`$TemplateURL`, `$StyleURL`) are read next to its script. A `.css` in an `index.js` is attached to the page once. Services, guards and directives of the graph are loaded before the root starts; components wait for their first use. A production build puts the whole graph in one bundle and nothing is loaded one by one (see [Resources and bundles](/guide/resources)).

## Several Applications

Every Application has its own root, router, services, languages of its own phrases and shadow root; the framework, its registries of components and its templates are shared. One Application may mount inside the element of another: the outer one keeps the inner mount in its place when it renders again.

```js
Elemenx.Application('Store', {$Component: 'StoreRoot', $Root: 'Store', $Mount: '#store'});
Elemenx.Application('Chat', {$Component: 'ChatRoot', $Root: 'Chat', $Mount: '#chat', $Shadow: true});
```

`elemenx generate application Chat` adds a second Application beside the first one, and a build bundles every graph it finds (see [Builds](/guide/build)).

## Example

An Application made in an example: it mounts into an element of this page and is destroyed with the example.

```example
<div class="docs-inner-mount"></div>
<Button Label="Mount the application" Variant="primary" [disabled]="Mounted" (click)="Mount" />
<Button Label="Destroy it" Variant="ghost" [disabled]="!Mounted" (click)="Destroy" />
<p class="elemenx-text small muted">{{Status}}</p>
<script>
({
	Mounted: false,
	Status: 'No application yet.',

	$OnCreate: function () {
		if (!window.ElemenxDocsInner) {
			window.ElemenxDocsInner = true;

			Elemenx.Component('DocsInnerRoot', {
				$Template: '<div class="elemenx-callout success">The application {{Name}} renders here, with its own state: {{Count}} <button type="button" (click)="Add">+1</button></div>',
				Name: '',
				Count: 0,

				Add: function () {
					this.Count++;
				}
			});
		}
	},

	Mount: function () {
		var self = this;

		this.Application = Elemenx.Application('DocsInner' + Date.now(), {
			$Component: 'DocsInnerRoot',
			$Mount: this.$Element().querySelector('.docs-inner-mount'),
			$State: {Name: 'Inner', Count: 10},

			$OnReady: function () {
				self.Status = 'Ready: ' + this.$Name();
			}
		});

		this.Mounted = true;
	},

	Destroy: function () {
		this.Application.$Destroy();
		this.Mounted = false;
		this.Status = 'Destroyed.';
	},

	$OnDestroy: function () {
		if (this.Application)
			this.Application.$Destroy();
	}
})
</script>
```
