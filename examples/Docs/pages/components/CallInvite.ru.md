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

## Пример

```example
<div style="max-width: 360px;">
	<CallInvite Name="Grace Hopper" Video="true" (accept)="Accepted" (decline)="Declined" />
</div>
<p class="elemenx-text small muted">{{Answer}}</p>
<script>
({
	Answer: 'Waiting for an answer',

	Accepted: function (event) {
		this.Answer = event.Video ? 'Accepted with the camera' : 'Accepted';
	},

	Declined: function () {
		this.Answer = 'Declined';
	}
})
</script>
```

## Тесты

- [draws a card of a Component of its own, as an invitation to a call: over the limit, its sound until it goes, its choice told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-notify.test.js#L284) — `tests/regression/native-notify.test.js`
