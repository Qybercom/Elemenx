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
