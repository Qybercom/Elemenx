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

- [declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L470) — `tests/examples/builder.spec.js`
- [sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L506) — `tests/examples/builder.spec.js`
- [text formats keep their characters, normalize the value and show what is wrong](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1416) — `tests/examples/ui-kit.spec.js`
- [a dialog that needs an answer shakes on Escape and the backdrop; Dialogs asks from the code](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4321) — `tests/examples/ui-kit.spec.js`
- [code editor highlights, keeps the indent, closes pairs, completes, comments and shows the messages of its markers](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5734) — `tests/examples/ui-kit.spec.js`
- [stands the strip left or right of the panels, its text turned or level, and moves by Up and Down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tabs.test.js#L37) — `tests/regression/library-tabs.test.js`
