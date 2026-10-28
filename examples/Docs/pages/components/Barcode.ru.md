<!-- generated -->
# Barcode

Штрихкод текста (сервис Barcodes): Format — code128 (по умолчанию), ean13, ean8, upca, code39, itf14, datamatrix, pdf417 или свой (Barcodes.Register). Module — ширина модуля в пикселях (2: код вдвое шире числа своих модулей), Height — высота штрихов в пикселях (80), ShowText пишет под ними человеческий текст (FontSize в пикселях), Dark и Light — его цвета (Light transparent — без фона). Его стиль: Round (от 0 до 1: концы штрихов скруглены), Shape — форма модулей матрицы (square, dots, rounded или diamond). Check добавляет контрольную цифру Code 39, Bearer false убирает рамку ITF-14, Columns и Level задают вид PDF417.
SVG() возвращает его как текст SVG, Png(scale, callback) — как data URL картинки PNG (в scale раз больше его размера: 2), Download(name, format) сохраняет его как name.png или name.svg; ready отдаёт сам компонент, чтобы их вызывать. Текст, который формат не может записать, ничего не показывает и отправляет error (причина — в его message).

## Свойства

| Свойство | По умолчанию |
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

## События

- `error`
- `ready`

## Методы

- `SVG()`
- `Png(scale, callback)`
- `Download(name, format, callback)`

## Пример

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

## Тесты

- [Barcode draws its format at its sizes, emits why it cannot, and gives its picture as an SVG, a PNG and a download](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L142) — `tests/regression/library-codes.test.js`
