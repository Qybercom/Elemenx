/*
 * A menu of settings as on a phone: rows in groups, each with an Icon on a tile of its Color, a Label, a Description
 * under it, a Value and a chevron to the submenu of its Items. A row with Toggle is a switch (Checked); a row with
 * Checked and no Toggle shows a check, as the choices of a submenu do. Badge is a count on the row. The submenu of
 * a row with Choice is a choice of one: a press checks the row pressed, and its Label becomes the Value of the row.
 * - Items: [{ID, Label, Description, Icon, Color, Value, Badge, Items, Choice, Toggle, Checked, Disabled, Danger}];
 *   an item {Group, Note} starts a group of rows: its title above them (empty for none), its Note under them.
 * - Title is the large title of the top menu; a submenu takes the Label of its row, under a button back to the menu
 *   above. Path is the IDs of the open submenus.
 * - Variant: 'auto' (ios on an Apple device, material on the others), 'ios' (rows on rounded cards, as in the
 *   Settings of an iPhone) or 'material' (rows across, with round tiles, as in the Settings of Android).
 * - Searchable shows a field that finds rows on every level by their Label and Description; a found row shows where
 *   it is, and pressing it does what pressing it in its menu does.
 * - The arrows move between the rows, Enter and Space press one, the right arrow opens a submenu; the left arrow,
 *   Escape and Backspace go back.
 * - Events: select ({ID, Item, Path}) for a row without Items, toggle ({ID, Item, Checked}), navigate ({Path}).
 */
