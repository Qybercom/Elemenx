/*
 * The items of a menu declared in a template with MenuItem (Menu and ContextMenu use it). Read(container) returns the
 * items its MenuItems declare, nested ones as Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked,
 * Separator, Group, Role, Items, Source}], Source the declaration. Watch(container, callback) calls back with the items again
 * whenever a declaration inside comes, goes or changes, and returns the function that stops it. Pick(item) tells the
 * MenuItem of a declared item that it was chosen (its select).
 */
Elemenx.Service('Menus', {
	$Meta: {
		Description: 'The items of a menu declared in a template with MenuItem (Menu and ContextMenu use it).',
		Methods: ['Read(container)', 'Watch(container, callback)', 'Pick(item)']
	},
	Read: function (container) {
		var self = this;

		if (!container) return [];

		return Array.prototype.filter.call(container.querySelectorAll('.elemenx-menu-item-source'), function (node) {
			var parent = node.parentNode && node.parentNode.closest('.elemenx-menu-item-source');

			return !parent || !container.contains(parent);
		}).map(function (node) {
			return self.Item(node);
		});
	},

	Item: function (node) {
		var self = this;
		var item = {Source: node};
		var children = Array.prototype.filter.call(node.querySelectorAll('.elemenx-menu-item-source'), function (child) {
			return child.parentNode.closest('.elemenx-menu-item-source') === node;
		});

		['ID', 'Label', 'Icon', 'Shortcut', 'Group', 'Role'].forEach(function (name) {
			var value = node.getAttribute('data-' + name.toLowerCase());
			if (value !== null)
				item[name] = value;
		});

		if (item.ID === undefined)
			item.ID = item.Label || '';

		if (node.getAttribute('data-disabled') === 'true')
			item.Disabled = true;

		if (node.getAttribute('data-danger') === 'true')
			item.Danger = true;

		if (node.getAttribute('data-separator') === 'true')
			item.Separator = true;

		if (node.getAttribute('data-checked') !== null)
			item.Checked = node.getAttribute('data-checked') === 'true';

		if (children.length) {
			item.Items = children.map(function (child) {
				return self.Item(child);
			});
		}

		return item;
	},

	Watch: function (container, callback) {
		var self = this;
		var observer;

		if (!container || typeof MutationObserver !== 'function') return function () {};

		observer = new MutationObserver(function () {
			callback(self.Read(container));
		});

		observer.observe(container, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-id', 'data-label', 'data-icon', 'data-shortcut', 'data-disabled', 'data-danger', 'data-checked', 'data-separator', 'data-group', 'data-role']});

		callback(self.Read(container));

		return function () {
			observer.disconnect();
		};
	},

	Pick: function (item) {
		if (item && item.Source && typeof CustomEvent === 'function')
			item.Source.dispatchEvent(new CustomEvent('elemenx-menu-pick', {detail: item}));
	}
});
