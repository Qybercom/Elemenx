<!-- generated -->
# DialogHost

Показывает подтверждения и предупреждения сервиса Dialogs, каждое — модальным Dialog, последнее сверху: поставьте его в раскладку приложения. Escape и нажатие на фон закрывают диалог, если он не помечен как Dismissible: false.

## Пример

```example
<Button Label="Confirm" Variant="danger" (click)="Confirm" />
<Button Label="Alert" (click)="Alert" />
<span class="elemenx-text small muted">{{Note}}</span>
<script>
({
	Note: 'The DialogHost of this reference is in its layout.',

	Confirm: function () {
		var self = this;

		this.$Service('Dialogs').Confirm({
			Title: 'Delete the project?',
			Message: 'Its files and its history go for good.',
			Icon: 'delete',
			Variant: 'danger'
		}, function (action) {
			self.Note = 'Answer: ' + (action || 'dismissed');
		});
	},

	Alert: function () {
		this.$Service('Dialogs').Alert('The build is complete.');
	}
})
</script>
```
