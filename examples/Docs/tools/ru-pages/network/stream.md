# Stream

`Network.Stream` читает ответ по мере прихода, часть за частью, через `fetch` и `ReadableStream`: растущий журнал, строки JSON, которые сервер пишет одну за другой, текст, который генерирует модель. Чтение можно приостановить и продолжить (браузер в это время перестаёт забирать байты из сети) и закрыть в любой момент.

@block 1

## Настройки

`Method`, `URL`, `Data` (тело запроса, отличного от `GET` и `HEAD`), `Headers` и `Protocol` — как у [XHR](/network/xhr), с теми же сеттерами.

## Методы

- `Connect()` начинает запрос и читает ответ.
- `Pause()` останавливает чтение (событие `Pause`); `Resume()` продолжает (событие `Resume`).
- `Close()` отменяет чтение и запрос (`BeforeClose`, затем `Close`).

## События

| Событие | Данные |
| --- | --- |
| `Transport.BeforeConnect` | `{Method, URL, Data}` |
| `Transport.Open` | `{Status, StatusText, Headers, URL, Response}`: заголовки пришли |
| `Transport.Data` | `{Data, Bytes, Response}`: часть, `Uint8Array` |
| `Protocol.<Type>` | сообщения, найденные протоколом в частях |
| `Transport.End` | ответ полностью получен |
| `Transport.Pause`, `Transport.Resume` | `{URL}` |
| `Transport.BeforeClose`, `Transport.Close` | `{URL}` |
| `Transport.Error` | `{Error}` или `{Reason: 'ReadableStreamUnavailable'}`, где браузер не умеет читать тело потоком |

## Сообщения через границы частей

Часть может закончиться где угодно: посреди строки, посреди символа UTF-8. Протокол с `Push(chunk)` хранит остаток между частями и возвращает завершённые сообщения (см. [Протоколы](/network/protocols)). Здесь сервер пишет строку JSON каждые 400 миллисекунд, всего десять:

@block 2

[Transfer](/network/transfer) без данных поверх Stream принимает большой ответ с прогрессом (`Loaded`, `Total`, `Speed`) и позволяет пользователю приостановить загрузку.
