# Messaging

`Elemenx.Messaging` carries messages on named channels between every place Elemenx runs: the components of a page, its frames and the windows it opens, the other tabs of the site, and its [web workers](/data/webworker) and [service workers](/data/serviceworker). A socket does not need to know where its peers are: the runtimes find each other and pass the messages along. For messages that stay in one runtime, [Events](/data/events) are simpler and synchronous.

```js
var socket = this.$Messaging();

socket.On('chat:message', function (message) {
	console.log(message.Data.Text, 'from', message.Source);
});

socket.Send('chat:message', {Text: 'Hello'});
```

## Sockets

`Elemenx.Messaging(context)` makes a socket; `this.$Messaging(context)` makes one that belongs to its component, service or Application and is destroyed with it.

| Method | Meaning |
| --- | --- |
| `On(channel, callback)` | listens to a channel |
| `On(callback)` | listens to the socket's own channel: the answers sent to it |
| `Off(channel, callback)`, `Off(callback)` | stops listening |
| `Send(channel, data, options)` | sends to every socket that listens to the channel, here and in every connected runtime; `{Transferable: true}` transfers `data` (an `ArrayBuffer`, a `MessagePort`) instead of copying it, when it goes to one runtime |
| `ID(value)` | names the socket's own channel; `ID()` returns the name |
| `Channels()` | its own channel and the channels it listens to |
| `Destroy()` | removes it |

A message is `{Channel, Source, Data, Is}`. `Source` is the own channel of the sending socket: `socket.Send(message.Source, answer)` answers the sender only. `message.Is(channel, pipes, handler)` works as for [Events](/data/events), with the same pipes.

The data of a message is copied by the structured clone of the browser when it leaves the runtime: plain objects, lists, dates, `Blob`, `ArrayBuffer`, `Map`... but no functions and no DOM nodes.

## Declared channels

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

`$Messaging` is a text (the ID of the socket: the messages sent to that channel), a list of channels, or `{ID, Channels, Context}`; `$OnMessage(message)` receives every message of them. Every socket of a component also listens to two channels of its own: `elemenx:<Name>` (every instance of that component) and `elemenx:<Name>:<index>` (one of them).

## Contexts

`Elemenx.Messaging.Context(name, {ID, Channels, Contexts})` names a set of channels and an ID that sockets take: `Elemenx.Messaging('Name')`, `$Messaging: {Context: 'Name'}`. An Application declares one with `this.$Messaging(name, definition)`.

## Where messages go

- **Frames and windows.** A page of Elemenx inside an iframe announces itself to its parent, and a window opened by another one to its opener; the other side answers and the two are connected, with nothing to call. Repeated announcements are counted once.
- **Other origins.** A frame or a window of another origin is refused unless both sides trust each other: `Elemenx.Messaging.Origins('https://other.example.com')` (a text or a list) on each one. The first announcement carries no data; the messages after it go to the verified origin only.
- **Other tabs.** The tabs of the same origin share a `BroadcastChannel`: a message reaches the sockets of every one of them.
- **Workers.** A web worker or a service worker made with Elemenx is connected to its page (see [Web workers](/data/webworker)).
- **By hand.** `Elemenx.Messaging.Window(target, {Origin, Transferable})` connects a window that is neither a frame nor an opener: `target` is a selector of an iframe, an iframe or a `Window`; `Origin` is the origin it must have (the origin of the page by default; `'*'` for any). It returns `{Target(), Origin(), Active(), Destroy()}`. `this.$Messaging.Window(...)` does the same for an owner, a selector being read inside its element.

A message reaches every runtime once, however many paths lead there.

## Example

Two sockets of this page; the second one answers on the first one's own channel. Open this page in a second tab and press *Ping the tabs*: the other tab answers through the `BroadcastChannel`.

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
