<!-- generated -->
# Dialogs

Подтверждения и предупреждения из кода, которые показывает DialogHost (поставьте его в раскладку приложения): модальный Dialog без собственного в шаблоне. Confirm(options, callback) показывает диалог и вызывает callback (id): ID нажатого действия или null, если диалог закрыли (Escape, фон, кнопка закрытия). Возвращает ID диалога. Параметры:

- Title, Message, Icon;
- Actions: [{ID, Label, Variant}], по умолчанию «Отмена» и «ОК»; Variant: danger рисует ОК как опасное действие;
- Dismissible: false требует выбрать одно из действий: Escape и фон лишь встряхивают диалог, у которого нет кнопки закрытия.

Alert(options, callback) имеет одно действие — ОК. Строка — это Message параметров. Close(id, action) закрывает диалог из кода и вызывает callback с action. OnChange(callback)/OffChange(callback) сообщают список.

## Методы

- `Confirm(options, callback)`
- `Alert(options, callback)`
- `Close(id, action)`
- `OnChange(callback)`
- `OffChange(callback)`

## Пример

```example
<Button Label="Confirm" Variant="danger" (click)="Confirm" />
<Button Label="Three actions" (click)="Choose" />
<Button Label="Alert" Variant="ghost" (click)="Alert" />
<span class="elemenx-text small muted">{{Note}}</span>
<script>
({
	Note: '',

	Confirm: function () {
		var self = this;

		this.$Service('Dialogs').Confirm({Title: 'Delete the project?', Message: 'Its files go for good.', Icon: 'delete', Variant: 'danger'}, function (action) {
			self.Note = 'Answer: ' + (action || 'dismissed');
		});
	},

	Choose: function () {
		var self = this;

		this.$Service('Dialogs').Confirm({
			Title: 'Unsaved changes',
			Message: 'Save them before closing?',
			Dismissible: false,
			Actions: [{ID: 'discard', Label: 'Discard', Variant: 'danger'}, {ID: 'cancel', Label: 'Cancel'}, {ID: 'save', Label: 'Save', Variant: 'primary'}]
		}, function (action) {
			self.Note = 'Answer: ' + action;
		});
	},

	Alert: function () {
		this.$Service('Dialogs').Alert('The build is complete.');
	}
})
</script>
```
