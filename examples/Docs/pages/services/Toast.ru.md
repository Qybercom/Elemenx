<!-- generated -->
# Toast

Уведомления, которые показывает ToastHost (поставьте его в раскладку приложения). Show(options) возвращает ID уведомления. Параметры:

- Title, Message, Variant (info, success, warning, danger), Icon (имя или false — без иконки), Class (дополнительные классы);
- AutoHide и Duration (миллисекунды): уведомление закрывается само, если AutoHide не false и Duration не 0;
- Actions: [{Label, Run, Variant}] (Action — одно из них); Closable: false скрывает кнопку закрытия;
- Element (узел DOM, например элемент компонента) или Render(container, toast) для своего содержимого.

Configure({Duration, AutoHide, Limit}) меняет значения по умолчанию. Dismiss(id), Clear(); Pause(id) и Resume(id) останавливают таймер, пока на уведомление наведён указатель или оно в фокусе. OnChange(callback)/OffChange(callback) сообщают список.

## Методы

- `Configure(options)`
- `Show(options)`
- `Dismiss(id)`
- `Clear()`
- `Pause(id)`
- `Resume(id)`
- `OnChange(callback)`
- `OffChange(callback)`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Success" Variant="primary" (click)="Success" />
	<Button Label="Stays until closed" (click)="Sticky" />
	<Button Label="With actions" (click)="Actions" />
	<Button Label="Clear all" Variant="ghost" (click)="Clear" />
</div>
<script>
({
	Success: function () {
		this.$Service('Toast').Show({Title: 'Saved', Message: 'The document is saved.', Variant: 'success'});
	},

	Sticky: function () {
		this.$Service('Toast').Show({Title: 'Offline', Message: 'Changes wait for the network.', Variant: 'warning', AutoHide: false});
	},

	Actions: function () {
		var toast = this.$Service('Toast');

		toast.Show({
			Message: 'A new version is ready.',
			Icon: 'download',
			Actions: [
				{Label: 'Later'},
				{Label: 'Reload', Variant: 'primary', Run: function () {
					toast.Show({Message: 'Reloading... (not really)', Variant: 'info'});
				}}
			]
		});
	},

	Clear: function () {
		this.$Service('Toast').Clear();
	}
})
</script>
```
