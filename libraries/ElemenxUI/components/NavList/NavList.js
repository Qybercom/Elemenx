/*
 * A navigation list or tree. Items: [{ID, Label, Icon, Badge, Items, Disabled}]; Value is the ID of the current item.
 * Items with Items are groups that open and close (Expanded lists the open ones). Searchable filters the tree and opens
 * the branches that match. Collapsed shows only the icons (for a narrow sidebar). The select event carries the item.
 * Keys: arrows move, Enter selects, Right opens a group, Left closes it.
 */
Elemenx.Component('NavList', {
	$TemplateURL: 'NavList.html',
	$StyleURL: 'NavList.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'menu',
		Description: 'A navigation list or tree.',
		Events: {
			expand: 'A group opened or closed: the IDs of the open groups.',
			select: 'An item was chosen: the item.'
		},
		Props: {
			Items: 'The items: [{ID, Label, Icon, Badge, Items, Disabled}]; Items make a group.',
			Value: 'The ID of the current item.',
			Expanded: 'The IDs of the open groups.',
			Searchable: 'Adds a filter of the tree.',
			Collapsed: 'Shows only the icons (a narrow sidebar).',
			Label: 'The name of the list for screen readers.'
		},
		Sample: {Searchable: true}
	},
	Items: [],
	Value: null,
	Expanded: [],
	Searchable: false,
	Collapsed: false,
	Label: '',
	Filter: '',

	$OnCreate: function () {
		var self = this;

		/* The visible rows: [{Item, Depth, Group, Open}] of the tree, filtered by the search text. */
		this.Rows = function (items, expanded, filter) {
			var rows = [];
			var query = String(filter || '').toLowerCase();

			function matches (item) {
				if (String(item.Label).toLowerCase().indexOf(query) !== -1) return true;

				return (item.Items || []).some(matches);
			}

			function walk (list, depth) {
				var i = 0;
				var item;
				var open;

				while (i < list.length) {
					item = list[i];

					if (!query || matches(item)) {
						open = !!item.Items && (!!query || (expanded || []).indexOf(item.ID) !== -1);

						rows.push({Item: item, Depth: depth, Group: !!item.Items, Open: open});

						if (open)
							walk(item.Items, depth + 1);
					}

					i++;
				}
			}

			walk(items || [], 0);

			return rows;
		};

		this.Find = function (id) {
			var found = null;

			function walk (list) {
				var i = 0;

				while (i < list.length && !found) {
					if (String(list[i].ID) === String(id)) found = list[i];
					else if (list[i].Items) walk(list[i].Items);

					i++;
				}
			}

			walk(self.Items || []);

			return found;
		};
	},

	Toggle: function (id, open) {
		var expanded = (this.Expanded || []).slice();
		var index = expanded.indexOf(id);

		if (open === undefined)
			open = index === -1;

		if (open && index === -1)
			expanded.push(id);

		if (!open && index !== -1)
			expanded.splice(index, 1);

		this.Expanded = expanded;

		this.$Emit('expand', expanded.slice());
	},

	Pick: function (event, node) {
		var item = this.Find(node.getAttribute('data-id'));
		if (!item || item.Disabled) return;

		if (item.Items && !this.Collapsed) {
			this.Toggle(item.ID);

			return;
		}

		this.Value = item.ID;

		this.$Emit('select', item);
	},

	Search: function (event, node) {
		this.Filter = node.value;
	},

	Key: function (event, node) {
		var rows = Array.prototype.slice.call(node.closest('.elemenx-nav').querySelectorAll('.elemenx-nav-row'));
		var index = rows.indexOf(node);
		var item = this.Find(node.getAttribute('data-id'));
		var target = null;

		if (Elemenx.Locale.Key(event) === 'ArrowDown') target = rows[index + 1];
		else if (Elemenx.Locale.Key(event) === 'ArrowUp') target = rows[index - 1];
		else if (Elemenx.Locale.Key(event) === 'ArrowRight' && item && item.Items) this.Toggle(item.ID, true);
		else if (Elemenx.Locale.Key(event) === 'ArrowLeft' && item && item.Items) this.Toggle(item.ID, false);
		else if (Elemenx.Locale.Key(event) === 'Enter' || Elemenx.Locale.Key(event) === ' ') this.Pick(event, node);
		else return;

		event.preventDefault();

		if (target)
			target.focus();
	}
});