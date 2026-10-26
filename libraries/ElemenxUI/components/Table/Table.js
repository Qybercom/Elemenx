/*
 * A data table. Columns: [{Key, Title, Width, MinWidth, Align (left, center, right), Sortable, Resizable, Format,
 * Filter, Options}], where Format(value, row) returns the text of a cell. Rows are objects identified by RowKey.
 * Sort is {Key, Direction} ('asc' or 'desc'); SortLocal sorts Rows here, otherwise the owner sorts on the sort event.
 * Selectable: none, single or multiple; Selected holds the selected keys and the select event reports them.
 * Filters: a column with Filter ('text': the text holds it; 'select': one of Options, or of the values found; 'number':
 * '10', '>10', '<=5', '5..10') gets a field under its title. Filters holds {Key: text}; FilterLocal filters here,
 * otherwise the owner filters on the filter event.
 * Pages: PageSize (0: one page) and Page (from 1) show a part of the rows, with a Pagination under the table;
 * PageSizes offers other sizes. PageLocal pages here; otherwise Rows is the page itself and Total the number of all the rows.
 * Tree: a row may hold child rows in Items (ChildrenKey); the first column shows a button that opens it (Expanded
 * holds the open keys; Arrow Right and Left too). Sorting keeps the children under their parent; a filter keeps the
 * parents of the rows it finds, open.
 * Events: sort ({Key, Direction}), select (keys), activate (row: double click or Enter), resize ({Key, Width}),
 * filter (Filters), page ({Page, PageSize}), expand (the open keys).
 */
