<!-- generated -->
# USB

USB-устройства через WebUSB (Chrome и Edge; HTTPS или localhost): устройства со своим драйвером, а не те, что держит система (клавиатуры, диски). Каждый метод принимает callback(error, result); error.name — имя ошибки браузера ('NotFoundError', когда пользователь не выбрал устройство, 'NotSupportedError' без WebUSB).

- Supported(). Request({Filters: [{VendorID, ProductID, ClassCode}]}, callback): пользователь выбирает устройство (после нажатия); результат — устройство. Devices(callback): устройства, уже разрешённые пользователем.
- Устройство: Info {VendorID, ProductID, Name, Manufacturer, Serial}; Open({Configuration (1), Interface (0)}, callback) открывает его и захватывает интерфейс; TransferIn(endpoint, length, callback) читает (Uint8Array); TransferOut(endpoint, data, callback) записывает текст или байты (число записанных); Control({Type, Recipient, Request, Value, Index}, data или length, callback): управляющая передача, входящая с длиной, исходящая с данными; Close(callback); Opened().
- On('connect' или 'disconnect', callback): устройство страницы подключается или отключается ({Device}).

## Методы

- `Supported()`
- `Request(options, callback)`
- `Devices(callback)`
- `On(name, callback)`

## Пример

```example
<p class="elemenx-text">WebUSB here: <strong>{{Supported ? 'yes' : 'no (Chrome and Edge)'}}</strong></p>
<Button Label="Pick a device" Icon="link" [disabled]="!Supported" (click)="Pick" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Supported: false,
	Note: '',

	$OnCreate: function () {
		this.Supported = this.$Service('USB').Supported();
	},

	Pick: function () {
		var self = this;

		this.$Service('USB').Request({}, function (error, device) {
			self.Note = error ? error.name : device.Info.Manufacturer + ' ' + device.Info.Name + ' (' + device.Info.VendorID + ':' + device.Info.ProductID + ')';
		});
	}
})
</script>
```

## Тесты

- [asks for a device, opens and claims it, and transfers data in, out and by control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L178) — `tests/regression/devices.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8738) — `tests/examples/ui-kit.spec.js`
