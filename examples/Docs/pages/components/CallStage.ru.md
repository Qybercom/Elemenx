<!-- generated -->
# CallStage

Сцена видеозвонка; сами медиа — дело Приложения. Слоты: main (видео впереди: докладчик, показанный экран), participants (их CallTile), self (своё видео в углу поверх сцены; перетаскивается в другой угол — событие corner), controls (CallControls), side (боковая панель: чат, участники; видна при Side), status (время, запись). Layout: grid (столько колонок, сколько нужно плиткам; больше PerPage — страницы: Page, кнопки по бокам, событие page), speaker (main крупно, участники полосой под ним) или screen (main крупно, участники колонкой сбоку).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Layout` | `'grid'` |
| `Side` | `false` |
| `PerPage` | `0` |
| `Page` | `0` |

## События

`page`, `corner`

## Слоты

`status`, `main`, `participants`, `self`, `side`, `controls`
