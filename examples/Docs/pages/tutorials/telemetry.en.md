# A board of live telemetry

A board of live telemetry: a race car, a server cluster or a spaceship, each a scene of 36 to 60 channels, their values coming over a WebSocket from 1 to 120 times a second. The board draws them on dials, bars, numbers, sparklines, signals and lamps, keeps a log of the alarms, and tells its own frames, packets and updates a second. The finished project is `examples/Tutorials/Telemetry`.

What you learn: a WebSocket of the server of the CLI, a Protocol of JSON, and the rules of a board that keeps up with a fast feed: the packets stay out of the state, the state changes once a frame, the buffers have a fixed length.

## 1. The feed of the server

`Server.WebSocket` of `elemenx.config.js` is the feed, for `elemenx dev` and `elemenx serve`. A connection gets the channels of its scene, then their values at its rate. The packets go by the clock, not by the interval of the timer: a timer of the system may tick every 15 milliseconds or so, and 20 packets a second would be 16.

```js
function start (connection) {
	var began = Date.now();
	var sent = 0;

	clearInterval(connection.Timer);

	connection.Timer = setInterval(function () {
		var due = Math.floor((Date.now() - began) * connection.Hz / 1000);

		while (sent < due) {
			packet(connection);

			sent++;
		}
	}, 5);
}
```

The browser asks for another scene (`{Type: 'scene', Scene}`) and another rate (`{Type: 'rate', Hz}`).

## 2. The packets stay out of the state

The `Feed` Service receives the packets. A Service is not reactive state: a packet lands in a plain field and costs an assignment, not a render, however many come.

```js
this.Socket.On('Protocol.data', function (event) {
	self.Latest = event.Data;
	self.Seq = event.Data.Seq;
	self.Received++;
});
```

## 3. The state changes once a frame

The board reads the latest packet in a `requestAnimationFrame` loop. Many packets between two frames cost one render, and every binding of the board reads the same `Values`:

```js
function frame (now) {
	own.Frames++;

	if (!self.Paused && feed.Latest && feed.Seq !== own.Seq)
		self.Draw(feed.Latest);

	own.Frame = window.requestAnimationFrame(frame);
}
```

`Draw` builds the new values first, outside of the state, then gives them to it in one assignment each. The histories of the sparklines are buffers of 90 values, and the log keeps its last 30 lines:

```js
history.push(value);

if (history.length > 90)
	history.shift();

series[item.ID] = history.slice();
```

```js
this.Values = packet.Values;
this.Series = series;
this.Lit = lit;
```

One more rule keeps a busy computer in step: a frame with an update lasts its script and the layout and the painting that follow, and what it took past a frame the next update waits. The board takes half of the time of the page at most; on a slow processor it skips frames and stays close to the feed, instead of filling every frame and letting the packets queue behind it. A frame of more than a second is the page held up, not the board: the update after it waits a second at most.

## 4. A widget for each kind

The template draws each channel by its kind:

```html
<Meter *if="item.Kind === 'dial'" Shape="dial" Needle="true" [value]="Math.round(Values[item.ID] || item.Min)" [min]="item.Min" [max]="item.Max" [high]="item.Alarm" [label]="item.Label" [unit]="item.Unit" ShowValue="true" Size="small" />
<Meter *if="item.Kind === 'bar'" [value]="Values[item.ID] || item.Min" [min]="item.Min" [max]="item.Max" [high]="item.Alarm" [label]="item.Label" [unit]="item.Unit" ShowValue="true" Size="small" />
<Sparkline *if="item.Kind === 'spark'" [values]="Series[item.ID] || []" Type="area" Width="160" Height="36" [min]="item.Min" [max]="item.Max" Dot="true" />
<Signal *if="item.Kind === 'signal'" [value]="Values[item.ID] || 0" Bars="4" />
```

A scene gives the board a theme of its own, whatever the page shows: `this.$Service('Theme').Scope(this.$Element(), 'scifi')`.

## 5. What it costs

The header tells the frames the page draws a second (FPS), the packets it receives and the updates it shows. At 20 packets a second every packet is shown and the page keeps its frames; at 120 the updates follow the frames (about 60), the packets between them merged. The dials, bars and lines of a scene take a few milliseconds to update on a desktop computer: the budget of a frame is 16.

## 6. Try it

```bash
node elemenx-cli.js dev examples/Tutorials/Telemetry
```

Move the rate to 120, switch to the cluster (60 channels) and watch the FPS; pause the board and the packets go on, counted.
