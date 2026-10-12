/*
 * A panel that slides in from an edge of the window over the page (modal: the page behind is inert). Open shows it;
 * the close event (with the reason: 'close', 'escape' or 'backdrop') asks the owner to set Open back to false.
 * Side: right (default), left, top or bottom. Size: small, medium, large or full (the width, or the height for top and
 * bottom). Slots: default (the body), actions (beside the title), footer. Dismissible: false keeps it open on
 * Escape and backdrop presses.
 */
Elemenx.Component('Drawer', {
	$TemplateURL: 'Drawer.html',
	$StyleURL: 'Drawer.css',
	Open: false,
	Title: '',
	Description: '',
	Icon: '',
	Side: 'right',
	Size: 'medium',
	Closable: true,
	Dismissible: true,
	Padded: true,

	Close: function () {
		this.$Emit('close', 'close');
	},

	Dismissed: function (event) {
		if (this.Dismissible)
			this.$Emit('close', event.detail.Reason);
	}
});
