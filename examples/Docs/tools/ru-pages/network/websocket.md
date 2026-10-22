# WebSocket

`Network.WebSocket` — сокет, который переносит сообщения в обе стороны, пока открыт. К браузерному `WebSocket` он добавляет протокол (сообщения кодируются и декодируются в типизированные события) и обратное давление: когда в очереди больше, чем принимает сеть, `Send` отказывает, а не заполняет память, и событие `Drain` говорит, когда можно продолжать.

@block 1

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `URL` | `URL(value)` | `ws://` или `wss://` |
| `Protocols` | `Protocols(value)` | подпротоколы рукопожатия WebSocket (имя или список) |
| `BinaryType` | `BinaryType(value)` | `'blob'` (по умолчанию) или `'arraybuffer'`: в каком виде приходят двоичные сообщения |
| `Protocol` | `Protocol(value)` | [протокол](/network/protocols) сообщений |
| `BufferHighWaterMark` | `BufferHighWaterMark(bytes)` | 4 МиБ: если в сокете ждёт больше байт, `Send` отказывает |
| `BufferLowWaterMark` | `BufferLowWaterMark(bytes)` | 1 МиБ: когда после отказа становится меньше, приходит `Drain` |
| `DrainInterval` | `DrainInterval(milliseconds)` | 10: как часто сокет проверяет, освободился ли он |

Пороги и интервал можно менять при открытом сокете; без аргумента сеттеры возвращают значение.

## Методы

- `Connect()` открывает сокет.
- `Send(message)` кодирует сообщение протоколом и отправляет его. Возвращает `true` или `false`, если сокет не открыт или перегружен (ничего не отправлено: повторите на `Drain`).
- `Writable()` — `true`, если сокет открыт и не перегружен.
- `Close(code, reason)` закрывает его.
- `Socket()` — нативный `WebSocket` или `null`, пока закрыт.

## События

| Событие | Данные |
| --- | --- |
| `Transport.BeforeConnect` | `{URL, Protocols, Socket}` |
| `Transport.Open` | `{Event, Protocol, Extensions, Socket}` |
| `Transport.BeforeSend`, `Transport.AfterSend` | `{Data, BufferedAmount, Socket}`: вокруг каждого сообщения |
| `Transport.Data` | `{Data, Origin, Event, Socket}`: сообщение, как пришло |
| `Protocol.<Type>` | сообщение, декодированное протоколом |
| `Transport.Backpressure` | `{BufferedAmount, Bytes, HighWaterMark, Socket}`: сокет переполнен |
| `Transport.Drain` | `{BufferedAmount, Socket}`: можно снова отправлять |
| `Transport.Error` | `{Event, Socket}` |
| `Transport.BeforeClose` | `{Code, Reason, Socket}` |
| `Transport.Close` | `{Code, Reason, Clean, Event, Socket}` |

WebSocket сам не переподключается: слушайте `Close` и вызывайте `Connect()` снова, когда это нужно приложению.

## Пример

Сервер справки отвечает на каждое сообщение объектом `{Echo, Time}`. Протокол отправляет объекты как JSON и декодирует ответы:

@block 2

## Отправка большого объёма

Цикл, отправляющий много сообщений, останавливается, когда `Send` возвращает `false`, и продолжает со следующего на `Drain`:

@block 3

[Transfer](/network/transfer) делает это за вас — с подтверждениями и повторами — и сообщает один общий прогресс.
