/*
 * One level of a Menu. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}].
 * An item with Items opens a nested MenuList to the right; a leaf item emits "select" with the item.
 */
Elemenx.Component('MenuList', {
	$TemplateURL: 'MenuList.html',
	$StyleURL: 'MenuList.css',
	Items: [],
	Open: false,
	Placement: 'bottom-start',
	MatchWidth: false,
	Active: -1,
	Expanded: -1,

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

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();

			this.Active = this.Move(event.key === 'ArrowDown' ? 1 : -1);
			this.Expanded = -1;

			this.Focus(list, this.Active);
		}
		else if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
			item = this.Items[this.Active];

			if (!item) return;

			event.preventDefault();

			if (item.Items) {
				this.Expanded = this.Active;

				this.Focus(list.querySelector('.elemenx-option[data-index="' + this.Active + '"] .elemenx-popup'), -1);
			}
			else if (event.key !== 'ArrowRight' && !item.Disabled) {
				this.Reset();

				this.$Emit('select', item);
			}
		}
		else if (event.key === 'ArrowLeft' && this.Placement === 'right-start') {
			event.preventDefault();

			this.$Emit('dismiss', 'back');
		}
		else if (event.key === 'Tab') {
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
	}
});