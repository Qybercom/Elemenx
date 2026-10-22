<!-- generated -->
# SSE

`Network.SSE` принимает события сервера через `EventSource`: ответ, который сервер держит открытым и пишет в него сообщения — `data: ...` и пустая строка. Браузер сам переподключается при обрыве и отправляет `id` последнего полученного сообщения (`Last-Event-ID`), чтобы сервер продолжил с него.

```js
var events = this.$Network().SSE({URL: '/api/prices', Protocol: 'JSON'});

events.On('Protocol.JSON', function (event) {
	self.Price = event.Data.Price;
});

events.Connect();
```

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `URL` | `URL(value)` | адрес потока |
| `WithCredentials` | `WithCredentials(value)` | `true` отправляет cookie другого источника (CORS) |
| `Protocol` | `Protocol(value)` | декодирует `data` каждого сообщения |

## Методы

- `Connect()` открывает `EventSource`.
- `Close()` закрывает его: браузер перестаёт переподключаться.
- `Source()` — нативный `EventSource` или `null`, пока закрыт.

## События

| Событие | Данные |
| --- | --- |
| `Transport.BeforeConnect` | `{URL, WithCredentials}` |
| `Transport.Open` | `{Event, Source}`: также после каждого переподключения |
| `Transport.Data` | `{Data, LastEventID, Origin, Event, Source}`: одно сообщение |
| `Protocol.<Type>` | сообщение, декодированное протоколом |
| `Transport.Error` | `{ReadyState, Event, Source}`: `ReadyState` 0 — браузер переподключается, 2 — сдался |
| `Transport.BeforeClose`, `Transport.Close` | `{Source}` |

Сервер завершает свой ответ, и браузер открывает его снова через `retry` миллисекунд: событие `Error` с `ReadyState` 0, затем `Open`. Чтобы остановиться совсем, вызовите `Close()`.

## Пример

Сервер справки отправляет пять событий, по одному каждые 400 миллисекунд, и завершает ответ. Пример закрывает поток после пятого, чтобы браузер не запрашивал его снова:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect" Variant="primary" [disabled]="Open" (click)="Connect" />
	<Button Label="Close" Variant="ghost" [disabled]="!Open" (click)="Close" />
</div>
<p class="elemenx-text small muted">{{Steps}}</p>
<ul class="elemenx-ul">
	<li *for="message of Messages" *key="message.Index">id {{message.ID}}: event {{message.Index}} at {{message.Time}}</li>
</ul>
<script>
({
	Open: false,
	Steps: '',
	Messages: [],
	Events: null,

	Connect: function () {
		var self = this;
		var steps = [];

		this.Messages = [];

		this.Events = this.$Network().SSE({URL: '/api/events'});

		this.Events.On('Transport', function (event) {
			steps.push(event.Type);

			self.Steps = steps.join(' → ');
		});

		this.Events.On('Transport.Open', function () {
			self.Open = true;
		});

		this.Events.On('Transport.Data', function (event) {
			var data = JSON.parse(event.Data.Data);

			data.ID = event.Data.LastEventID;
			self.Messages = self.Messages.concat([data]);

			if (data.Index >= 5)
				self.Events.Close();
		});

		this.Events.On('Transport.Close', function () {
			self.Open = false;
		});

		this.Events.Connect();
	},

	Close: function () {
		this.Events.Close();
	}
})
</script>
```

SSE работает в одну сторону — от сервера. Для сообщений в обе стороны используйте [WebSocket](/network/websocket), а где ответ не может оставаться открытым — [LongPolling](/network/longpolling).
