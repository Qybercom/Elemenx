# Transfer

`Network.Transfer` moves a large value over another resource and reports one progress for it: a file, a `Blob`, an `ArrayBuffer`, or any object that holds files, dates and numbers together. It works in three ways, chosen by what it is given:

| Mode | When | How |
| --- | --- | --- |
| **Whole** | `Data`, over a resource without `Send` (an [XHR](/network/xhr)) | the value goes in one request; the progress is the progress of the upload, then of the response |
| **Chunked** | `Data`, over a resource with `Send` (a [WebSocket](/network/websocket), [WebRTC](/network/webrtc)) | the value is cut into chunks; a window of them is in flight at once, each one waits for its acknowledgment and is sent again when it does not come |
| **Inbound** | no `Data` | it receives: the progress of a download over an XHR or a [Stream](/network/stream) (pause and resume with a Stream), or the chunks a chunked Transfer of the other side sends |

```js
var upload = this.$Network().Transfer({
	Transport: this.$Network().XHR({Method: 'POST', URL: '/api/upload'}),
	Data: {Title: 'Holiday', Taken: new Date(), Photos: [fileA, fileB]}
});

upload.On('Transfer.Progress', function (event) {
	self.Percent = Math.round(event.Data.Progress * 100);
});

upload.On('Transfer.Complete', function (event) {
	self.Done = true;
});

upload.Send();
```

## Values with files

A plain object or a list goes as a structured envelope (`application/x-elemenx-structured`): an 8-byte header, a JSON manifest of the value with a placeholder for each binary part (`{$ElemenxBinary: index}`) and each date (`{$ElemenxDate: iso}`), then the bytes of the parts, one after another. The receiving side of Elemenx (`TransferReceiver`) gives the same object back, with `File` and `Blob` objects in their places. A server reads the header (the magic number `0x45585354` and the length of the manifest), the manifest, and the parts by their sizes.

A `Blob`, a `File`, an `ArrayBuffer` or a typed array goes as it is.

## Settings

| Setting | Setter | Meaning |
| --- | --- | --- |
| `Transport` | `Transport(resource)` | the resource it goes over |
| `Data` | `Data(value)` | what to send; without it the Transfer receives |
| `ChunkSize` | `ChunkSize(bytes)` | 64 KiB: the size of a chunk |
| `WindowSize` | `WindowSize(count)` | 8: the chunks in flight at once |
| `Retry` | `Retry(milliseconds)` | 1500: how long a chunk waits for its acknowledgment before it goes again |
| `MaxRetries` | `MaxRetries(count)` | 8: how many times a chunk goes again before the Transfer fails |
| `Encoder` | `Encoder(function)` | encodes each chunk (or the whole value) before it is sent: compression, encryption |

An `Encoder` is `function (value, context)` returning the encoded value, or `function (value, context, done)` calling `done(error, value)` once; a Promise is refused with an error.

## Methods

- `Send(value)` sends a value (or the `Data` already set); `Execute()` starts what was set: sending with `Data`, receiving without.
- `Pause()`, `Resume()`, `Paused()`: a download over a Stream.
- `Abort()` stops it (the other side of a chunked Transfer is told), `Destroy()` stops it and lets its transport go.
- `Phase()`: `Idle`, `Sending`, `WaitingComplete`, `WaitingResponse`, `Receiving`, `Complete`, `Error`, `Abort`; `Active()`.
- `Receive(packet)` gives it a packet by hand, when the packets do not come through a Protocol.

## Events

| Event | Data |
| --- | --- |
| `Transfer.Start` | `{ID, Name, Type, Size, Mode, ChunkSize, WindowSize, Transport}` |
| `Transfer.Phase` | `{ID, Phase, Data, Elapsed}` |
| `Transfer.Chunk` | `{ID, Index, Offset, Bytes}`: a chunk went |
| `Transfer.Retry` | `{ID, Index, Retry}`: a chunk went again |
| `Transfer.Progress` | `{ID, Loaded, Total, Progress, Speed, Elapsed, Mode}` (`Sent` too for chunks): `Loaded` counts what the other side acknowledged |
| `Transfer.Data` | `{ID, Data, Bytes, Loaded, Total}`: a part received (inbound) |
| `Transfer.Pause`, `Transfer.Resume` | `{ID, Loaded, Total}` |
| `Transfer.Complete` | `{ID, Loaded, Total, Elapsed, Mode, Metrics: {SendElapsed, WaitElapsed, ResponseElapsed, TotalElapsed}}`, and in the Whole mode `Response`: the data of the `Success` of the transport (`{Status, Response, ...}`) |
| `Transfer.Error`, `Transfer.Abort`, `Transfer.Timeout` | `{ID, Loaded, Total, Phase, Error}` |

## The chunked protocol

A chunked Transfer speaks in packets `{Type: 'Transfer', Action, ID, ...}`:

1. `Start` `{Name, Mime, Size, ChunkSize, Chunks}` opens it;
2. `Chunk` `{Index, Offset, Bytes, Data}` carries a part; the receiver answers `Ack` `{Index}`;
3. `End` `{Chunks, Size}` closes it; the receiver answers `Complete`;
4. `Abort` stops it from either side.

