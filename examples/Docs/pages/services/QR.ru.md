<!-- generated -->
# QR

QR-коды (ISO/IEC 18004): Encode(text, level) возвращает модули кода текста, {Size, Version, Level, Modules: строки из true (тёмный) и false}: текст в UTF-8 (байтовый режим), наименьшая версия (от 1 до 40), в которую он помещается, уровень коррекции ошибок L, M (по умолчанию), Q или H (код читается, даже если повреждено 7, 15, 25 или 30% его) и маска с наименьшим штрафом. Текст, слишком длинный для версии 40, вызывает ошибку. SVG(text, options) — текст SVG кода ({Level, Margin (4 модуля), Dark, Light}).

## Методы

- `Encode(text, level)`
- `SVG(text, options)`

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
