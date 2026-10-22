# Service workers

`Elemenx.ServiceWorker` registers a service worker with Elemenx loaded in it and connects it to [Messaging](/data/messaging), and reports the states of its registration as events. A service worker lives beyond the page: it caches files for the page to work offline, receives push messages, answers requests of the pages of its scope.

```js
var worker = this.$ServiceWorker('Offline', {Script: '/offline-worker.js', Scope: '/', Channel: 'offline'});

worker.On('Active', function () {
	this.$Messaging().Send('offline', {Command: 'cache', URLs: ['/', '/app.js']});
}.bind(this));
```

The browser registers the framework itself (`elemenx.js?elemenx_service_worker=1&...`) as the worker; it loads the script of the Application and sets `ElemenxWorkerName` and `ElemenxWorkerChannel`, as in a [web worker](/data/webworker):

```js
/* /offline-worker.js */
var socket = Elemenx.Messaging();

socket.On(ElemenxWorkerChannel, function (message) {
	if (message.Data.Command === 'cache')
		caches.open('v1').then(function (cache) {
			return cache.addAll(message.Data.URLs);
		});
});

self.addEventListener('fetch', function (event) {
	event.respondWith(caches.match(event.request).then(function (cached) {
		return cached || fetch(event.request);
	}));
});
```

## The definition

| Key | Meaning |
| --- | --- |
| `Script` | the script of the worker (required) |
| `Scope` | the pages it controls, `'./'` by default |
| `Channel` | its channel, its name by default |
| `Framework` | the URL of `elemenx.js`, the script the page loaded by default |

`Elemenx.ServiceWorker(name, definition)` registers it at once and returns a handle; `this.$ServiceWorker(name, definition)` makes one that belongs to its owner. A service worker needs HTTPS or `localhost`.

## The handle

| Method | Meaning |
| --- | --- |
| `Register()` | registers again after `Unregister` or an error |
| `Update()` | asks the browser to check the script for a new version |
| `Unregister()` | unregisters it |
| `State()` | `'Unregistered'`, `'Registering'`, `'Installing'`, `'Waiting'`, `'Active'`, `'Unregistering'` or `'Error'` |
| `Registered(callback)` | calls back `true` or `false`: whether the browser has a registration for its scope |
| `Controlled()` | whether a service worker controls this page |
| `Reachable()` | whether the active worker is connected to Messaging |
| `Registration()` | the `ServiceWorkerRegistration` |
| `Name()`, `Channel()`, `Scope()`, `Destroy()` | |
| `On(state, callback)`, `Off(state, callback)` | an event for each state as it comes: `Registering`, `Installing`, `Waiting`, `Active`, `Unregistering`, `Unregistered`, `Error`; the callback gets `{Type, Worker, State, Data}` |

## Example

The service worker of this reference answers on its channel. Its scope, `/sw-demo/`, does not hold this page, so it controls nothing here:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Register" Variant="primary" [disabled]="Worker" (click)="Register" />
	<Button Label="Ping" [disabled]="State !== 'Active'" (click)="Ping" />
	<Button Label="Unregister" Variant="ghost" [disabled]="!Worker" (click)="Unregister" />
</div>
<Properties>
	<Property Label="State" [value]="State" />
	<Property Label="Answer" [value]="Answer" />
</Properties>
<script>
({
	Worker: null,
	State: 'Unregistered',
	Answer: '—',

	$OnCreate: function () {
		var self = this;

		this.Socket = this.$Messaging();

		this.Socket.On(function (message) {
			self.Answer = message.Data.Worker + ': ' + message.Data.Type + ' at ' + message.Data.Time;
		});
	},

	Register: function () {
		var self = this;

		this.Worker = this.$ServiceWorker('DocsService', {Script: '/workers/service.js', Scope: '/sw-demo/', Channel: 'docs:service'});

		['Registering', 'Installing', 'Waiting', 'Active', 'Unregistering', 'Unregistered', 'Error'].forEach(function (state) {
			self.Worker.On(state, function () {
				self.State = state;
			});
		});

		this.State = this.Worker.State();
	},

	Ping: function () {
		this.Answer = 'waiting';

		this.Socket.Send('docs:service', {Command: 'ping'});
	},

	Unregister: function () {
		var self = this;

		this.Worker.On('Unregistered', function () {
			self.Worker.Destroy();
			self.Worker = null;
		});

		this.Worker.Unregister();
	}
})
</script>
```
