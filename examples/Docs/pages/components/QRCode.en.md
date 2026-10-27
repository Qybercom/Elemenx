<!-- generated -->
# QRCode

The QR code of a text (the QR Service): an address, a contact, the details of a payment. Level of error correction: L, M (the default), Q or H (a code with a logo over it needs H). Size in pixels, Margin in modules (4, the quiet zone a reader needs), Dark and Light its colors (black on white reads best). Image(size) returns it as a data URL of a PNG, SVG() as the text of an SVG, to download or print. A text too long for a code shows nothing and emits error.

## Properties

| Property | Default |
| --- | --- |
| `Level` | `'M'` |
| `Size` | `160` |
| `Margin` | `4` |
| `Dark` | `'#000000'` |
| `Light` | `'#ffffff'` |
| `Label` | `''` |

## Events

- `error`: The text is too long for a code: the error.

## Methods

- `SVG()`
- `Image(size)`

## Example

```example
<div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
	<QRCode [value]="Text" Size="144" />
	<Input Label="Text" [value]="Text" (input)="Typed" />
</div>
<script>
({
	Text: 'https://elemenx.dev',

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```
