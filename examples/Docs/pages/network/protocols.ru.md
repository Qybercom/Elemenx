<!-- generated -->
# Протоколы

Протокол стоит между ресурсом и проводом: он кодирует то, что отправляет приложение, и декодирует приходящее в типизированные сообщения. Без протокола ресурс отправляет то, что ему дали, и сообщает только `Transport.Data`; с протоколом каждое пришедшее сообщение — ещё и событие `Protocol.<Type>`, так что компонент слушает `Protocol.Price` или `Protocol.ChatMessage`, а не разбирает текст повсюду.

```js
Elemenx.Network.Protocol('JSON', {
	Encode: function (value) {
		return JSON.stringify(value);
	},
	Decode: function (text) {
		var data;

		try {
			data = JSON.parse(text);
		}
		catch (error) {
			return {Type: 'Invalid', Data: text};
		}

		return {Type: data.Type || 'JSON', Data: data};
	}
});

var socket = this.$Network().WebSocket({URL: 'wss://example.com/live', Protocol: 'JSON'});

socket.On('Protocol.Quote', function (event) {
	self.Price = event.Data.Price;
});
```

`Elemenx.Network.Protocol(name, definition)` регистрирует протокол, `Elemenx.Network.Protocol(name)` возвращает его (или `null`). Ресурс принимает протокол по имени или объектом определения — в настройках (`Protocol: 'JSON'`) или сеттером (`Protocol('JSON')`) до запуска.

## Определение

| Член | Когда вызывается | Возвращает |
| --- | --- | --- |
| `Encode(value, resource)` | для каждого исходящего значения: `Data` запроса, сообщения `Send`, пакета Transfer | то, что уходит в провод: текст, `Blob`, `ArrayBuffer`... |
| `Decode(input, resource)` | для каждого входящего сообщения: ответа, события SSE, сообщения сокета | `{Type, Data}`, порождаемое как `Protocol.<Type>` с `Data`; `null` ничего не порождает |
| `Push(chunk, resource)` | для каждой части [Stream](/network/stream), вместо `Decode` | сообщение `{Type, Data}`, список сообщений или ничего |

`this` в этих функциях — ресурс, поэтому `Push` хранит в нём остаток между частями (`this.Rest`) — свой буфер у каждого ресурса, использующего протокол.

## Строки JSON

```js
Elemenx.Network.Protocol('NDJSON', {
	Push: function (chunk) {
		var lines;

		this.Decoder = this.Decoder || new TextDecoder();
		lines = ((this.Rest || '') + this.Decoder.decode(chunk, {stream: true})).split('\n');
		this.Rest = lines.pop();

		return lines.filter(Boolean).map(function (line) {
			return {Type: 'Line', Data: JSON.parse(line)};
		});
	}
});
```

## Передачи

[Transfer](/network/transfer) по частям поверх сокета отправляет пакеты `{Type: 'Transfer', Action, ID, Index, Data, ...}` через `Encode`, где `Data` — двоичные данные, и ждёт событий `Protocol.Transfer`: `Decode` транспорта превращает пришедшие обратно пакеты (`Ack`, `Complete`) в `{Type: 'Transfer', Data: packet}`, с `Data` снова в виде `ArrayBuffer`. Двоичный протокол оформляет каждый пакет кадром (заголовок JSON, затем байты), текстовый кладёт байты в base64.

## Пример

Протокол, созданный для одного запроса: он декодирует ответ `/api/hello` в собственный тип.

```example
<Button Label="Ask the server" Variant="primary" (click)="Ask" />
<p>{{Text}}</p>
<script>
({
	Text: '',

	Ask: function () {
		var self = this;
		var request = this.$Network().XHR({
			URL: '/api/hello',
			Protocol: {
				Decode: function (text) {
					var data = JSON.parse(text);

					return {Type: 'Greeting', Data: data.Message + ' (' + new Date(data.Time).toLocaleTimeString() + ')'};
				}
			}
		});

		request.On('Protocol.Greeting', function (event) {
			self.Text = event.Data;
		});

		request.Execute();
	}
})
</script>
```
