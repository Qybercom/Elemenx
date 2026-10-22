<!-- generated -->
# DashboardWidget

A widget of a Dashboard grid. Span (1 to 4 columns) and Rows (1 to 3) set its size; on a narrow dashboard every widget takes a full row. Slots: default (the body), actions (at the right of the title), footer.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Note` | `''` |
| `Span` | `1` |
| `Rows` | `1` |

## Slots

`actions`, default, `footer`

## Example

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
