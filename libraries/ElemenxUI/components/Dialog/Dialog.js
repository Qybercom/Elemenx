/*
 * A modal dialog. Open shows it; the close event (with the reason: 'close', 'escape' or 'backdrop') asks the owner
 * to set Open back to false. Slots: default (the body), footer (the actions). Size: small, medium, large or full.
 * Dismissible: false keeps it open on Escape and backdrop presses, which shake it (for flows that need an explicit answer).
 */
Elemenx.Component('Dialog', {
	$TemplateURL: 'Dialog.html',
	$StyleURL: 'Dialog.css',
	$Meta: {
		Group: 'overlays',
		Icon: 'layout',
		Description: 'A modal dialog.',
		Container: true,
		Slots: ['footer'],
		Events: ['close'],
		Props: {
			Open: 'Shows the dialog; its close event asks the owner to set it back to false.',
			Title: 'The title of the dialog.',
			Description: 'A text under the title.',
			Icon: 'An icon before the title.',
			Size: {Options: ['small', 'medium', 'large', 'full'], Description: 'Its size: small, medium or large.'},
			Closable: 'Shows the close button.',
			Dismissible: 'Escape and a press on the backdrop close it; false keeps it open.',
			Padded: 'Puts room around the body.'
		},
		Sample: {Title: 'Project settings', Description: 'Changes apply to every member.', Icon: 'settings'}
	},
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
		if (this.Dismissible) this.$Emit('close', event.detail.Reason);
		else this.Refuse();
	},

	/* Escape or the backdrop would close it, but it waits for an answer: it shakes. */
	Refuse: function () {
		var element = this.$Element();

		element.classList.remove('refused');
		element.getBoundingClientRect();
		element.classList.add('refused');

		window.clearTimeout(this.Refusal);

		this.Refusal = window.setTimeout(function () {
			element.classList.remove('refused');
		}, 600);
	}
});