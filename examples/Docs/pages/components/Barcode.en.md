<!-- generated -->
# Barcode

A barcode of a text (the Barcodes Service): Format code128 (the default), ean13, ean8, upca, code39, itf14, datamatrix, pdf417, or one of its own (Barcodes.Register). Module is the width of a module in pixels (2: a code as wide as its modules twice), Height the height of the bars in pixels (80), ShowText writes the human text under them (FontSize in pixels), Dark and Light its colors (Light transparent for none). Its style: Round (0 to 1: the ends of the bars round), Shape of the modules of a matrix (square, dots, rounded or diamond). Check adds the check digit of Code 39, Bearer false leaves out the frame of ITF-14, Columns and Level shape a PDF417. SVG() returns it as the text of an SVG, Png(scale, callback) as a data URL of a PNG (scale times its size: 2), Download(name, format) saves it as name.png or name.svg; ready gives the component itself, to call them. A text the format cannot write shows nothing and emits error (the reason, as its message).

## Properties

| Property | Default |
| --- | --- |
| `Format` | `'code128'` |
| `Module` | `2` |
| `Height` | `80` |
| `ShowText` | `true` |
| `FontSize` | `14` |
| `Dark` | `'#000000'` |
| `Light` | `'#ffffff'` |
| `Round` | `0` |
| `Shape` | `'square'` |
| `Check` | `false` |
| `Bearer` | `true` |
| `Columns` | `null` |
| `Level` | `null` |
| `Label` | `''` |

## Events

- `error`: The format cannot write the text: the error.
- `ready`: It is made: the component itself, to call Download, Png or SVG.

## Methods

- `SVG()`
- `Png(scale, callback)`
- `Download(name, format, callback)`

## Example

```example
<div class="docs-stack">
	<div class="docs-row">
		<Select Label="Format" [value]="Format" [options]="Formats" (change)="Chosen" />
		<Input Label="Text" [value]="Value" (input)="Typed" />
		<Checkbox Label="Round bars" [checked]="Round" (change)="Rounded" />
	</div>
	<Barcode [format]="Format" [value]="Value" Module="2" [round]="Round ? 1 : 0" Shape="rounded" (ready)="Made" (error)="Failed" />
	<p class="elemenx-text small" [class.danger]="!!Problem">{{Problem || 'Every format takes its own text: digits for EAN, UPC and ITF-14, any text for DataMatrix and PDF417.'}}</p>
	<div class="docs-row">
		<Button Label="PNG" Icon="download" (click)="SavePng" />
		<Button Label="SVG" Icon="download" (click)="SaveSvg" />
	</div>
</div>
<script>
(function () {
	var code = null;
	var samples = {code128: 'ELEMENX-2026', ean13: '400638133393', ean8: '9638507', upca: '03600029145', code39: 'ELEMENX 39', itf14: '1540014128876', datamatrix: 'https://elemenx.dev', pdf417: 'Elemenx: the boarding pass of a train.'};

	return {
		Format: 'ean13',
		Value: '400638133393',
		Round: false,
		Problem: '',
		Formats: Object.keys(samples).map(function (name) {
			return {Value: name, Label: name};
		}),

		/* ready gives the Barcode itself: its methods save the picture. */
		Made: function (instance) {
			code = instance;
		},

		Chosen: function (value) {
			this.Format = value;
			this.Value = samples[value];
			this.Problem = '';
		},

		Typed: function (value) {
			this.Value = value;
			this.Problem = '';
		},

		Rounded: function (value) {
			this.Round = value;
		},

		Failed: function (error) {
			this.Problem = error.message;
		},

		SavePng: function () {
			code.Download('barcode-' + this.Format, 'png');
		},

		SaveSvg: function () {
			code.Download('barcode-' + this.Format, 'svg');
		}
	};
})()
</script>
```

## Tests

- [Barcode draws its format at its sizes, emits why it cannot, and gives its picture as an SVG, a PNG and a download](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L142) — `tests/regression/library-codes.test.js`
