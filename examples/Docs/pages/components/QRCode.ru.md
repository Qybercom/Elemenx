<!-- generated -->
# QRCode

QR-код текста (сервис QR): адреса, контакта, реквизитов платежа. Level — уровень коррекции ошибок: L, M (по умолчанию), Q или H (коду с логотипом поверх нужен H). Size — размер в пикселях, Margin — поля в модулях (4, тихая зона, нужная считывателю), Dark и Light — его цвета (чёрное на белом читается лучше всего; Light transparent — без фона).
- Его стиль: Modules (square, dots, rounded или diamond), Eyes (три угла: square, rounded, circle или leaf) и EyeColor, Gradient ({From, To, Angle}), Logo (картинка в середине, LogoSize — доля его ширины: 0.22) или Text (слово там же); с ними уровень становится H, и код по-прежнему читается.
- SVG() возвращает его как текст SVG; Image(size) — как data URL картинки PNG сразу (модули квадратные, без логотипа); Png(size, callback) — как data URL картинки PNG со всем стилем, callback(error, url); Download(name, format) сохраняет его как name.png (format png, по умолчанию) или name.svg (svg): загрузкой в вебе, диалогом системы в программе; ready отдаёт сам компонент, чтобы их вызывать. Слишком длинный для кода текст ничего не показывает и отправляет error.

## Свойства

| Свойство | По умолчанию |
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

## События

- `error`: Текст слишком длинный для кода: ошибка.
- `ready`

## Методы

- `SVG()`
- `Image(size)`
- `Png(size, callback)`
- `Download(name, format, callback)`

## Пример

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

## Тесты

- [QRCode takes a style: its modules, eyes, gradient and logo (the level H then), and saves its whole style as a PNG and an SVG](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-codes.test.js#L204) — `tests/regression/library-codes.test.js`
- [QRCode draws the modules of its text, and tells once that a text is too long](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L361) — `tests/regression/library-new.test.js`
