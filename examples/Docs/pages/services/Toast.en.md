<!-- generated -->
# Toast

Notifications shown by a ToastHost (place one in the layout of the Application). Show(options) returns the ID of the toast. Options:

- Title, Message, Variant (info, success, warning, danger), Icon (a name, or false for none), Class (extra classes);
- AutoHide and Duration (milliseconds): the toast closes by itself unless AutoHide is false or Duration is 0;
- Actions: [{Label, Run, Variant}] (Action: one of them); Closable: false hides the close button;
- Element (a DOM node, for example the element of a Component) or Render(container, toast) for custom content.

Configure({Duration, AutoHide, Limit}) changes the defaults. Dismiss(id), Clear(); Pause(id) and Resume(id) hold the timer while the toast is hovered or focused. OnChange(callback)/OffChange(callback) report the list.

## Methods

- `Configure(options)`
- `Show(options)`
- `Dismiss(id)`
- `Clear()`
- `Pause(id)`
- `Resume(id)`
- `OnChange(callback)`
- `OffChange(callback)`

## Example

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

## Tests

- [ToastHost shows the toasts of the Toast Service, runs an action, and lets one go by its close button](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L273) — `tests/regression/library-overlays.test.js`
- [takes the Library Services, Directives and Guards the Application names, and the ones they name](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L303) — `tests/regression/builder-multi-application.test.js`
- [knows the Components, Services and Directives of the Libraries and of the project](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L46) — `tests/regression/language-server.test.js`
- [completes the tags, props, bindings, events, directives and options of a template, and the fields of its Component](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L63) — `tests/regression/language-server.test.js`
- [tells of a Component, a prop, a directive and a Service on hover, and finds their definitions](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/language-server.test.js#L89) — `tests/regression/language-server.test.js`
