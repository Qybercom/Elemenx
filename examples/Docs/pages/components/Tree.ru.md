<!-- generated -->
# Tree

Дерево. Items: [{ID, Label, Icon, Badge, Items, Disabled, Lazy}]; Value — ID выбранного элемента; Expanded хранит раскрытые ID. Lazy-элемент без Items запрашивает детей событием load (элемент): владелец даёт ему Items (Loading хранит загружаемые ID, показанные со спиннером). Checkable добавляет флажки: родитель отмечен, когда отмечены все его дети, и частично — когда некоторые; отметка родителя отмечает всех. Checked хранит отмеченные ID (включая родителей). Filter (или поле поиска с Searchable) оставляет совпадающие элементы и их родителей, раскрытыми. Клавиши: стрелки (вправо раскрывает или переходит к первому ребёнку, влево сворачивает или переходит к родителю), Home, End, Enter выбирает, пробел отмечает, '*' раскрывает соседей, буква переходит к следующему элементу, начинающемуся с неё. События: select (элемент), expand (раскрытые ID), check (отмеченные ID), load (элемент).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Expanded` | `[]` |
| `Checkable` | `false` |
| `Checked` | `[]` |
| `Loading` | `[]` |
| `Searchable` | `false` |
| `Filter` | `''` |
| `Label` | `''` |
| `Empty` | `''` |

## События

`check`, `expand`, `load`, `select`

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 260px;"><Tree [items]="Items" [value]="Current" [expanded]="Open" [loading]="Loading" Checkable="true" [checked]="Checked" Searchable="true" (select)="Selected" (expand)="Expanded" (check)="Checks" (load)="Load" /></div>
	<div class="elemenx-text small">
		<p>Selected: {{Current || 'none'}}</p>
		<p>Checked: {{Checked.join(', ') || 'none'}}</p>
	</div>
</div>
<script>
({
	Current: 'app',
	Open: ['src'],
	Checked: [],
	Loading: [],
	Items: [
		{ID: 'src', Label: 'src', Icon: 'folder', Items: [
			{ID: 'app', Label: 'app.js', Icon: 'file'},
			{ID: 'router', Label: 'router.js', Icon: 'file', Badge: 'M'}
		]},
		{ID: 'remote', Label: 'remote (loads)', Icon: 'cloud', Lazy: true},
		{ID: 'readme', Label: 'README.md', Icon: 'file'}
	],

	Selected: function (item) {
		this.Current = item.ID;
	},

	Expanded: function (ids) {
		this.Open = ids;
	},

	Checks: function (ids) {
		this.Checked = ids;
	},

	Load: function (item) {
		var self = this;

		this.Loading = [item.ID];

		setTimeout(function () {
			self.Items = self.Items.map(function (entry) {
				return entry.ID === item.ID ? {ID: entry.ID, Label: entry.Label, Icon: entry.Icon, Items: [{ID: 'r1', Label: 'one.txt'}, {ID: 'r2', Label: 'two.txt'}]} : entry;
			});
			self.Loading = [];
		}, 800);
	}
})
</script>
```
