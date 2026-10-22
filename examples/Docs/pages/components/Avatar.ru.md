<!-- generated -->
# Avatar

Изображение человека, команды или продукта. Image показывает картинку; без неё или если она не загрузилась, аватар строится из Name (или Seed): Generate initials (первые буквы двух первых слов или свои Initials — логотип из букв), pattern (симметричная фигура из клеток пять на пять, как у пользователей хостингов кода) или shapes (абстрактная композиция из кругов, квадратов и треугольников) — всегда одинаковый для одного имени, в цвете этого имени; Color задаёт свой цвет. Shape: circle, rounded или square; Size: small, medium, large, xlarge или число пикселей. Status ставит в угол точку Presence (online, away, busy, dnd, offline, connecting).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Image` | `''` |
| `Initials` | `''` |
| `Generate` | `'initials'` |
| `Seed` | `''` |
| `Color` | `''` |
| `Shape` | `'circle'` |
| `Size` | `'medium'` |
| `Status` | `''` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Avatar Name="Ada Lovelace" Status="online" Size="large" />
	<Avatar Name="Alan Turing" Generate="pattern" Size="large" />
	<Avatar Name="Grace Hopper" Generate="shapes" Size="large" Status="away" />
	<Avatar Initials="EX" Shape="rounded" Size="large" Color="#3f6c9e" />
	<Avatar Name="Mountains" Image="/data/cards/mountains.svg" Size="large" />
	<Avatar Name="Broken image" Image="/data/missing.png" Size="large" />
</div>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Avatar Name="Ada Lovelace" Size="small" />
	<Avatar Name="Ada Lovelace" Size="medium" />
	<Avatar Name="Ada Lovelace" Size="large" />
</div>
<p class="elemenx-text small muted">The initials take a color of the name; an image that does not load falls back to them.</p>
```
