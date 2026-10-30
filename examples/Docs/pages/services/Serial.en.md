<!-- generated -->
# Serial

Serial ports (COM ports, UART: Arduino, GPS, scales, printers...) through Web Serial: Chrome and Edge on the desktop, HTTPS or localhost. Every method takes callback(error, result); error.name is the name of the browser error ('NotFoundError' when the user picks no port, 'NotSupportedError' without Web Serial).

- Supported(). Request({Filters: [{VendorID, ProductID}]}, callback): the user picks a port (from a press: the browser asks for a gesture); the result is a port. Ports(callback): the ports the user already allowed.
- A port: Info {VendorID, ProductID}; Open({BaudRate (9600), DataBits, StopBits, Parity, FlowControl, Text}, callback) opens it and starts reading: the data event carries what comes (a text with Text: true, the default, or a Uint8Array), the line event each line of text; Write(data, callback) sends a text or bytes; Signals({DTR, RTS, Break}, callback); Close(callback); On(name, callback) / Off(name, callback) for data, line, error and close; Opened().
- On('connect' or 'disconnect', callback): a port of the page joins or leaves ({Port}).

## Methods

- `Supported()`
- `Request(options, callback)`
- `Ports(callback)`
- `On(name, callback)`
- `Off(name, callback)`

## Example

```example
<p class="elemenx-text">Web Serial here: <strong>{{Supported ? 'yes' : 'no (Chrome and Edge on the desktop)'}}</strong></p>
<Button Label="Pick a port" Icon="link" [disabled]="!Supported" (click)="Pick" />
<ul class="elemenx-ul"><li *for="line of Lines" *key="$index">{{line}}</li></ul>
<script>
({
	Supported: false,
	Lines: [],

	$OnCreate: function () {
		this.Supported = this.$Service('Serial').Supported();
	},

	Pick: function () {
		var self = this;

		this.$Service('Serial').Request({}, function (error, port) {
			if (error) {
				self.Lines = [error.name];

				return;
			}

			self.Port = port;

			port.On('line', function (line) {
				self.Lines = self.Lines.concat([line]).slice(-8);
			});

			port.Open({BaudRate: 9600}, function (failure) {
				self.Lines = [failure ? failure.message : 'Open: VendorID ' + port.Info.VendorID];
			});
		});
	},

	$OnDestroy: function () {
		if (this.Port)
			this.Port.Close(function () {});
	}
})
</script>
```

## Tests

- [asks for a port by its filters, reads text and lines, writes, and closes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L69) — `tests/regression/devices.test.js`
- [calls back NotSupportedError without Web Serial, and reports the ports that come and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L156) — `tests/regression/devices.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8943) — `tests/examples/ui-kit.spec.js`
