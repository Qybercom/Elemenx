/*
 * A button that opens a multi-level MenuList. Items, and the items its MenuItem children declare after them (a
 * MenuItem with MenuItems inside is a submenu). The select event carries the chosen leaf item (a declared one emits
 * select on its MenuItem too). Sheet: true, or 'auto' (on a narrow or a touch screen), shows the list as a sheet from
 * the bottom of the screen, as on a phone.
 *
 * Menu is the button and the menu it opens; MenuList is one level of a menu alone (the list, its submenus, its sheet):
 * Menu, ContextMenu and the Ribbon are made of it, and it can be placed under any element of your own.
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
	Declared: [],

	/* The items its MenuItems declare, after Items; they follow the template as it changes. */
	$OnReady: function () {
		var self = this;

		this.Unwatch = this.$Service('Menus').Watch(this.$Element().querySelector('.elemenx-menu-sources'), function (items) {
			self.Declared = items;
		});
	},

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

		this.$Service('Menus').Pick(item);

		this.$Emit('select', item);

		this.$Element().querySelector('.elemenx-button').focus();
	},

	Close: function (reason) {
		this.Open = false;

		if (reason === 'escape' || reason === 'back')
			this.$Element().querySelector('.elemenx-button').focus();
	},

	$OnDestroy: function () {
		if (this.Unwatch)
			this.Unwatch();
	}
});
