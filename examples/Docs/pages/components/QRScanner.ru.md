<!-- generated -->
# QRScanner

Читает QR-коды (и другие штрихкоды, Formats) с камеры: изображение задней камеры телефона в рамке и scan с {Value, Format} для каждого прочитанного кода. Continuous false (по умолчанию) останавливается после первого кода; true продолжает (каждый раз новый код, тот же — снова через Repeat миллисекунд). Active включает и выключает камеру (а также Start() и Stop()). Коды читает браузер (BarcodeDetector: Chrome и Edge на Android, ChromeOS и macOS, Safari): в остальных случаях, а также когда камеру запретили, он сообщает об этом и отправляет error ({Reason: 'unsupported', 'denied' или 'camera'}); тогда показывается содержимое его тега (поле, чтобы ввести код).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Active` | `true` |
| `Continuous` | `false` |
| `Repeat` | `2000` |
| `Formats` | `['qr_code']` |
| `Label` | `''` |

## События

- `error`: Он не может читать: {Reason: unsupported, denied или camera}.
- `scan`: Код прочитан: {Value, Format}.

## Слоты

по умолчанию

## Методы

- `Start()`
- `Stop()`

## Пример

```example
<QRScanner [active]="Active" Height="220" (scan)="Scanned">
	<Input Label="Or type the code" (change)="Typed" />
</QRScanner>
<Button [label]="Active ? 'Stop the camera' : 'Scan'" Size="small" (click)="Toggled" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Active: false,
	Note: 'Press Scan and point the camera at a QR code.',

	Toggled: function () {
		this.Active = !this.Active;
	},

	Scanned: function (code) {
		this.Active = false;
		this.Note = 'Read: ' + code.Value;
	},

	Typed: function (value) {
		this.Note = 'Typed: ' + value;
	}
})
</script>
```

## Тесты

- [QRScanner reads a code from the camera through BarcodeDetector, and without it says so and shows its content](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L406) — `tests/regression/library-new.test.js`
