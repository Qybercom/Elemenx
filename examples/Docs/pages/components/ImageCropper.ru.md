<!-- generated -->
# ImageCropper

Часть картинки, которую нужно оставить: рамка над Src, которую указатель двигает (внутри неё) и меняет в размере (за углы и стороны), а стрелки двигают (с Shift — меняют размер). Aspect сохраняет форму рамки (1 — квадрат, 16 / 9, 0 — свободная); Round показывает её кругом (аватар). Value — рамка в пикселях картинки, {X, Y, Width, Height} (по умолчанию самая большая рамка своей формы посередине, не меньше MinSize); change отправляет её после каждого перемещения. Image(type, quality, width) возвращает эту часть как data URL картинки (image/png, а width масштабирует её); картинке другого сайта для этого нужен CORS. Height — высота поля; картинка вписывается в него.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Src` | `''` |
| `Value` | `null` |
| `Aspect` | `0` |
| `Round` | `false` |
| `MinSize` | `32` |
| `Height` | `320` |
| `Disabled` | `false` |
| `Label` | `''` |

## События

- `load`: Картинка загрузилась: {Width, Height}.
- `change`: Рамка сдвинулась или изменила размер: Value.

## Методы

- `Image(type, quality, width)`

## Пример

```example
<ImageCropper [src]="Picture" Aspect="1" Round="true" Height="260" (change)="Cropped" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Picture: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="480" height="320" fill="#5f7d95"/><circle cx="240" cy="140" r="70" fill="#f2c79a"/><rect x="150" y="220" width="180" height="100" rx="60" fill="#3b4a5a"/></svg>'),
	Note: 'Move the circle, or pull its handles.',

	Cropped: function (value) {
		this.Note = 'From ' + value.X + ', ' + value.Y + ': ' + value.Width + ' by ' + value.Height + ' pixels';
	}
})
</script>
```
