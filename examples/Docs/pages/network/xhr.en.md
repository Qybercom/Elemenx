# XHR

`Network.XHR` is one HTTP request and its response, on `XMLHttpRequest`: the upload and the download report their progress, and the steps of the request are events. A request may be executed again once it has finished.

```js
var request = this.$Network().XHR({
	Method: 'POST',
	URL: '/api/orders',
	Headers: {'Content-Type': 'application/json'},
	Data: JSON.stringify({Product: 7, Count: 2}),
	ResponseType: 'json',
	Timeout: 10000
});

request.On('Transport.Success', function (event) {
	console.log(event.Data.Status, event.Data.Response);
});

request.On('Transport.Error', function (event) {
	console.log('The request failed', event.Data.Event);
});

request.Execute();
```

## Settings

| Setting | Setter | Meaning |
| --- | --- | --- |
| `Method` | `Method(value)` | `GET` by default |
| `URL` | `URL(value)` | the address |
| `Data` | `Data(value)` | the body: a text, a `FormData`, a `Blob`, an `ArrayBuffer`... (sent as it is, or encoded by the Protocol) |
| `Headers` | `Header(name, value)` | request headers; a value may be a list, and `Header` adds to what is there |
| `Protocol` | `Protocol(value)` | a [Protocol](/network/protocols) (its name or its definition) that encodes `Data` and decodes the response |
| `Timeout` | | milliseconds before the request gives up (`Timeout` event) |
| `ResponseType` | | `''`, `'text'`, `'json'`, `'blob'`, `'arraybuffer'`, `'document'`, as `XMLHttpRequest` has them |

`Data` goes as it is: an object needs `JSON.stringify` (or a Protocol whose `Encode` does it), and a `FormData` sets its own content type.

## Methods

- `Execute()` sends the request; while it runs, a second `Execute()` does nothing.
- `Abort()` stops it (`Abort` event).
- `XHR()` returns the native `XMLHttpRequest` of the current request.
- `On(name, callback)`, `Off(name, callback)`, `$StartedAt()`, `$ConnectedAt()`, `$ClosedAt()`.

## Events

In the order they come:

| Event | Data |
| --- | --- |
| `Transport.BeforeRequest` | `{Method, URL, Data, XHR}`: the request is about to be sent (a context adds headers here) |
| `Transport.RequestProgress` | the `ProgressEvent` of the upload |
| `Transport.AfterRequest` | the upload is complete |
| `Transport.BeforeResponse` | `{Status, StatusText, Headers, URL, XHR}`: the headers of the response are in |
| `Transport.ResponseProgress` | the `ProgressEvent` of the download |
| `Transport.AfterResponse` | `{Status, StatusText, Headers, Response, ResponseText, URL, XHR}` |
| `Protocol.<Type>` | the response decoded by the Protocol |
| `Transport.Success` | the same as `AfterResponse`: the request is over |
| `Transport.Error`, `Transport.Abort`, `Transport.Timeout` | `{Event, XHR}`: it failed, was aborted, or took too long |

`Success` means an answer came, whatever its status: a `404` is a success of the transport, so look at `Status`.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="GET /api/hello" Variant="primary" (click)="Get" />
	<Button Label="POST /api/echo" (click)="Post" />
</div>
<p class="elemenx-text small muted">{{Steps}}</p>
<pre class="elemenx-code">{{Result}}</pre>
<script>
({
	Steps: '',
	Result: 'Press a button.',

	Get: function () {
		this.Run(this.$Network().XHR({URL: '/api/hello', ResponseType: 'json'}));
	},

	Post: function () {
		this.Run(this.$Network().XHR({
			Method: 'POST',
			URL: '/api/echo',
			Headers: {'Content-Type': 'application/json'},
			Data: JSON.stringify({Hello: 'server', Sent: new Date().toISOString()}),
			ResponseType: 'json'
		}));
	},

	Run: function (request) {
		var self = this;
		var steps = [];

		request.On('Transport', function (event) {
			steps.push(event.Type);

			self.Steps = steps.join(' → ');
		});

		request.On('Transport.Success', function (event) {
			self.Result = event.Data.Status + '\n' + JSON.stringify(event.Data.Response, null, 2);
		});

		request.On('Transport.Error', function () {
			self.Result = 'The request failed.';
		});

		request.Execute();
	}
})
</script>
```

## Progress of an upload

```js
var upload = this.$Network().XHR({Method: 'POST', URL: '/api/upload', Data: file});

upload.On('Transport.RequestProgress', function (event) {
	if (event.Data.lengthComputable)
		self.Percent = Math.round(event.Data.loaded * 100 / event.Data.total);
});

upload.Execute();
```

For a file that must survive a broken connection, or for several files inside one object, use a [Transfer](/network/transfer) over the request: it reports one progress, and over a socket it resends what was lost.
