<!-- generated -->
# Tree

Дерево. Items: [{ID, Label, Icon, Badge, Items, Disabled, Lazy}]; Value — ID выбранного элемента; Expanded хранит раскрытые ID. Lazy-элемент без Items запрашивает детей событием load (элемент): владелец даёт ему Items (Loading хранит загружаемые ID, показанные со спиннером). Checkable добавляет флажки: родитель отмечен, когда отмечены все его дети, и частично — когда некоторые; отметка родителя отмечает всех. Checked хранит отмеченные ID (включая родителей). Filter (или поле поиска с Searchable) оставляет совпадающие элементы и их родителей, раскрытыми. Клавиши: стрелки (вправо раскрывает или переходит к первому ребёнку, влево сворачивает или переходит к родителю), Home, End, Enter выбирает, пробел отмечает, '*' раскрывает соседей, буква переходит к следующему элементу, начинающемуся с неё. Movable позволяет перетащить элемент указателем на другой: перед ним (верхняя часть строки), после него (нижняя) или внутрь (середина), но никогда в самого себя или в свой элемент. Дерево не меняет Items само: событие move ({ID, Target, Position: 'before', 'after' или 'inside'}) просит об этом владельца. Accept называет другие типы перетаскивания (*draggable), которые строки принимают так же, например вид из палитры, брошенный в структуру: их move несёт Type и Data перетаскивания в качестве ID. События: select (элемент), expand (раскрытые ID), check (отмеченные ID), load (элемент), move.

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
| `Movable` | `false` |
| `Accept` | `[]` |

## События

- `check`: Изменились флажки: ID отмеченных элементов.
- `expand`: Элемент открылся или закрылся: ID открытых элементов.
- `load`: Открыт элемент Lazy: сам элемент, который просит свои Items.
- `select`: Выбран элемент: сам элемент.
- `move`: Элемент перетащен на другой (Movable): {ID, Target, Position (before, after или inside), Type}.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="width: 260px;"><Tree [items]="Items" [value]="Current" [expanded]="Open" [loading]="Loading" Checkable="true" [checked]="Checked" Searchable="true" (select)="Selected" (expand)="Expanded" (check)="Checks" (load)="Load" /></div>
	<div class="elemenx-text small">
		<p>Selected: {{Current || 'none'}}</p>
		<p>Checked: {{Checked.join(', ') || 'none'}}</p>
	</div>
</div>
<h3 class="elemenx-label">Movable: drag an item before, after or into another</h3>
<div style="width: 260px;"><Tree Movable="true" [items]="Layers" [expanded]="['page', 'header']" (move)="Moved" /></div>
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

	Layers: [
		{ID: 'page', Label: 'Page', Icon: 'file', Items: [
			{ID: 'header', Label: 'Header', Icon: 'layout', Items: [{ID: 'logo', Label: 'Logo', Icon: 'image'}]},
			{ID: 'body', Label: 'Body', Icon: 'layout'},
			{ID: 'footer', Label: 'Footer', Icon: 'layout'}
		]}
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

	/* The tree asks; the owner moves the item in Layers: out of where it was, then before, after or into the target. */
	Moved: function (move) {
		var taken = null;

		function take (items) {
			return items.filter(function (item) {
				if (item.ID === move.ID)
					taken = item;

				return item.ID !== move.ID;
			}).map(function (item) {
				return item.Items ? {ID: item.ID, Label: item.Label, Icon: item.Icon, Items: take(item.Items)} : item;
			});
		}

		function put (items) {
			var result = [];

			items.forEach(function (item) {
				if (item.ID === move.Target && move.Position === 'before')
					result.push(taken);

				result.push(item.ID === move.Target && move.Position === 'inside' ? {ID: item.ID, Label: item.Label, Icon: item.Icon, Items: (item.Items || []).concat([taken])} : item.Items ? {ID: item.ID, Label: item.Label, Icon: item.Icon, Items: put(item.Items)} : item);

				if (item.ID === move.Target && move.Position === 'after')
					result.push(taken);
			});

			return result;
		}

		this.Layers = put(take(this.Layers));
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

## Тесты

- [radio groups and tab strips with their own state do not affect each other](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4382) — `tests/examples/ui-kit.spec.js`
