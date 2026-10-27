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

## Пример

```example
<Button Label="Notify" Icon="bell" Variant="primary" (click)="Add" />
<Button Label="Clear" Variant="ghost" (click)="Clear" />
<NotificationHost Page="true" Corner="bottom-right" [items]="Items" [choose]="Choose" [close]="Close" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'The cards are in the corner of the page: Native.Notify with Look elemenx shows them so on the web, and by the corner of the screen in a program.',
	Count: 0,
	Items: [],

	$OnCreate: function () {
		var self = this;

		this.Choose = function (item, action) {
			self.Note = item.Title + ': ' + (action ? action.Label || action.ID : 'the card');
		};

		this.Close = function (item) {
			self.Items = self.Items.filter(function (each) {
				return each.ID !== item.ID;
			});
		};
	},

	Clear: function () {
		this.Items = [];
	},

	Add: function () {
		this.Count++;
		this.Items = [this.Count % 2 ? {ID: 'mail-' + this.Count, Title: 'New mail', Text: 'Ada sent the report.', Icon: 'mail', Actions: [{ID: 'open', Label: 'Open'}]} : {ID: 'task-' + this.Count, Title: 'Upload ' + this.Count, Text: 'photos.zip', Icon: 'upload', Progress: 0.4}].concat(this.Items);
	}
})
</script>
```
