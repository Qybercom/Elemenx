<!-- generated -->
# TabSplit

Группы вкладок рядом и одна над другой, как редакторы редактора кода: в каждой части TabGroup, разделители между ними перетаскиваются, чтобы поделить место. Вкладки объявляются в нём с содержимым (Tab); их раскладка тоже объявляется (TabRow — рядом, TabColumn — одна над другой, Sizes — доли в процентах, TabGroup Group="..." — группа) или приходит из Layout. Вкладки, объявленные вне TabGroup, попадают в первую группу. Layout — та же раскладка как модель, а change сообщает её при каждом изменении, так что приложение хранит её и возвращает: {Split: 'row' или 'column', Sizes: [проценты], Children} из {Group, Tabs: [ID], Active, Pinned: [ID]}. Вкладка, объявленная позже, открывается текущей в группе фокуса. Вкладку перетаскивают в другую группу или к краю группы, чтобы разделить её там; меню вкладки разделяет её группу в сторону вместе с ней (группа из одной вкладки остаётся как есть). Группа без вкладок уходит, её место достаётся остальным. Части сохраняют содержимое при переносе: их панели переходят из группы в группу и не создаются заново. События: change (раскладка), select (ID открытой вкладки), close (ID вкладки, которая просит закрыться: владелец убирает её Tab; до тех пор вкладка вне групп). Методы: Open(id), Close(id), Split(id, side), Model().

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Layout` | `null` |
| `Closable` | `false` |
| `Label` | `''` |

## События

- `change`
- `select`
- `close`

## Слоты

по умолчанию

## Методы

- `Model()`
- `Open(id)`
- `Close(id)`
- `Split(id, side, beside)`

## Пример

```example
<div style="height: 320px; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius); overflow: hidden;">
	<TabSplit Closable="true" (change)="Changed" (close)="Closed">
		<TabRow Sizes="30,70">
			<TabGroup Group="side">
				<Tab ID="files" Label="Files" Icon="folder" Pinned="true"><p class="elemenx-text small" style="margin: 0; padding: 12px;">Pinned: a close of the others leaves it.</p></Tab>
			</TabGroup>
			<TabColumn Sizes="60,40">
				<TabGroup Group="main">
					<Tab *for="file of Files" *key="file" [id]="file" [label]="file" Icon="file-code"><p class="elemenx-text small" style="margin: 0; padding: 12px;">The text of {{file}}. Drag its tab to an edge, or split it from its menu.</p></Tab>
				</TabGroup>
				<TabGroup Group="bottom">
					<Tab ID="console" Label="Console" Icon="terminal"><p class="elemenx-text small" style="margin: 0; padding: 12px;">Ready.</p></Tab>
				</TabGroup>
			</TabColumn>
		</TabRow>
	</TabSplit>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Files: ['app.js', 'index.html', 'styles.css'],
	Note: 'The layout: three groups.',

	Changed: function (layout) {
		this.Note = 'The layout: ' + JSON.stringify(layout);
	},

	Closed: function (id) {
		this.Files = this.Files.filter(function (file) {
			return file !== id;
		});
	}
})
</script>
```

## Тесты

- [a TabGroup shows its declared tabs, the pinned ones first and without a cross, and its menu closes the others but the pinned](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L45) — `tests/regression/library-tab-split.test.js`
- [a TabSplit lays out the groups it declares side by side, each with its tabs, and splits a group to a side with a tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L94) — `tests/regression/library-tab-split.test.js`
- [a tab dropped in the middle of another group goes into it, and a group left without a tab goes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L134) — `tests/regression/library-tab-split.test.js`
- [takes the layout of Layout, closes a tab for its owner, and moves a divider by its keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L166) — `tests/regression/library-tab-split.test.js`
