/*
 * Shows the confirmations and alerts of the Dialogs Service, one modal Dialog each, the last one on top: place one in
 * the layout of the Application. Escape and a press on the backdrop dismiss a dialog unless it is not Dismissible.
 */
Elemenx.Component('DialogHost', {
	$TemplateURL: 'DialogHost.html',
	$StyleURL: 'DialogHost.css',
	Items: [],

	$OnCreate: function () {
		var self = this;
		var dialogs = this.$Service('Dialogs');

		this.Items = dialogs.Items.slice();

		this.Listener = dialogs.OnChange(function (items) {
			self.Items = items;
		});
	},

	$OnDestroy: function () {
		this.$Service('Dialogs').OffChange(this.Listener);
	},

	Act: function (event, node) {
		this.$Service('Dialogs').Close(node.closest('.elemenx-dialog-host-item').getAttribute('data-id'), node.getAttribute('data-action'));
	},

	/* Only the dialog on top can be dismissed: the ones below are inert. */
	Dismissed: function () {
		var items = this.Items;
		if (items.length)
			this.$Service('Dialogs').Close(items[items.length - 1].ID, null);
	}
});
