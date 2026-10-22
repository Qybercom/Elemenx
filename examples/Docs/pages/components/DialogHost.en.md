<!-- generated -->
# DialogHost

Shows the confirmations and alerts of the Dialogs Service, one modal Dialog each, the last one on top: place one in the layout of the Application. Escape and a press on the backdrop dismiss a dialog unless it is not Dismissible.

## Example

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
