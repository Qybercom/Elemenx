<!-- generated -->
# Table

A data table. Columns: [{Key, Title, Width, MinWidth, Align (left, center, right), Sortable, Resizable, Format, Filter, Options}], where Format(value, row) returns the text of a cell. Rows are objects identified by RowKey. Sort is {Key, Direction} ('asc' or 'desc'); SortLocal sorts Rows here, otherwise the owner sorts on the sort event. Selectable: none, single or multiple; Selected holds the selected keys and the select event reports them. Filters: a column with Filter ('text': the text holds it; 'select': one of Options, or of the values found; 'number': '10', '>10', '<=5', '5..10') gets a field under its title. Filters holds {Key: text}; FilterLocal filters here, otherwise the owner filters on the filter event. Pages: PageSize (0: one page) and Page (from 1) show a part of the rows, with a Pagination under the table; PageSizes offers other sizes. PageLocal pages here; otherwise Rows is the page itself and Total the number of all the rows. Tree: a row may hold child rows in Items (ChildrenKey); the first column shows a button that opens it (Expanded holds the open keys; Arrow Right and Left too). Sorting keeps the children under their parent; a filter keeps the parents of the rows it finds, open. Events: sort ({Key, Direction}), select (keys), activate (row: double click or Enter), resize ({Key, Width}), filter (Filters), page ({Page, PageSize}), expand (the open keys).

## Properties

| Property | Default |
| --- | --- |
| `Columns` | `[]` |
| `Rows` | `[]` |
| `Label` | `''` |
| `RowKey` | `'ID'` |
| `Sort` | `null` |
| `SortLocal` | `true` |
| `Selectable` | `'none'` |
| `Selected` | `[]` |
| `Caption` | `''` |
| `Empty` | `''` |
| `Height` | `''` |
| `Compact` | `false` |
| `Striped` | `false` |
| `Bordered` | `false` |
| `Sticky` | `true` |
| `Filters` | `{}` |
| `FilterLocal` | `true` |
| `Page` | `1` |
| `PageSize` | `0` |
| `PageSizes` | `[10, 25, 50, 100]` |
| `PageLocal` | `true` |
| `Total` | `null` |
| `Tree` | `false` |
| `ChildrenKey` | `'Items'` |
| `Expanded` | `[]` |
| `OfLabel` | `''` |

## Events

- `sort`: A sortable title was pressed: {Key, Direction}.
- `filter`: A filter of a column changed: {Key: text}.
- `page`: Another page or page size was chosen: {Page, PageSize}.
- `expand`: A row was expanded or folded: the keys of the expanded rows.
- `select`: The selection changed: the keys of the selected rows.
- `activate`: A row was opened (a double press or Enter): the row.
- `resize`: A column was resized: {Key, Width}.

## Example

```example
<Table [columns]="Columns" [rows]="Rows" [sort]="Sort" Selectable="multiple" [selected]="Selected" PageSize="5" [page]="Page" [pagesizes]="[5, 10]" (sort)="Sorted" (select)="Picked" (page)="Paged" (activate)="Opened" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Sort: {Key: 'Name', Direction: 'asc'},
	Selected: [],
	Page: 1,
	Note: 'Sort by a title, filter under it, select rows; a double click opens one.',
	Columns: [
		{Key: 'Name', Title: 'Name', Sortable: true, Filter: 'text'},
		{Key: 'Role', Title: 'Role', Sortable: true, Filter: 'select'},
		{Key: 'Tasks', Title: 'Tasks', Align: 'right', Sortable: true, Filter: 'number'},
		{Key: 'Since', Title: 'Since', Sortable: true, Format: function (value) {
			return new Date(value).toLocaleDateString();
		}}
	],
	Rows: [
		{ID: 1, Name: 'Ada', Role: 'Analyst', Tasks: 12, Since: '2019-03-01'},
		{ID: 2, Name: 'Alan', Role: 'Engineer', Tasks: 7, Since: '2020-06-15'},
		{ID: 3, Name: 'Grace', Role: 'Engineer', Tasks: 21, Since: '2018-01-09'},
		{ID: 4, Name: 'Edsger', Role: 'Architect', Tasks: 3, Since: '2021-11-30'},
		{ID: 5, Name: 'Barbara', Role: 'Analyst', Tasks: 15, Since: '2017-08-21'},
		{ID: 6, Name: 'Donald', Role: 'Writer', Tasks: 9, Since: '2016-04-04'},
		{ID: 7, Name: 'Margaret', Role: 'Engineer', Tasks: 18, Since: '2022-02-14'}
	],

	Sorted: function (sort) {
		this.Sort = sort;
	},

	Picked: function (keys) {
		this.Selected = keys;
		this.Note = keys.length + ' selected: ' + keys.join(', ');
	},

	Paged: function (event) {
		this.Page = event.Page;
	},

	Opened: function (row) {
		this.Note = 'Open ' + row.Name;
	}
})
</script>
```

## Tests

- [table sorts, selects and opens rows](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4261) — `tests/examples/ui-kit.spec.js`
- [tables fit their container without a horizontal scroll](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5243) — `tests/examples/ui-kit.spec.js`
- [writes a <template id> as a script of text, its tags as they were written](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/server.test.js#L310) — `tests/regression/server.test.js`
