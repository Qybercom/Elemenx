<!-- generated -->
# Serial

Последовательные порты (COM-порты, UART: Arduino, GPS, весы, принтеры...) через Web Serial: Chrome и Edge на компьютере, HTTPS или localhost. Каждый метод принимает callback(error, result); error.name — имя ошибки браузера ('NotFoundError', когда пользователь не выбрал порт, 'NotSupportedError' без Web Serial).

- Supported(). Request({Filters: [{VendorID, ProductID}]}, callback): пользователь выбирает порт (после нажатия: браузер требует жеста); результат — порт. Ports(callback): порты, уже разрешённые пользователем.
- Порт: Info {VendorID, ProductID}; Open({BaudRate (9600), DataBits, StopBits, Parity, FlowControl, Text}, callback) открывает его и начинает чтение: событие data несёт пришедшее (текст при Text: true, по умолчанию, или Uint8Array), событие line — каждую строку текста; Write(data, callback) отправляет текст или байты; Signals({DTR, RTS, Break}, callback); Close(callback); On(name, callback) / Off(name, callback) для data, line, error и close; Opened().
- On('connect' или 'disconnect', callback): порт страницы подключается или отключается ({Port}).

## Методы

- `Supported()`
- `Request(options, callback)`
- `Ports(callback)`
- `On(name, callback)`
- `Off(name, callback)`

## Пример

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

## Тесты

- [asks for a port by its filters, reads text and lines, writes, and closes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L69) — `tests/regression/devices.test.js`
- [calls back NotSupportedError without Web Serial, and reports the ports that come and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L156) — `tests/regression/devices.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8263) — `tests/examples/ui-kit.spec.js`
