/*
 * A bar of menus, as at the top of the window of a program: File, Edit, View... Items are the menus ([{ID, Label,
 * Icon, Disabled, Items}]), then the ones its MenuItem children declare (a MenuItem with MenuItems inside is a menu of
 * the bar, its MenuItems the items of that menu). It behaves as the bar of a program: while a menu is open, the
 * pointer on another one opens that one in its place; the left and right arrows go from menu to menu (and between the
 * buttons of the closed bar), the down arrow opens one; F10, or Alt pressed alone, takes the first bar of the page to
 * its first menu and gives the focus back. Caret shows the arrow of a menu by its label (none by default, as in a
 * program). The select event carries the chosen leaf item (a declared one emits select on its MenuItem too).
 */
Elemenx.Component('MenuBar', {
	$TemplateURL: 'MenuBar.html',
	$StyleURL: 'MenuBar.css',
	$Meta: {
		Group: 'buttons',
		Icon: 'menu',
		Description: 'A bar of menus, as at the top of the window of a program: File, Edit, View...',
		Container: true,
		Children: ['MenuItem'],
		Events: ['select'],
		Props: {
			Items: 'The menus: [{ID, Label, Icon, Disabled, Items}], the items of each as in Menu.',
			Variant: 'The look of its buttons, as in Button.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Caret: 'Shows the arrow of a menu by its label.',
			Disabled: 'Turns it off: it takes no input and looks so.'
		},
		Sample: {Items: [{Label: 'File', Items: [{ID: 'new', Label: 'New'}, {ID: 'open', Label: 'Open...'}]}, {Label: 'Edit', Items: [{ID: 'copy', Label: 'Copy'}, {ID: 'paste', Label: 'Paste'}]}, {Label: 'Help', Items: [{ID: 'about', Label: 'About'}]}]}
	},
	Items: [],
	Variant: 'ghost',
	Size: 'small',
	Caret: false,
	Disabled: false,
	Open: -1,
	Declared: [],

	$OnCreate: function () {
		/* The menus of the bar: Items, then the declared ones; a separator or a group has no place in a bar. */
		this.Menus = function (items, declared) {
			return (items || []).concat(declared || []).filter(function (item) {
				return item && !item.Separator && !item.Group;
			});
		};
	},

	/* The menus its MenuItems declare, as the template changes; F10 and Alt alone on its document. */
	$OnReady: function () {
		var self = this;
		var element = this.$Element();
		/* The document of the element; an element still in the inert document of its template is for the page. */
		var owner = element.ownerDocument && element.ownerDocument.defaultView ? element.ownerDocument : document;
		var alone = false;

		this.Unwatch = this.$Service('Menus').Watch(element.querySelector('.elemenx-menu-bar-sources'), function (items) {
			self.Declared = items;
		});

		this.Keys = function (event) {
			var first = owner.querySelector('.elemenx-menu-bar');

			if (event.type === 'keydown') {
				alone = event.key === 'Alt' && !event.repeat && !event.ctrlKey && !event.shiftKey && !event.metaKey;

				if (event.key === 'F10' && !event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey && first === element.firstElementChild) {
					event.preventDefault();

					self.Take();
				}

				return;
			}

			if (event.key !== 'Alt' || !alone || first !== element.firstElementChild) return;

			alone = false;

			event.preventDefault();

			self.Take();
		};

		owner.addEventListener('keydown', this.Keys);
		owner.addEventListener('keyup', this.Keys);

		this.Owner = owner;
	},

	/* The index of the menu a node is part of. */
	Index: function (node) {
		var entry = node && node.closest ? node.closest('.elemenx-menu-bar-entry') : null;

		return entry ? Number(entry.getAttribute('data-index')) : -1;
	},

	Button: function (index) {
		return this.$Element().querySelector('.elemenx-menu-bar-entry[data-index="' + index + '"] .elemenx-button');
	},

	/* The menu at index opened (-1 closes it), its first item focused, or its button (on the pointer). */
	Show: function (index, focus) {
		var self = this;
		var menus = this.Menus(this.Items, this.Declared);
		if (index !== -1 && (!menus[index] || menus[index].Disabled || this.Disabled))
			index = -1;

		this.Open = index;

		if (index === -1) return;

		if (!focus) {
			if (this.Button(index))
				this.Button(index).focus();

			return;
		}

		/* The list becomes visible after the update of the MenuList, so the first item is focused on the next task. */
		window.setTimeout(function () {
			var first = self.$Element().querySelector('.elemenx-menu-bar-entry[data-index="' + index + '"] .elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option:not(.disabled)');
			if (first)
				first.focus();
		}, 0);
	},

	/* F10 or Alt alone: the focus to the first menu of the bar, or back where it was. */
	Take: function () {
		var active = this.Owner.activeElement;
		var button;

		if (this.Disabled) return;

		if (active && this.$Element().contains(active)) {
			this.Open = -1;

			if (this.Before && this.Before.focus && this.Before.isConnected) this.Before.focus();
			else active.blur();

			return;
		}

		this.Before = active;

		button = this.Button(this.Next(-1, 1));

		if (button)
			button.focus();
	},

	/* The next menu that can open from index, right (1) or left (-1), round the bar. */
	Next: function (index, direction) {
		var menus = this.Menus(this.Items, this.Declared);
		var next = index;
		var steps = 0;

		while (steps < menus.length) {
			next = (next + direction + menus.length) % menus.length;

			if (!menus[next].Disabled) return next;

			steps++;
		}

		return -1;
	},

	/* A press on the button of a menu (the click of a Button: the event alone). */
	Toggle: function (event) {
		var index = this.Index(event && event.target);

		this.Show(this.Open === index ? -1 : index, true);
	},

	/* The pointer on another menu while one is open: that one opens instead, as in the bar of a program. */
	Hover: function (event, node) {
		var index = this.Index(node);
		if (this.Open === -1 || this.Open === index) return;

		this.Show(index, false);
	},

	/* The arrows: from menu to menu, open or closed; down opens the menu of the focused button. */
	Key: function (event) {
		var key = Elemenx.Locale.Key(event);
		var index = this.Index(event.target);
		var option = event.target.closest('.elemenx-option');
		var menu = event.target.closest('.elemenx-menu');
		var next;

		if (index === -1) return;

		if (key === 'ArrowDown' && !event.defaultPrevented && this.Open === -1 && event.target.closest('.elemenx-button')) {
			event.preventDefault();

			this.Show(index, true);

			return;
		}

		if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;

		/*
		 * In a submenu the arrows are the submenu's, and the right arrow opens the submenu of an item: only the first level
		 * of a menu goes from menu to menu (the MenuList takes the arrows of its items, so their default is no sign).
		 */
		if (menu && menu.parentNode.closest('.elemenx-menu')) return;

		if (key === 'ArrowRight' && option && option.getAttribute('aria-haspopup') === 'menu') return;

		event.preventDefault();

		next = this.Next(index, key === 'ArrowRight' ? 1 : -1);

		if (this.Open === -1) {
			if (this.Button(next))
				this.Button(next).focus();

			return;
		}

		this.Show(next, true);
	},

	Picked: function (item) {
		var button = this.Button(this.Open);

		this.Open = -1;

		this.$Service('Menus').Pick(item);

		this.$Emit('select', item);

		if (button)
			button.focus();
	},

	Close: function (reason) {
		var button = this.Button(this.Open);

		this.Open = -1;

		if ((reason === 'escape' || reason === 'back') && button)
			button.focus();
	},

	$OnDestroy: function () {
		if (this.Unwatch)
			this.Unwatch();

		if (this.Owner) {
			this.Owner.removeEventListener('keydown', this.Keys);
			this.Owner.removeEventListener('keyup', this.Keys);
		}
	}
});
