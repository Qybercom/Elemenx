# Events and pipes

`Elemenx.Events` is a bus of the page for parts that do not know each other: a component says that something happened on a channel, and every component, service or Application that listens to that channel hears it. The delivery is synchronous, in the same JavaScript runtime, with the object itself (no copy). Across tabs, frames and workers use [Messaging](/data/messaging).

```js
/* Anywhere: a socket, and a message on a channel. */
var events = Elemenx.Events();

events.On('cart:changed', function (event) {
	console.log(event.Channel, event.Data, event.Source);
});

events.Emit('cart:changed', {Count: 3});
```

## Sockets

`Elemenx.Events()` makes a socket; inside a component, a service or an Application `this.$Events()` makes one that belongs to it and is destroyed with it.

| Method | Meaning |
| --- | --- |
| `On(channel, callback)` | listens to a channel; the same callback is added once |
| `Off(channel, callback)` | stops listening; `Off(channel)` removes every callback of the channel |
| `Emit(channel, data)` | delivers `data` to every socket that listens to the channel, this one included; returns the socket |
| `Channels()` | the channels this socket listens to |
| `Destroy()` | removes the socket; a destroyed socket throws `Elemenx Events Socket is destroyed` |
| `ID` | the identifier of the socket |

An event is `{Channel, Data, Source, Is}`: `Source` is the socket that emitted it.

## Declared channels

A definition may name its channels and get all of them through one method:

```js
Elemenx.Component('CartBadge', {
	$Template: '<span>{{Count}}</span>',
	$Events: ['cart:changed', 'cart:cleared'],
	Count: 0,

	$OnEvent: function (event) {
		var self = this;

		event.Is('cart:changed', function (changed) {
			self.Count = changed.Data.Count;
		});

		event.Is('cart:cleared', function () {
			self.Count = 0;
		});
	}
});
```

`event.Is(channel)` returns whether the event is of that channel; `event.Is(channel, handler)` also calls the handler when it is.

## Pipes

`event.Is(channel, pipes, handler)` passes the events of a channel through a pipeline before the handler: a list of pipes, each written `{Name: setting}`. The pipeline lives as long as the socket that owns the listener, so a pipe remembers what it saw between events. Its place is the order of the `Is` calls of the listener: keep that order the same at every event.

| Pipe | Setting | What passes |
| --- | --- | --- |
| `Debouncer` | a count | a value once it came that many times in a row, and not again until another value has come as many times (a flicker of a sensor does not pass) |
| `Filter` | a count | after every that many events, the value seen most often among them (a vote against noise) |
| `Gate` | milliseconds | an event with a true value after that long, unless an event with a false value came meanwhile (a hover that stays, a key held) |

```js
event.Is('presence:typing', [{Gate: 500}], function () {
	self.Typing = true;
});

event.Is('sensor:door', [{Debouncer: 3}, {Filter: 5}], function (stable) {
	self.Door = stable.Data;
});
```

`Elemenx.Pipe(name, factory)` adds a pipe: `factory(setting)` returns `{Use: function (event, pass) {...}, Destroy: function () {...}}`; `Use` calls `pass(event)` (or `pass` with another event) for what goes on, and `Destroy` frees its timers. `Elemenx.Pipe(name)` returns a factory. A pipe that is not registered throws `Elemenx Pipe is not registered: <name>`.

```js
Elemenx.Pipe('Throttle', function (milliseconds) {
	var last = 0;

	return {
		Use: function (event, pass) {
			if (Date.now() - last < milliseconds) return;

			last = Date.now();

			pass(event);
		}
	};
});
```

Messaging uses the same pipes: `message.Is(channel, pipes, handler)`.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Emit A" (click)="EmitA" />
	<Button Label="Emit B" (click)="EmitB" />
	<Button Label="Emit A three times" (click)="EmitThree" />
	<Button Label="Hold for 400 ms" (click)="Hold" />
</div>
<Properties>
	<Property Label="Last event" [value]="Last" />
	<Property Label="Debouncer 3 passed" [value]="Debounced" />
	<Property Label="Gate 400 ms" [value]="Gated" />
</Properties>
<script>
({
	$Events: ['docs:letters', 'docs:hold'],
	Last: '—',
	Debounced: '—',
	Gated: '—',

	$OnEvent: function (event) {
		var self = this;

		event.Is('docs:letters', function (letter) {
			self.Last = letter.Data;
		});

		event.Is('docs:letters', [{Debouncer: 3}], function (letter) {
			self.Debounced = letter.Data;
		});

		event.Is('docs:hold', [{Gate: 400}], function () {
			self.Gated = 'passed at ' + new Date().toLocaleTimeString();
		});
	},

	EmitA: function () {
		this.$Events().Emit('docs:letters', 'A').Destroy();
	},

	EmitB: function () {
		this.$Events().Emit('docs:letters', 'B').Destroy();
	},

	EmitThree: function () {
		this.$Events().Emit('docs:letters', 'A').Emit('docs:letters', 'A').Emit('docs:letters', 'A').Destroy();
	},

	Hold: function () {
		this.Gated = 'waiting';

		this.$Events().Emit('docs:hold', true).Destroy();
	}
})
</script>
```
