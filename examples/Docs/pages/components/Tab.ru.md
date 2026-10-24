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