The Protocol of the transport encodes the packets for the wire (a binary frame, or JSON with the data in base64) and decodes the incoming ones into the type `Transfer`: `{Type: 'Transfer', Data: packet}`. A `TransferReceiver` on the other side listens to `Protocol.Transfer` of its transport, answers the acknowledgments and emits `Transfer.Start`, `Transfer.Chunk`, `Transfer.Complete` (`{ID, Name, Mime, Size, Blob}`) and `Transfer.Receive` (the same, with `Data`, the object back, for a structured value).

## Example: a value with a file, over a request

The server of this reference answers `/api/echo` with the size of what it received:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Upload 4 MB" Variant="primary" [disabled]="Busy" (click)="Upload" />
</div>
<Progress [value]="Percent" ShowValue="true" />
<p class="elemenx-text small muted">{{Status}}</p>
<script>
({
	Busy: false,
	Percent: 0,
	Status: 'An object with a text, a date and a 4 MB file.',

	Upload: function () {
		var self = this;
		var file = new File([new Uint8Array(4 * 1024 * 1024)], 'zeros.bin', {type: 'application/octet-stream'});
		var transfer = this.$Network().Transfer({
			Transport: this.$Network().XHR({Method: 'POST', URL: '/api/echo', ResponseType: 'json'}),
			Data: {Title: 'Report', Created: new Date(), Attachment: file}
		});

		this.Busy = true;
		this.Percent = 0;

		transfer.On('Transfer.Progress', function (event) {
			self.Percent = Math.round(event.Data.Progress * 100);
		});

		transfer.On('Transfer.Complete', function (event) {
			self.Busy = false;
			self.Percent = 100;
			self.Status = 'The server received ' + event.Data.Response.Response.Bytes + ' bytes (' + event.Data.Response.Response.Type + ') in ' + event.Data.Elapsed + ' ms.';
		});

		transfer.On('Transfer.Error', function () {
			self.Busy = false;
			self.Status = 'The transfer failed.';
		});

		transfer.Send();
	}
})
</script>
```

## Example: chunks over a data channel

Two WebRTC peers of this page: one sends 2 MB in chunks of 32 KiB, the other receives them with a `TransferReceiver` and acknowledges each one. The Protocol carries the chunks as JSON with their bytes in base64:

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect and send 2 MB" Variant="primary" [disabled]="Busy" (click)="Run" />
</div>
<Progress [value]="Percent" ShowValue="true" />
<p class="elemenx-text small muted">{{Status}}</p>
<script>
({
	Busy: false,
	Percent: 0,
	Status: 'Idle',

	Run: function () {
		var self = this;
		var protocol = {
			Encode: function (packet) {
				var copy = {};
				var bytes;
				var text = '';
				var i = 0;

				Object.keys(packet).forEach(function (key) {
					copy[key] = packet[key];
				});

				if (packet.Data) {
					bytes = new Uint8Array(packet.Data.buffer || packet.Data, packet.Data.byteOffset || 0, packet.Data.byteLength);

					while (i < bytes.length) {
						text += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));

						i += 8192;
					}

					copy.Data = btoa(text);
				}

				return JSON.stringify(copy);
			},
			Decode: function (text) {
				var packet = JSON.parse(text);
				var binary;
				var bytes;
				var i = 0;

				if (typeof packet.Data === 'string') {
					binary = atob(packet.Data);
					bytes = new Uint8Array(binary.length);

					while (i < binary.length) {
						bytes[i] = binary.charCodeAt(i);

						i++;
					}

					packet.Data = bytes.buffer;
				}

				return packet.Type === 'Transfer' ? {Type: 'Transfer', Data: packet} : null;
			}
		};
		var a = this.$Network().WebRTC({Protocol: protocol});
		var b = this.$Network().WebRTC({Protocol: protocol});
		var receiver = this.$Network().TransferReceiver({Transport: b});

		this.Busy = true;
		this.Status = 'Negotiating';

		a.On('Transport.ICECandidate', function (event) {
			if (event.Data.Candidate)
				b.AddICECandidate(event.Data.Candidate);
		});

		b.On('Transport.ICECandidate', function (event) {
			if (event.Data.Candidate)
				a.AddICECandidate(event.Data.Candidate);
		});

		receiver.On('Transfer.Complete', function (event) {
			self.Busy = false;
			self.Status = 'The other peer has a Blob of ' + event.Data.Blob.size + ' bytes.';
		});

		a.On('Transport.Open', function () {
			var transfer = self.$Network().Transfer({Transport: a, Data: new Uint8Array(2 * 1024 * 1024).buffer, ChunkSize: 32 * 1024});

			self.Status = 'Sending';

			transfer.On('Transfer.Progress', function (event) {
				self.Percent = Math.round(event.Data.Progress * 100);
			});

			transfer.Send();
		});

		a.CreateOffer(function (error, offer) {
			if (!error)
				b.AcceptOffer(offer, function (failure, answer) {
					if (!failure)
						a.AcceptAnswer(answer);
				});
		});
	}
})
</script>
```
