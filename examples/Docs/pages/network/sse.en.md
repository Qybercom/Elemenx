# SSE

`Network.SSE` receives server-sent events through `EventSource`: a response the server keeps open and writes messages into, `data: ...` followed by a blank line. The browser reconnects by itself when the connection breaks, and sends the `id` of the last message it received (`Last-Event-ID`), so the server can go on from there.

```js
var events = this.$Network().SSE({URL: '/api/prices', Protocol: 'JSON'});

events.On('Protocol.JSON', function (event) {
	self.Price = event.Data.Price;
});

events.Connect();
```

## Settings

| Setting | Setter | Meaning |
| --- | --- | --- |
| `URL` | `URL(value)` | the address of the stream |
| `WithCredentials` | `WithCredentials(value)` | `true` sends the cookies of another origin (CORS) |
| `Protocol` | `Protocol(value)` | decodes the `data` of every message |

## Methods

- `Connect()` opens the `EventSource`.
- `Close()` closes it: the browser stops reconnecting.
- `Source()` is the native `EventSource`, or `null` while closed.

## Events

| Event | Data |
| --- | --- |
| `Transport.BeforeConnect` | `{URL, WithCredentials}` |
| `Transport.Open` | `{Event, Source}`: also after every reconnection |
| `Transport.Data` | `{Data, LastEventID, Origin, Event, Source}`: one message |
| `Protocol.<Type>` | the message decoded by the Protocol |
| `Transport.Error` | `{ReadyState, Event, Source}`: `ReadyState` 0 means the browser reconnects, 2 that it gave up |
| `Transport.BeforeClose`, `Transport.Close` | `{Source}` |

The server ends its response, and the browser opens it again after `retry` milliseconds: an `Error` event with `ReadyState` 0, then `Open`. To stop for good, call `Close()`.

## Example

The server of this reference sends five events, one every 400 milliseconds, then ends the response. The example closes the stream after the fifth one, so the browser does not ask again:

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

SSE goes one way, from the server. For messages both ways use a [WebSocket](/network/websocket); where a response cannot stay open, [LongPolling](/network/longpolling).
