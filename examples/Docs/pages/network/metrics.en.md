# Metrics

`Network.Metrics` counts the bytes a resource sends (TX) and receives (RX) and their speeds: the current one, and the average, the lowest and the highest of a measurement. It listens to the events of its transport: the upload and download progress of an [XHR](/network/xhr), the messages of a [WebSocket](/network/websocket), a [WebRTC](/network/webrtc) channel, an [SSE](/network/sse) or a [Stream](/network/stream).

```js
var metrics = this.$Network().Metrics({Transport: socket, Interval: 100, Window: 1000});

metrics.On('Metrics.Update', function (event) {
	self.Upload = Math.round(event.Data.TX.Speed / 1024) + ' KiB/s';
	self.Download = Math.round(event.Data.RX.Speed / 1024) + ' KiB/s';
});
```

## Settings

| Setting | Meaning |
| --- | --- |
| `Transport` | the resource it measures; `Transport(resource)` changes it while it is stopped, `Transport()` returns it |
| `Interval` | 50: milliseconds between two `Update` events and between two samples of the speeds |
| `Window` | 250: the milliseconds of traffic the current speed is computed over |
| `AutoStart` | with a `Transport`, the metrics start at once unless this is `false` |

## Running and measuring

Metrics run (`Start()`, `Stop()`): while they run they count every byte, and `Elapsed` is the time since `Start`. A measurement (`Begin()`, `End()`) is a part of that time whose average, lowest and highest speeds are kept: `Begin` zeroes them, and the time of a direction counts only while bytes go in that direction, so the pause between an upload and its response does not lower the average. `End` freezes the measurement until the next `Begin`. `Reset()` zeroes everything, `Active()` tells whether a measurement runs, `Destroy()` stops and lets the transport go.

## The snapshot

`Snapshot()`, and the data of every event, is:

```js
{
	TX: {Bytes, Speed, SpeedAvg, SpeedMin, SpeedMax, MeasureElapsed, Active},
	RX: {Bytes, Speed, SpeedAvg, SpeedMin, SpeedMax, MeasureElapsed, Active},
	Total,          /* TX.Bytes + RX.Bytes */
	Elapsed,        /* milliseconds since Start */
	MeasureElapsed, /* milliseconds since Begin */
	Active,         /* a measurement runs */
	Running         /* the metrics run */
}
```

Speeds are bytes per second.

## Events

`Metrics.Start`, `Metrics.Stop`, `Metrics.Begin`, `Metrics.End`, `Metrics.Reset`, and `Metrics.Update` every `Interval` while they run and on every change of the counters; the data of each one is the snapshot.

## Example

An upload of 16 MB to `/api/echo` through a [Transfer](/network/transfer), measured:

```example
<Button Label="Upload 16 MB" Variant="primary" [disabled]="Busy" (click)="Upload" />
<Properties Columns="2">
	<Property Label="Sent" [value]="Sent" />
	<Property Label="Current speed" [value]="Speed" />
	<Property Label="Average" [value]="Average" />
	<Property Label="Highest" [value]="Highest" />
</Properties>
<script>
({
	Busy: false,
	Sent: '0 MB',
	Speed: '—',
	Average: '—',
	Highest: '—',

	Megabytes: function (bytes) {
		return (bytes / 1048576).toFixed(1) + ' MB';
	},

	Upload: function () {
		var self = this;
		var request = this.$Network().XHR({Method: 'POST', URL: '/api/echo', ResponseType: 'json'});
		var metrics = this.$Network().Metrics({Transport: request, Interval: 100, Window: 500});
		var transfer = this.$Network().Transfer({Transport: request, Data: new Blob([new Uint8Array(16 * 1048576)])});

		this.Busy = true;

		metrics.Begin();

		metrics.On('Metrics.Update', function (event) {
			self.Sent = self.Megabytes(event.Data.TX.Bytes);
			self.Speed = self.Megabytes(event.Data.TX.Speed) + '/s';
			self.Average = self.Megabytes(event.Data.TX.SpeedAvg) + '/s';
			self.Highest = self.Megabytes(event.Data.TX.SpeedMax) + '/s';
		});

		transfer.On('Transfer.Complete', function () {
			metrics.End();

			self.Busy = false;
		});

		transfer.Send();
	}
})
</script>
```
