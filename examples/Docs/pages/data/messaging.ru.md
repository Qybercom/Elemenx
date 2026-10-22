<!-- generated -->
# Обмен сообщениями

`Elemenx.Messaging` переносит сообщения по именованным каналам между всеми местами, где работает Elemenx: компонентами страницы, её фреймами и открытыми ею окнами, другими вкладками сайта, её [web worker'ами](/data/webworker) и [service worker'ами](/data/serviceworker). Сокету не нужно знать, где его собеседники: среды выполнения находят друг друга и передают сообщения дальше. Для сообщений внутри одной среды проще и синхроннее [события](/data/events).

```js
var socket = this.$Messaging();

socket.On('chat:message', function (message) {
	console.log(message.Data.Text, 'from', message.Source);
});

socket.Send('chat:message', {Text: 'Hello'});
```

## Сокеты

`Elemenx.Messaging(context)` создаёт сокет; `this.$Messaging(context)` создаёт сокет, принадлежащий компоненту, сервису или приложению и уничтожаемый вместе с ними.

| Метод | Значение |
| --- | --- |
| `On(channel, callback)` | слушает канал |
| `On(callback)` | слушает собственный канал сокета: ответы, отправленные ему |
| `Off(channel, callback)`, `Off(callback)` | перестаёт слушать |
| `Send(channel, data, options)` | отправляет каждому сокету, слушающему канал, здесь и во всех подключённых средах; `{Transferable: true}` передаёт `data` (`ArrayBuffer`, `MessagePort`) вместо копирования, когда она идёт в одну среду |
| `ID(value)` | задаёт имя собственного канала сокета; `ID()` возвращает его |
| `Channels()` | собственный канал и каналы, которые слушает сокет |
| `Destroy()` | удаляет сокет |

Сообщение — `{Channel, Source, Data, Is}`. `Source` — собственный канал отправившего сокета: `socket.Send(message.Source, answer)` отвечает только отправителю. `message.Is(channel, pipes, handler)` работает как у [событий](/data/events), с теми же звеньями конвейера.

Данные сообщения, покидающего среду, копируются структурным клонированием браузера: простые объекты, списки, даты, `Blob`, `ArrayBuffer`, `Map`... но не функции и не узлы DOM.

## Объявленные каналы

```js
Elemenx.Component('OrderStatus', {
	$Template: '<p>{{Status}}</p>',
	$Messaging: ['orders:status', 'orders:cancelled'],
	Status: '',

	$OnMessage: function (message) {
		if (message.Is('orders:status')) this.Status = message.Data.Status;
		else if (message.Is('orders:cancelled')) this.Status = 'Cancelled';
	}
});
```

`$Messaging` — текст (ID сокета: сообщения, отправленные в этот канал), список каналов или `{ID, Channels, Context}`; `$OnMessage(message)` получает все их сообщения. Каждый сокет компонента слушает ещё два своих канала: `elemenx:<Name>` (все экземпляры этого компонента) и `elemenx:<Name>:<index>` (один из них).

## Контексты

`Elemenx.Messaging.Context(name, {ID, Channels, Contexts})` именует набор каналов и ID, которые получают сокеты: `Elemenx.Messaging('Name')`, `$Messaging: {Context: 'Name'}`. Приложение объявляет контекст через `this.$Messaging(name, definition)`.

## Куда идут сообщения

- **Фреймы и окна.** Страница Elemenx внутри iframe объявляет о себе родителю, а окно, открытое другим, — открывшему; другая сторона отвечает, и они соединяются — ничего вызывать не нужно. Повторные объявления учитываются один раз.
- **Другие источники.** Фрейм или окно другого источника отклоняется, пока обе стороны не доверяют друг другу: `Elemenx.Messaging.Origins('https://other.example.com')` (текст или список) на каждой. Первое объявление не несёт данных; сообщения после него идут только проверенному источнику.
- **Другие вкладки.** Вкладки одного источника разделяют `BroadcastChannel`: сообщение доходит до сокетов каждой.
- **Воркеры.** Web worker или service worker, созданный Elemenx, подключён к своей странице (см. [Web Worker](/data/webworker)).
- **Вручную.** `Elemenx.Messaging.Window(target, {Origin, Transferable})` подключает окно, не являющееся ни фреймом, ни открывшим: `target` — селектор iframe, iframe или `Window`; `Origin` — каким должен быть его источник (по умолчанию источник страницы; `'*'` — любой). Возвращает `{Target(), Origin(), Active(), Destroy()}`. `this.$Messaging.Window(...)` делает то же для владельца, а селектор ищется внутри его элемента.

Сообщение доходит до каждой среды один раз, сколько бы путей к ней ни вело.

## Пример

Два сокета этой страницы; второй отвечает в собственный канал первого. Откройте эту страницу во второй вкладке и нажмите *Ping the tabs*: другая вкладка ответит через `BroadcastChannel`.

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Ask" Variant="primary" (click)="Ask" />
	<Button Label="Ping the tabs" (click)="Ping" />
</div>
<ul class="elemenx-ul">
	<li *for="line of Log" *key="line">{{line}}</li>
</ul>
<script>
({
	Log: [],
	Count: 0,

	$OnCreate: function () {
		var self = this;
		var runtime = Elemenx.RuntimeID();

		this.Asker = this.$Messaging();
		this.Answerer = this.$Messaging();

		this.Answerer.On('docs:question', function (message) {
			self.Answerer.Send(message.Source, 'The answer to "' + message.Data + '" is 42');
		});

		this.Asker.On(function (message) {
			self.Write(message.Data);
		});

		this.Answerer.On('docs:tabs', function (message) {
			if (message.Data.Runtime !== runtime)
				self.Answerer.Send(message.Source, 'Pong from the tab ' + runtime.slice(-6));
		});
	},

	Write: function (line) {
		this.Count++;

		this.Log = this.Log.concat([this.Count + '. ' + line]).slice(-6);
	},

	Ask: function () {
		this.Asker.Send('docs:question', 'question ' + (this.Count + 1));
	},

	Ping: function () {
		this.Write('Ping sent; open this page in another tab to get an answer');

		this.Asker.Send('docs:tabs', {Runtime: Elemenx.RuntimeID()});
	}
})
</script>
```
