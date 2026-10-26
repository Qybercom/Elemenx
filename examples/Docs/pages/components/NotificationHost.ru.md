<!-- generated -->
# NotificationHost

Уведомления Приложения, нарисованные ElemenxUI (Native.Notify с Look elemenx): карточки Items ([{ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}], Progress, Duration, Component, Props, Bare}]), новые — ближе к углу, в окне у угла экрана в программе или в углу страницы в вебе (Page, Corner). Карточка с Duration показывает оставшееся время, которое стоит, пока над ней указатель (Hold(item), Release(item)); Progress (от 0 до 1) рисует полосу задачи. Карточка с Component держит компонент Приложения с его Props и Notification ({ID, Choose(action), Close()}) — например, приглашение в звонок (CallInvite); Bare убирает рамку карточки. More — сколько карточек сверх лимита. Choose(item, action) вызывается при нажатии на карточку (action — null) или на её кнопку, Close(item) — при нажатии на крестик. Рисует их тема: классы elemenx-notification и токены поверхности.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `More` | `0` |
| `Page` | `false` |
| `Corner` | `'bottom-right'` |
| `Choose` | `null` |
| `Close` | `null` |
| `Hold` | `null` |
| `Release` | `null` |
