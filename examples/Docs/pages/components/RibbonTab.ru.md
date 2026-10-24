<!-- generated -->
# RibbonTab

Вкладка Ribbon: <RibbonTab ID="home" Title="Home"> с дочерними RibbonGroup. KeyTip задаёт её подсказку клавиши (по умолчанию буква Title). Contextual делает её вкладкой, появляющейся вместе со своим объектом (поставьте на неё *if), в цвете Color, с подписью Context ('Работа с таблицами'). Лента читает её и показывает её панель, пока она текущая.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Title` | `''` |
| `KeyTip` | `''` |
| `Contextual` | `false` |
| `Context` | `''` |
| `Color` | `''` |
| `Disabled` | `false` |

## Слоты

по умолчанию

## Пример

```example
<div class="docs-frame" style="height: 150px;">
	<Ribbon Collapsible="false" [tab]="Tab" (tab)="Changed">
		<RibbonTab ID="home" Title="Home" KeyTip="H">
			<RibbonGroup Title="Clipboard"><RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" /></RibbonGroup>
		</RibbonTab>
		<RibbonTab ID="view" Title="View" KeyTip="W">
			<RibbonGroup Title="Zoom"><RibbonButton ID="zoom" Label="Zoom" Icon="search" Size="large" /></RibbonGroup>
		</RibbonTab>
		<RibbonTab ID="review" Title="Review" Disabled="true"></RibbonTab>
		<RibbonTab ID="table" Title="Table design" Contextual="true" Context="Table tools" Color="#3f6c9e" *if="Selected">
			<RibbonGroup Title="Rows"><RibbonButton ID="row" Label="Insert a row" Icon="add" Size="large" /></RibbonGroup>
		</RibbonTab>
	</Ribbon>
</div>
<Toggle Label="A table is selected: its contextual tab shows" [checked]="Selected" (change)="Selecting" />
<p class="elemenx-text small">The tab: {{Tab}}</p>
<script>
({
	Tab: 'home',
	Selected: false,

	Changed: function (event) {
		this.Tab = event.ID;
	},

	Selecting: function (value) {
		this.Selected = value;
	}
})
</script>
```
