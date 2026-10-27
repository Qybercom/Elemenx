<!-- generated -->
# CallTile

Плитка участника звонка: его видео или аватар, пока камера выключена. Видео — Stream (MediaStream в <video> плитки) или Element (свой элемент, например <video> другого медиа-слоя). Name, Image (картинка аватара), Muted (микрофон выключен), Camera (включена по умолчанию), Speaking (рамка, пока говорит; Level от 0 до 1 — рамка дышит с голосом), Quality (good, fair или poor — полоски связи), Hand (поднята рука), Pinned, Self (своё видео, зеркально), Screen (показанный экран — видео целиком). Двойной клик или кнопка булавки — событие pin ({Pinned, Name}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Image` | `''` |
| `Stream` | `null` |
| `Element` | `null` |
| `Muted` | `false` |
| `Camera` | `true` |
| `Speaking` | `false` |
| `Level` | `0` |
| `Quality` | `''` |
| `Hand` | `false` |
| `Pinned` | `false` |
| `Self` | `false` |
| `Screen` | `false` |

## События

- `pin`: Кнопка закрепления или двойное нажатие: {Pinned, Name}, запрошенное состояние.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 12px;">
	<div style="width: 240px; height: 160px;"><CallTile Name="Ada Lovelace" Camera="false" Speaking="true" Level="0.6" Quality="good" [pinned]="Pinned" (pin)="Pin" /></div>
	<div style="width: 240px; height: 160px;"><CallTile Name="Alan Turing" Camera="false" Muted="true" Hand="true" Quality="poor" /></div>
</div>
<script>
({
	Pinned: false,

	Pin: function (event) {
		this.Pinned = event.Pinned;
	}
})
</script>
```
