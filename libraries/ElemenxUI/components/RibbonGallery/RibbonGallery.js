/*
 * A gallery of a RibbonGroup: a strip of samples (styles, layouts, colors) that scrolls row by row, and a button that
 * shows all of them. Items: [{ID, Label, Icon, Preview, Style, Hint}]; a sample shows its Icon, or Preview (or its
 * Label) in its Style ('font-weight: 700; color: #b4483f'); its tooltip is its Label and its Hint. Value is the chosen ID; Columns the samples in a row of the strip.
 * Labels writes the Label of each sample under it in the strip too. Drag names a type of drags (*draggable): a sample
 * pulled away is dragged with its ID as the Data, to where a *droppable of that type takes it (a canvas, a list).
 * Events: select ({ID, Item}); the Ribbon reports it as command ({ID: the ID of the gallery, Item}).
 */
Elemenx.Component('RibbonGallery', {
	$TemplateURL: 'RibbonGallery.html',
	$Meta: {
		Group: 'navigation',
		Icon: 'menu',
		Description: 'A gallery of a RibbonGroup: a strip of samples (styles, layouts, colors) that scrolls row by row, and a button that shows all of them.',
		Events: ['select'],
		Props: {
			ID: 'The ID of the gallery, in the command.',
			Label: 'The name of the gallery.',
			Items: 'The samples: [{ID, Label, Icon, Preview, Style, Hint}].',
			Value: 'The ID of the sample chosen.',
			Columns: 'How many samples in a row of the strip.',
			Labels: 'Writes the label of each sample under it in the strip.',
			Drag: 'A type of drags (*draggable): the samples are dragged with their ID as the Data.'
		},
		Sample: {ID: 'style', Label: 'Styles', Columns: 3}
	},
	ID: '',
	Label: '',
	Items: [],
	Value: null,
	Columns: 4,
	Labels: false,
	Drag: '',
	KeyTip: '',
	Open: false,

	Choose: function (event, node) {
		var id = node.getAttribute('data-id');
		var item = this.Items.filter(function (entry) {
			return String(entry.ID) === id;
		})[0] || null;

		this.Value = item ? item.ID : id;
		this.Open = false;

		this.$Emit('select', {ID: this.Value, Item: item});

		this.$Element().dispatchEvent(new CustomEvent('elemenx-ribbon-command', {bubbles: true, detail: {ID: this.ID, Item: item}}));
	},

	Step: function (direction) {
		var strip = this.$Element().querySelector('.elemenx-ribbon-gallery-items');
		var item = strip.querySelector('.elemenx-ribbon-gallery-item');
		if (item)
			strip.scrollTop += direction * item.offsetHeight;
	},

	Up: function () {
		this.Step(-1);
	},

	Down: function () {
		this.Step(1);
	},

	More: function () {
		var root = this.$Element();

		this.Open = !this.Open;

		if (!this.Open) return;

		window.setTimeout(function () {
			var item = root.querySelector('.elemenx-ribbon-gallery-popup .elemenx-ribbon-gallery-item.selected') || root.querySelector('.elemenx-ribbon-gallery-popup .elemenx-ribbon-gallery-item');
			if (item)
				item.focus();
		}, 0);
	},

	Dismissed: function (event) {
		this.Open = false;

		if (event && event.detail && event.detail.Reason === 'escape')
			this.$Element().querySelector('.elemenx-ribbon-gallery-more').focus();
	}
});
