<!-- generated -->
# FileBrowser

Folders and files to go through, as the explorer of a system: Items is the tree, [{ID, Name, Items (a folder: its content, null while not loaded), Size, Modified, Icon}], Path the IDs of the folders open from the root. A folder opens by a double press or Enter (navigate, and load with the folder whose Items are null: the owner gives them), a file by the same emits open; Up (Backspace) and the path over it go back. View: list (with Size and Modified, a press on a header sorts by it) or grid. A press selects (Ctrl or Cmd adds, Shift a range, with Multiple), Ctrl+A selects all; select emits the items selected. Arrows move between them. Folders come first, then the files, each by Sort. View tree shows the whole tree, a folder open under itself (Expanded: the IDs of the folders open, null all of them; a press on its arrow, Enter, the arrows right and left open and close it, expand tells {Item, Open, Expanded}). Toolbar (true) shows the bar of the path and the views, Details (true) the sizes and the dates.

## Properties

| Property | Default |
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

## Events

- `expand`: A folder of the tree was opened or closed: {Item, Open, Expanded}.
- `load`: A folder whose Items are null was opened: {Folder, Path}.
- `navigate`: A folder was opened, or left: {Path, Folder}.
- `open`: A file was opened: the item.
- `select`: The selection changed: the items selected.

## Example

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

## Tests

- [FileBrowser opens folders and files, loads a folder not loaded, sorts, selects with Ctrl and Shift, and follows the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L467) — `tests/regression/library-new.test.js`
- [FileBrowser as a tree: every folder open under itself, its arrow, Enter and the arrows across open and close it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L540) — `tests/regression/library-new.test.js`
- [reads a tree of files by its indents, of spaces or of the lines of tree, and Markdown draws it by FileBrowser as a tree](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L204) — `tests/regression/rich-plugins.test.js`
