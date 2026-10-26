<!-- generated -->
# CallInvite

Приглашение в звонок, как его показывает мессенджер: картинка и имя звонящего, вид звонка и кнопки — отклонить, принять, принять с камерой (Video). В карточке Native.Notify (Component CallInvite, Look elemenx, Bare, Priority high, Timeout 0, Sound с Loop) выбор берёт её Notification: событие notification с Action accept, accept-video или decline. Само по себе на странице — события accept ({Video}) и decline. Name, Image (URL картинки; без неё — аватар по имени), Text (вид звонка; по умолчанию «Входящий звонок»), Video.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Name` | `''` |
| `Image` | `''` |
| `Text` | `''` |
| `Video` | `false` |
| `Notification` | `null` |
