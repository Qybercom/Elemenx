/*
 * One level of a Menu. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}].
 * Open shows it: a popup under the closest elemenx-popup-anchor around it (a button of your own and the list in one
 * element of that class), placed by Placement ('bottom-start'; 'right-start' for a submenu), as wide as the anchor with
 * MatchWidth. A press outside it or Escape emits "dismiss" with the reason: the owner sets Open back to false.
 * An item with Items opens a nested MenuList to the right; a leaf item emits "select" with the item.
 * Sheet shows the menu as on a phone: a sheet from the bottom of the screen over a shade, with large rows, its Title,
 * and a Cancel row; an item with Items opens its items in the same sheet, with a row back. The sheet follows a finger
 * that drags its top (the grabber and the title) down, and a swipe down there closes it. Sheet: false (the default),
 * true, or 'auto' (a sheet on a narrow screen or a touch screen, a popup otherwise).
 */
Elemenx.Component('MenuList', {
	$TemplateURL: 'MenuList.html',
	$StyleURL: 'MenuList.css',
	$Meta: {
		Group: 'buttons',
		Icon: 'launcher',
		Description: 'One level of a Menu.',
		Events: ['select', 'dismiss'],
		Props: {
			Items: 'The items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}].',
			Open: 'Shows the list under the closest elemenx-popup-anchor around it.',
			Placement: {Options: ['bottom-start', 'bottom-end', 'top-start', 'right-start'], Description: 'Where it opens: bottom-start; right-start for a submenu.'},
			MatchWidth: 'As wide as its anchor.',
			Sheet: 'A sheet from the bottom: true, or auto on a narrow or a touch screen.',
			Title: 'The title of the sheet.'
		},
		Sample: {Items: [{ID: 'new', Label: 'New', Icon: 'add'}, {ID: 'open', Label: 'Open', Icon: 'folder-open'}, {ID: 'save', Label: 'Save', Icon: 'save'}]}
	},
	Items: [],
	Open: false,
	Placement: 'bottom-start',
	MatchWidth: false,
	Active: -1,
	Expanded: -1,
	Sheet: false,
	Title: '',
	Path: [],

	$OnCreate: function () {
		var self = this;

		/* Whether the menu shows as a sheet now. */
		this.Sheeted = function (sheet) {
			if (sheet === 'auto')
				return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;

			return sheet === true || sheet === 'true';
		};

		/* The items of the level of the sheet at a path of indexes. */
		this.Level = function (items, path) {
			return (path || []).reduce(function (list, index) {
				return list[index] && list[index].Items || [];
			}, items || []);
		};

		/* The item whose items the sheet shows, or null at the top. */
		this.Parent = function (items, path) {
			return path && path.length ? self.Level(items, path.slice(0, -1))[path[path.length - 1]] || null : null;
		};
	},

	/*
	 * Focuses an item of the list root at once when it is visible, so a fast key sequence never meets a stale focus;
	 * a list that has just been opened becomes visible on the next task.
	 */
	Focus: function (root, index) {
		function find () {
			return root && (root.querySelector(':scope > .elemenx-menu-entry > .elemenx-option[data-index="' + index + '"]') || root.querySelector(':scope > .elemenx-menu-entry > .elemenx-option:not(.disabled)'));
		}

		var item = root && !root.hidden ? find() : null;

		if (item) {
			item.focus();

			return;
		}

		window.setTimeout(function () {
			var later = find();
			if (later)
				later.focus();
		}, 0);
	},

	Enabled: function (index) {
		var item = this.Items[index];

		return !!item && !item.Separator && !item.Group && !item.Disabled;
	},

	Move: function (direction) {
		var index = this.Active;
		var steps = 0;

		while (steps < this.Items.length) {
			index = (index + direction + this.Items.length) % this.Items.length;

			if (this.Enabled(index)) return index;

			steps++;
		}

		return -1;
	},

	Hover: function (event, node) {
		var index = Number(node.getAttribute('data-index'));

		this.Expanded = this.Items[index] && this.Items[index].Items && !this.Items[index].Disabled ? index : -1;

		if (this.Active !== index)
			node.focus();
	},

	Focused: function (event, node) {
		this.Active = Number(node.getAttribute('data-index'));
	},

	Pick: function (event, node) {
		var index = Number(node.getAttribute('data-index'));
		var item = this.Items[index];

		event.stopPropagation();

		if (!item || item.Disabled) return;

		if (item.Items) {
			this.Expanded = index;

			this.Focus(node.querySelector('.elemenx-popup'), -1);

			return;
		}

		this.Reset();

		this.$Emit('select', item);
	},

	Key: function (event, node) {
		var list = event.currentTarget;
		var item;

		if (event.target.closest('.elemenx-menu') !== list) return;

		if (Elemenx.Locale.Key(event) === 'ArrowDown' || Elemenx.Locale.Key(event) === 'ArrowUp') {
			event.preventDefault();

			this.Active = this.Move(Elemenx.Locale.Key(event) === 'ArrowDown' ? 1 : -1);
			this.Expanded = -1;

			this.Focus(list, this.Active);
		}
		else if (Elemenx.Locale.Key(event) === 'ArrowRight' || Elemenx.Locale.Key(event) === 'Enter' || Elemenx.Locale.Key(event) === ' ') {
			item = this.Items[this.Active];

			if (!item) return;

			event.preventDefault();

			if (item.Items) {
				this.Expanded = this.Active;

				this.Focus(list.querySelector('.elemenx-option[data-index="' + this.Active + '"] .elemenx-popup'), -1);
			}
			else if (Elemenx.Locale.Key(event) !== 'ArrowRight' && !item.Disabled) {
				this.Reset();

				this.$Emit('select', item);
			}
		}
		else if (Elemenx.Locale.Key(event) === 'ArrowLeft' && this.Placement === 'right-start') {
			event.preventDefault();

			this.$Emit('dismiss', 'back');
		}
		else if (Elemenx.Locale.Key(event) === 'Tab') {
			this.Reset();

			this.$Emit('dismiss', 'tab');
		}
	},

	Nested: function (item) {
		this.Reset();

		this.$Emit('select', item);
	},

	Back: function () {
		var anchor = this.$Element().querySelector('.elemenx-option[data-index="' + this.Expanded + '"]');

		this.Expanded = -1;

		if (anchor)
			anchor.focus();
	},

	Dismissed: function (event) {
		event.stopPropagation();

		this.Reset();

		this.$Emit('dismiss', event.detail.Reason);
	},

	Reset: function () {
		this.Active = -1;
		this.Expanded = -1;
		this.Path = [];
	},

	/* The sheet: a press on an item opens its items in the sheet, or chooses it. */
	SheetPick: function (event, node) {
		var index = Number(node.getAttribute('data-index'));
		var item = this.Level(this.Items, this.Path)[index];

		event.stopPropagation();

		if (!item || item.Disabled) return;

		if (item.Items) {
			this.SheetHold();

			this.Path = this.Path.concat([index]);

			this.SheetFocus();

			return;
		}

		this.Reset();

		this.$Emit('select', item);
	},

	SheetBack: function (event) {
		if (event)
			event.stopPropagation();

		this.SheetHold();

		this.Path = this.Path.slice(0, -1);

		this.SheetFocus();
	},

	/* The top of the sheet dragged: the sheet follows the finger down (barely up). */
	SheetDragged: function (event, node) {
		var sheet = node.parentNode;
		var dy = event.detail.DY;

		sheet.classList.add('dragging');

		sheet.style.transform = 'translateY(' + Math.round(dy > 0 ? dy : dy / 4) + 'px)';
	},

	SheetSettled: function (event, node) {
		node.parentNode.classList.remove('dragging');

		node.parentNode.style.transform = '';
	},

	/* A swipe down closes the sheet; up, it goes back in place. */
	SheetSwiped: function (event, node) {
		this.SheetSettled(event, node);

		if (event.detail.Direction !== 'down') return;

		this.Reset();

		this.$Emit('dismiss', 'swipe');
	},

	SheetCancel: function (event) {
		if (event)
			event.stopPropagation();

		this.Reset();

		this.$Emit('dismiss', event && event.target.classList.contains('elemenx-menu-shade') ? 'backdrop' : 'cancel');
	},

	/*
	 * The sheet itself takes the focus while its level changes: the row pressed goes away with its level, and a key
	 * pressed before the next level renders still reaches the sheet.
	 */
	SheetHold: function () {
		var sheet = this.$Element() && this.$Element().querySelector('.elemenx-menu.sheet');
		if (sheet)
			sheet.focus();
	},

	/* The first row of the level shown, once it renders. */
	SheetFocus: function () {
		var root = this.$Element();

		window.setTimeout(function () {
			var first = root && root.querySelector('.elemenx-menu.sheet > .elemenx-menu-entry > .elemenx-option:not(.disabled)');
			if (first)
				first.focus();
		}, 0);
	},

	/* The keys of the sheet: the arrows go through its rows, Escape goes back a level or closes it. */
	SheetKey: function (event) {
		var rows = Array.prototype.slice.call(event.currentTarget.querySelectorAll('.elemenx-menu-back, .elemenx-menu.sheet > .elemenx-menu-entry > .elemenx-option:not(.disabled), .elemenx-menu-cancel'));
		var at = rows.indexOf(event.target);
		var key = Elemenx.Locale.Key(event);

		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();

			if (rows.length)
				rows[(at + (key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length].focus();
		}
		else if (key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();

			if (this.Path.length) this.SheetBack();
			else this.SheetCancel();
		}
		else if ((key === 'Enter' || key === ' ') && event.target.classList.contains('elemenx-option')) {
			event.preventDefault();

			event.target.click();
		}
	}
});