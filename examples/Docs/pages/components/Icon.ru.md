<!-- generated -->
# Icon

Иконка из спрайта: <Icon Name="add" /> или из другого набора: <Icon Name="weather:rain" /> (см. сервис Icons). Символы набора копируются на страницу один раз (как elemenx-icon-<name>), и каждая иконка сама рисует фигуры своего символа (*glyph), без <use>: Chrome перестраивает теневое дерево каждого <use> при перестилизации страницы, и с открытыми инструментами разработчика все иконки остаются пустыми до конца смены темы. data-icon называет иконку. Ready становится true, когда спрайт библиотеки скопирован. Sprite называет другой файл спрайта, рисуемый через <use>. Colored раскрашивает именованные части набора (sun, moon, cloud, rain, snow, bolt, wind, fog, thermometer в наборе погоды) цветами темы --elemenx-weather-*.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Size` | `16` |
| `Label` | `''` |
| `Sprite` | `''` |
| `Colored` | `false` |
| `Ready` | `false` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Icon Name="home" Size="24" />
	<Icon Name="settings" Size="24" />
	<Icon Name="heart" Size="24" Label="Liked" />
	<Icon Name="loader" Size="24" Spin="true" />
	<Icon Name="files:pdf" Size="32" />
	<Icon Name="brands:github" Size="32" Colored="true" />
	<Icon Name="weather:snow" Size="32" Colored="true" />
	<Icon Name="games:gamepad" Size="32" />
</div>
<div class="elemenx-container" style="gap: 12px; align-items: center;">
	<Field Label="An icon name" Hint="home, star-filled, files:zip, weather:sun..."><Input [value]="Name" (input)="Typed" /></Field>
	<Icon [name]="Name" Size="48" />
</div>
<script>
({
	Name: 'trophy',

	Typed: function (value) {
		this.Name = value;
	}
})
</script>
```

## Тесты

- [keeps the badge over an icon that changes by Elemenx.Icon or $Icon, and over the icon of the page brought back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L138) — `tests/regression/platform-icon.test.js`
- [in a program gives the windows the icon drawn into a PNG at every change of Elemenx.Icon, and the count and the progress to the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L207) — `tests/regression/platform-icon.test.js`
- [Elemenx.Icon sets the favicon (one for each scheme), brings back the icons of the page, and tells its listeners and those of the title](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title.test.js#L186) — `tests/regression/title.test.js`
- [puts an icon in the favicon, draws a count and a ring over it, and brings the icon of the page back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L99) — `tests/regression/platform-icon.test.js`
- [makes a favicon for a page that named none, takes it away on ResetIcon, and keeps an icon of each scheme](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L167) — `tests/regression/platform-icon.test.js`
- [on the web blinks the favicon and the title of a hidden page, and tells that the tray needs a program](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/platform-icon.test.js#L289) — `tests/regression/platform-icon.test.js`
