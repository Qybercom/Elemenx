<!-- generated -->
# NFC

Метки NFC через Web NFC: Chrome на Android, HTTPS. Каждый метод принимает callback(error, result); error.name — имя ошибки браузера ('NotAllowedError', когда пользователь отказал, 'NotSupportedError' без Web NFC).

- Supported().
- Scan(callback): читает метки, поднесённые к устройству, до Stop(); callback(error, tag) для каждой, tag {Serial, Records: [{Type, Text, URL, Data (Uint8Array), MediaType, ID, Language}]} (Text для текста, URL для ссылки). Stop() завершает чтение.
- Write(message, options, callback): записывает поднесённую метку. message: текст, {URL}, {Text, Language} или {Records: [{Type, Text, URL, Data, MediaType, ID}]}; options: {Overwrite (true)}.
- Lock(callback): навсегда делает поднесённую метку только для чтения.

## Методы

- `Supported()`
- `Scan(callback)`
- `Stop()`
- `Write(message, options, callback)`
- `Lock(callback)`

## Пример

```example
<p class="elemenx-text">Web NFC here: <strong>{{Supported ? 'yes' : 'no (Chrome on Android, HTTPS)'}}</strong></p>
<Button Label="Scan a tag" Icon="search" [disabled]="!Supported" (click)="Scan" />
<Button Label="Stop" Variant="ghost" [disabled]="!Supported" (click)="Stop" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Supported: false,
	Note: '',

	$OnCreate: function () {
		this.Supported = this.$Service('NFC').Supported();
	},

	Scan: function () {
		var self = this;

		this.Note = 'Hold a tag to the device';

		this.$Service('NFC').Scan(function (error, tag) {
			self.Note = error ? error.name : 'Tag ' + tag.Serial + ': ' + tag.Records.map(function (record) {
				return record.Text || record.URL || record.Type;
			}).join(', ');
		});
	},

	Stop: function () {
		this.$Service('NFC').Stop();
		this.Note = 'Stopped';
	},

	$OnDestroy: function () {
		if (this.Supported)
			this.$Service('NFC').Stop();
	}
})
</script>
```

## Тесты

- [reads the records of the tags until it stops, and writes texts, links and records](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/devices.test.js#L251) — `tests/regression/devices.test.js`
- [devices: the browser tells which of Push, Serial, USB and NFC it has, and each calls back its result or its error](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L8961) — `tests/examples/ui-kit.spec.js`
