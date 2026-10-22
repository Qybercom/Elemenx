# XHR

`Network.XHR` — один HTTP-запрос и его ответ поверх `XMLHttpRequest`: выгрузка и загрузка сообщают прогресс, а шаги запроса — события. Закончившийся запрос можно выполнить снова.

@block 1

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `Method` | `Method(value)` | по умолчанию `GET` |
| `URL` | `URL(value)` | адрес |
| `Data` | `Data(value)` | тело: текст, `FormData`, `Blob`, `ArrayBuffer`... (отправляется как есть или кодируется протоколом) |
| `Headers` | `Header(name, value)` | заголовки запроса; значение может быть списком, а `Header` добавляет к имеющимся |
| `Protocol` | `Protocol(value)` | [протокол](/network/protocols) (имя или определение), кодирующий `Data` и декодирующий ответ |
| `Timeout` | | миллисекунды до отказа (событие `Timeout`) |
| `ResponseType` | | `''`, `'text'`, `'json'`, `'blob'`, `'arraybuffer'`, `'document'` — как у `XMLHttpRequest` |

`Data` уходит как есть: объекту нужен `JSON.stringify` (или протокол, чей `Encode` это делает), а `FormData` сам ставит свой тип содержимого.

## Методы

- `Execute()` отправляет запрос; пока он идёт, повторный `Execute()` ничего не делает.
- `Abort()` останавливает его (событие `Abort`).
- `XHR()` возвращает нативный `XMLHttpRequest` текущего запроса.
- `On(name, callback)`, `Off(name, callback)`, `$StartedAt()`, `$ConnectedAt()`, `$ClosedAt()`.

## События

В порядке появления:

| Событие | Данные |
| --- | --- |
| `Transport.BeforeRequest` | `{Method, URL, Data, XHR}`: запрос вот-вот уйдёт (контекст добавляет здесь заголовки) |
| `Transport.RequestProgress` | `ProgressEvent` выгрузки |
| `Transport.AfterRequest` | выгрузка завершена |
| `Transport.BeforeResponse` | `{Status, StatusText, Headers, URL, XHR}`: пришли заголовки ответа |
| `Transport.ResponseProgress` | `ProgressEvent` загрузки |
| `Transport.AfterResponse` | `{Status, StatusText, Headers, Response, ResponseText, URL, XHR}` |
| `Protocol.<Type>` | ответ, декодированный протоколом |
| `Transport.Success` | то же, что `AfterResponse`: запрос окончен |
| `Transport.Error`, `Transport.Abort`, `Transport.Timeout` | `{Event, XHR}`: запрос не удался, прерван или слишком долгий |

`Success` значит, что ответ пришёл, каким бы ни был его статус: `404` — успех транспорта, поэтому смотрите на `Status`.

## Пример

@block 2

## Прогресс выгрузки

@block 3

Для файла, который должен пережить обрыв связи, или для нескольких файлов внутри одного объекта используйте [Transfer](/network/transfer) поверх запроса: он сообщает один общий прогресс, а поверх сокета досылает потерянное.
