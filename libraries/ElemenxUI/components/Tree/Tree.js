/*
 * A tree. Items: [{ID, Label, Icon, Badge, Items, Disabled, Lazy}]; Value is the ID of the selected item; Expanded
 * holds the open IDs. A Lazy item without Items asks for its children with the load event (the item): the owner gives
 * it Items (Loading holds the IDs being loaded, shown with a spinner). Checkable adds check boxes: a parent is
 * checked when all its children are, mixed when some are; checking it checks all of them. Checked holds the checked
 * IDs (parents included). Filter (or a search field with Searchable) keeps the items that match and their parents,
 * open. Keys: arrows (Right opens or goes to the first child, Left closes or goes to the parent), Home, End, Enter
 * selects, Space checks, '*' opens the siblings, a letter goes to the next item that starts with it.
 * Movable lets the pointer drag an item onto another: before it (the upper part of its row), after it (the lower part)
 * or into it (the middle), never into itself or one of its own items. The tree does not change Items itself: the move
 * event ({ID, Target, Position: 'before', 'after' or 'inside'}) asks the owner to. Accept names other types of drags
 * (*draggable) the rows take the same way, a kind of a palette dropped in a structure: their move carries the Type and
 * the Data of the drag as ID.
 * Events: select (the item), expand (the open IDs), check (the checked IDs), load (the item), move.
 */
