<!-- generated -->
# Dashboard

A dashboard layout built on elemenx-screen, elemenx-container and elemenx-column. Slots: nav (the sidebar, often a NavList), header, default (the content: a responsive grid of DashboardWidget elements; any element with the class elemenx-dashboard-wide takes a full row), footer. An area shows only while its slot renders something; the sidebar narrows by itself around a collapsed NavList.

## Slots

`nav`, `header`, default, `footer`

## Example

```example
<div class="docs-frame tall">
	<Dashboard>
		<NavList slot="nav" [items]="Nav" [value]="Page" (select)="Picked" />
		<div slot="header" class="elemenx-container fill" style="gap: 8px;"><strong>{{Title}}</strong><span class="elemenx-spacer"></span><Input Shape="round" Icon="search" Placeholder="Search" Size="small" /></div>
		<DashboardWidget Title="Revenue" Icon="cart" Note="This month">
			<span class="elemenx-title">$48,200</span>
			<Meter Value="72" Low="30" High="80" Optimum="100" Label="Target" Unit="%" />
		</DashboardWidget>
		<DashboardWidget Title="Users" Icon="users">
			<span class="elemenx-title">1,284</span>
			<span class="elemenx-text small muted">+12% since last week</span>
		</DashboardWidget>
		<DashboardWidget Title="Builds" Icon="play" Span="2">
			<Progress Value="84" Label="Passing" ShowValue="true" Tone="success" />
			<Progress Value="12" Label="Flaky" ShowValue="true" Tone="warning" />
		</DashboardWidget>
	</Dashboard>
</div>
<script>
({
	Page: 'overview',
	Title: 'Overview',
	Nav: [
		{ID: 'overview', Label: 'Overview', Icon: 'home'},
		{ID: 'projects', Label: 'Projects', Icon: 'folder', Badge: 12},
		{ID: 'people', Label: 'People', Icon: 'users'},
		{ID: 'settings', Label: 'Settings', Icon: 'settings'}
	],

	Picked: function (item) {
		this.Page = item.ID;
		this.Title = item.Label;
	}
})
</script>
```
