<!-- generated -->
# QRCode

The QR code of a text (the QR Service): an address, a contact, the details of a payment. Level of error correction: L, M (the default), Q or H (a code with a logo over it needs H). Size in pixels, Margin in modules (4, the quiet zone a reader needs), Dark and Light its colors (black on white reads best; Light transparent for none).

- Its style: Modules (square, dots, rounded or diamond), Eyes (the three corners: square, rounded, circle or leaf) and EyeColor, Gradient ({From, To, Angle}), Logo (a picture in the middle, LogoSize of its width: 0.22) or Text (a word there); with them the level is H, so the code still reads.
- SVG() returns it as the text of an SVG; Image(size) as a data URL of a PNG at once (the modules square, no logo); Png(size, callback) as a data URL of a PNG of its whole style, callback(error, url); Download(name, format) saves it as name.png (format png, the default) or name.svg (svg): a download on the web, the dialog of the system in a program; ready gives the component itself, to call them. A text too long for a code shows nothing and emits error.

## Properties

| Property | Default |
| --- | --- |
| `Level` | `'M'` |
| `Size` | `160` |
| `Margin` | `4` |
| `Dark` | `'#000000'` |
| `Light` | `'#ffffff'` |
| `Modules` | `'square'` |
| `Eyes` | `null` |
| `EyeColor` | `null` |
| `Gradient` | `null` |
| `Logo` | `null` |
| `LogoSize` | `0.22` |
| `Text` | `''` |
| `Label` | `''` |

## Events

- `error`: The text is too long for a code: the error.
- `ready`: It is made: the component itself, to call Download, Png or SVG.

## Methods

- `SVG()`
- `Image(size)`
- `Png(size, callback)`
- `Download(name, format, callback)`

## Example

```example
<div class="docs-row">
	<QRCode [value]="Text" Size="160" [modules]="Modules" [eyes]="Eyes" [gradient]="Gradient" [logo]="Logo ? Picture : null" (ready)="Made" />
	<div class="docs-stack">
		<Input Label="Text" [value]="Text" (input)="Typed" />
		<Select Label="Modules" [value]="Modules" [options]="ModuleOptions" (change)="ModulesChosen" />
		<Select Label="Eyes" [value]="Eyes" [options]="EyeOptions" (change)="EyesChosen" />
		<Checkbox Label="A gradient" [checked]="!!Gradient" (change)="Graded" />
		<Checkbox Label="A logo in the middle (the level goes to H)" [checked]="Logo" (change)="Logoed" />
		<div class="docs-row">
			<Button Label="PNG" Icon="download" (click)="SavePng" />
			<Button Label="SVG" Icon="download" (click)="SaveSvg" />
		</div>
	</div>
</div>
<script>
(function () {
	var code = null;

	return {
		Text: 'https://elemenx.dev',
		Modules: 'dots',
		Eyes: 'leaf',
		Gradient: {From: '#1a237e', To: '#00897b', Angle: 45},
		Logo: true,
		Picture: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#00897b"/><path d="M6 12l4 4 8-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'),
		ModuleOptions: [{Value: 'square', Label: 'Squares'}, {Value: 'dots', Label: 'Dots'}, {Value: 'rounded', Label: 'Rounded'}, {Value: 'diamond', Label: 'Diamonds'}],
		EyeOptions: [{Value: 'square', Label: 'Squares'}, {Value: 'rounded', Label: 'Rounded'}, {Value: 'circle', Label: 'Circles'}, {Value: 'leaf', Label: 'Leaves'}],

		/* ready gives the QRCode itself: its methods save the picture. */
		Made: function (instance) {
			code = instance;
		},

		Typed: function (value) {
			this.Text = value;
		},

		ModulesChosen: function (value) {
			this.Modules = value;
		},

		EyesChosen: function (value) {
			this.Eyes = value;
		},

		Graded: function (value) {
			this.Gradient = value ? {From: '#1a237e', To: '#00897b', Angle: 45} : null;
		},

		Logoed: function (value) {
			this.Logo = value;
		},

		SavePng: function () {
			code.Download('elemenx-qr', 'png');
		},

		SaveSvg: function () {
			code.Download('elemenx-qr', 'svg');
		}
	};
})()
</script>
```

## Tests

- [QRCode takes a style: its modules, eyes, gradient and logo (the level H then), and saves its whole style as a PNG and an SVG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L204) — `tests/regression/library-codes.test.js`
- [QRCode draws the modules of its text, and tells once that a text is too long](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L361) — `tests/regression/library-new.test.js`
