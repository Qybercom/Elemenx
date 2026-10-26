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

`pin`