Elemenx.Component('Table', {
	$TemplateURL: 'Table.html',
	$StyleURL: 'Table.css',
	$Meta: {
		Group: 'data',
		Icon: 'table',
		Description: 'A data table.',
		Events: ['sort', 'filter', 'page', 'expand', 'select', 'activate', 'resize'],
		Props: {
			Label: 'The name of the table for screen readers.',
			Columns: 'The columns: [{Key, Title, Width, MinWidth, Align, Sortable, Resizable, Format, Filter, Options}].',
			Rows: 'The rows: objects.',
			RowKey: 'The field that identifies a row.',
			Sort: 'The sort: {Key, Direction} (asc or desc).',
			SortLocal: 'Sorts the rows here; false leaves it to the owner (the sort event).',
			Selectable: {Options: ['none', 'single', 'multiple'], Description: 'none, single or multiple.'},
			Selected: 'The keys of the selected rows.',
			Caption: 'The caption of the table.',
			Empty: 'The text without rows.',
			Height: 'A height that makes the body scroll (a CSS length).',
			Compact: 'Tighter rows.',
			Striped: 'Every other row shaded.',
			Bordered: 'Lines between the cells.',
			Sticky: 'The header stays on top while the body scrolls.',
			Filters: 'The text of the filters: {Key: text}.',
			FilterLocal: 'Filters the rows here; false leaves it to the owner (the filter event).',
			Page: 'The page shown, from 1.',
			PageSize: 'Rows on a page (0: one page).',
			PageSizes: 'Other sizes offered.',
			PageLocal: 'Pages the rows here; false: Rows is the page and Total the count.',
			Total: 'The count of all the rows, when the owner pages.',
			Tree: 'Rows hold child rows (ChildrenKey).',
			ChildrenKey: 'The field of the child rows.',
			Expanded: 'The keys of the open rows of a tree.',
			OfLabel: 'The word between the range and the count (of).'
		},
		Sample: {Selectable: 'multiple', PageSize: 5, PageSizes: [5, 10]}
	},
	Columns: [],
	Rows: [],
	Label: '',
	RowKey: 'ID',
	Sort: null,
	SortLocal: true,
	Selectable: 'none',
	Selected: [],
	Caption: '',
	Empty: '',
	Height: '',
	Compact: false,
	Striped: false,
	Bordered: false,
	Sticky: true,
	Widths: {},
	Filters: {},
	FilterLocal: true,
	Page: 1,
	PageSize: 0,
	PageSizes: [10, 25, 50, 100],
	PageLocal: true,
	Total: null,
	Tree: false,
	ChildrenKey: 'Items',
	Expanded: [],
	OfLabel: '',

	$OnCreate: function () {
		var self = this;

		this.Cell = function (row, column) {
			var value = row[column.Key];

			if (typeof column.Format === 'function') return column.Format(value, row);

			return value == null ? '' : String(value);
		};

		/* The rows to show: filtered, sorted and, in a tree, flattened with the open ones: [{Row, Depth, Children, Open}]. */
		this.Entries = function (rows, sort, sortLocal, filters, filterLocal, expanded, tree) {
			var entries = [];
			var active = filterLocal !== false && filterLocal !== 'false' ? self.Active(filters) : [];
			var open = expanded || [];

			function walk (list, depth) {
				self.Sorted(list || [], sort, sortLocal).forEach(function (row) {
					var children = tree ? row[self.ChildrenKey] : null;
					var found = !active.length || self.Matches(row, active);
					var inner = children && children.length && active.length ? self.Holds(children, active) : false;
					var opened;

					if (!found && !inner) return;

					opened = !!(children && children.length) && (inner || open.indexOf(row[self.RowKey]) !== -1);

					entries.push({Row: row, Depth: depth, Children: !!(children && children.length), Open: opened});

					if (opened)
						walk(children, depth + 1);
				});
			}

			walk(rows, 0);

			return entries;
		};

		this.Paged = function (entries, page, size, local) {
			var count = Number(size) || 0;
			var start;

			if (!count || local === false || local === 'false') return entries;

			start = (self.Clamp(page, entries.length, count) - 1) * count;

			return entries.slice(start, start + count);
		};

		this.Count = function (entries, total, local) {
			return local === false || local === 'false' ? Number(total) || entries.length : entries.length;
		};

		this.PageCount = function (count, size) {
			return Number(size) ? Math.max(1, Math.ceil(count / Number(size))) : 1;
		};

		this.Clamp = function (page, count, size) {
			return Math.max(1, Math.min(Number(page) || 1, self.PageCount(count, size)));
		};

		this.FilterOptions = function (column, rows) {
			var values = [];

			if (column.Options)
				return column.Options;

			(function walk (list) {
				(list || []).forEach(function (row) {
					var value = row[column.Key];
					if (value != null && values.indexOf(String(value)) === -1)
						values.push(String(value));

					if (self.Tree)
						walk(row[self.ChildrenKey]);
				});
			})(rows);

			return values.sort(function (a, b) {
				return a.localeCompare(b, undefined, {numeric: true});
			});
		};

		this.HasFilters = function (columns) {
			return (columns || []).some(function (column) {
				return !!column.Filter;
			});
		};

		this.FilterOf = function (filters, key) {
			return filters && filters[key] != null ? String(filters[key]) : '';
		};

		this.IsSelected = function (selected, row) {
			return (selected || []).indexOf(row[self.RowKey]) !== -1;
		};

		this.SortIcon = function (sort, column) {
			if (!sort || sort.Key !== column.Key) return 'sort';

			return sort.Direction === 'desc' ? 'sort-descending' : 'sort-ascending';
		};

		this.AriaSort = function (sort, column) {
			if (!column.Sortable) return null;
			if (!sort || sort.Key !== column.Key) return 'none';

			return sort.Direction === 'desc' ? 'descending' : 'ascending';
		};

		this.AllSelected = function (entries, selected) {
			return entries.length > 0 && entries.every(function (entry) {
				return (selected || []).indexOf(entry.Row[self.RowKey]) !== -1;
			});
		};

		/* The rows of the page now shown, as the check box of the header selects them. */
		this.Shown = function () {
			return self.Paged(self.Entries(self.Rows, self.Sort, self.SortLocal, self.Filters, self.FilterLocal, self.Expanded, self.Tree), self.Page, self.PageSize, self.PageLocal);
		};
	},

	Sorted: function (rows, sort, local) {
		var direction;

		if (!local || !sort || !sort.Key) return rows;

		direction = sort.Direction === 'desc' ? -1 : 1;

		return rows.slice().sort(function (a, b) {
			var x = a[sort.Key];
			var y = b[sort.Key];

			if (x == null) return 1;
			if (y == null) return -1;
			if (typeof x === 'number' && typeof y === 'number') return (x - y) * direction;

			return String(x).localeCompare(String(y), undefined, {numeric: true, sensitivity: 'base'}) * direction;
		});
	},

	/* The filters in use: [{Column, Text}]. */
	Active: function (filters) {
		var columns = this.Columns || [];
		var active = [];
		var key;
		var column;

		for (key in filters || {}) {
			if (!Object.prototype.hasOwnProperty.call(filters, key) || filters[key] == null || String(filters[key]).trim() === '') continue;

			column = columns.filter(function (entry) {
				return entry.Key === key;
			})[0];

			if (column)
				active.push({Column: column, Text: String(filters[key]).trim()});
		}

		return active;
	},

	Matches: function (row, active) {
		var self = this;

		return active.every(function (filter) {
			var value = row[filter.Column.Key];

			if (filter.Column.Filter === 'select') return String(value) === filter.Text;

			if (filter.Column.Filter === 'number')
				return self.Compare(Number(value), filter.Text);

			return self.Cell(row, filter.Column).toLowerCase().indexOf(filter.Text.toLowerCase()) !== -1;
		});
	},

	/* Whether a row under rows matches. */
	Holds: function (rows, active) {
		var self = this;

		return rows.some(function (row) {
			var children = row[self.ChildrenKey];

			return self.Matches(row, active) || !!(children && children.length && self.Holds(children, active));
		});
	},

	/* A number against '10', '>10', '>=10', '<10', '<=10', '!=10' or '5..10'. */
	Compare: function (value, text) {
		var range = /^\s*(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)\s*$/.exec(text);
		var test = /^\s*(>=|<=|!=|>|<|=)?\s*(-?[\d.]+)\s*$/.exec(text);
		var number;
		var results;

		if (isNaN(value)) return false;

		if (range)
			return value >= Number(range[1]) && value <= Number(range[2]);

		if (!test)
			return true;

		number = Number(test[2]);
		results = {'>': value > number, '>=': value >= number, '<': value < number, '<=': value <= number, '!=': value !== number};

		return test[1] in results ? results[test[1]] : value === number;
	},

	/* The row of a key, at any depth. */
	Find: function (key) {
		var self = this;
		var found = null;

		(function walk (rows) {
			(rows || []).forEach(function (row) {
				if (found) return;

				if (String(row[self.RowKey]) === key) found = row;
				else if (self.Tree) walk(row[self.ChildrenKey]);
			});
		})(this.Rows);

		return found;
	},

	Row: function (node) {
		return this.Find(node.closest('tr').getAttribute('data-key'));
	},

	SortBy: function (event, node) {
		var key = node.getAttribute('data-key');
		var sort = this.Sort;
		var next;

		if (!sort || sort.Key !== key) next = {Key: key, Direction: 'asc'};
		else if (sort.Direction === 'asc') next = {Key: key, Direction: 'desc'};
		else next = null;

		this.Sort = next;

		this.$Emit('sort', next);
	},

	FilterBy: function (event, node) {
		var filters = {};
		var key;

		for (key in this.Filters || {}) {
			if (Object.prototype.hasOwnProperty.call(this.Filters, key))
				filters[key] = this.Filters[key];
		}

		filters[node.getAttribute('data-key')] = node.value;

		this.Filters = filters;
		this.Page = 1;

		this.$Emit('filter', filters);
	},

	/* A page or a page size chosen in the Pagination. */
	PageChosen: function (state) {
		this.Page = state.Page;
		this.PageSize = state.PageSize;

		this.$Emit('page', {Page: state.Page, PageSize: state.PageSize});
	},

	Flip: function (key, open) {
		var expanded = (this.Expanded || []).slice();
		var index = expanded.indexOf(key);

		if (open === undefined)
			open = index === -1;

		if (open && index === -1) expanded.push(key);
		else if (!open && index !== -1) expanded.splice(index, 1);
		else return;

		this.Expanded = expanded;

		this.$Emit('expand', expanded.slice());
	},

	Twist: function (event, node) {
		var row = this.Row(node);

		event.stopPropagation();

		if (row)
			this.Flip(row[this.RowKey]);
	},

	Choose: function (keys) {
		this.Selected = keys;

		this.$Emit('select', keys.slice());
	},

	RowClick: function (event, node) {
		var row = this.Row(node);
		var key;
		var selected;
		var index;

		if (!row || this.Selectable === 'none') return;

		key = row[this.RowKey];

		if (this.Selectable === 'multiple' && (event.ctrlKey || event.metaKey)) {
			selected = (this.Selected || []).slice();
			index = selected.indexOf(key);

			if (index === -1) selected.push(key);
			else selected.splice(index, 1);

			this.Choose(selected);

			return;
		}

		this.Choose([key]);
	},

	CheckRow: function (event, node) {
		var row = this.Row(node);
		var selected = (this.Selected || []).slice();
		var index;

		event.stopPropagation();

		if (!row) return;

		index = selected.indexOf(row[this.RowKey]);

		if (index === -1) selected.push(row[this.RowKey]);
		else selected.splice(index, 1);

		this.Choose(selected);
	},

	Stop: function (event) {
		event.stopPropagation();
	},

	/* Selects the rows shown (or none), their keys in the order of Rows. */
	CheckAll: function () {
		var self = this;
		var shown = this.Shown();
		var keys = shown.map(function (entry) {
			return entry.Row[self.RowKey];
		});
		var ordered = [];

		if (this.AllSelected(shown, this.Selected)) {
			this.Choose([]);

			return;
		}

		(function walk (rows) {
			(rows || []).forEach(function (row) {
				if (keys.indexOf(row[self.RowKey]) !== -1)
					ordered.push(row[self.RowKey]);

				if (self.Tree)
					walk(row[self.ChildrenKey]);
			});
		})(this.Rows);

		this.Choose(ordered);
	},

	Activate: function (event, node) {
		var row = this.Row(node);
		if (row)
			this.$Emit('activate', row);
	},

	Key: function (event, node) {
		var row = this.Row(node);
		var target = null;
		var children = row && this.Tree ? row[this.ChildrenKey] : null;

		if (Elemenx.Locale.Key(event) === 'ArrowDown') target = node.nextElementSibling;
		else if (Elemenx.Locale.Key(event) === 'ArrowUp') target = node.previousElementSibling;

		if (Elemenx.Locale.Key(event) === 'Enter') {
			this.Activate(event, node);

			return;
		}

		if ((Elemenx.Locale.Key(event) === 'ArrowRight' || Elemenx.Locale.Key(event) === 'ArrowLeft') && children && children.length) {
			event.preventDefault();

			this.Flip(row[this.RowKey], Elemenx.Locale.Key(event) === 'ArrowRight');

			return;
		}

		if (Elemenx.Locale.Key(event) === ' ' && this.Selectable === 'multiple') {
			event.preventDefault();

			this.CheckRow(event, node);

			return;
		}

		if (!target || target.tagName !== 'TR' || !target.hasAttribute('data-key')) return;

		event.preventDefault();

		target.focus();

		if (this.Selectable === 'single')
			this.RowClick({}, target);
	},

	Resized: function (event, node) {
		var widths = {};
		var key;

		for (key in this.Widths) {
			if (Object.prototype.hasOwnProperty.call(this.Widths, key))
				widths[key] = this.Widths[key];
		}

		widths[node.getAttribute('data-key')] = event.detail.Width + 'px';
		this.Widths = widths;

		this.$Emit('resize', {Key: node.getAttribute('data-key'), Width: event.detail.Width});
	}
});
