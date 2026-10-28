<!-- generated -->
# Barcodes

Barcodes: the codes of the shelves, the parcels and the tickets, drawn in SVG; QR codes are the QR Service.

- Formats(): the names of the formats: code128 (any ASCII text, its sets switched to the shortest), ean13 and ean8 (12 or 7 digits, the check digit added; or 13 and 8, the check digit checked), upca (11 or 12 digits), code39 (the capitals, the digits and - . space $ / + %; Check adds the digit of modulo 43), itf14 (13 or 14 digits, its bearer bars), datamatrix (any text, in UTF-8; the least square symbol it fits, 10 to 144 modules) and pdf417 (any text; Columns 1 to 30, Level 0 to 8 of error correction, by its length when not given).
- Register(name, format): a format of its own, {Encode(text, options), Label}: Encode returns a code (below) or throws an Error of what is wrong in the text.
- Encode(format, text, options): the code, one of {Kind: 'linear', Modules: '1011...' (1 a dark module), Guards (the same length, 1 a bar drawn longer: the guards of EAN and UPC), Texts: [{Text, From, To}] (the human text, at those modules: less than 0 or past the end in the quiet zone), Quiet: {Left, Right}, Bearer}, {Kind: 'matrix', Modules: [[true, false...]] (rows of dark), Quiet} or {Kind: 'stacked', Rows: ['1011...'], RowHeight, Quiet}.
- SVG(format, text, options): its drawing; options Height (of the bars, in modules: 50), ShowText (true), FontSize (in modules: 10), Dark, Light (transparent for none), Round (0 to 1: the ends of the bars round), Shape (of the modules of a matrix: square, dots, rounded or diamond, as the QR Service draws them) and the options of the format.

## Methods

- `Formats()`
- `Register(name, format)`
- `Encode(format, text, options)`
- `SVG(format, text, options)`

## Example

```example
<p class="elemenx-text small">A format of its own: each letter a bar and a gap, as wide as its place in the alphabet.</p>
<span style="display: inline-block; width: 320px;" [property.innerHTML]="Drawing"></span>
<p class="elemenx-text small muted">{{Formats}}</p>
<script>
({
	Drawing: '',
	Formats: '',

	$OnCreate: function () {
		var barcodes = this.$Service('Barcodes');

		barcodes.Register('alphabet', {
			Label: 'Alphabet',
			Encode: function (text) {
				var modules = '';

				String(text).toLowerCase().replace(/[^a-z]/g, '').split('').forEach(function (letter) {
					var width = letter.charCodeAt(0) - 96;

					modules += new Array(Math.ceil(width / 4) + 1).join('1') + '0';
				});

				if (!modules)
					throw new Error('The alphabet format takes letters');

				return {Kind: 'linear', Modules: modules, Texts: [{Text: text, From: 0, To: modules.length}], Quiet: {Left: 4, Right: 4}};
			}
		});

		this.Drawing = barcodes.SVG('alphabet', 'Elemenx', {Height: 20, FontSize: 6, Round: 1});
		this.Formats = 'The formats: ' + barcodes.Formats().join(', ');
	}
})
</script>
```
