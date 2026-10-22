<!-- generated -->
# LongPolling

`Network.LongPolling` спрашивает у сервера новости запросом, который сервер держит, пока они не появятся; как только приходит ответ, уходит следующий запрос. Так сообщения от сервера доходят там, где ответ не может оставаться открытым (старый прокси, serverless-функция, хостинг, обрывающий долгие ответы). После ошибки или тайм-аута следующий запрос ждёт `Retry` миллисекунд.

```js
var feed = this.$Network().LongPolling({URL: '/api/notifications', Retry: 2000, Timeout: 30000});

feed.On('Transport.Data', function (event) {
	self.Notifications.push(JSON.parse(event.Data.Data));
});

feed.Connect();
```

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

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect" Variant="primary" [disabled]="Polling" (click)="Connect" />
	<Button Label="Close" Variant="ghost" [disabled]="!Polling" (click)="Close" />
</div>
<p class="elemenx-text small muted">{{Polling ? 'Polling' : 'Stopped'}} · {{Answers.length}} answers</p>
<ul class="elemenx-ul">
	<li *for="answer of Answers" *key="answer.Sequence">#{{answer.Sequence}} at {{answer.Time}}</li>
</ul>
<script>
({
	Polling: false,
	Answers: [],
	Feed: null,

	Connect: function () {
		var self = this;

		this.Answers = [];

		this.Feed = this.$Network().LongPolling({
			URL: '/api/poll',
			Retry: 1000,
			Protocol: {
				Decode: function (text) {
					return {Type: 'Answer', Data: JSON.parse(text)};
				}
			}
		});

		this.Feed.On('Transport.Open', function () {
			self.Polling = true;
		});

		this.Feed.On('Protocol.Answer', function (event) {
			self.Answers = [event.Data].concat(self.Answers).slice(0, 5);
		});

		this.Feed.On('Transport.Close', function () {
			self.Polling = false;
		});

		this.Feed.Connect();
	},

	Close: function () {
		this.Feed.Close();
	}
})
</script>
```

Сервер отвечает на каждый запрос: новостями или, спустя время, пустым ответом (`204`, пустой список), чтобы прокси не обрывали слишком долго ждущий запрос.
