<!-- generated -->
# Stream

`Network.Stream` читает ответ по мере прихода, часть за частью, через `fetch` и `ReadableStream`: растущий журнал, строки JSON, которые сервер пишет одну за другой, текст, который генерирует модель. Чтение можно приостановить и продолжить (браузер в это время перестаёт забирать байты из сети) и закрыть в любой момент.

```js
var stream = this.$Network().Stream({URL: '/api/logs?follow=1'});
var decoder = new TextDecoder();

stream.On('Transport.Data', function (event) {
	self.Log += decoder.decode(event.Data.Data, {stream: true});
});

stream.On('Transport.End', function () {
	self.Done = true;
});

stream.Connect();
```

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

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Connect" Variant="primary" [disabled]="Running" (click)="Connect" />
	<Button Label="Pause" [disabled]="!Running || Paused" (click)="Pause" />
	<Button Label="Resume" [disabled]="!Paused" (click)="Resume" />
	<Button Label="Close" Variant="ghost" [disabled]="!Running" (click)="Close" />
</div>
<p class="elemenx-text small muted">{{Status}} · {{Bytes}} bytes</p>
<ul class="elemenx-ul">
	<li *for="line of Lines" *key="line.Index">#{{line.Index}}: {{line.Text}}</li>
</ul>
<script>
({
	Running: false,
	Paused: false,
	Status: 'Idle',
	Bytes: 0,
	Lines: [],
	Stream: null,

	Connect: function () {
		var self = this;

		this.Lines = [];
		this.Bytes = 0;

		this.Stream = this.$Network().Stream({
			URL: '/api/stream',
			Protocol: {
				/* Keeps the end of a chunk that is not a whole line until the next chunk completes it. */
				Push: function (chunk) {
					var lines;

					this.Decoder = this.Decoder || new TextDecoder();
					lines = ((this.Rest || '') + this.Decoder.decode(chunk, {stream: true})).split('\n');
					this.Rest = lines.pop();

					return lines.filter(Boolean).map(function (line) {
						return {Type: 'Line', Data: JSON.parse(line)};
					});
				}
			}
		});

		this.Stream.On('Transport.Open', function () {
			self.Running = true;
			self.Status = 'Reading';
		});

		this.Stream.On('Transport.Data', function (event) {
			self.Bytes += event.Data.Bytes;
		});

		this.Stream.On('Protocol.Line', function (event) {
			self.Lines = self.Lines.concat([event.Data]);
		});

		this.Stream.On('Transport.End', function () {
			self.Running = false;
			self.Status = 'Complete';
		});

		this.Stream.On('Transport.Close', function () {
			self.Running = false;
			self.Paused = false;
			self.Status = 'Closed';
		});

		this.Stream.Connect();
	},

	Pause: function () {
		this.Stream.Pause();
		this.Paused = true;
		this.Status = 'Paused';
	},

	Resume: function () {
		this.Stream.Resume();
		this.Paused = false;
		this.Status = 'Reading';
	},

	Close: function () {
		this.Stream.Close();
	}
})
</script>
```

[Transfer](/network/transfer) без данных поверх Stream принимает большой ответ с прогрессом (`Loaded`, `Total`, `Speed`) и позволяет пользователю приостановить загрузку.
