<!-- generated -->
# Table

Таблица данных. Columns: [{Key, Title, Width, MinWidth, Align (left, center, right), Sortable, Resizable, Format, Filter, Options}], где Format(value, row) возвращает текст ячейки. Rows — объекты, различаемые по RowKey. Sort — {Key, Direction} ('asc' или 'desc'); SortLocal сортирует Rows здесь, иначе сортирует владелец по событию sort. Selectable: none, single или multiple; Selected хранит выбранные ключи, событие select сообщает их. Фильтры: столбец с Filter ('text': содержит текст; 'select': один из Options или найденных значений; 'number': '10', '>10', '<=5', '5..10') получает поле под заголовком. Filters хранит {Key: текст}; FilterLocal фильтрует здесь, иначе фильтрует владелец по событию filter. Страницы: PageSize (0 — одна страница) и Page (с 1) показывают часть строк с Pagination под таблицей; PageSizes предлагает другие размеры. PageLocal делит на страницы здесь; иначе Rows — сама страница, а Total — число всех строк. Дерево: строка может содержать дочерние строки в Items (ChildrenKey); первый столбец показывает кнопку, раскрывающую её (Expanded хранит раскрытые ключи; также стрелки вправо и влево). Сортировка оставляет детей под родителем; фильтр сохраняет родителей найденных строк, раскрытыми. События: sort ({Key, Direction}), select (ключи), activate (строка: двойной щелчок или Enter), resize ({Key, Width}), filter (Filters), page ({Page, PageSize}), expand (раскрытые ключи). Label — имя таблицы для скринридера.

## Свойства

| Свойство | По умолчанию |
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

## События

- `sort`: Нажат сортируемый заголовок: {Key, Direction}.
- `filter`: Изменился фильтр колонки: {Key: текст}.
- `page`: Выбрана другая страница или размер страницы: {Page, PageSize}.
- `expand`: Строка раскрыта или свёрнута: ключи раскрытых строк.
- `select`: Изменилось выделение: ключи выделенных строк.
- `activate`: Строка открыта (двойное нажатие или Enter): сама строка.
- `resize`: Изменён размер колонки: {Key, Width}.

## Пример

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

## Тесты

- [puts what one route alone uses into its part, and keeps the first screen, the shared and what the rest uses](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/split.test.js#L17) — `tests/regression/split.test.js`
- [table sorts, selects and opens rows](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4635) — `tests/examples/ui-kit.spec.js`
- [tables fit their container without a horizontal scroll](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5617) — `tests/examples/ui-kit.spec.js`
- [writes a <template id> as a script of text, its tags as they were written](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/server.test.js#L399) — `tests/regression/server.test.js`
