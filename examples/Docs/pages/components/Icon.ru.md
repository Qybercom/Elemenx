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
