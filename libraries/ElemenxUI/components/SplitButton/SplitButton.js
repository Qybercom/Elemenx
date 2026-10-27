/*
 * A button with a main action and an arrow beside it that opens a menu of the other actions (Save, and Save as,
 * Export... under the arrow). A press on the button emits click; an item of the menu emits select with the item, as in
 * Menu. Items, and the MenuItems declared inside it after them. Placement says where the menu opens (bottom-end by
 * default, under the arrow); Sheet shows it as a sheet from the bottom of the screen, as Menu does.
 */
Elemenx.Component('SplitButton', {
	$TemplateURL: 'SplitButton.html',
	$StyleURL: 'SplitButton.css',
	$Meta: {
		Group: 'buttons',
		Icon: 'chevron-down',
		Description: 'A button with a main action and an arrow beside it that opens a menu of the other actions.',
		Container: true,
		Children: ['MenuItem'],
		Events: {
			click: 'The main button was pressed.',
			select: 'An item of the menu was chosen: the item.'
		},
		Props: {
			Label: 'The text of the main button.',
			Icon: 'The icon of the main button.',
			Items: 'The items of the menu: [{ID, Label, Icon, Shortcut, Disabled, Danger, Items, Separator}].',
			Variant: 'The look of both buttons, as in Button.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Placement: {Options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'], Description: 'Where the menu opens.'},
			Sheet: 'Shows the menu as a sheet from the bottom: true, or auto on a narrow or a touch screen.',
			Loading: 'Shows that the main action runs; the main button takes no press.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Open: 'Shows the menu.'
		},
		Sample: {Label: 'Save', Icon: 'save', Variant: 'primary', Items: [{ID: 'copy', Label: 'Save a copy'}, {ID: 'export', Label: 'Export'}]}
	},
	Label: '',
	Icon: '',
	Items: [],
	Variant: 'primary',
	Size: 'medium',
	Placement: 'bottom-end',
	Sheet: false,
	Loading: false,
	Disabled: false,
	Open: false,
	Declared: [],

	/* The items its MenuItems declare, after Items; they follow the template as it changes. */
	$OnReady: function () {
		var self = this;

		this.Unwatch = this.$Service('Menus').Watch(this.$Element().querySelector('.elemenx-split-button-sources'), function (items) {
			self.Declared = items;
		});
	},

	Pressed: function () {
		this.Open = false;

		this.$Emit('click');
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

	/* The focus goes back to the arrow; the owner may take the button away in its select. */
	Picked: function (item) {
		var arrow = this.Arrow();

		this.Open = false;

		this.$Service('Menus').Pick(item);

		this.$Emit('select', item);

		if (arrow && arrow.isConnected)
			arrow.focus();
	},

	Close: function (reason) {
		var arrow = this.Arrow();

		this.Open = false;

		if (arrow && (reason === 'escape' || reason === 'back'))
			arrow.focus();
	},

	Arrow: function () {
		return this.$Element() ? this.$Element().querySelector('.elemenx-split-button-arrow') : null;
	},

	$OnDestroy: function () {
		if (this.Unwatch)
			this.Unwatch();
	}
});
