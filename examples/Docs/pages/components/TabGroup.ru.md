<!-- generated -->
# TabGroup

Группа вкладок: их полоса и содержимое текущей, как вкладки файлов редактора. Вкладки объявляются в ней с содержимым (<Tab ID="readme" Label="README.md">...</Tab>) или задаются Items ([{ID, Label, Icon, Badge, Closable, Disabled, Pinned}]: содержимое в её тело кладёт владелец, как это делает TabSplit). Active — ID текущей вкладки (первая, пока он не назван). Закреплённая вкладка (Pinned) стоит первой в полосе, без крестика, и закрытие всех вкладок, других или стоящих в стороне её не трогает. Меню вкладки (правая кнопка, долгое нажатие, клавиша меню или Shift+F10) закрывает её, другие, вкладки справа или слева, все; закрепляет или открепляет её; в TabSplit (Splittable) ещё и разделяет группу в сторону вместе с вкладкой. Вкладку перетаскивают на другое место полосы, а в TabSplit — в другую группу или к краю группы, чтобы разделить её там: край, который она займёт, подсвечивается, пока вкладка над ним. Клавиши полосы: стрелки, Home и End — между вкладками, Delete закрывает, клавиша меню открывает меню; Ctrl+Page Down и Ctrl+Page Up в любом месте группы — следующая и предыдущая вкладка. События: select (ID), close (ID, по одному на вкладку: владелец убирает её Tab), pin ({ID, Pinned}), а с Items для владельца — order ({ID, Index}), move ({ID, From, Index}: вкладка другой группы в полосе), drop ({ID, From, Side: left, right, top, bottom или center}) и split ({ID, Side}). В каждом событии есть Group, её имя. В TabSplit она ещё и часть раскладки, объявленной в шаблоне: <TabGroup Group="side">...</TabGroup>.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `null` |
| `Active` | `null` |
| `Closable` | `false` |
| `Splittable` | `false` |
| `Group` | `''` |
| `Label` | `''` |

## События

- `select`
- `close`
- `pin`
- `split`
- `move`
- `order`
- `drop`

## Слоты

по умолчанию

## Пример

```example
<div style="display: flex; height: 180px; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius); overflow: hidden;">
	<TabGroup Closable="true" Label="Documents" style="flex: 1;" (close)="Closed" (select)="Opened">
		<Tab *for="tab of Tabs" *key="tab" [id]="tab" [label]="tab" [pinned]="tab === 'Notes'"><p class="elemenx-text small" style="margin: 0; padding: 12px;">{{tab}}: its menu closes the others, the ones to a side, or pins it.</p></Tab>
	</TabGroup>
</div>
<p class="elemenx-text small muted">Opened: {{Current}}</p>
<script>
({
	Tabs: ['Notes', 'Plan', 'Budget', 'Ideas'],
	Current: 'Notes',

	Opened: function (id) {
		this.Current = id;
	},

	Closed: function (id) {
		this.Tabs = this.Tabs.filter(function (tab) {
			return tab !== id;
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
