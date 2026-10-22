# Router

The router of an Application puts the component of the route into an outlet of its layout, follows the links of the page and the steps of the browser history, asks the [guards](/guide/guards), shows a waiting component while a route loads, and reports every step of a navigation as an event.

```js
Elemenx.Application('Shop', {
	$Component: 'Layout',
	$Mount: 'body',
	$Router: {
		Mode: 'history',
		Waiting: 'PageLoading',
		NotFound: 'PageNotFound',
		Routes: [
			{Path: '/', Component: 'HomePage'},
			{Path: '/product/:id', Component: 'ProductPage'},
			{Path: '/account', Component: 'AccountLayout', Guard: 'SignedIn', GuardFailed: 'SignIn', Routes: [
				{Path: 'orders', Component: 'OrdersPage'},
				{Path: 'orders/:order', Component: 'OrderPage', Outlet: 'Detail'}
			]}
		]
	}
});
```

```html
<!-- Layout -->
<nav><a href="/">Home</a> <a href="/product/7?tab=photos#reviews">A lamp</a> <a href="/account/orders">Orders</a></nav>
<main *outlet="Content"></main>
```

## The settings

| Setting | Meaning |
| --- | --- |
| `Routes` | the routes, in order: the first that matches wins |
| `Mode` | where the route lives: `'history'`, `'hash'` or `'memory'` (below) |
| `Outlet` | the name of the outlet of the root for the routes of the first level, `'Content'` |
| `Waiting` | the component shown while a route loads or a guard waits |
| `WaitingOutlet` | where the waiting component shows, the outlet of the route by default |
| `NotFound` | the component of a path no route matches |

`Elemenx.Router({Root: component, Routes: [...]})` makes a router for any component outside the declaration of an Application; `Start()` starts it.

## A route

| Key | Meaning |
| --- | --- |
| `Path` | `/product/:id`: a part that starts with `:` is a parameter. A trailing slash and a missing leading one do not matter. A child's path continues its parent's |
| `Component` | the component of the route: a name, or a factory |
| `Routes` | the children: their component goes into an outlet of this component's template |
| `Outlet` | the outlet of the parent it goes into, `'Content'` by default (several outlets show several children) |
| `Guard`, `Guards` | a guard or a list of them, by name or as functions (see [Guards](/guide/guards)) |
| `GuardFailed` | what shows when a guard says no: a component, or `{GuardName: component, Default: component}` |
| `Waiting` | the waiting component of this route, instead of the router's |

## A routed component

A component the router renders gets the values of its route, which its template reads too:

| Value | For `/product/7?tab=photos#reviews` |
| --- | --- |
| `$Path` | `'/product/7'` |
| `$Params` | `{id: '7'}` |
| `$Query` | `{tab: 'photos'}` (a key without `=` is `''`) |
| `$Hash` | `'reviews'` |

They are there from `$OnReady` on. A navigation to the same route with other parameters, query or hash keeps the component and changes these values: a template that reads them follows, and code that loads data by them reads them in a helper or watches them through the router's events. A navigation keeps the components the old and the new route share (a common layout of nested routes).

A component that holds an outlet (`*outlet="Content"`) is a layout: the outlets of its template receive the children of its route.

## Navigating

- **Links**: a click on an `<a href>` of the same origin goes through the router (not a link with `target` or `download`, a click with Ctrl, Shift, Alt, Command or another button, a click whose default a listener prevented, or a path no route matches when there is no `NotFound`: those the browser follows itself).
- **Code**: `this.$Router()` in a component returns the router: `Go(url)` (a new entry of the history), `Replace(url)` (the same entry), `Back()`, `Forward()`, `Current()` (the routes of now, from the outer one in), `On(event, callback)`. `Go` and `Replace` never throw: a navigation that fails is an event.
- **The history**: Back and Forward of the browser go through the router and its guards.

## Modes

- `'history'`: the route is the path of the URL, through the History API. The default for a page served over http. The server answers every path of the Application with its `index.html` (the `elemenx dev` and `serve` commands do).
- `'hash'`: the route is after the `#` (`index.html#/orders/5?tab=2#comments`); a link to `#/path` goes to a route, and a link to `#name` sets the hash of the current route.
- `'memory'`: the route lives in the entries of the browser history, and the URL of the page does not change. The default for a page that is not served over http (a file, a browser extension, an Electron window); its first route is `/`.

A relative link or `Go('details')` is read against the current route outside the `history` mode.

## Events

`this.$Router().On(name, callback)` hears a navigation (the listener of a component goes with it; on the router itself, `router.Owner(owner).On(name, callback)` ties a listener to an owner and `router.OffOwner(owner)` removes them), as `callback(context)`: `context.$From` and `context.$To` are `{Path, Params, Query, Hash}`, `context.$Route` the route, `context.$Guard` the guard.

| Event | When |
| --- | --- |
| `NavigationStart` | a navigation begins |
| `GuardStart`, `GuardWait`, `GuardEnd`, `GuardFailed` | a guard is asked, waits, answers, says no |
| `NavigationWaiting` | the waiting component shows |
| `NavigationCommit` | the URL is the new one |
| `NavigationEnd` | the components of the route, and the ones inside them that load later, are rendered |
| `NavigationCancel` | a newer navigation replaced it, or a guard said no |
| `NavigationError` | a component of the route could not be loaded or rendered (`context.$Error`); the URL goes back |

## Titles

A component with `$Title` sets the title of the document when it renders: a page of the router names the tab. `this.$Title(text)` changes it later (a page that loaded its data).

## Example

The router of this reference, driven from an example. The example is not a page of the router, so it reaches the router through its Application:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Go to Guards" (click)="Guards" />
	<Button Label="Back" Variant="ghost" (click)="Back" />
</div>
<p class="elemenx-text small muted">The routes of now: {{Routes}}</p>
<ol class="elemenx-ol"><li *for="line of Log" *key="$index">{{line}}</li></ol>
<script>
({
	Routes: '',
	Log: [],

	$OnCreate: function () {
		var self = this;
		var router = this.$Application().$Router();

		this.Routes = router.Current().map(function (route) {
			return route.Path;
		}).join(' › ');

		['NavigationStart', 'NavigationCommit', 'NavigationEnd'].forEach(function (name) {
			router.Owner(self).On(name, function (context) {
				self.Log = self.Log.concat([name + ': ' + context.$From.Path + ' → ' + context.$To.Path]);
			});
		});
	},

	$OnDestroy: function () {
		this.$Application().$Router().OffOwner(this);
	},

	Guards: function () {
		this.$Application().$Router().Go('/guide/guards');
	},

	Back: function () {
		this.$Application().$Router().Back();
	}
})
</script>
```

The example is destroyed as the page of the route changes: its listeners report the start and the commit, and the next page shows. Come back with Back.
