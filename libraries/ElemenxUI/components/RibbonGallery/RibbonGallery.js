/*
 * A gallery of a RibbonGroup: a strip of samples (styles, layouts, colors) that scrolls row by row, and a button that
 * shows all of them. Items: [{ID, Label, Icon, Preview, Style}]; a sample shows its Icon, or Preview (or its Label)
 * in its Style ('font-weight: 700; color: #b4483f'). Value is the chosen ID; Columns the samples in a row of the strip.
 * Events: select ({ID, Item}); the Ribbon reports it as command ({ID: the ID of the gallery, Item}).
 */
Elemenx.Component('RibbonGallery', {
	$TemplateURL: 'RibbonGallery.html',
	ID: '',
	Label: 'Gallery',
	Items: [],
	Value: null,
	Columns: 4,
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
