# WebSocket

`Network.WebSocket` is a socket that carries messages both ways while it is open. It adds to the browser's `WebSocket` a Protocol (messages encoded and decoded as typed events) and backpressure: when more is queued than the network takes, `Send` refuses instead of filling the memory, and a `Drain` event says when it may go on.

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

## Settings

| Setting | Setter | Meaning |
| --- | --- | --- |
| `URL` | `URL(value)` | `ws://` or `wss://` |
| `Protocols` | `Protocols(value)` | the subprotocols of the WebSocket handshake (a name or a list) |
| `BinaryType` | `BinaryType(value)` | `'blob'` (the default) or `'arraybuffer'`: how binary messages arrive |
| `Protocol` | `Protocol(value)` | the [Protocol](/network/protocols) of the messages |
| `BufferHighWaterMark` | `BufferHighWaterMark(bytes)` | 4 MiB: above this many bytes waiting in the socket, `Send` refuses |
| `BufferLowWaterMark` | `BufferLowWaterMark(bytes)` | 1 MiB: below this, after a refusal, `Drain` comes |
| `DrainInterval` | `DrainInterval(milliseconds)` | 10: how often the socket checks whether it drained |

The water marks and the interval may change while the socket is open; without an argument their setters return the value.

## Methods

- `Connect()` opens the socket.
- `Send(message)` encodes the message with the Protocol and sends it. It returns `true`, or `false` when the socket is not open or under pressure (nothing was sent: try again on `Drain`).
- `Writable()` is `true` when the socket is open and not under pressure.
- `Close(code, reason)` closes it.
- `Socket()` is the native `WebSocket`, or `null` while closed.

## Events

| Event | Data |
| --- | --- |
| `Transport.BeforeConnect` | `{URL, Protocols, Socket}` |
| `Transport.Open` | `{Event, Protocol, Extensions, Socket}` |
| `Transport.BeforeSend`, `Transport.AfterSend` | `{Data, BufferedAmount, Socket}`: around every message |
| `Transport.Data` | `{Data, Origin, Event, Socket}`: a message as it came |
| `Protocol.<Type>` | the message decoded by the Protocol |
| `Transport.Backpressure` | `{BufferedAmount, Bytes, HighWaterMark, Socket}`: the socket is full |
| `Transport.Drain` | `{BufferedAmount, Socket}`: it may take messages again |
| `Transport.Error` | `{Event, Socket}` |
| `Transport.BeforeClose` | `{Code, Reason, Socket}` |
| `Transport.Close` | `{Code, Reason, Clean, Event, Socket}` |

A WebSocket does not reconnect by itself: listen to `Close` and call `Connect()` again when the Application wants it to.

## Example

The server of this reference answers every message with `{Echo, Time}`. The Protocol sends objects as JSON and decodes the answers:

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

## Sending a lot

A loop that sends many messages stops when `Send` returns `false` and goes on with the next one on `Drain`:

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

A [Transfer](/network/transfer) does this for you, with acknowledgments and retries, and reports one progress.