Elemenx.Component('SettingsMenu', {
	$TemplateURL: 'SettingsMenu.html',
	$StyleURL: 'SettingsMenu.css',
	$Meta: {
		Group: 'layout',
		Icon: 'settings',
		Description: 'A menu of settings as on a phone: rows in groups, each with an Icon on a tile of its Color, a Label, a Description under it, a Value and a chevron to the submenu of its Items.',
		Events: {
			toggle: 'A switch row was switched: {ID, Item, Checked}.',
			select: 'A row was chosen: {ID, Item, Path}.',
			navigate: 'A submenu was opened or left: {Path}, the IDs of the open submenus.'
		},
		Props: {
			Items: 'The rows: [{ID, Label, Description, Icon, Color, Value, Badge, Items, Choice, Toggle, Checked, Disabled, Danger}], and {Group, Note} for a group.',
			Title: 'The large title of the top menu.',
			Variant: {Options: ['auto', 'ios', 'material'], Description: 'auto, ios (rows on rounded cards) or material (rows across).'},
			Searchable: 'Shows a field that finds rows on every level.',
			SearchLabel: 'The placeholder of the search.',
			Path: 'The IDs of the open submenus.'
		},
		Sample: {Title: 'Settings', Variant: 'ios', Searchable: true}
	},
	Items: [],
	Title: '',
	Variant: 'auto',
	Searchable: false,
	SearchLabel: '',
	Path: [],
	Query: '',
	Direction: '',
	Version: 0,

	$OnCreate: function () {
		var self = this;

		/* The rows drawn now, by their keys, for the handlers of their buttons: out of the state, so drawing them draws nothing again. */
		var drawn = {};

		this.Row = function (key) {
			return drawn[key] || null;
		};

		/* The look: ios or material, as asked, or as the device is. */
		this.Look = function (variant) {
			if (variant === 'ios' || variant === 'material') return variant;

			return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent || '') ? 'ios' : 'material';
		};

		this.Name = function (item, index) {
			return String(item.ID !== undefined && item.ID !== null ? item.ID : item.Label || index);
		};

		/* The items of the submenu at the end of a path of IDs, and the items of the rows on the way. */
		this.Walk = function (items, path) {
			var trail = [];
			var level = items || [];
			var i = 0;
			var found;

			while (i < path.length) {
				found = null;

				level.forEach(function (item, index) {
					if (!found && item.Items && self.Name(item, index) === String(path[i]))
						found = item;
				});

				if (!found) break;

				trail.push(found);

				level = found.Items;

				i++;
			}

			return {Items: level, Trail: trail};
		};

		/* The row of the submenu open now, or null at the top. */
		this.Parent = function (items, path) {
			var trail = self.Walk(items, path).Trail;

			return trail.length ? trail[trail.length - 1] : null;
		};

		/* The name of the menu the button back goes to: the row above, or the Title of the top menu. */
		this.Above = function (items, path) {
			var trail = self.Walk(items, path).Trail;
			if (trail.length > 1)
				return trail[trail.length - 2].Label;

			return self.Title || Elemenx.Locale.Text('ui.settingsMenu.back');
		};

		/* The groups of a list of items: [{Key, Title, Note, Rows: [{Key, Name, Item, Path, Where}]}]. */
		this.Grouped = function (items, path) {
			var groups = [];
			var group = null;

			items.forEach(function (item, index) {
				var row;

				if (item.Group !== undefined && !item.Label) {
					group = {Key: 'group-' + index, Title: item.Group, Note: item.Note || '', Rows: []};

					groups.push(group);

					return;
				}

				if (!group) {
					group = {Key: 'group-top', Title: '', Note: '', Rows: []};

					groups.push(group);
				}

				row = {Key: path.concat([self.Name(item, index)]).join('/'), Name: self.Name(item, index), Item: item, Path: path, Where: ''};

				drawn[row.Key] = row;

				group.Rows.push(row);
			});

			return groups;
		};

		/* The rows that match the query, on every level, with the labels of the menus they are in. */
		this.Found = function (items, query) {
			var rows = [];
			var text = String(query).trim().toLowerCase();
			var visit = function (list, path, where) {
				list.forEach(function (item, index) {
					var row;

					if (item.Group !== undefined && !item.Label) return;

					if ((String(item.Label || '') + ' ' + String(item.Description || '')).toLowerCase().indexOf(text) !== -1) {
						row = {Key: 'found:' + path.concat([self.Name(item, index)]).join('/'), Name: self.Name(item, index), Item: item, Path: path, Where: where.join(' › ')};

						drawn[row.Key] = row;

						rows.push(row);
					}

					if (item.Items)
						visit(item.Items, path.concat([self.Name(item, index)]), where.concat([item.Label]));
				});
			};

			visit(items || [], [], []);

			return [{Key: 'found', Title: '', Note: rows.length ? '' : Elemenx.Locale.Text('ui.settingsMenu.nothing'), Rows: rows}];
		};

		/* The groups to draw: the found rows while there is a query, the submenu open now otherwise (again on a new Version, when a switch or a choice changed the items). */
		this.Groups = function (items, path, query) {
			drawn = {};

			if (String(query || '').trim())
				return self.Found(items, query);

			return self.Grouped(self.Walk(items, path).Items, path);
		};

		/* The page of the submenu open now, so a new one is a new element and plays its entrance. */
		this.Page = function (path, query) {
			return String(query || '').trim() ? ['search'] : [path.join('/') || 'top'];
		};

		this.Shown = function (value) {
			return value !== undefined && value !== null && value !== '';
		};
	},

	/* A press on a row: its submenu opens, its switch turns, or it is chosen. */
	Press: function (event, node) {
		var row = this.Row(node.getAttribute('data-key'));
		var item = row && row.Item;
		var parent;
		var self = this;

		if (!item || item.Disabled) return;

		if (item.Items) {
			this.Open(row.Path.concat([row.Name]));

			return;
		}

		if (item.Toggle) {
			item.Checked = !item.Checked;

			this.Version++;

			this.$Emit('toggle', {ID: item.ID, Item: item, Checked: item.Checked});

			return;
		}

		parent = this.Parent(this.Items, row.Path);

		if (parent && parent.Choice) {
			parent.Items.forEach(function (other, index) {
				if (other.Label)
					other.Checked = self.Name(other, index) === row.Name;
			});

			parent.Value = item.Label;

			this.Version++;
		}

		this.$Emit('select', {ID: item.ID, Item: item, Path: row.Path.slice()});
	},

	Open: function (path) {
		this.Direction = 'forward';
		this.Query = '';
		this.Path = path;

		this.$Emit('navigate', {Path: path.slice()});

		this.Focus('');
	},

	Back: function () {
		var from = this.Path.join('/');

		if (!this.Path.length) return;

		this.Direction = 'back';
		this.Path = this.Path.slice(0, -1);

		this.$Emit('navigate', {Path: this.Path.slice()});

		this.Focus(from);
	},

	Search: function (event, node) {
		this.Query = node.value;
	},

	/* The row of the key given (the row the menu came back from), or the first row, once the page renders. */
	Focus: function (key) {
		var root = this.$Element();

		window.setTimeout(function () {
			var row = root && (root.querySelector('.elemenx-settings-menu-row[data-key="' + key.replace(/["\\]/g, '\\$&') + '"]') || root.querySelector('.elemenx-settings-menu-row:not([disabled])'));
			if (row)
				row.focus();
		}, 0);
	},

	Key: function (event) {
		var rows = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-settings-menu-row:not([disabled])'));
		var at = rows.indexOf(event.target);
		var key = Elemenx.Locale.Key(event);
		var row;

		if (event.target.tagName === 'INPUT') {
			if (key === 'ArrowDown' && rows.length) {
				event.preventDefault();

				rows[0].focus();
			}
			else if (key === 'Escape' && this.Query) {
				event.preventDefault();

				this.Query = '';
			}

			return;
		}

		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();

			if (rows.length)
				rows[(at + (key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length].focus();
		}
		else if (key === 'Home' || key === 'End') {
			event.preventDefault();

			if (rows.length)
				rows[key === 'Home' ? 0 : rows.length - 1].focus();
		}
		else if (key === 'ArrowRight') {
			row = this.Row(event.target.getAttribute('data-key'));

			if (row && row.Item.Items) {
				event.preventDefault();

				event.target.click();
			}
		}
		else if ((key === 'ArrowLeft' || key === 'Escape' || key === 'Backspace') && this.Path.length && !this.Query) {
			event.preventDefault();
			event.stopPropagation();

			this.Back();
		}
	}
});
