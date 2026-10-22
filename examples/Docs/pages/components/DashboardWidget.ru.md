<!-- generated -->
# DashboardWidget

Виджет сетки Dashboard. Span (от 1 до 4 колонок) и Rows (от 1 до 3) задают размер; на узкой панели каждый виджет занимает всю строку. Слоты: по умолчанию (тело), actions (справа от заголовка), footer.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Note` | `''` |
| `Span` | `1` |
| `Rows` | `1` |

## Слоты

`actions`, по умолчанию, `footer`

## Пример

```example
<div class="docs-frame">
	<Dashboard>
		<DashboardWidget Title="Sales" Icon="chart" Note="Last 12 weeks" Span="2">
			<Button slot="actions" Icon="refresh" Title="Refresh" Variant="ghost" Size="small" />
			<Sparkline [values]="[4, 6, 5, 8, 7, 9, 12, 10, 13, 15, 14, 18]" Width="240" Height="48" Type="area" />
			<span slot="footer" class="elemenx-text small muted">Updated a minute ago</span>
		</DashboardWidget>
		<DashboardWidget Title="Errors" Icon="warning">
			<span class="elemenx-title">3</span>
		</DashboardWidget>
	</Dashboard>
</div>
```
