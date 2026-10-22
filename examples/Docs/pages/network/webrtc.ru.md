<!-- generated -->
# WebRTC

`Network.WebRTC` — канал данных между двумя браузерами: `RTCPeerConnection` с одним `RTCDataChannel`, с протоколом и обратным давлением, как у [WebSocket](/network/websocket). Согласование (предложение, ответ, ICE-кандидаты) идёт через методы с обратными вызовами, а не через Promise; как два участника обмениваются ими (WebSocket, сервер, QR-код), решает приложение.

## Согласование

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

Каждый метод согласования принимает необязательный обратный вызов `(error, result)` последним аргументом; он всегда вызывается после возврата из метода: `CreateOffer` и `AcceptOffer` дают локальное описание, `AcceptAnswer` — принятое удалённое, `AddICECandidate` — ничего. Без обратного вызова неудачный шаг становится событием `Transport.Error` с `Error`, `Operation` (имя метода) и `Connection` в данных.

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `Configuration` | `Configuration(value)` | `RTCConfiguration`: `iceServers`... |
| `ChannelName` | `ChannelName(value)` | имя канала данных, `'elemenx'` |
| `Channel` | `Channel(value)` | `RTCDataChannelInit`: `{ordered, maxRetransmits, protocol}` |
| `Protocol` | `Protocol(value)` | [протокол](/network/protocols) сообщений |
| `BufferHighWaterMark`, `BufferLowWaterMark` | сеттеры | 1 МиБ и 256 КиБ: байты, ждущие в канале |
| `QueueHighWaterMark`, `QueueLowWaterMark` | сеттеры | 4 МиБ и 1 МиБ: байты, ждущие в очереди Elemenx перед каналом |

## Методы

- `CreateOffer(callback)`, `AcceptOffer(offer, callback)`, `AcceptAnswer(answer, callback)`, `AddICECandidate(candidate, callback)` — согласование.
- `Connect(initiator)` создаёт соединение без согласования (`initiator` `false`: не создавать канал, а ждать канал другой стороны).
- `Send(message)` ставит сообщение в очередь канала и возвращает `true` или `false`, если канал не открыт или очередь полна (`Backpressure`; продолжайте на `Drain`).
- `Writable()`, `Close()`.
- `Connection()` — `RTCPeerConnection`, `DataChannel()` — `RTCDataChannel`.

## События

| Событие | Данные |
| --- | --- |
| `Transport.BeforeConnect` | соединение создано |
| `Transport.LocalDescription`, `Transport.RemoteDescription` | описания установлены |
| `Transport.ICECandidate` | `{Candidate, Connection}`: отправьте его другому участнику |
| `Transport.ConnectionState`, `Transport.ICEConnectionState`, `Transport.SignalingState` | состояния соединения по мере изменения |
| `Transport.Channel` | канал данных появился (здесь задайте ему `binaryType`) |
| `Transport.Open` | канал открыт |
| `Transport.Queued`, `Transport.BeforeSend`, `Transport.AfterSend` | сообщение поставлено в очередь и отправлено в канал |
| `Transport.Data` | `{Data, ...}`: получено сообщение |
| `Protocol.<Type>` | сообщение, декодированное протоколом |
| `Transport.Backpressure`, `Transport.BufferedAmountLow`, `Transport.Drain` | очередь полна, канал освободил буфер, очередь снова принимает сообщения |
| `Transport.ChannelClose`, `Transport.BeforeClose`, `Transport.Close` | |
| `Transport.Error` | `{Error, Operation, Connection}` |

## Пример

Два участника на этой странице говорят друг с другом: предложение и ответ передаются в коде — так их нёс бы сервер сигнализации.

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

Для файлов и больших значений поверх канала используйте [Transfer](/network/transfer): он режет их на части, которые принимает канал, ждёт подтверждений другой стороны и досылает потерянное.
