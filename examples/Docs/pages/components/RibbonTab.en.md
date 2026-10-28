<!-- generated -->
# RibbonTab

A tab of a Ribbon: <RibbonTab ID="home" Title="Home"> with RibbonGroup children. KeyTip names its key tip (a letter of the Title by default). Contextual makes it a tab that shows with its object (put *if on it), in its Color, with Context as its caption ('Table tools'). The Ribbon reads it and shows its panel while it is the current tab.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Title` | `''` |
| `KeyTip` | `''` |
| `Contextual` | `false` |
| `Context` | `''` |
| `Color` | `''` |
| `Disabled` | `false` |

## Slots

default

## Example

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

## Tests

- [Ribbon: the first control of the panel a person can see, after ArrowDown on its tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L84) — `tests/regression/focus-on-open.test.js`
