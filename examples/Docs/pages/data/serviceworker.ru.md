<!-- generated -->
# Service Worker

`Elemenx.ServiceWorker` регистрирует service worker с загруженным в нём Elemenx, подключает его к [обмену сообщениями](/data/messaging) и сообщает о состояниях регистрации событиями. Service worker живёт дольше страницы: кэширует файлы, чтобы страница работала без сети, принимает push-сообщения, отвечает на запросы страниц своей области.

```js
var worker = this.$ServiceWorker('Offline', {Script: '/offline-worker.js', Scope: '/', Channel: 'offline'});

worker.On('Active', function () {
	this.$Messaging().Send('offline', {Command: 'cache', URLs: ['/', '/app.js']});
}.bind(this));
```

Браузер регистрирует воркером сам фреймворк (`elemenx.js?elemenx_service_worker=1&...`); тот загружает скрипт приложения и задаёт `ElemenxWorkerName` и `ElemenxWorkerChannel`, как в [web worker](/data/webworker):

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

## Определение

| Ключ | Значение |
| --- | --- |
| `Script` | скрипт воркера (обязателен) |
| `Scope` | страницы, которыми он управляет, по умолчанию `'./'` |
| `Channel` | его канал, по умолчанию его имя |
| `Framework` | URL `elemenx.js`, по умолчанию скрипт, загруженный страницей |

`Elemenx.ServiceWorker(name, definition)` сразу регистрирует его и возвращает описатель; `this.$ServiceWorker(name, definition)` создаёт описатель, принадлежащий владельцу. Service worker требует HTTPS или `localhost`.

## Описатель

| Метод | Значение |
| --- | --- |
| `Register()` | регистрирует снова после `Unregister` или ошибки |
| `Update()` | просит браузер проверить, нет ли новой версии скрипта |
| `Unregister()` | снимает регистрацию |
| `State()` | `'Unregistered'`, `'Registering'`, `'Installing'`, `'Waiting'`, `'Active'`, `'Unregistering'` или `'Error'` |
| `Registered(callback)` | вызывает обратно `true` или `false`: есть ли у браузера регистрация для его области |
| `Controlled()` | управляет ли этой страницей service worker |
| `Reachable()` | подключён ли активный воркер к обмену сообщениями |
| `Registration()` | `ServiceWorkerRegistration` |
| `Name()`, `Channel()`, `Scope()`, `Destroy()` | |
| `On(state, callback)`, `Off(state, callback)` | событие на каждое состояние по мере наступления: `Registering`, `Installing`, `Waiting`, `Active`, `Unregistering`, `Unregistered`, `Error`; обработчик получает `{Type, Worker, State, Data}` |

## Пример

Service worker справки отвечает в своём канале. Его область, `/sw-demo/`, не включает эту страницу, поэтому здесь он ничем не управляет:

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
