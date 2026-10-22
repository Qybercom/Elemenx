# Stream

`Network.Stream` reads a response while it comes, chunk by chunk, through `fetch` and a `ReadableStream`: a log that grows, lines of JSON that a server writes one after another, a text a model generates. The reading can be paused and resumed (the browser stops taking bytes from the network meanwhile), and closed at any moment.

```js
var stream = this.$Network().Stream({URL: '/api/logs?follow=1'});
var decoder = new TextDecoder();

stream.On('Transport.Data', function (event) {
	self.Log += decoder.decode(event.Data.Data, {stream: true});
});

stream.On('Transport.End', function () {
	self.Done = true;
});

stream.Connect();
```

## Settings

`Method`, `URL`, `Data` (the body of a request that is not `GET` or `HEAD`), `Headers` and `Protocol`, as for [XHR](/network/xhr), with the same setters.

## Methods

- `Connect()` starts the request and reads the response.
- `Pause()` stops reading (`Pause` event); `Resume()` reads on (`Resume` event).
- `Close()` cancels the reading and the request (`BeforeClose`, then `Close`).

## Events

| Event | Data |
| --- | --- |
| `Transport.BeforeConnect` | `{Method, URL, Data}` |
| `Transport.Open` | `{Status, StatusText, Headers, URL, Response}`: the headers are in |
| `Transport.Data` | `{Data, Bytes, Response}`: a chunk, a `Uint8Array` |
| `Protocol.<Type>` | the messages the Protocol found in the chunks |
| `Transport.End` | the response is complete |
| `Transport.Pause`, `Transport.Resume` | `{URL}` |
| `Transport.BeforeClose`, `Transport.Close` | `{URL}` |
| `Transport.Error` | `{Error}`, or `{Reason: 'ReadableStreamUnavailable'}` where the browser cannot read a body as a stream |

## Messages across chunks

A chunk ends anywhere: in the middle of a line, of a character of UTF-8. A Protocol with `Push(chunk)` keeps what is left over between chunks and returns the messages that are complete (see [Protocols](/network/protocols)). Here the server writes a line of JSON every 400 milliseconds, ten of them:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect" Variant="primary" [disabled]="Running" (click)="Connect" />
	<Button Label="Pause" [disabled]="!Running || Paused" (click)="Pause" />
	<Button Label="Resume" [disabled]="!Paused" (click)="Resume" />
	<Button Label="Close" Variant="ghost" [disabled]="!Running" (click)="Close" />
</div>
<p class="elemenx-text small muted">{{Status}} · {{Bytes}} bytes</p>
<ul class="elemenx-ul">
	<li *for="line of Lines" *key="line.Index">#{{line.Index}}: {{line.Text}}</li>
</ul>
<script>
({
	Running: false,
	Paused: false,
	Status: 'Idle',
	Bytes: 0,
	Lines: [],
	Stream: null,

	Connect: function () {
		var self = this;

		this.Lines = [];
		this.Bytes = 0;

		this.Stream = this.$Network().Stream({
			URL: '/api/stream',
			Protocol: {
				/* Keeps the end of a chunk that is not a whole line until the next chunk completes it. */
				Push: function (chunk) {
					var lines;

					this.Decoder = this.Decoder || new TextDecoder();
					lines = ((this.Rest || '') + this.Decoder.decode(chunk, {stream: true})).split('\n');
					this.Rest = lines.pop();

					return lines.filter(Boolean).map(function (line) {
						return {Type: 'Line', Data: JSON.parse(line)};
					});
				}
			}
		});

		this.Stream.On('Transport.Open', function () {
			self.Running = true;
			self.Status = 'Reading';
		});

		this.Stream.On('Transport.Data', function (event) {
			self.Bytes += event.Data.Bytes;
		});

		this.Stream.On('Protocol.Line', function (event) {
			self.Lines = self.Lines.concat([event.Data]);
		});

		this.Stream.On('Transport.End', function () {
			self.Running = false;
			self.Status = 'Complete';
		});

		this.Stream.On('Transport.Close', function () {
			self.Running = false;
			self.Paused = false;
			self.Status = 'Closed';
		});

		this.Stream.Connect();
	},

	Pause: function () {
		this.Stream.Pause();
		this.Paused = true;
		this.Status = 'Paused';
	},

	Resume: function () {
		this.Stream.Resume();
		this.Paused = false;
		this.Status = 'Reading';
	},

	Close: function () {
		this.Stream.Close();
	}
})
</script>
```

A [Transfer](/network/transfer) without data over a Stream receives a large response with its progress (`Loaded`, `Total`, `Speed`) and lets the user pause the download.
