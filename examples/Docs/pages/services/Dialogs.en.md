<!-- generated -->
# Dialogs

Confirmations and alerts from the code, shown by a DialogHost (place one in the layout of the Application): a modal Dialog without one of its own in a template. Confirm(options, callback) shows a dialog and calls back (id): the ID of the action pressed, or null when it was dismissed (Escape, the backdrop, the close button). It returns the ID of the dialog. Options:

- Title, Message, Icon;
- Actions: [{ID, Label, Variant}], Cancel and OK by default; Variant: danger paints OK as a dangerous action;
- Dismissible: false asks for one of the actions: Escape and the backdrop only shake the dialog, which has no close button.

Alert(options, callback) has one action, OK. A string is the Message of the options. Close(id, action) closes a dialog from the code and calls back with action. OnChange(callback)/OffChange(callback) report the list.

## Methods

- `Confirm(options, callback)`
- `Alert(options, callback)`
- `Close(id, action)`
- `OnChange(callback)`
- `OffChange(callback)`

## Example

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

## Tests

- [DialogHost shows the dialogs of the Dialogs Service, and an action pressed closes one with its ID](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L250) — `tests/regression/library-overlays.test.js`
- [Dialogs: a confirmation and an alert in the list, closed with the action pressed or with none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L157) — `tests/regression/library-services.test.js`
- [a dialog that needs an answer shakes on Escape and the backdrop; Dialogs asks from the code](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4458) — `tests/examples/ui-kit.spec.js`
