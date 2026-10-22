# LongPolling

`Network.LongPolling` спрашивает у сервера новости запросом, который сервер держит, пока они не появятся; как только приходит ответ, уходит следующий запрос. Так сообщения от сервера доходят там, где ответ не может оставаться открытым (старый прокси, serverless-функция, хостинг, обрывающий долгие ответы). После ошибки или тайм-аута следующий запрос ждёт `Retry` миллисекунд.

@block 1

## Настройки

| Настройка | Сеттер | Значение |
| --- | --- | --- |
| `Method`, `URL`, `Data`, `Headers`, `Protocol` | как у [XHR](/network/xhr) | их отправляет каждый запрос опроса |
| `Retry` | `Retry(milliseconds)` | пауза после ошибки или тайм-аута, по умолчанию 1000 |
| `Timeout` | | сколько миллисекунд может ждать запрос (событие `Timeout`, затем повтор) |

## Методы

- `Connect()` начинает опрос (`BeforeConnect`, `Open`, затем запросы).
- `Close()` останавливает его и прерывает ожидающий запрос (`BeforeClose`, `Close`).
- `XHR()` — запрос, который ждёт сейчас.

## События

| Событие | Данные |
| --- | --- |
| `Transport.BeforeConnect`, `Transport.Open` | `{URL}` |
| `Transport.BeforeRequest` | `{Method, URL, Data, XHR}`: перед каждым запросом |
| `Transport.BeforeResponse` | `{Status, StatusText, XHR}` |
| `Transport.Data` | `{Data, Status, StatusText, XHR}`: `Data` — текст ответа |
| `Protocol.<Type>` | ответ, декодированный протоколом |
| `Transport.AfterResponse` | `{Status, StatusText, Response, XHR}` |
| `Transport.Error`, `Transport.Timeout` | `{Event, XHR}`: следующий запрос ждёт `Retry` |
| `Transport.BeforeClose`, `Transport.Close` | `{URL}` |

## Пример

Сервер справки держит `/api/poll` 600 миллисекунд и отвечает растущим числом. Протокол декодирует JSON каждого ответа:

@block 2

Сервер отвечает на каждый запрос: новостями или, спустя время, пустым ответом (`204`, пустой список), чтобы прокси не обрывали слишком долго ждущий запрос.
