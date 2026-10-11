/*
 * A modal dialog. Open shows it; the close event (with the reason: 'close', 'escape' or 'backdrop') asks the owner
 * to set Open back to false. Slots: default (the body), footer (the actions). Size: small, medium, large or full.
 * Dismissible: false keeps it open on Escape and backdrop presses (for flows that need an explicit answer).
 */
Elemenx.Component('Dialog', {
	$TemplateURL: 'Dialog.html',
	$StyleURL: 'Dialog.css',
	Open: false,
	Title: '',
	Description: '',
	Icon: '',
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