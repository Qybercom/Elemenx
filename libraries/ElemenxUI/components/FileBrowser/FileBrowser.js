/*
 * Folders and files to go through, as the explorer of a system: Items is the tree, [{ID, Name, Items (a folder: its
 * content, null while not loaded), Size, Modified, Icon}], Path the IDs of the folders open from the root. A folder
 * opens by a double press or Enter (navigate, and load with the folder whose Items are null: the owner gives them), a
 * file by the same emits open; Up (Backspace) and the path over it go back. View: list (with Size and Modified, a press
 * on a header sorts by it) or grid. A press selects (Ctrl or Cmd adds, Shift a range, with Multiple), Ctrl+A selects all;
 * select emits the items selected. Arrows move between them. Folders come first, then the files, each by Sort.
 * View tree shows the whole tree, a folder open under itself (Expanded: the IDs of the folders open, null all of them;
 * a press on its arrow, Enter, the arrows right and left open and close it, expand tells {Item, Open, Expanded}).
 * Toolbar (true) shows the bar of the path and the views, Details (true) the sizes and the dates.
 */
Elemenx.Component('FileBrowser', {
	$TemplateURL: 'FileBrowser.html',
	$StyleURL: 'FileBrowser.css',
	$Meta: {
		Group: 'data',
		Icon: 'folder-open',
		Description: 'Folders and files to go through, as the explorer of a system.',
		Events: {
			navigate: 'A folder was opened, or left: {Path, Folder}.',
			load: 'A folder whose Items are null was opened: {Folder, Path}.',
			open: 'A file was opened: the item.',
			select: 'The selection changed: the items selected.',
			expand: 'A folder of the tree was opened or closed: {Item, Open, Expanded}.'
		},
		Props: {
			Items: {Schema: {ID: 'text', Name: 'text', Size: 'number', Modified: 'text', Icon: 'icon'}, Description: 'The tree: [{ID, Name, Items, Size, Modified, Icon}]; a folder has Items (null while not loaded).'},
			Path: 'The IDs of the folders open from the root.',
			View: {Options: ['list', 'grid', 'tree'], Description: 'list (with sizes and dates), grid (big icons) or tree (the whole tree, folders open under themselves).'},
			Expanded: 'The IDs of the folders open in the tree; null: all of them.',
			Toolbar: 'Shows the bar of the path and the views.',
			Details: 'Shows the sizes and the dates.',
			Sort: {Options: ['Name', 'Size', 'Modified'], Description: 'The column it sorts by.'},
			Descending: 'Sorts from the last to the first.',
			Multiple: 'Lets several items be selected.',
			Selected: 'The IDs of the items selected.',
			Root: 'The name of the root in the path.',
			Height: 'The height of the list in pixels (it scrolls).',
			Label: 'The name of the browser for screen readers.'
		},
		Sample: {Items: [{ID: 'docs', Name: 'Documents', Items: [{ID: 'cv', Name: 'cv.pdf', Size: 182000}]}, {ID: 'photo', Name: 'photo.jpg', Size: 2400000}]}
	},
	Items: [],
	Path: [],
	View: 'list',
	Sort: 'Name',
	Descending: false,
	Multiple: true,
	Selected: [],
	Root: '',
	Height: 360,
	Label: '',
	Expanded: null,
	Toolbar: true,
	Details: true,
	Anchor: '',

	$OnCreate: function () {
		var self = this;

		this.Folder = function (item) {
			return !!item && (Array.isArray(item.Items) || item.Items === null);
		};

		/* The folders of the path, from the root: [{ID, Name, Items}]; a path that leaves the tree stops there. */
		this.Trail = function (items, path) {
			var trail = [];
			var level = items || [];

			(path || []).every(function (id) {
				var folder = level.filter(function (item) {
					return item.ID === id && self.Folder(item);
				})[0];
				if (!folder)
					return false;

				trail.push(folder);

				level = folder.Items || [];

				return true;
			});

			return trail;
		};

		/* The items of the open folder: folders first, then files, each by the column of Sort. */
		this.Shown = function (items, path, sort, descending) {
			var trail = self.Trail(items, path);

			return self.Order((trail.length ? trail[trail.length - 1].Items : items) || [], sort, descending);
		};

		/* The rows: of the open folder; of the tree, each folder open under itself, its Depth from the root. */
		this.Rows = function (items, path, sort, descending, view, expanded) {
			var rows = [];

			if (view !== 'tree') {
				return self.Shown(items, path, sort, descending).map(function (item) {
					return {Item: item, Depth: 0, Open: false};
				});
			}

			(function walk (list, depth) {
				self.Order(list || [], sort, descending).forEach(function (item) {
					var open = self.Folder(item) && self.IsOpen(expanded, item.ID);

					rows.push({Item: item, Depth: depth, Open: open});

					if (open && item.Items)
						walk(item.Items, depth + 1);
				});
			})(items, 0);

			return rows;
		};

		this.IsOpen = function (expanded, id) {
			return expanded === null || expanded === undefined || expanded.indexOf(id) !== -1;
		};

		this.Order = function (items, sort, descending) {
			var list = items || [];
			var key = sort || 'Name';
			var sign = descending && descending !== 'false' ? -1 : 1;

			return list.slice().sort(function (a, b) {
				var x = a[key];
				var y = b[key];

				if (self.Folder(a) !== self.Folder(b)) return self.Folder(a) ? -1 : 1;

				if (key === 'Modified') {
					x = x ? new Date(x).getTime() : 0;
					y = y ? new Date(y).getTime() : 0;
				}

				if (key === 'Name' || typeof x === 'string')
					return sign * String(x || '').localeCompare(String(y || ''), undefined, {numeric: true, sensitivity: 'base'});

				return sign * ((Number(x) || 0) - (Number(y) || 0));
			});
		};

		this.Crumbs = function (items, path, root) {
			return [{ID: '', Label: root || Elemenx.Locale.Text('ui.fileBrowser.root'), Icon: 'home'}].concat(self.Trail(items, path).map(function (folder) {
				return {ID: folder.ID, Label: folder.Name};
			}));
		};

		this.Loading = function (items, path) {
			var trail = self.Trail(items, path);

			return !!trail.length && trail[trail.length - 1].Items === null;
		};

		this.Size = function (item) {
			return self.Folder(item) ? (item.Items ? Elemenx.Locale.Text('ui.fileBrowser.items', {count: item.Items.length}) : '') : self.$Service('Format').Bytes(item.Size);
		};

		this.When = function (value) {
			return value ? self.$Service('Format').Date(value, 'medium') : '';
		};

		this.Picked = function (selected, id) {
			return (selected || []).indexOf(id) !== -1;
		};
	},

	/* The items shown: of the open folder, or of the tree. */
	Current: function () {
		return this.Rows(this.Items, this.Path, this.Sort, this.Descending, this.View, this.Expanded).map(function (row) {
			return row.Item;
		});
	},

	/* Every folder of the tree: what Expanded is when it is null. */
	Folders: function (items) {
		var self = this;

		return (items || []).reduce(function (all, item) {
			return self.Folder(item) ? all.concat([item.ID], self.Folders(item.Items)) : all;
		}, []);
	},

	/* A folder of the tree opened or closed: one not loaded is asked for. */
	Expand: function (item, open) {
		var expanded = this.Expanded === null || this.Expanded === undefined ? this.Folders(this.Items) : this.Expanded.slice();
		if (!item || !this.Folder(item) || this.IsOpen(expanded, item.ID) === open) return;

		this.Expanded = open ? expanded.concat([item.ID]) : expanded.filter(function (id) {
			return id !== item.ID;
		});

		this.$Emit('expand', {Item: item, Open: open, Expanded: this.Expanded});

		if (open && item.Items === null)
			this.$Emit('load', {Folder: item, Path: []});
	},

	Toggle: function (event, node) {
		var item = this.ItemOf(node);

		event.stopPropagation();

		if (item)
			this.Expand(item, !this.IsOpen(this.Expanded, item.ID));
	},

	/* The item of a row from its data-id. */
	ItemOf: function (node) {
		var row = node.closest('[data-id]');
		var id = row ? row.getAttribute('data-id') : null;

		return this.Current().filter(function (item) {
			return String(item.ID) === id;
		})[0] || null;
	},

	Go: function (path) {
		var trail = this.Trail(this.Items, path);
		var folder = trail.length ? trail[trail.length - 1] : null;

		this.Path = trail.map(function (each) {
			return each.ID;
		});
		this.Anchor = '';

		this.Choose([]);

		this.$Emit('navigate', {Path: this.Path, Folder: folder});

		if (folder && folder.Items === null)
			this.$Emit('load', {Folder: folder, Path: this.Path});
	},

	Up: function () {
		if (this.Path.length)
			this.Go(this.Path.slice(0, -1));
	},

	Crumb: function (event) {
		this.Go(this.Path.slice(0, event.Index));
	},

	Open: function (item) {
		if (!item) return;

		if (this.Folder(item) && this.View === 'tree') this.Expand(item, !this.IsOpen(this.Expanded, item.ID));
		else if (this.Folder(item)) this.Go(this.Path.concat([item.ID]));
		else this.$Emit('open', item);
	},

	Choose: function (ids) {
		if (JSON.stringify(ids) === JSON.stringify(this.Selected)) return;

		this.Selected = ids;

		this.$Emit('select', this.Current().filter(function (item) {
			return ids.indexOf(item.ID) !== -1;
		}));
	},

	/* A press selects the item; Ctrl or Cmd adds it or takes it away, Shift selects from the last one pressed. */
	Pressed: function (event, node) {
		var item = this.ItemOf(node);
		var list = this.Current();
		var ids = list.map(function (each) {
			return each.ID;
		});
		var from;
		var to;
		var multiple = this.Multiple && this.Multiple !== 'false';

		if (!item) return;

		if (multiple && event.shiftKey && this.Anchor !== '' && ids.indexOf(this.Anchor) !== -1) {
			from = Math.min(ids.indexOf(this.Anchor), ids.indexOf(item.ID));
			to = Math.max(ids.indexOf(this.Anchor), ids.indexOf(item.ID));

			this.Choose(ids.slice(from, to + 1));

			return;
		}

		this.Anchor = item.ID;

		if (multiple && (event.ctrlKey || event.metaKey)) {
			this.Choose(this.Picked(this.Selected, item.ID) ? this.Selected.filter(function (id) {
				return id !== item.ID;
			}) : this.Selected.concat([item.ID]));

			return;
		}

		this.Choose([item.ID]);
	},

	Opened: function (event, node) {
		this.Open(this.ItemOf(node));
	},

	Sorted: function (event, node) {
		var key = node.getAttribute('data-sort');

		if (this.Sort === key) {
			this.Descending = !(this.Descending && this.Descending !== 'false');
		}
		else {
			this.Sort = key;
			this.Descending = false;
		}
	},

	Viewed: function (event, node) {
		this.View = node.getAttribute('data-view');
	},

	/* The keys of the list: arrows move the focus, Enter opens, Backspace goes up, Space selects, Ctrl+A all. */
	Key: function (event) {
		var rows = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-file-browser-item'));
		var index = rows.indexOf(document.activeElement);
		var step = {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1}[event.key];
		var next;

		if (event.key === 'Backspace') {
			event.preventDefault();

			this.Up();

			return;
		}

		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && this.Multiple && this.Multiple !== 'false') {
			event.preventDefault();

			this.Choose(this.Current().map(function (item) {
				return item.ID;
			}));

			return;
		}

		if (index === -1) return;

		if (event.key === 'Enter') {
			event.preventDefault();

			this.Open(this.ItemOf(rows[index]));

			return;
		}

		if (event.key === ' ') {
			event.preventDefault();

			this.Pressed({ctrlKey: true, shiftKey: false}, rows[index]);

			return;
		}

		/* In the tree the arrows across open and close a folder. */
		if (this.View === 'tree' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
			event.preventDefault();

			this.Expand(this.ItemOf(rows[index]), event.key === 'ArrowRight');

			return;
		}

		if (!step || (this.View !== 'grid' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight'))) return;

		event.preventDefault();

		next = rows[Math.max(0, Math.min(rows.length - 1, index + step))];

		next.focus();

		if (event.shiftKey)
			this.Pressed({shiftKey: true}, next);
	}
});
