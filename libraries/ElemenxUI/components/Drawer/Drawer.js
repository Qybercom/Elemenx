/*
 * A panel that slides in from an edge of the window over the page (modal: the page behind is inert). Open shows it;
 * the close event (with the reason: 'close', 'escape' or 'backdrop') asks the owner to set Open back to false.
 * Side: right (default), left, top or bottom. Size: small, medium, large or full (the width, or the height for top and
 * bottom). Slots: default (the body), actions (beside the title), footer. Dismissible: false keeps it open on
 * Escape and backdrop presses, which shake it.
 */
Elemenx.Component('Drawer', {
	$TemplateURL: 'Drawer.html',
	$StyleURL: 'Drawer.css',
	$Meta: {
		Group: 'overlays',
		Icon: 'panel-left',
		Description: 'A panel that slides in from an edge of the window over the page (modal: the page behind is inert).',
		Container: true,
		Slots: ['actions', 'footer'],
		Events: {
			close: 'It asks to close (the owner sets Open to false): the reason, close, escape or backdrop.'
		},
		Props: {
			Open: 'Shows the drawer; its close event asks the owner to set it back to false.',
			Title: 'The title of the drawer.',
			Description: 'A text under the title.',
			Icon: 'An icon before the title.',
			Side: {Options: ['right', 'left', 'top', 'bottom'], Description: 'The edge it slides from: right, left, top or bottom.'},
			Size: {Options: ['small', 'medium', 'large', 'full'], Description: 'Its width (or height): small, medium, large or full.'},
			Closable: 'Shows the close button.',
			Dismissible: 'Escape and a press on the backdrop close it; false keeps it open.',
			Padded: 'Puts room around the body.'
		},
		Sample: {Title: 'Filters', Description: 'A drawer over the page', Icon: 'filter'}
	},
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
