# SSE

`Network.SSE` принимает события сервера через `EventSource`: ответ, который сервер держит открытым и пишет в него сообщения — `data: ...` и пустая строка. Браузер сам переподключается при обрыве и отправляет `id` последнего полученного сообщения (`Last-Event-ID`), чтобы сервер продолжил с него.

@block 1

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `URL` | `URL(value)` | адрес потока |
| `WithCredentials` | `WithCredentials(value)` | `true` отправляет cookie другого источника (CORS) |
| `Protocol` | `Protocol(value)` | декодирует `data` каждого сообщения |

## Методы

- `Connect()` открывает `EventSource`.
- `Close()` закрывает его: браузер перестаёт переподключаться.
- `Source()` — нативный `EventSource` или `null`, пока закрыт.

## События

| Событие | Данные |
| --- | --- |
| `Transport.BeforeConnect` | `{URL, WithCredentials}` |
| `Transport.Open` | `{Event, Source}`: также после каждого переподключения |
| `Transport.Data` | `{Data, LastEventID, Origin, Event, Source}`: одно сообщение |
| `Protocol.<Type>` | сообщение, декодированное протоколом |
| `Transport.Error` | `{ReadyState, Event, Source}`: `ReadyState` 0 — браузер переподключается, 2 — сдался |
| `Transport.BeforeClose`, `Transport.Close` | `{Source}` |

Сервер завершает свой ответ, и браузер открывает его снова через `retry` миллисекунд: событие `Error` с `ReadyState` 0, затем `Open`. Чтобы остановиться совсем, вызовите `Close()`.

## Пример

Сервер справки отправляет пять событий, по одному каждые 400 миллисекунд, и завершает ответ. Пример закрывает поток после пятого, чтобы браузер не запрашивал его снова:

@block 2

SSE работает в одну сторону — от сервера. Для сообщений в обе стороны используйте [WebSocket](/network/websocket), а где ответ не может оставаться открытым — [LongPolling](/network/longpolling).
