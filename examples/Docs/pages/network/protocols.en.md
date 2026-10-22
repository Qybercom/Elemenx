# Protocols

A Protocol stands between a resource and the wire: it encodes what the Application sends and decodes what comes into typed messages. Without one, a resource sends what it is given and reports only `Transport.Data`; with one, every message that comes is also a `Protocol.<Type>` event, so a component listens to `Protocol.Price` or `Protocol.ChatMessage` instead of parsing text everywhere.

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

`Elemenx.Network.Protocol(name, definition)` registers a Protocol, `Elemenx.Network.Protocol(name)` returns it (or `null`). A resource takes a Protocol by its name or as a definition object, in its settings (`Protocol: 'JSON'`) or by its setter (`Protocol('JSON')`) before it starts.

## A definition

| Member | Called | Returns |
| --- | --- | --- |
| `Encode(value, resource)` | for every outgoing value: the `Data` of a request, a message of `Send`, a packet of a Transfer | what goes on the wire: a text, a `Blob`, an `ArrayBuffer`... |
| `Decode(input, resource)` | for every incoming message: a response, an event of SSE, a message of a socket | `{Type, Data}`, emitted as `Protocol.<Type>` with `Data`; `null` emits nothing |
| `Push(chunk, resource)` | for every chunk of a [Stream](/network/stream), instead of `Decode` | a message `{Type, Data}`, a list of them, or nothing |

`this` in these functions is the resource, so `Push` keeps there what is left over between chunks (`this.Rest`), one buffer for each resource that uses the Protocol.

## Lines of JSON

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

## Transfers

A [Transfer](/network/transfer) in chunks over a socket sends packets `{Type: 'Transfer', Action, ID, Index, Data, ...}` through `Encode`, where `Data` is binary, and waits for `Protocol.Transfer` events: the `Decode` of its transport turns the packets that come back (`Ack`, `Complete`) into `{Type: 'Transfer', Data: packet}`, with `Data` back as an `ArrayBuffer`. A binary Protocol frames each packet (a header of JSON, then the bytes); a text one puts the bytes in base64.

## Example

A Protocol made for one request: it decodes the response of `/api/hello` into a type of its own.

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
