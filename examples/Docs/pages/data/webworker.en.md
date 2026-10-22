# Web workers

`Elemenx.WebWorker` runs a script in a worker, off the thread of the page, with Elemenx loaded there and [Messaging](/data/messaging) connected: the page and the worker talk on a channel, as any two sockets do. Long computations, parsing of large files and compression stop freezing the page.

```js
var worker = this.$WebWorker('Resizer', {Script: '/workers/resizer.js', StartMode: 'lazy', Channel: 'images:resize'});

this.$Messaging().Send('images:resize', {Image: blob, Width: 320});
```

The script of the worker:

```js
/* /workers/resizer.js: Elemenx is already loaded; ElemenxWorkerName and ElemenxWorkerChannel are set. */
var socket = Elemenx.Messaging();

socket.On(ElemenxWorkerChannel, function (message) {
	var result = resize(message.Data.Image, message.Data.Width);

	socket.Send(message.Source, {Image: result});
});
```

## The definition

| Key | Meaning |
| --- | --- |
| `Script` | the URL of the script (required) |
| `StartMode` | `'auto'` (the default: it starts when the handle is made), `'manual'` (it starts on `Start()`), or `'lazy'` (it starts when a message is first sent on its channel) |
| `Channel` | the channel of the worker, its name by default (in the worker: `ElemenxWorkerChannel`) |
| `Framework` | the URL of `elemenx.js` for the worker; by default the script the page loaded (a framework inline in a single-file build gives the worker a copy of its text) |

`Elemenx.WebWorker(name, definition)` registers a worker and returns a handle; `Elemenx.WebWorker(name)` makes another handle of a registered one. `this.$WebWorker(name, definition)` makes a handle that belongs to its component or service and stops with it; an Application's `$WebWorker(name, definition)` makes one its components share: `this.$WebWorker(name)` in a component returns the Application's handle when there is one.

## The handle

| Method | Meaning |
| --- | --- |
| `Start()` | starts the worker (from a page only) |
| `Stop()` | terminates it; a lazy worker stopped by hand does not start again by itself |
| `Destroy()` | terminates it for good |
| `State()` | `'Stopped'`, `'Starting'`, `'Running'` or `'Error'` |
| `Name()`, `Channel()`, `StartMode()`, `Native()` | the native `Worker` |
| `On(event, callback)`, `Off(event, callback)` | `Starting`, `Running` (the worker loaded its script), `Stop`, `Error`; the callback gets `{Type, Worker, State, Data}` |

A message sent before the worker runs waits: the bridge keeps it until the worker is there. A worker cannot start from a page opened as a file, and a widget build starts no worker.

## Example

The worker of this reference sums the numbers up to a limit and answers with the sum and the time it took; the page stays responsive meanwhile:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Sum to 100 million in the worker" Variant="primary" (click)="Count" />
	<Button Label="Stop the worker" Variant="ghost" (click)="Stop" />
</div>
<Properties>
	<Property Label="State" [value]="State" />
	<Property Label="Answer" [value]="Answer" />
</Properties>
<Spinner *if="Busy" Label="The page still runs this spinner" ShowLabel="true" />
<script>
({
	State: 'Stopped',
	Answer: '—',
	Busy: false,

	$OnCreate: function () {
		var self = this;

		this.Worker = this.$WebWorker('DocsCounter', {Script: '/workers/counter.js', StartMode: 'lazy', Channel: 'docs:counter'});
		this.Socket = this.$Messaging();

		['Starting', 'Running', 'Stop', 'Error'].forEach(function (name) {
			self.Worker.On(name, function (event) {
				self.State = event.State;
			});
		});

		this.Socket.On(function (message) {
			self.Busy = false;
			self.Answer = message.Data.Sum + ' in ' + message.Data.Elapsed + ' ms';
		});
	},

	Count: function () {
		this.Busy = true;
		this.Answer = 'counting...';

		if (this.Worker.State() === 'Stopped')
			this.Worker.Start();

		this.Socket.Send('docs:counter', {Command: 'count', To: 100000000});
	},

	Stop: function () {
		this.Worker.Stop();
		this.Busy = false;
	}
})
</script>
```
