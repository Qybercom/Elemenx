# WebRTC

`Network.WebRTC` — канал данных между двумя браузерами: `RTCPeerConnection` с одним `RTCDataChannel`, с протоколом и обратным давлением, как у [WebSocket](/network/websocket). Согласование (предложение, ответ, ICE-кандидаты) идёт через методы с обратными вызовами, а не через Promise; как два участника обмениваются ими (WebSocket, сервер, QR-код), решает приложение.

## Согласование

@block 1

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

@block 2

Для файлов и больших значений поверх канала используйте [Transfer](/network/transfer): он режет их на части, которые принимает канал, ждёт подтверждений другой стороны и досылает потерянное.
