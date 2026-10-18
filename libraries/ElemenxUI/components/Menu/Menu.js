/*
 * A button that opens a multi-level MenuList. The select event carries the chosen leaf item. Sheet: true, or 'auto'
 * (on a narrow or a touch screen), shows the list as a sheet from the bottom of the screen, as on a phone.
 */
Elemenx.Component('Menu', {
	$TemplateURL: 'Menu.html',
	$StyleURL: 'Menu.css',
	Items: [],
	Label: '',
	Icon: '',
	Title: '',
	Variant: 'secondary',
	Size: 'medium',
	Placement: 'bottom-start',
	Sheet: false,
	Disabled: false,
	Open: false,

	Toggle: function () {
		var root = this.$Element();

		this.Open = !this.Open;

		if (!this.Open) return;

		/* The list becomes visible after the update of the MenuList, so the first item is focused on the next task. */
		window.setTimeout(function () {
			var first = root.querySelector('.elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option:not(.disabled)');
			if (first)
				first.focus();
		}, 0);
	},

	Picked: function (item) {
		this.Open = false;

		this.$Emit('select', item);

		this.$Element().querySelector('.elemenx-button').focus();
	},

	Close: function (reason) {
		this.Open = false;

		if (reason === 'escape' || reason === 'back')
			this.$Element().querySelector('.elemenx-button').focus();
	}
});