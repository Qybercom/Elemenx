<!-- generated -->
# QR

QR-коды (ISO/IEC 18004): Encode(text, level) возвращает модули кода текста, {Size, Version, Level, Modules: строки из true (тёмный) и false}: текст в UTF-8 (байтовый режим), наименьшая версия (от 1 до 40), в которую он помещается, уровень коррекции ошибок L, M (по умолчанию), Q или H (код читается, даже если повреждено 7, 15, 25 или 30% его) и маска с наименьшим штрафом. Текст, слишком длинный для версии 40, вызывает ошибку. SVG(text, options) — текст SVG кода ({Level, Margin (4 модуля), Dark, Light}) в стиле Modules (square, dots, rounded или diamond), Eyes (три поисковых узора: square, rounded, circle или leaf), EyeColor, Gradient ({From, To, Angle}) и Logo (URL картинки в середине, LogoSize: 0.22) или Text (слово там же): с Logo или Text уровень — H (LevelFor(options)), а модули под ними убираются. Raster(svg, width, height, callback) рисует SVG в картинку PNG, callback(error, data URL), и сначала читает Logo с другого адреса. ModulePath(x, y, shape) — путь модуля заданной формы.

## Методы

- `Encode(text, level)`
- `LevelFor(options)`
- `ModulePath(x, y, shape)`
- `SVG(text, options)`
- `Raster(svg, width, height, callback)`

## Пример

```example
<p class="elemenx-text">Version {{Code.Version}}, {{Code.Size}} by {{Code.Size}} modules, level {{Code.Level}}, mask {{Code.Mask}}.</p>
<span style="display: inline-block; width: 120px;" [property.innerHTML]="Drawing"></span>
<script>
({
	Code: {},
	Drawing: '',

	$OnCreate: function () {
		var qr = this.$Service('QR');

		this.Code = qr.Encode('WIFI:T:WPA;S:Home;P:secret;;', 'Q');
		this.Drawing = qr.SVG('WIFI:T:WPA;S:Home;P:secret;;', {Level: 'Q'});
	}
})
</script>
```

## Тесты

- [Barcodes writes each format as the reference decoder read it, checks the digits, and tells what a format cannot write](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L75) — `tests/regression/library-codes.test.js`
- [Barcodes takes a format of its own, and draws the guards of EAN longer, the text under the bars and the frame of ITF-14](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L113) — `tests/regression/library-codes.test.js`
- [Barcode draws its format at its sizes, emits why it cannot, and gives its picture as an SVG, a PNG and a download](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L142) — `tests/regression/library-codes.test.js`
- [QRCode takes a style: its modules, eyes, gradient and logo (the level H then), and saves its whole style as a PNG and an SVG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L204) — `tests/regression/library-codes.test.js`
- [codes and diagrams: a commit graph, barcodes, styled QR codes, diagrams and the plugins of Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L10041) — `tests/examples/ui-kit.spec.js`
- [QRCode draws the modules of its text, and tells once that a text is too long](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L361) — `tests/regression/library-new.test.js`
