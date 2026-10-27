<!-- generated -->
# QRCode

QR-код текста (сервис QR): адреса, контакта, реквизитов платежа. Level — уровень коррекции ошибок: L, M (по умолчанию), Q или H (коду с логотипом поверх нужен H). Size — размер в пикселях, Margin — поля в модулях (4, тихая зона, нужная считывателю), Dark и Light — его цвета (чёрное на белом читается лучше всего). Image(size) возвращает его как data URL картинки PNG, SVG() — как текст SVG, чтобы скачать или напечатать. Слишком длинный для кода текст ничего не показывает и отправляет error.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Level` | `'M'` |
| `Size` | `160` |
| `Margin` | `4` |
| `Dark` | `'#000000'` |
| `Light` | `'#ffffff'` |
| `Label` | `''` |

## События

- `error`: Текст слишком длинный для кода: ошибка.

## Методы

- `SVG()`
- `Image(size)`

## Пример

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
