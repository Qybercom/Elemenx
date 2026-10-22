# WebRTC

`Network.WebRTC` is a data channel between two browsers: an `RTCPeerConnection` with one `RTCDataChannel`, with a Protocol and backpressure as a [WebSocket](/network/websocket) has them. The negotiation (the offer, the answer, the ICE candidates) goes through methods with callbacks, never through Promises; how the two peers exchange them (a WebSocket, a server, a QR code) is up to the Application.

## The negotiation

```js
var caller = this.$Network().WebRTC({Configuration: {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]}});

caller.On('Transport.ICECandidate', function (event) {
	signaling.Send({Type: 'Candidate', Candidate: event.Data.Candidate});
});

caller.CreateOffer(function (error, offer) {
	if (error) return;

	signaling.Send({Type: 'Offer', Offer: offer});
});

/* The other browser: */
callee.AcceptOffer(offer, function (error, answer) {
	signaling.Send({Type: 'Answer', Answer: answer});
});

/* Back in the first one: */
caller.AcceptAnswer(answer, function (error) {
	/* The channel opens: Transport.Open. */
});

/* Both, for every candidate the other one found: */
peer.AddICECandidate(candidate);
```

Every negotiation method takes an optional callback `(error, result)` as its last argument, always called after the method returned: `CreateOffer` and `AcceptOffer` give the local description, `AcceptAnswer` the accepted remote one, `AddICECandidate` nothing. Without a callback, a failed step is a `Transport.Error` event whose data holds `Error`, `Operation` (the method) and `Connection`.

## Settings

| Setting | Setter | Meaning |
| --- | --- | --- |
| `Configuration` | `Configuration(value)` | the `RTCConfiguration`: `iceServers`... |
| `ChannelName` | `ChannelName(value)` | the label of the data channel, `'elemenx'` |
| `Channel` | `Channel(value)` | the `RTCDataChannelInit`: `{ordered, maxRetransmits, protocol}` |
| `Protocol` | `Protocol(value)` | the [Protocol](/network/protocols) of the messages |
| `BufferHighWaterMark`, `BufferLowWaterMark` | setters | 1 MiB and 256 KiB: the bytes waiting in the channel |
| `QueueHighWaterMark`, `QueueLowWaterMark` | setters | 4 MiB and 1 MiB: the bytes waiting in the queue of Elemenx before the channel |

## Methods

- `CreateOffer(callback)`, `AcceptOffer(offer, callback)`, `AcceptAnswer(answer, callback)`, `AddICECandidate(candidate, callback)`: the negotiation.
- `Connect(initiator)` makes the peer connection without negotiating (`initiator` `false`: do not create the channel, wait for the one of the other side).
- `Send(message)` queues a message for the channel and returns `true`, or `false` when the channel is not open or the queue is full (`Backpressure`; go on at `Drain`).
- `Writable()`, `Close()`.
- `Connection()` is the `RTCPeerConnection`, `DataChannel()` the `RTCDataChannel`.

## Events

| Event | Data |
| --- | --- |
| `Transport.BeforeConnect` | the peer connection is made |
| `Transport.LocalDescription`, `Transport.RemoteDescription` | the descriptions set |
| `Transport.ICECandidate` | `{Candidate, Connection}`: send it to the other peer |
| `Transport.ConnectionState`, `Transport.ICEConnectionState`, `Transport.SignalingState` | the states of the connection as they change |
| `Transport.Channel` | the data channel is there (set its `binaryType` here) |
| `Transport.Open` | the channel is open |
| `Transport.Queued`, `Transport.BeforeSend`, `Transport.AfterSend` | a message queued, and sent into the channel |
| `Transport.Data` | `{Data, ...}`: a message received |
| `Protocol.<Type>` | the message decoded |
| `Transport.Backpressure`, `Transport.BufferedAmountLow`, `Transport.Drain` | the queue is full, the channel took its buffer, the queue may take messages again |
| `Transport.ChannelClose`, `Transport.BeforeClose`, `Transport.Close` | |
| `Transport.Error` | `{Error, Operation, Connection}` |

## Example

Two peers in this page talk to each other: the offer and the answer go from one to the other in code, as a signaling server would carry them.

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect the peers" Variant="primary" [disabled]="State !== 'Idle'" (click)="Connect" />
	<Button Label="Send from A to B" [disabled]="State !== 'Open'" (click)="Send" />
</div>
<p class="elemenx-text small muted">{{State}}</p>
<ul class="elemenx-ul">
	<li *for="line of Received" *key="line">{{line}}</li>
</ul>
<script>
({
	State: 'Idle',
	Received: [],
	A: null,
	B: null,
	Count: 0,

	Connect: function () {
		var self = this;
		var json = {
			Encode: function (message) {
				return JSON.stringify(message);
			},
			Decode: function (text) {
				return {Type: 'Message', Data: JSON.parse(text)};
			}
		};

		this.A = this.$Network().WebRTC({Protocol: json});
		this.B = this.$Network().WebRTC({Protocol: json});
		this.State = 'Negotiating';

		/* Each candidate one peer finds goes to the other. */
		this.A.On('Transport.ICECandidate', function (event) {
			if (event.Data.Candidate)
				self.B.AddICECandidate(event.Data.Candidate);
		});

		this.B.On('Transport.ICECandidate', function (event) {
			if (event.Data.Candidate)
				self.A.AddICECandidate(event.Data.Candidate);
		});

		this.A.On('Transport.Open', function () {
			self.State = 'Open';
		});

		this.B.On('Protocol.Message', function (event) {
			self.Received = self.Received.concat(['B got: ' + event.Data.Text]);
		});

		this.A.CreateOffer(function (error, offer) {
			if (error) {
				self.State = 'Error: ' + error.message;

				return;
			}

			self.B.AcceptOffer(offer, function (failure, answer) {
				if (failure) {
					self.State = 'Error: ' + failure.message;

					return;
				}

				self.A.AcceptAnswer(answer);
			});
		});
	},

	Send: function () {
		this.Count++;

		this.A.Send({Text: 'message ' + this.Count});
	}
})
</script>
```

For files and large values over the channel use a [Transfer](/network/transfer): it splits them into chunks the channel takes, waits for the acknowledgments of the other side and resends what was lost.
