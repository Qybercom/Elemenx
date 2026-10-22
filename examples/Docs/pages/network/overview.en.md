# Network

`Elemenx.Network` gives one model to every way a page talks to a server or to another page: a request, a stream of a response, a long poll, server-sent events, a WebSocket, a WebRTC data channel, a large transfer split into chunks, and the measurement of the traffic of any of them. Each one is a resource with the same shape: it is configured, it is started, it reports what happens as events, and it is closed or destroyed. None of them returns a Promise.

| Resource | What it is | Start | Stop |
| --- | --- | --- | --- |
| [XHR](/network/xhr) | one request and its response | `Execute()` | `Abort()` |
| [Stream](/network/stream) | a response read chunk by chunk while it comes (`fetch`) | `Connect()` | `Close()` |
| [LongPolling](/network/longpolling) | a request held by the server until it has news, made again and again | `Connect()` | `Close()` |
| [SSE](/network/sse) | server-sent events (`EventSource`) | `Connect()` | `Close()` |
| [WebSocket](/network/websocket) | a two-way socket, with backpressure | `Connect()` | `Close()` |
| [WebRTC](/network/webrtc) | a peer-to-peer data channel, with backpressure | `Connect()`, `CreateOffer()` | `Close()` |
| [Transfer](/network/transfer) | a large value (files, an object with files) sent or received in chunks with progress | `Send()`, `Execute()` | `Abort()` |
| `TransferReceiver` | the receiving side of a chunked Transfer | (listens) | `Destroy()` |
| [Metrics](/network/metrics) | bytes and speeds of a resource | `Start()`, `Begin()` | `End()`, `Stop()` |

Two more parts shape them: a [Protocol](/network/protocols) turns what a resource sends and receives into typed messages, and a [Context](/network/contexts) gives several resources the same protocol, listeners and settings.

## Creating a resource

A resource is made by a factory of `Elemenx.Network`, with its settings in an object, or by its setters one after another:

```js
var request = Elemenx.Network.XHR({Method: 'GET', URL: '/api/hello', ResponseType: 'json'});

var same = Elemenx.Network.XHR()
	.Method('GET')
	.URL('/api/hello')
	.Header('Accept', 'application/json');
```

Setters return the resource, so they chain; a setter called while the resource runs (an executing request, an open socket) is ignored.

## Owned resources

Inside a component, a service or an Application, use `this.$Network()` instead of `Elemenx.Network`. The resources it makes belong to their owner: when the component is destroyed, its requests are aborted, its sockets are closed and its transfers are destroyed, so nothing keeps running for a page that is gone. A resource made after its owner was destroyed throws `Elemenx Network owner is destroyed`.

```js
Elemenx.Component('Weather', {
	$Template: '<p>{{Text}}</p>',
	Text: 'Loading...',

	$OnReady: function () {
		var self = this;

		this.$Network().XHR({URL: '/api/weather', ResponseType: 'json'})
			.On('Transport.Success', function (event) {
				self.Text = event.Data.Response.Summary;
			})
			.Execute();
	}
});
```

`this.$Network('Name')` gives a facade whose every resource takes the context `Name` (see [Contexts](/network/contexts)). An Application declares a context with `this.$Network('Name', definition)`.

## Events

Every resource reports through `On(name, callback)` and `Off(name, callback)` (`Off(name)` removes all the listeners of that name). An event has a namespace and a type, and a listener chooses how much it hears:

- `On('Transport', callback)`: every event of the transport (`BeforeRequest`, `Open`, `Data`, `Close`...);
- `On('Transport.Success', callback)`: one type of them;
- `On('Protocol.JSON', callback)`: a message decoded by the [Protocol](/network/protocols) of the resource;
- `On('Transfer.Progress', callback)` and `On('Metrics.Update', callback)`: the events of a Transfer and of Metrics.

The callback gets `(event, context)`. The event is `{Namespace, Type, Data, Target}`: `Data` holds what the event is about (the response, the received data, the close code...), `Target` the resource. A Protocol event also gets as its `context` the transport event that carried it.

An exception thrown by a listener is reported as an uncaught error, as the DOM does for its listeners; the other listeners still run.

## Times

Every resource keeps the times of its life: `$StartedAt()` (when it was made), `$ConnectedAt()` (when it opened, or the request started) and `$ClosedAt()` (when it closed or finished); a time that has not come is `null`.

## Which one to use

- One request with an answer: [XHR](/network/xhr). Its upload and download progress are events.
- A long response to show while it comes (a log, lines of JSON, a generated text): [Stream](/network/stream).
- News from the server, one way: [SSE](/network/sse) where the server can keep a response open, [LongPolling](/network/longpolling) where it cannot (an old proxy, a serverless function).
- Messages both ways: [WebSocket](/network/websocket).
- Between two browsers, without the server in the middle: [WebRTC](/network/webrtc).
- Files and large values, with progress, pause and retries: [Transfer](/network/transfer) over any of them.

The examples of this section run against the server of this reference: `/api/hello`, `/api/echo`, `/api/events`, `/api/poll`, `/api/stream` and the socket `/api/socket`.
