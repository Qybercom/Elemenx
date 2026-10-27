# A live dashboard

The numbers of a shop as they happen: the visitors on the site, the orders and the revenue, a chart of the last minute and the newest orders, streamed by the server. The finished project is `examples/Tutorials/Dashboard`.

What you learn: server-sent events with `Network.SSE`, a Protocol that turns the text of the stream into typed messages, a Service that owns the connection, reconnection and resuming without losing or repeating a message, and pausing a stream nobody looks at.

## 1. Why SSE

The numbers go one way, from the server. Server-sent events are made for that: an ordinary HTTP response the server keeps open and writes into, which the browser reconnects by itself when it breaks. A [WebSocket](/network/websocket) is for messages both ways (a chat, a game); asking every few seconds wastes requests and still comes late.

## 2. The server

A stream is a response of type `text/event-stream` with messages separated by a blank line. Each one has an `id`: when the connection breaks, the browser sends the last one back (`Last-Event-ID`), and the server goes on from there. The project streams from `Server.Request` of its `elemenx.config.js`, which `elemenx dev` and `elemenx serve` call for every request:

```js
Request: function (request, response, pathname) {
	var id;
	var timer;

	if (pathname !== '/api/stream') return false;

	id = Number(request.headers['last-event-id'] || new URL(request.url, 'http://localhost').searchParams.get('after')) || 0;

	response.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive'});
	response.write('retry: 1000\n\n');

	function send () {
		id += 1;

		response.write('id: ' + id + '\ndata: ' + JSON.stringify(tick(id)) + '\n\n');
	}

	send();

	timer = setInterval(send, 1000);

	request.on('close', function () {
		clearInterval(timer);
	});

	return true;
}
```

`retry` tells the browser how long to wait before it reconnects. Stop the timer when the request closes: a stream left writing into a closed socket is a leak of the server. Any server does the same: Express, PHP, Go, a proxy in front of them that must not buffer the response.

## 3. A Protocol

The `data` of a message is text. A Protocol decodes it once, so the rest of the code hears typed messages instead of parsing text everywhere:

```js
Elemenx.Network.Protocol('Shop', {
	Decode: function (text) {
		try {
			return {Type: 'Tick', Data: JSON.parse(text)};
		}
		catch (error) {
			return {Type: 'Invalid', Data: text};
		}
	}
});
```

A resource with `Protocol: 'Shop'` emits `Protocol.Tick` with the object, and `Protocol.Invalid` for a message it cannot read. A server that sends several kinds names them in the JSON (`{"Type": "Order", ...}`), and the Protocol returns that `Type`: `Protocol.Order`, `Protocol.Price`.

## 4. A Service owns the connection

The connection belongs to a Service, not to a component: one stream for the whole application, whatever shows its numbers, and its state in one place.

```js
Open: function () {
	var self = this;

	if (this.Stream) return;

	this.Stream = this.$Network().SSE({URL: '/api/stream' + (this.Last ? '?after=' + this.Last : ''), Protocol: 'Shop'});

	this.Stream.On('Transport.Open', function () {
		self.Tell('live');
	});

	this.Stream.On('Transport.Error', function (event) {
		self.Tell(event.Data.ReadyState === 0 ? 'reconnecting' : 'paused');
	});

	this.Stream.On('Protocol.Tick', function (event) {
		self.Take(event.Data);
	});

	this.State = 'connecting';

	this.Stream.Connect();
	this.Tell(this.State);
}
```

- `Transport.Error` with `ReadyState` 0 means the browser is reconnecting by itself: show it, do nothing else. 2 means it gave up.
- `Take(tick)` keeps the last minute of points (`slice(-60)`, so the memory does not grow for hours), the five newest orders, and their count and sum.
- `Tell(state)` calls the listeners of the Service (`OnChange`), as in the other tutorials.

## 5. Resuming without gaps

The browser sends `Last-Event-ID` only when it reconnects the same `EventSource`. A new one, after a pause, starts from nothing, so the server would send the first ticks again: the same order twice in the list. The Service remembers the last ID it took and names it in the URL of a new stream (`?after=`); the server reads both. The end-to-end test of the project pauses and resumes the stream, and checks that no order comes twice: it failed before this line was written.

## 6. Nobody looks, nothing streams

A tab in the background needs no numbers. The Service closes the stream when the page is hidden and opens it again, from the last tick, when it shows:

```js
document.addEventListener('visibilitychange', function () {
	if (!self.Wanted) return;

	if (document.hidden) self.Close('paused');
	else self.Open();
});
```

`Wanted` keeps a stream the person paused paused when the tab comes back. The server keeps fewer connections open, and a phone saves its battery.

## 7. The component

The component copies what it shows at each change of the Service:

```js
Show: function (live) {
	var last = live.Points[live.Points.length - 1];

	this.State = live.State;
	this.Visitors = last ? last.Visitors : 0;
	this.Orders = live.Orders;
	this.Revenue = live.Revenue;
	this.Recent = live.Recent;
	this.Labels = live.Points.map(function (point) {
		return new Date(point.Time).toLocaleTimeString();
	});
	this.Values = live.Points.map(function (point) {
		return point.Visitors;
	});
}
```

```html
<span class="elemenx-badge live-state" [class.success]="State === 'live'" [class.warning]="State === 'reconnecting' || State === 'connecting'" role="status">{{States[State]}}</span>
<Chart Type="area" [labels]="Labels" [series]="[{Name: 'Visitors', Values: Values}]" Height="220" Min="0" Label="Visitors, the last minute" />
<ul class="live-orders-list" aria-live="polite">
	<li *for="order of Recent" *key="order.ID"><span>#{{order.ID}} · {{order.Customer}}</span><strong>{{Money(order.Amount)}}</strong></li>
</ul>
```

- `role="status"` reads a change of the state to a screen reader; `aria-live="polite"` the new orders, without interrupting.
- `*key="order.ID"` keeps the rows of the orders already there: a new one is added on top, the rest are not built again.
- `Min="0"` holds the bottom of the chart, so the area does not jump as the numbers move.
- The `$OnDestroy` of the component takes its listener away and pauses the stream.

## 8. Try it

```bash
cd examples/Tutorials/Dashboard
npm install
npm run dev
```

Stop the server for a few seconds and start it again: the badge says Reconnecting, then Live, and the numbers go on from where they stopped.
