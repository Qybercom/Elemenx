<!-- generated -->
# WebSocket

`Network.WebSocket` — сокет, который переносит сообщения в обе стороны, пока открыт. К браузерному `WebSocket` он добавляет протокол (сообщения кодируются и декодируются в типизированные события) и обратное давление: когда в очереди больше, чем принимает сеть, `Send` отказывает, а не заполняет память, и событие `Drain` говорит, когда можно продолжать.

```js
var socket = this.$Network().WebSocket({URL: 'wss://example.com/chat', Protocol: 'ChatJSON'});

socket.On('Transport.Open', function () {
	socket.Send({Type: 'Join', Room: 'general'});
});

socket.On('Protocol.Message', function (event) {
	self.Messages.push(event.Data);
});

socket.Connect();
```

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `URL` | `URL(value)` | `ws://` или `wss://` |
| `Protocols` | `Protocols(value)` | подпротоколы рукопожатия WebSocket (имя или список) |
| `BinaryType` | `BinaryType(value)` | `'blob'` (по умолчанию) или `'arraybuffer'`: в каком виде приходят двоичные сообщения |
| `Protocol` | `Protocol(value)` | [протокол](/network/protocols) сообщений |
| `BufferHighWaterMark` | `BufferHighWaterMark(bytes)` | 4 МиБ: если в сокете ждёт больше байт, `Send` отказывает |
| `BufferLowWaterMark` | `BufferLowWaterMark(bytes)` | 1 МиБ: когда после отказа становится меньше, приходит `Drain` |
| `DrainInterval` | `DrainInterval(milliseconds)` | 10: как часто сокет проверяет, освободился ли он |

Пороги и интервал можно менять при открытом сокете; без аргумента сеттеры возвращают значение.

## Методы

- `Connect()` открывает сокет.
- `Send(message)` кодирует сообщение протоколом и отправляет его. Возвращает `true` или `false`, если сокет не открыт или перегружен (ничего не отправлено: повторите на `Drain`).
- `Writable()` — `true`, если сокет открыт и не перегружен.
- `Close(code, reason)` закрывает его.
- `Socket()` — нативный `WebSocket` или `null`, пока закрыт.

## События

| Событие | Данные |
| --- | --- |
| `Transport.BeforeConnect` | `{URL, Protocols, Socket}` |
| `Transport.Open` | `{Event, Protocol, Extensions, Socket}` |
| `Transport.BeforeSend`, `Transport.AfterSend` | `{Data, BufferedAmount, Socket}`: вокруг каждого сообщения |
| `Transport.Data` | `{Data, Origin, Event, Socket}`: сообщение, как пришло |
| `Protocol.<Type>` | сообщение, декодированное протоколом |
| `Transport.Backpressure` | `{BufferedAmount, Bytes, HighWaterMark, Socket}`: сокет переполнен |
| `Transport.Drain` | `{BufferedAmount, Socket}`: можно снова отправлять |
| `Transport.Error` | `{Event, Socket}` |
| `Transport.BeforeClose` | `{Code, Reason, Socket}` |
| `Transport.Close` | `{Code, Reason, Clean, Event, Socket}` |

WebSocket сам не переподключается: слушайте `Close` и вызывайте `Connect()` снова, когда это нужно приложению.

## Пример

Сервер справки отвечает на каждое сообщение объектом `{Echo, Time}`. Протокол отправляет объекты как JSON и декодирует ответы:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect" Variant="primary" [disabled]="Open" (click)="Connect" />
	<Button Label="Close" Variant="ghost" [disabled]="!Open" (click)="Close" />
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Text" placeholder="A message" /></span>
	<Button Label="Send" Icon="send" [disabled]="!Open || !Text" (click)="Send" />
</div>
<p class="elemenx-text small muted">{{Status}}</p>
<ul class="elemenx-ul">
	<li *for="echo of Echoes" *key="echo.Time">{{echo.Echo}} <span class="elemenx-caption">{{echo.Time}}</span></li>
</ul>
<script>
({
	Open: false,
	Text: 'Hello',
	Status: 'Closed',
	Echoes: [],
	Socket: null,

	Connect: function () {
		var self = this;

		this.Socket = this.$Network().WebSocket({
			URL: (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/api/socket',
			Protocol: {
				Encode: function (message) {
					return JSON.stringify(message);
				},
				Decode: function (text) {
					return {Type: 'Echo', Data: JSON.parse(text)};
				}
			}
		});

		this.Socket.On('Transport.Open', function () {
			self.Open = true;
			self.Status = 'Open';
		});

		this.Socket.On('Protocol.Echo', function (event) {
			self.Echoes = [{Echo: JSON.parse(event.Data.Echo).Text, Time: event.Data.Time}].concat(self.Echoes).slice(0, 5);
		});

		this.Socket.On('Transport.Close', function (event) {
			self.Open = false;
			self.Status = 'Closed: ' + event.Data.Code + (event.Data.Reason ? ' ' + event.Data.Reason : '');
		});

		this.Socket.Connect();
	},

	Send: function () {
		if (!this.Socket.Send({Text: this.Text}))
			this.Status = 'Not sent: the socket is full or closed';
	},

	Close: function () {
		this.Socket.Close(1000, 'done');
	}
})
</script>
```

## Отправка большого объёма

Цикл, отправляющий много сообщений, останавливается, когда `Send` возвращает `false`, и продолжает со следующего на `Drain`:

```js
function pump () {
	while (index < chunks.length) {
		if (!socket.Send(chunks[index])) return;

		index++;
	}
}

socket.On('Transport.Drain', pump);
pump();
```

[Transfer](/network/transfer) делает это за вас — с подтверждениями и повторами — и сообщает один общий прогресс.
