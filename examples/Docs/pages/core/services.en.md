# Services, events and messages

Components show things. What they share (a session, a cart, a client of an API) lives in services, and what they tell each other without knowing each other goes through events and messages. This page shows who owns what, and which way a message goes.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 300" role="img" aria-label="Services, events and messages">
	<title>Services, events and messages</title>
	<rect class="box soft" x="20" y="20" width="410" height="260" rx="8" />
	<text x="36" y="44" text-anchor="start" class="strong">Application</text>
	<rect class="box" x="40" y="64" width="120" height="44" rx="8" />
	<text x="100" y="90.5" text-anchor="middle" class="strong">Header</text>
	<polyline class="line" points="100,108 170,190" />
	<polygon class="head" points="170,190 167.6,180.2 160.7,186.1" />
	<rect class="box" x="165" y="64" width="120" height="44" rx="8" />
	<text x="225" y="90.5" text-anchor="middle" class="strong">CartPage</text>
	<polyline class="line" points="225,108 220,190" />
	<polygon class="head" points="220,190 225.0,181.3 216.1,180.7" />
	<rect class="box" x="290" y="64" width="120" height="44" rx="8" />
	<text x="350" y="90.5" text-anchor="middle" class="strong">CartBadge</text>
	<polyline class="line" points="350,108 270,190" />
	<polygon class="head" points="270,190 279.5,186.7 273.1,180.4" />
	<rect class="box accent" x="105" y="190" width="230" height="56" rx="8" />
	<text x="220" y="213.5" text-anchor="middle" class="strong">Service: Cart</text>
	<text x="220" y="231.5" text-anchor="middle" class="muted">one for the Application</text>
	<rect class="box" x="460" y="20" width="280" height="56" rx="8" />
	<text x="600" y="43.5" text-anchor="middle" class="strong">Events</text>
	<text x="600" y="61.5" text-anchor="middle" class="muted">channels inside the page</text>
	<rect class="box" x="460" y="130" width="120" height="44" rx="8" />
	<text x="520" y="156.5" text-anchor="middle" class="strong">Tab A</text>
	<rect class="box" x="620" y="130" width="120" height="44" rx="8" />
	<text x="680" y="156.5" text-anchor="middle" class="strong">Tab B</text>
	<rect class="box" x="540" y="226" width="120" height="44" rx="8" />
	<text x="600" y="252.5" text-anchor="middle" class="strong">Worker</text>
	<polyline class="line" points="580,152 620,152" />
	<polygon class="head" points="620,152 611.0,147.5 611.0,156.5" />
	<polygon class="head" points="580,152 589.0,156.5 589.0,147.5" />
	<polyline class="line" points="530,174 580,226" />
	<polygon class="head" points="580,226 577.0,216.4 570.5,222.6" />
	<polygon class="head" points="530,174 533.0,183.6 539.5,177.4" />
	<polyline class="line" points="690,174 620,226" />
	<polygon class="head" points="620,226 629.9,224.2 624.5,217.0" />
	<polygon class="head" points="690,174 680.1,175.8 685.5,183.0" />
	<text x="600" y="114" text-anchor="middle" class="muted">Messaging: tabs, frames, workers</text>
</svg>
```

## A service: one object for the Application

```js
Elemenx.Service('Cart', {
	$OnCreate: function () {
		this.Items = [];
	},

	Add: function (product) {
		this.Items.push(product);
	}
});
```

`this.$Service('Cart')` in any component, service, guard or directive of the Application returns **the same object**. It is made the first time someone asks for it (its `$OnCreate` runs then), and lives as long as its Application; its `$OnDestroy` runs when the Application goes. Two Applications of one page have two carts: a service belongs to its Application, never to the page.

A service is a plain object, not reactive (see [How state updates the page](/core/reactivity)). A component that shows its data copies what it shows into its own fields when the service tells it: the service keeps listeners (`OnChange`), the component adds one in `$OnCreate` and removes it in `$OnDestroy`. This keeps a service usable anywhere, in a test without a page included, and keeps the cost of updates in the components that show something.

**Guards** are functions the router calls before a navigation, with the same `this.$Service` (see [How a navigation happens](/core/router)).

## Events: inside the page

When two parts of a page should not know each other (a header that shows a count, a page that changes it), one says that something happened on a **channel**, and whoever listens hears it:

```js
this.$Events().Emit('cart:changed', {Count: 3});

this.$Events().On('cart:changed', function (event) {
	self.Count = event.Data.Count;
});
```

Delivery is synchronous, in the same page, with the object itself. A socket made by `this.$Events()` belongs to its component or service and is closed with it, so a destroyed component never hears an event again.

Prefer a service when there is state to keep (the count itself), and an event when there is only news to tell (a toast to show, a sound to play).

## Messages: between tabs, frames and workers

`Elemenx.Messaging` carries messages on channels between every place Elemenx runs: the other tabs of the site, the frames and windows a page opens, its web workers and its service worker. A socket does not need to know where the others are: the runtimes find each other (through `BroadcastChannel` and `postMessage`) and pass the messages along.

```js
this.$Messaging().Send('cart:changed', {Count: 3});
```

A message is copied, as everything that crosses a boundary of the browser: send data, not objects with methods. A tab that signs out can tell the others; a worker that finished a long computation tells the page.

## Who owns what

| Made by | Belongs to | Ends |
| --- | --- | --- |
| `this.$Service('Cart')` | the Application | with the Application |
| `this.$Events()`, `this.$Messaging()`, `this.$Network()...` in a component | the component | when the component is destroyed |
| the same in a service | the service | with the service, so with its Application |
| `Elemenx.Events()` in plain code | nobody | when you call `Destroy()` |

Ownership is what keeps a long-lived application from leaking: what a component opened is closed when it goes, without code of yours.
