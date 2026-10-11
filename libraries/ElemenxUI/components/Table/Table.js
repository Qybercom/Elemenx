/*
 * A data table. Columns: [{Key, Title, Width, MinWidth, Align (left, center, right), Sortable, Resizable, Format}],
 * where Format(value, row) returns the text of a cell. Rows are objects identified by RowKey.
 * Sort is {Key, Direction} ('asc' or 'desc'); SortLocal sorts Rows here, otherwise the owner sorts on the sort event.
 * Selectable: none, single or multiple; Selected holds the selected keys and the select event reports them.
 * Events: sort ({Key, Direction}), select (keys), activate (row: double click or Enter), resize ({Key, Width}).
 */
Elemenx.Component('Table', {
	$TemplateURL: 'Table.html',
	$StyleURL: 'Table.css',
	Columns: [],
	Rows: [],
	RowKey: 'ID',
	Sort: null,
	SortLocal: true,
	Selectable: 'none',
	Selected: [],
	Caption: '',
	Empty: 'No data',
	Height: '',
	Compact: false,
	Striped: false,
	Bordered: false,
	Sticky: true,
	Widths: {},

	$OnCreate: function () {
		var self = this;

		this.View = function (rows, sort, local) {
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
		};

		this.Cell = function (row, column) {
			var value = row[column.Key];

			if (typeof column.Format === 'function') return column.Format(value, row);

			return value == null ? '' : String(value);
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

		this.AllSelected = function (rows, selected) {
			return rows.length > 0 && rows.every(function (row) {
				return (selected || []).indexOf(row[self.RowKey]) !== -1;
			});
		};
	},

	Row: function (node) {
		var key = node.closest('tr').getAttribute('data-key');
		var rows = this.Rows;
		var i = 0;

		while (i < rows.length) {
			if (String(rows[i][this.RowKey]) === key) return rows[i];

			i++;
		}

		return null;
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

	CheckAll: function () {
		var key = this.RowKey;

		this.Choose(this.AllSelected(this.Rows, this.Selected) ? [] : this.Rows.map(function (row) {
			return row[key];
		}));
	},

	Activate: function (event, node) {
		var row = this.Row(node);
		if (row)
			this.$Emit('activate', row);
	},

	Key: function (event, node) {
		var target = null;

		if (event.key === 'ArrowDown') target = node.nextElementSibling;
		else if (event.key === 'ArrowUp') target = node.previousElementSibling;

		if (event.key === 'Enter') {
			this.Activate(event, node);

			return;
		}

		if (event.key === ' ' && this.Selectable === 'multiple') {
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