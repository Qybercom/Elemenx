# Transfer

`Network.Transfer` переносит большое значение поверх другого ресурса и сообщает для него один общий прогресс: файл, `Blob`, `ArrayBuffer` или любой объект, где вместе лежат файлы, даты и числа. Он работает тремя способами — в зависимости от того, что ему дали:

| Режим | Когда | Как |
| --- | --- | --- |
| **Whole** (целиком) | есть `Data`, поверх ресурса без `Send` ([XHR](/network/xhr)) | значение уходит одним запросом; прогресс — это прогресс выгрузки, затем ответа |
| **Chunked** (частями) | есть `Data`, поверх ресурса с `Send` ([WebSocket](/network/websocket), [WebRTC](/network/webrtc)) | значение режется на части; в полёте одновременно окно частей, каждая ждёт подтверждения и уходит снова, если оно не пришло |
| **Inbound** (приём) | нет `Data` | приём: прогресс загрузки поверх XHR или [Stream](/network/stream) (с паузой и продолжением у Stream) или части, которые присылает Transfer другой стороны |

@block 1

## Значения с файлами

Простой объект или список уходит как структурированный конверт (`application/x-elemenx-structured`): 8-байтовый заголовок, JSON-манифест значения с заглушкой на месте каждой двоичной части (`{$ElemenxBinary: index}`) и каждой даты (`{$ElemenxDate: iso}`), затем байты частей одна за другой. Принимающая сторона Elemenx (`TransferReceiver`) возвращает тот же объект с объектами `File` и `Blob` на своих местах. Сервер читает заголовок (магическое число `0x45585354` и длину манифеста), манифест и части по их размерам.

`Blob`, `File`, `ArrayBuffer` или типизированный массив уходит как есть.

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `Transport` | `Transport(resource)` | ресурс, поверх которого идёт передача |
| `Data` | `Data(value)` | что отправить; без него Transfer принимает |
| `ChunkSize` | `ChunkSize(bytes)` | 64 КиБ: размер части |
| `WindowSize` | `WindowSize(count)` | 8: частей в полёте одновременно |
| `Retry` | `Retry(milliseconds)` | 1500: сколько часть ждёт подтверждения, прежде чем уйти снова |
| `MaxRetries` | `MaxRetries(count)` | 8: сколько раз часть уходит снова, прежде чем передача завершится ошибкой |
| `Encoder` | `Encoder(function)` | кодирует каждую часть (или всё значение) перед отправкой: сжатие, шифрование |

`Encoder` — это `function (value, context)`, возвращающая закодированное значение, или `function (value, context, done)`, один раз вызывающая `done(error, value)`; Promise отклоняется с ошибкой.

## Методы

- `Send(value)` отправляет значение (или уже заданное `Data`); `Execute()` запускает заданное: отправку с `Data`, приём без него.
- `Pause()`, `Resume()`, `Paused()` — загрузка поверх Stream.
- `Abort()` останавливает передачу (другой стороне передачи по частям об этом сообщается), `Destroy()` останавливает и отпускает транспорт.
- `Phase()`: `Idle`, `Sending`, `WaitingComplete`, `WaitingResponse`, `Receiving`, `Complete`, `Error`, `Abort`; `Active()`.
- `Receive(packet)` передаёт пакет вручную, когда пакеты приходят не через протокол.

## События

| Событие | Данные |
| --- | --- |
| `Transfer.Start` | `{ID, Name, Type, Size, Mode, ChunkSize, WindowSize, Transport}` |
| `Transfer.Phase` | `{ID, Phase, Data, Elapsed}` |
| `Transfer.Chunk` | `{ID, Index, Offset, Bytes}`: часть ушла |
| `Transfer.Retry` | `{ID, Index, Retry}`: часть ушла снова |
| `Transfer.Progress` | `{ID, Loaded, Total, Progress, Speed, Elapsed, Mode}` (у частей ещё `Sent`): `Loaded` считает подтверждённое другой стороной |
| `Transfer.Data` | `{ID, Data, Bytes, Loaded, Total}`: получена часть (приём) |
| `Transfer.Pause`, `Transfer.Resume` | `{ID, Loaded, Total}` |
| `Transfer.Complete` | `{ID, Loaded, Total, Elapsed, Mode, Metrics: {SendElapsed, WaitElapsed, ResponseElapsed, TotalElapsed}}`, а в режиме Whole ещё `Response` — данные `Success` транспорта (`{Status, Response, ...}`) |
| `Transfer.Error`, `Transfer.Abort`, `Transfer.Timeout` | `{ID, Loaded, Total, Phase, Error}` |

## Протокол передачи по частям

Передача по частям говорит пакетами `{Type: 'Transfer', Action, ID, ...}`:

1. `Start` `{Name, Mime, Size, ChunkSize, Chunks}` открывает её;
2. `Chunk` `{Index, Offset, Bytes, Data}` несёт часть; получатель отвечает `Ack` `{Index}`;
3. `End` `{Chunks, Size}` закрывает её; получатель отвечает `Complete`;
4. `Abort` останавливает её с любой стороны.

Протокол транспорта кодирует пакеты для передачи (двоичный кадр или JSON с данными в base64) и декодирует входящие в тип `Transfer`: `{Type: 'Transfer', Data: packet}`. `TransferReceiver` на другой стороне слушает `Protocol.Transfer` своего транспорта, отвечает подтверждениями и порождает `Transfer.Start`, `Transfer.Chunk`, `Transfer.Complete` (`{ID, Name, Mime, Size, Blob}`) и `Transfer.Receive` (то же с `Data` — объектом обратно — для структурированного значения).

## Пример: значение с файлом поверх запроса

Сервер справки отвечает на `/api/echo` размером полученного:

@block 2

## Пример: части поверх канала данных

Два участника WebRTC на этой странице: один отправляет 2 МБ частями по 32 КиБ, другой принимает их через `TransferReceiver` и подтверждает каждую. Протокол переносит части как JSON с байтами в base64:

@block 3
