<!-- generated -->
# ToastHost

Shows the toasts of the Toast Service: place one in the layout of the Application. Placement: bottom-right (the default), bottom-left, top-right, top-left, top or bottom. A toast closes by itself after its Duration, and its timer pauses while the pointer or the focus is on it; the newest is nearest the edge.

## Properties

| Property | Default |
| --- | --- |
| `Placement` | `'bottom-right'` |

## Example

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

## Tests

- [ToastHost shows the toasts of the Toast Service, runs an action, and lets one go by its close button](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L273) — `tests/regression/library-overlays.test.js`
