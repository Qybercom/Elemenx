<!-- generated -->
# Barcodes

Штрихкоды полок, посылок и билетов, нарисованные в SVG; QR-коды — это сервис QR.
- Formats(): имена форматов: code128 (любой текст ASCII, его наборы переключаются на кратчайшие), ean13 и ean8 (12 или 7 цифр — контрольная цифра добавляется; 13 и 8 — проверяется), upca (11 или 12 цифр), code39 (заглавные буквы, цифры и - . пробел $ / + %; Check добавляет цифру по модулю 43), itf14 (13 или 14 цифр, с рамкой), datamatrix (любой текст в UTF-8; наименьший квадратный символ, в который он помещается, от 10 до 144 модулей) и pdf417 (любой текст; Columns от 1 до 30, Level коррекции ошибок от 0 до 8 — по длине, если не задан).
- Register(name, format): свой формат, {Encode(text, options), Label}: Encode возвращает код (ниже) или выбрасывает Error с тем, что не так в тексте.
- Encode(format, text, options): код, один из {Kind: 'linear', Modules: '1011...' (1 — тёмный модуль), Guards (той же длины, 1 — удлинённый штрих: охранные знаки EAN и UPC), Texts: [{Text, From, To}] (человеческий текст на этих модулях: меньше 0 или после конца — в тихой зоне), Quiet: {Left, Right}, Bearer}, {Kind: 'matrix', Modules: [[true, false...]] (строки тёмных), Quiet} или {Kind: 'stacked', Rows: ['1011...'], RowHeight, Quiet}.
- SVG(format, text, options): его рисунок; options — Height (штрихов, в модулях: 50), ShowText (true), FontSize (в модулях: 10), Dark, Light (transparent — без фона), Round (от 0 до 1: скругление концов штрихов), Shape (модулей матрицы: square, dots, rounded или diamond, как их рисует сервис QR) и параметры формата.

## Методы

- `Formats()`
- `Register(name, format)`
- `Encode(format, text, options)`
- `SVG(format, text, options)`

## Пример

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

## Тесты

- [Barcodes writes each format as the reference decoder read it, checks the digits, and tells what a format cannot write](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L75) — `tests/regression/library-codes.test.js`
- [Barcodes takes a format of its own, and draws the guards of EAN longer, the text under the bars and the frame of ITF-14](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L113) — `tests/regression/library-codes.test.js`
