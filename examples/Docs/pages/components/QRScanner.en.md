<!-- generated -->
# QRScanner

Reads QR codes (and other barcodes, Formats) from the camera: the picture of the camera at the back of a phone in a frame, and scan with {Value, Format} for each code read. Continuous false (the default) stops after the first code; true goes on (a new code each time, the same one again after Repeat milliseconds). Active starts and stops the camera (Start() and Stop() too). The browser reads the codes (BarcodeDetector: Chrome and Edge on Android, ChromeOS and macOS, Safari): elsewhere, and when the camera is refused, it says so and emits error ({Reason: 'unsupported', 'denied' or 'camera'}); the content of its tag shows then (a field to type the code).

## Properties

| Property | Default |
| --- | --- |
| `Active` | `true` |
| `Continuous` | `false` |
| `Repeat` | `2000` |
| `Formats` | `['qr_code']` |
| `Label` | `''` |

## Events

- `error`: It cannot read: {Reason: unsupported, denied or camera}.
- `scan`: A code was read: {Value, Format}.

## Slots

default

## Methods

- `Start()`
- `Stop()`

## Example

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

## Tests

- [QRScanner reads a code from the camera through BarcodeDetector, and without it says so and shows its content](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L406) — `tests/regression/library-new.test.js`
