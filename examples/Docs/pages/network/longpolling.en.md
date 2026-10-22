# LongPolling

`Network.LongPolling` asks the server for news with a request the server holds until it has some; as soon as the answer comes, the next request goes. It brings messages from the server where a response cannot stay open (an old proxy, a serverless function, a host that cuts long responses). After an error or a timeout the next request waits `Retry` milliseconds.

```js
var feed = this.$Network().LongPolling({URL: '/api/notifications', Retry: 2000, Timeout: 30000});

feed.On('Transport.Data', function (event) {
	self.Notifications.push(JSON.parse(event.Data.Data));
});

feed.Connect();
```

## Settings

| Setting | Setter | Meaning |
| --- | --- | --- |
| `Method`, `URL`, `Data`, `Headers`, `Protocol` | as for [XHR](/network/xhr) | every request of the poll sends them |
| `Retry` | `Retry(milliseconds)` | the pause after an error or a timeout, 1000 by default |
| `Timeout` | | milliseconds a request may wait (`Timeout` event, then a retry) |

## Methods

- `Connect()` starts polling (`BeforeConnect`, `Open`, then the requests).
- `Close()` stops it and aborts the request that waits (`BeforeClose`, `Close`).
- `XHR()` is the request that waits now.

## Events

| Event | Data |
| --- | --- |
| `Transport.BeforeConnect`, `Transport.Open` | `{URL}` |
| `Transport.BeforeRequest` | `{Method, URL, Data, XHR}`: before every request |
| `Transport.BeforeResponse` | `{Status, StatusText, XHR}` |
| `Transport.Data` | `{Data, Status, StatusText, XHR}`: `Data` is the text of the answer |
| `Protocol.<Type>` | the answer decoded by the Protocol |
| `Transport.AfterResponse` | `{Status, StatusText, Response, XHR}` |
| `Transport.Error`, `Transport.Timeout` | `{Event, XHR}`: the next request waits `Retry` |
| `Transport.BeforeClose`, `Transport.Close` | `{URL}` |

## Example

The server of this reference holds `/api/poll` for 600 milliseconds and answers with a number that grows. The Protocol decodes the JSON of every answer:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect" Variant="primary" [disabled]="Polling" (click)="Connect" />
	<Button Label="Close" Variant="ghost" [disabled]="!Polling" (click)="Close" />
</div>
<p class="elemenx-text small muted">{{Polling ? 'Polling' : 'Stopped'}} · {{Answers.length}} answers</p>
<ul class="elemenx-ul">
	<li *for="answer of Answers" *key="answer.Sequence">#{{answer.Sequence}} at {{answer.Time}}</li>
</ul>
<script>
({
	Polling: false,
	Answers: [],
	Feed: null,

	Connect: function () {
		var self = this;

		this.Answers = [];

		this.Feed = this.$Network().LongPolling({
			URL: '/api/poll',
			Retry: 1000,
			Protocol: {
				Decode: function (text) {
					return {Type: 'Answer', Data: JSON.parse(text)};
				}
			}
		});

		this.Feed.On('Transport.Open', function () {
			self.Polling = true;
		});

		this.Feed.On('Protocol.Answer', function (event) {
			self.Answers = [event.Data].concat(self.Answers).slice(0, 5);
		});

		this.Feed.On('Transport.Close', function () {
			self.Polling = false;
		});

		this.Feed.Connect();
	},

	Close: function () {
		this.Feed.Close();
	}
})
</script>
```

The server answers every request: with news, or with nothing after a while (a `204`, an empty list), so that proxies do not cut a request that waits too long.
