<!-- generated -->
# Tab

Вкладка Tabs, объявленная в его шаблоне вместе с содержимым: <Tab ID="general" Label="Общие">...</Tab>. ID, Label, Icon, Badge, Closable и Disabled описывают её вкладку в полосе (как элементы Tabs); Tabs показывает под полосой содержимое текущей вкладки и прячет остальные. Содержимое внутри вкладки создаётся вместе со страницей; Component называет компонент, который создаётся только при первом открытии вкладки (с Props в качестве свойств), — для дорогого содержимого: страницы настроек, графика, таблицы данных. Её панель — elemenx-tab-panel (её читает сервис Panels).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Icon` | `''` |
| `Badge` | `''` |
| `Closable` | `false` |
| `Disabled` | `false` |
| `Pinned` | `false` |
| `Component` | `''` |
| `Props` | `null` |

## Слоты

по умолчанию

## Пример

```example
<Tabs Label="Settings" [value]="Current" (change)="Changed">
	<Tab ID="profile" Label="Profile" Icon="user">
		<Field Label="Name"><Input Value="Ada Lovelace" /></Field>
	</Tab>
	<Tab ID="sales" Label="Sales" Icon="chart" Component="Chart" [props]="Sales" />
	<Tab ID="archive" Label="Archive" Disabled="true">Nothing here yet.</Tab>
	<Button Icon="add" Title="A new tab" Size="small" Variant="ghost" />
</Tabs>
<p class="elemenx-text small muted">The chart of Sales is made only when its tab first opens.</p>
<script>
({
	Current: 'profile',
	Sales: {Type: 'bar', Labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], Series: [{Name: 'Orders', Values: [12, 19, 8, 15, 22]}]},

	Changed: function (id) {
		this.Current = id;
	}
})
</script>
```

## Тесты

- [declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L470) — `tests/examples/designer.spec.js`
- [sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L506) — `tests/examples/designer.spec.js`
- [text formats keep their characters, normalize the value and show what is wrong](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1416) — `tests/examples/ui-kit.spec.js`
- [a dialog that needs an answer shakes on Escape and the backdrop; Dialogs asks from the code](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4663) — `tests/examples/ui-kit.spec.js`
- [code editor highlights, keeps the indent, closes pairs, completes, comments and shows the messages of its markers](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6129) — `tests/examples/ui-kit.spec.js`
- [a TabGroup shows its declared tabs, the pinned ones first and without a cross, and its menu closes the others but the pinned](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L45) — `tests/regression/library-tab-split.test.js`
- [a TabSplit lays out the groups it declares side by side, each with its tabs, and splits a group to a side with a tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L94) — `tests/regression/library-tab-split.test.js`
- [a tab dropped in the middle of another group goes into it, and a group left without a tab goes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L134) — `tests/regression/library-tab-split.test.js`
- [takes the layout of Layout, closes a tab for its owner, and moves a divider by its keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L166) — `tests/regression/library-tab-split.test.js`
- [a Split of the menu copies the tab into a new group, its content made again, and Split and move takes the tab there](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L221) — `tests/regression/library-tab-split.test.js`
- [stands the strip left or right of the panels, its text turned or level, and moves by Up and Down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tabs.test.js#L37) — `tests/regression/library-tabs.test.js`
