<!-- generated -->
# ToastHost

Показывает уведомления сервиса Toast: поставьте его в раскладку приложения. Placement: bottom-right (по умолчанию), bottom-left, top-right, top-left, top или bottom. Уведомление закрывается само по истечении своего Duration, а его таймер останавливается, пока на нём указатель или фокус; новейшее — ближе всего к краю.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Placement` | `'bottom-right'` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Label="Info" (click)="Info" />
	<Button Label="Success" Variant="primary" (click)="Success" />
	<Button Label="With an action" (click)="Action" />
</div>
<p class="elemenx-text small muted">The ToastHost of this reference is in its layout, at the bottom right.</p>
<script>
({
	Info: function () {
		this.$Service('Toast').Show({Title: 'Sync', Message: 'The files are synced.', Variant: 'info'});
	},

	Success: function () {
		this.$Service('Toast').Show({Title: 'Saved', Message: 'The document is saved.', Variant: 'success'});
	},

	Action: function () {
		var toast = this.$Service('Toast');

		toast.Show({
			Title: 'Deleted',
			Message: 'The file went to the bin.',
			Variant: 'warning',
			Actions: [{Label: 'Undo', Run: function () {
				toast.Show({Message: 'Restored', Variant: 'success'});
			}}]
		});
	}
})
</script>
```

## Тесты

- [ToastHost shows the toasts of the Toast Service, runs an action, and lets one go by its close button](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L273) — `tests/regression/library-overlays.test.js`