Elemenx.Component('Tree', {
	$TemplateURL: 'Tree.html',
	$StyleURL: 'Tree.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'tree',
		Description: 'A tree.',
		Events: ['check', 'expand', 'load', 'select', 'move'],
		Props: {
			Items: 'The items: [{ID, Label, Icon, Badge, Items, Disabled, Lazy}].',
			Value: 'The ID of the selected item.',
			Expanded: 'The IDs of the open items.',
			Checkable: 'Adds check boxes.',
			Checked: 'The IDs of the checked items.',
			Loading: 'The IDs of the items whose children load.',
			Searchable: 'Adds a search field.',
			Filter: 'Keeps the items that match, and their parents.',
			Label: 'The name of the tree for screen readers.',
			Empty: 'The text without items.',
			Movable: 'Lets the pointer drag an item before, after or into another (the move event).',
			Accept: 'Other types of drags (*draggable) the rows take as their own items, with their Type in the move event.'
		},
		Sample: {Checkable: true, Searchable: true}
	},
	Items: [],
	Value: null,
	Expanded: [],
	Checkable: false,
	Checked: [],
	Loading: [],
	Searchable: false,
	Filter: '',
	Label: '',
	Empty: '',
	Movable: false,
	Accept: [],
	Focused: null,
	DropOn: null,
	DropAt: '',

	$OnCreate: function () {
		var self = this;

		/* Whether target is the item of id or one of its own items (an item never goes into itself). */
		this.Within = function (items, id, target) {
			var found = null;

			function find (list) {
				(list || []).forEach(function (item) {
					if (String(item.ID) === String(id)) found = item;
					else if (!found) find(item.Items);
				});
			}

			function has (item) {
				return String(item.ID) === String(target) || (item.Items || []).some(has);
			}

			find(items);

			return !!found && has(found);
		};

		/* The place a dragged item would take at a row: its mark (before, after, inside), or nothing. */
		this.Drop = function (id, on, at) {
			return String(id) === String(on) ? at : null;
		};

		/* The visible rows: [{Item, Depth, Group, Open, Parent, Check ('true', 'false', 'mixed')}]. */
		this.Rows = function (items, expanded, filter, checked) {
			var rows = [];
			var query = String(filter || '').trim().toLowerCase();

			function matches (item) {
				if (String(item.Label).toLowerCase().indexOf(query) !== -1) return true;

				return (item.Items || []).some(matches);
			}

			function walk (list, depth, parent) {
				(list || []).forEach(function (item) {
					var group = !!(item.Items && item.Items.length) || !!item.Lazy && !item.Items;
					var open;

					if (query && !matches(item)) return;

					open = group && (!!query && !!item.Items || (expanded || []).indexOf(item.ID) !== -1);

					rows.push({Item: item, Depth: depth, Group: group, Open: open, Parent: parent, Check: self.Checkable ? self.State(item, checked) : null});

					if (open && item.Items)
						walk(item.Items, depth + 1, item.ID);
				});
			}

			walk(items, 0, null);

			return rows;
		};

		this.IsLoading = function (loading, item) {
			return (loading || []).indexOf(item.ID) !== -1;
		};

		/* The row that takes the focus of the keys: the focused one, else the selected one, else the first. */
		this.Current = function (rows, focused, value) {
			var ids = rows.map(function (row) {
				return String(row.Item.ID);
			});
			if (focused != null && ids.indexOf(String(focused)) !== -1) return String(focused);
			if (value != null && ids.indexOf(String(value)) !== -1) return String(value);

			return ids[0];
		};
	},

	/* The leaves under item (itself when it has no children). */
	Leaves: function (item) {
		var self = this;
		var leaves = [];

		if (!item.Items || !item.Items.length) return [item.ID];

		item.Items.forEach(function (child) {
			leaves = leaves.concat(self.Leaves(child));
		});

		return leaves;
	},

	State: function (item, checked) {
		var leaves = this.Leaves(item);
		var count = leaves.filter(function (id) {
			return (checked || []).indexOf(id) !== -1;
		}).length;
		if (!count)
			return 'false';

		return count === leaves.length ? 'true' : 'mixed';
	},

	Find: function (id) {
		var found = null;

		(function walk (list) {
			(list || []).forEach(function (item) {
				if (found) return;

				if (String(item.ID) === String(id)) found = item;
				else walk(item.Items);
			});
		})(this.Items);

		return found;
	},

	/* The checked leaves, and every parent whose leaves are all checked. */
	Normalize: function (leaves) {
		var self = this;
		var checked = [];

		(function walk (list) {
			(list || []).forEach(function (item) {
				var all = self.Leaves(item);
				if (all.every(function (id) {
					return leaves.indexOf(id) !== -1;
				}))
					checked.push(item.ID);

				walk(item.Items);
			});
		})(this.Items);

		return checked;
	},

	Check: function (item) {
		var leaves = this.Leaves(item);
		var current = this.Checked || [];
		var on = this.State(item, current) !== 'true';
		var all = [];

		(function walk (list, self) {
			(list || []).forEach(function (entry) {
				all = all.concat(self.Leaves(entry).filter(function (id) {
					return current.indexOf(id) !== -1;
				}));
			});
		})(this.Items, this);

		all = all.filter(function (id, index) {
			return all.indexOf(id) === index && leaves.indexOf(id) === -1;
		});

		if (on)
			all = all.concat(leaves);

		this.Checked = this.Normalize(all);

		this.$Emit('check', this.Checked.slice());
	},

	Toggle: function (id, open) {
		var expanded = (this.Expanded || []).slice();
		var index = expanded.indexOf(id);
		var item = this.Find(id);

		if (open === undefined)
			open = index === -1;

		if (open && index === -1) expanded.push(id);
		else if (!open && index !== -1) expanded.splice(index, 1);
		else return;

		this.Expanded = expanded;

		this.$Emit('expand', expanded.slice());

		if (open && item && item.Lazy && !item.Items && !this.IsLoading(this.Loading, item))
			this.$Emit('load', item);
	},

	Select: function (item) {
		if (!item || item.Disabled) return;

		this.Value = item.ID;
		this.Focused = item.ID;

		this.$Emit('select', item);
	},

	Pick: function (event, node) {
		var item = this.Find(node.getAttribute('data-id'));

		this.Focused = item ? item.ID : null;

		this.Select(item);
	},

	Twist: function (event, node) {
		var row = node.closest('[data-id]');

		event.stopPropagation();

		this.Toggle(this.Find(row.getAttribute('data-id')).ID);
	},

	Tick: function (event, node) {
		var row = node.closest('[data-id]');
		var item = this.Find(row.getAttribute('data-id'));

		event.stopPropagation();

		if (item && !item.Disabled)
			this.Check(item);
	},

	Search: function (event, node) {
		this.Filter = node.value;
	},

	Move: function (node, rows, index) {
		var target = rows[Math.max(0, Math.min(rows.length - 1, index))];
		var element;

		if (!target) return;

		this.Focused = target.Item.ID;

		element = node.closest('.elemenx-tree').querySelector('.elemenx-tree-row[data-id="' + String(target.Item.ID).replace(/"/g, '\\"') + '"]');

		if (element)
			element.focus();
	},

	Key: function (event, node) {
		var self = this;
		var rows = this.Rows(this.Items, this.Expanded, this.Filter, this.Checked);
		var id = node.getAttribute('data-id');
		var index = rows.map(function (row) {
			return String(row.Item.ID);
		}).indexOf(id);
		var row = rows[index];
		var next;

		if (!row) return;

		if (Elemenx.Locale.Key(event) === 'ArrowDown') {
			this.Move(node, rows, index + 1);
		}
		else if (Elemenx.Locale.Key(event) === 'ArrowUp') {
			this.Move(node, rows, index - 1);
		}
		else if (Elemenx.Locale.Key(event) === 'Home') {
			this.Move(node, rows, 0);
		}
		else if (Elemenx.Locale.Key(event) === 'End') {
			this.Move(node, rows, rows.length - 1);
		}
		else if (Elemenx.Locale.Key(event) === 'ArrowRight') {
			if (row.Group && !row.Open) this.Toggle(row.Item.ID, true);
			else if (row.Open) this.Move(node, rows, index + 1);
		}
		else if (Elemenx.Locale.Key(event) === 'ArrowLeft') {
			if (row.Open) this.Toggle(row.Item.ID, false);
			else if (row.Parent != null) this.Move(node, rows, rows.map(function (entry) {
				return entry.Item.ID;
			}).indexOf(row.Parent));
		}
		else if (Elemenx.Locale.Key(event) === 'Enter') {
			this.Select(row.Item);
		}
		else if (Elemenx.Locale.Key(event) === ' ' && this.Checkable) {
			if (!row.Item.Disabled)
				this.Check(row.Item);
		}
		else if (Elemenx.Locale.Key(event) === '*') {
			rows.filter(function (entry) {
				return entry.Parent === row.Parent && entry.Group && !entry.Open;
			}).forEach(function (entry) {
				self.Toggle(entry.Item.ID, true);
			});
		}
		else if (Elemenx.Locale.Key(event).length === 1 && /\S/.test(Elemenx.Locale.Key(event)) && !event.ctrlKey && !event.metaKey && !event.altKey) {
			next = rows.slice(index + 1).concat(rows.slice(0, index + 1)).filter(function (entry) {
				return String(entry.Item.Label).toLowerCase().indexOf(Elemenx.Locale.Key(event).toLowerCase()) === 0;
			})[0];

			if (next)
				this.Move(node, rows, rows.indexOf(next));
		}
		else {
			return;
		}

		event.preventDefault();
	},

	/* A dragged item over a row: before, after or into it by the height the pointer is at. */
	DragOver: function (event, node) {
		var id = node.getAttribute('data-id');
		var box = node.getBoundingClientRect();
		var y = (event.detail.ClientY - box.top) / Math.max(1, box.height);
		var at = y < 0.25 ? 'before' : y > 0.75 ? 'after' : 'inside';

		if (event.detail.Type === 'elemenx-tree-item' && this.Within(this.Items, event.detail.Data, id))
			at = '';

		if (this.DropOn !== id)
			this.DropOn = id;

		if (this.DropAt !== at)
			this.DropAt = at;
	},

	DragLeave: function (event, node) {
		if (this.DropOn === node.getAttribute('data-id'))
			this.DropOn = null;
	},

	Dropped: function (event, node) {
		var id = node.getAttribute('data-id');
		var at = this.DropOn === id ? this.DropAt : '';

		this.DropOn = null;
		this.DropAt = '';

		if (at && (event.detail.Type !== 'elemenx-tree-item' || String(event.detail.Data) !== id))
			this.$Emit('move', {ID: event.detail.Data, Target: id, Position: at, Type: event.detail.Type});
	}
});
