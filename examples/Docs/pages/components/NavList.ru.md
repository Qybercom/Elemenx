<!-- generated -->
# NavList

Навигационный список или дерево. Items: [{ID, Label, Icon, Badge, Items, Disabled}]; Value — ID текущего пункта. Пункты с Items — группы, которые раскрываются и сворачиваются (Expanded перечисляет раскрытые). Searchable фильтрует дерево и раскрывает подходящие ветви. Collapsed показывает только иконки (для узкой боковой панели). Событие select несёт пункт. Клавиши: стрелки двигают, Enter выбирает, стрелка вправо раскрывает группу, влево — сворачивает.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Expanded` | `[]` |
| `Searchable` | `false` |
| `Collapsed` | `false` |
| `Label` | `''` |

## События

- `expand`: Группа открылась или закрылась: ID открытых групп.
- `select`: Выбран пункт: сам пункт.

## Пример

```example
<Toggle Label="Collapsed" [checked]="Narrow" (change)="Fold" />
<div class="elemenx-container" style="gap: 8px; align-items: flex-start;">
	<div [style.width]="Narrow ? '56px' : '240px'"><NavList [items]="Items" [value]="Current" [collapsed]="Narrow" Searchable="true" (select)="Selected" /></div>
	<p class="elemenx-text">Page: <strong>{{Current}}</strong></p>
</div>
<script>
({
	Current: 'inbox',
	Narrow: false,
	Items: [
		{ID: 'inbox', Label: 'Inbox', Icon: 'mail', Badge: 4},
		{ID: 'starred', Label: 'Starred', Icon: 'star'},
		{ID: 'files', Label: 'Files', Icon: 'folder', Items: [
			{ID: 'documents', Label: 'Documents'},
			{ID: 'pictures', Label: 'Pictures'},
			{ID: 'music', Label: 'Music', Disabled: true}
		]},
		{ID: 'settings', Label: 'Settings', Icon: 'settings'}
	],

	Selected: function (item) {
		this.Current = item.ID;
	},

	Fold: function (value) {
		this.Narrow = value;
	}
})
</script>
```

## Тесты

- [NavList opens a group, selects an item with the keys, and its search opens the branches that match](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L304) — `tests/regression/library-controls.test.js`
