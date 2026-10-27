<!-- generated -->
# GameMinimap

Рамка миникарты: карта в слоте по умолчанию (картинка, canvas), круглая или квадратная (Shape), шириной Size пикселей. Маркеры Markers [{ID, X, Y, Kind, Icon, Label, Color}] стоят в X и Y от 0 до 1 поверх карты (Kind quest, enemy, ally или point — для цвета); маркер вне карты ждёт на её краю и указывает направление. Игрок — стрелка в центре, повёрнутая на Heading градусов (Player false скрывает её); North ставит на рамку букву N. Title (место) и Note (координаты, время) — на полосе под картой. Zoomable добавляет кнопки + и −. События: zoom (1 или −1), marker (нажатый маркер).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Shape` | `'round'` |
| `Size` | `160` |
| `Markers` | `[]` |
| `Heading` | `0` |
| `Player` | `true` |
| `North` | `true` |
| `Title` | `''` |
| `Note` | `''` |
| `Zoomable` | `false` |
| `Label` | `''` |

## События

- `marker`: Нажата метка: сама метка.
- `zoom`: Нажата кнопка масштаба: 1 (ближе) или -1 (дальше).

## Слоты

по умолчанию

## Пример

```example
<GameMinimap Size="160" Title="Northern woods" [note]="'412, 88 · ×' + Zoom" [markers]="Markers" Heading="35" Zoomable="true" (zoom)="Zoomed" (marker)="Chose"><img src="/data/cards/mountains.svg" alt="" [style.transform]="'scale(' + (1 + Zoom * 0.25) + ')'" /></GameMinimap>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Zoom: 2,
	Note: 'Press a marker; zoom with the buttons.',
	Markers: [
		{ID: 'elder', X: 0.3, Y: 0.35, Kind: 'quest', Label: 'The elder'},
		{ID: 'wolf', X: 0.7, Y: 0.6, Kind: 'enemy', Label: 'Grey wolf'},
		{ID: 'mira', X: 0.45, Y: 0.72, Kind: 'ally', Label: 'Mira'},
		{ID: 'pass', X: 0.95, Y: -0.2, Kind: 'quest', Label: 'The pass'}
	],

	Zoomed: function (step) {
		this.Zoom = Math.max(1, Math.min(4, this.Zoom + step));
	},

	Chose: function (marker) {
		this.Note = 'Marker: ' + marker.Label;
	}
})
</script>
```
