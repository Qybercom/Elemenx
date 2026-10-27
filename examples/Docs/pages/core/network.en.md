# Network and storage

A browser has many ways to talk to a server (a request, a stream, server-sent events, a socket, a peer connection) and many places to keep data (local and session storage, cookies, IndexedDB), each with an API of its own. Elemenx gives each group one shape, and ties what a component opens to the component.

```diagram
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 280" role="img" aria-label="A resource of the network">
	<title>A resource of the network</title>
	<rect class="box" x="20" y="20" width="230" height="60" rx="8" />
	<text x="135" y="45.5" text-anchor="middle" class="strong">1  Make it</text>
	<text x="135" y="63.5" text-anchor="middle" class="muted">$Network().WebSocket({...})</text>
	<rect class="box" x="265" y="20" width="230" height="60" rx="8" />
	<text x="380" y="45.5" text-anchor="middle" class="strong">2  Listen</text>
	<text x="380" y="63.5" text-anchor="middle" class="muted">On('Protocol.Chat', ...)</text>
	<rect class="box accent" x="510" y="20" width="230" height="60" rx="8" />
	<text x="625" y="45.5" text-anchor="middle" class="strong">3  Start it</text>
	<text x="625" y="63.5" text-anchor="middle" class="muted">Connect(), Execute()</text>
	<polyline class="line" points="250,50 265,50" />
	<polygon class="head" points="265,50 256.0,45.5 256.0,54.5" />
	<polyline class="line" points="495,50 510,50" />
	<polygon class="head" points="510,50 501.0,45.5 501.0,54.5" />
	<rect class="box soft" x="20" y="120" width="200" height="56" rx="8" />
	<text x="120" y="143.5" text-anchor="middle" class="strong">The wire</text>
	<text x="120" y="161.5" text-anchor="middle" class="muted">text, bytes</text>
	<rect class="box accent" x="280" y="120" width="200" height="56" rx="8" />
	<text x="380" y="143.5" text-anchor="middle" class="strong">Protocol</text>
	<text x="380" y="161.5" text-anchor="middle" class="muted">Encode / Decode</text>
	<rect class="box" x="540" y="120" width="200" height="56" rx="8" />
	<text x="640" y="143.5" text-anchor="middle" class="strong">Typed messages</text>
	<text x="640" y="161.5" text-anchor="middle" class="muted">Protocol.Chat {Text}</text>
	<polyline class="line" points="220,148 280,148" />
	<polygon class="head" points="280,148 271.0,143.5 271.0,152.5" />
	<polygon class="head" points="220,148 229.0,152.5 229.0,143.5" />
	<polyline class="line" points="480,148 540,148" />
	<polygon class="head" points="540,148 531.0,143.5 531.0,152.5" />
	<polygon class="head" points="480,148 489.0,152.5 489.0,143.5" />
	<text x="380" y="222" text-anchor="middle" class="muted">A resource belongs to the component or service that made it, and is closed with it.</text>
	<text x="380" y="246" text-anchor="middle" class="muted">Send() refuses when the buffer is full (backpressure); Drain says when to go on.</text>
</svg>
```

## One shape for every connection

Every resource of `Elemenx.Network` (XHR, Stream, LongPolling, SSE, WebSocket, WebRTC, Transfer) has the same life:

1. **Make it**, with its settings: `this.$Network().WebSocket({URL: 'wss://...', Protocol: 'Chat'})`. Nothing goes on the wire yet.
2. **Listen** to what it will report: `On('Transport.Open')`, `On('Transport.Error')`, `On('Protocol.Message')`. Every event is `{Namespace, Type, Data, Target}`.
3. **Start it**: `Execute()` for a request, `Connect()` for the rest.
4. **Stop it**: `Abort()`, `Close()`, or let its owner go.

Because they all report the same way, code that shows progress, retries, or logs works for any of them, and switching from long polling to server-sent events changes one line. None of them returns a Promise: a request can be aborted at any moment, and an event that comes after the component is gone is never delivered.

## Transport and Protocol

Two families of events come from a resource:

- **`Transport.*`** is what happens on the wire: `BeforeRequest`, `Open`, `Data`, `Success`, `Error`, `Close`, `Drain`. Its data is raw: a text, bytes, a status.
- **`Protocol.*`** is what the messages mean. A Protocol (`Elemenx.Network.Protocol('Chat', {Encode, Decode})`) stands between the wire and your code: it turns each message that comes into `{Type, Data}`, emitted as `Protocol.<Type>`, and each message you send into what the wire takes. Your code listens to `Protocol.Message` or `Protocol.Typing` and never parses text.

## Backpressure

A socket or a data channel can be given data faster than the network takes it. Instead of filling the memory, `Send` returns `false` once the buffer passes its high mark; a `Drain` event says when it is low enough to go on. A large file goes through a `Transfer`: cut into chunks, each sent when there is room, with its progress as events and a `TransferReceiver` that puts it back together.

## Owned and closed

`this.$Network()` in a component makes resources that belong to it. When the component is destroyed (its page left, its `*if` false), every resource it made is closed: the socket disconnects, the request aborts, the stream stops, and their late events go nowhere. A service's resources live as long as its Application. That is why a page of a router can open a stream without code to close it.

## Storage: one shape, and always there

`this.$Storage` gives the storages of the browser one interface:

| Storage | Kept | For |
| --- | --- | --- |
| `Local` | until cleared | settings, drafts, a cart |
| `Session` | while the tab lives | the state of a flow |
| `Cookie` | as you set it, sent to the server | what the server must read |
| `IndexedDB` | until cleared, large | records, files, offline data |

`Local.Namespace('cart')` keeps the keys of one part of an Application apart from the others; values are JSON in and out. Where the page may not use the storages of the browser (a sandboxed frame, a blocked site, a test without a DOM), `Local`, `Session` and `Cookie` keep their values in memory for the page instead of throwing: the application works, and forgets at reload.

IndexedDB keeps the same model as the network: an operation is made, listened to and executed (`Store('Notes').Put(...).On('Success', ...).Execute()`), and a transaction writes several records or none (see [Working offline](/tutorials/offline)).
