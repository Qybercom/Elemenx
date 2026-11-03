<!-- generated -->
# FileBrowser

Папки и файлы для просмотра, как проводник системы: Items — дерево, [{ID, Name, Items (у папки — её содержимое, null, пока не загружено), Size, Modified, Icon}], Path — ID папок, открытых от корня. Папка открывается двойным нажатием или Enter (navigate и load с папкой, у которой Items равен null: их даёт владелец), файл тем же отправляет open; кнопка «Вверх» (Backspace) и путь над списком возвращают назад. View: list (с размером и датой изменения, нажатие на заголовок сортирует по нему) или grid. Нажатие выделяет (Ctrl или Cmd добавляет, Shift — диапазон, при Multiple), Ctrl+A выделяет всё; select отправляет выделенные элементы. Стрелки переходят между ними. Сначала идут папки, потом файлы, каждые — по Sort.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Path` | `[]` |
| `View` | `'list'` |
| `Sort` | `'Name'` |
| `Multiple` | `true` |
| `Label` | `''` |
| `Expanded` | `null` |
| `Toolbar` | `true` |
| `Details` | `true` |

## События

- `expand`
- `load`: Открыта папка, у которой Items равен null: {Folder, Path}.
- `navigate`: Папка открыта или покинута: {Path, Folder}.
- `open`: Открыт файл: элемент.
- `select`: Выделение изменилось: выделенные элементы.

## Пример

```example
<FileBrowser [items]="Items" Height="240" (open)="Opened" (select)="Chosen" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Items: [
		{ID: 'docs', Name: 'Documents', Items: [
			{ID: 'cv', Name: 'cv.pdf', Size: 182000, Modified: '2026-09-12'},
			{ID: 'budget', Name: 'budget.xlsx', Size: 46000, Modified: '2026-10-02'}
		]},
		{ID: 'photos', Name: 'Photos', Items: [
			{ID: 'beach', Name: 'beach.jpg', Size: 3400000, Modified: '2026-08-20'}
		]},
		{ID: 'notes', Name: 'notes.md', Size: 2100, Modified: '2026-10-25'},
		{ID: 'song', Name: 'song.mp3', Size: 5800000, Modified: '2026-07-01'}
	],
	Note: 'Open a folder by a double press; select with Ctrl and Shift.',

	Opened: function (item) {
		this.Note = 'Opened ' + item.Name;
	},

	Chosen: function (items) {
		this.Note = items.length + ' selected';
	}
})
</script>
```

## Тесты

- [FileBrowser opens folders and files, loads a folder not loaded, sorts, selects with Ctrl and Shift, and follows the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L467) — `tests/regression/library-new.test.js`
- [FileBrowser as a tree: every folder open under itself, its arrow, Enter and the arrows across open and close it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L540) — `tests/regression/library-new.test.js`
- [reads a tree of files by its indents, of spaces or of the lines of tree, and Markdown draws it by FileBrowser as a tree](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L203) — `tests/regression/rich-plugins.test.js`
