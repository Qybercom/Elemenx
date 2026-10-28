/*
 * A context menu over its content: a right click, the Menu key or Shift+F10 inside the default slot opens a
 * multi-level MenuList at the pointer (or under the focused element). Items: as in MenuList. Before it opens, the
 * open event carries {Target (the element pressed), X, Y}: the owner may change Items for that target then. The
 * select event carries {Item, Target}. MenuItems in its slot items declare items after Items (a declared one emits
 * select on its MenuItem too). Disabled leaves the browser menu alone. Sheet: true, or 'auto' (on a narrow or
 * a touch screen), shows the menu as a sheet from the bottom of the screen with its Title, as on a phone. On a touch
 * screen a press held for Hold milliseconds in place opens it (iOS sends no contextmenu event for a long press).
 */
Elemenx.Component('ContextMenu', {
	$TemplateURL: 'ContextMenu.html',
	$StyleURL: 'ContextMenu.css',
	$Meta: {
		Group: 'menus',
		Icon: 'launcher',
		Description: 'A context menu over its content: a right click, the Menu key or Shift+F10 inside the default slot opens a multi-level MenuList at the pointer (or under the focused element).',
		Container: true,
		Slots: ['items'],
		Events: {
			open: 'It is about to open: {Target, X, Y}; the owner may change Items for that target.',
			select: 'A leaf item was chosen: {Item, Target}.'
		},
		Props: {
			Items: 'The items of the menu, as MenuList (more may be declared with MenuItem).',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Sheet: 'Shows the menu as a sheet from the bottom: true, or auto on a narrow or a touch screen.',
			Title: 'The title of the sheet.',
			Open: 'Shows the menu (at X, Y).',
			Target: 'The element the menu was opened for.',
			Hold: 'How long a press opens it on a touch screen, in milliseconds.'
		}
	},
	Items: [],
	Disabled: false,
	Sheet: false,
	Title: '',
	Open: false,
	X: 0,
	Y: 0,
	Target: null,
	Hold: 500,
	Declared: [],

	/* The items its MenuItems declare, after Items; they follow the template as it changes. */
	$OnReady: function () {
		var self = this;

		this.Unwatch = this.$Service('Menus').Watch(this.$Element().querySelector('.elemenx-menu-sources'), function (items) {
			self.Declared = items;
		});
	},

	Show: function (target, x, y) {
		var root = this.$Element();

		this.Target = target;
		this.X = Math.round(x);
		this.Y = Math.round(y);

		this.$Emit('open', {Target: target, X: this.X, Y: this.Y});

		this.Open = true;

		window.setTimeout(function () {
			var first = root.querySelector('.elemenx-context-point .elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option:not(.disabled)');
			if (first)
				first.focus();
		}, 0);
	},

	Pressed: function (event) {
		window.clearTimeout(this.Timer);

		if (this.Disabled || !this.Items.length) return;

		event.preventDefault();

		/* A long press opened it already: the menu of the system that Android sends after it stays away. */
		if (this.Held) return;

		this.Show(event.target, event.clientX, event.clientY);
	},

	/* The start of a press: a touch held for Hold milliseconds in place opens the menu at it. */
	Down: function (event) {
		var self = this;
		var target = event.target;
		var x = event.clientX;
		var y = event.clientY;

		window.clearTimeout(this.Timer);

		this.Held = false;
		this.Start = {X: x, Y: y};

		if (this.Disabled || !this.Items.length || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return;

		this.Timer = window.setTimeout(function () {
			self.Held = true;

			self.Show(target, x, y);
		}, Number(this.Hold) || 500);
	},

	/* A press that moves (the content scrolls) or ends before its time opens nothing. */
	Moved: function (event) {
		if (this.Start && Math.abs(event.clientX - this.Start.X) + Math.abs(event.clientY - this.Start.Y) > 10)
			window.clearTimeout(this.Timer);
	},

	Released: function () {
		window.clearTimeout(this.Timer);
	},

	/* The click that ends a long press is not a press on the content. */
	Clicked: function (event) {
		if (!this.Held) return;

		this.Held = false;

		event.preventDefault();
		event.stopPropagation();
	},

	Key: function (event) {
		var rect;

		if (this.Disabled || this.Open || !this.Items.length) return;
		if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;

		event.preventDefault();

		rect = event.target.getBoundingClientRect();

		this.Show(event.target, rect.left + 8, rect.bottom);
	},

	Picked: function (item) {
		var target = this.Target;

		this.Open = false;

		this.$Emit('select', {Item: item, Target: target});

		this.$Service('Menus').Pick(item);

		if (target && target.focus && document.contains(target))
			target.focus();
	},

	$OnDestroy: function () {
		if (this.Unwatch)
			this.Unwatch();

		window.clearTimeout(this.Timer);
	},

	Close: function (reason) {
		this.Open = false;

		if ((reason === 'escape' || reason === 'back') && this.Target && this.Target.focus)
			this.Target.focus();
	}
});
