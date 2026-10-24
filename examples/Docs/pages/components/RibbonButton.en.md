<!-- generated -->
# RibbonButton

A command of a RibbonGroup: <RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" />. Size: large (a 32px icon over the label, a whole column of the group), small (an icon and the label, one row) or icon (the icon alone; Label is its name). Toggle makes it a button that stays pressed (Pressed). Items opens a menu of them (MenuList items); with Split the button runs its own command and only the arrow opens the menu. KeyTip names its key tip. Events: click ({ID, Pressed}), select (the chosen item). The Ribbon also reports every command: command ({ID, Item}).

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Label` | `''` |
| `Icon` | `''` |
| `Size` | `'small'` |
| `Title` | `''` |
| `KeyTip` | `''` |
| `Toggle` | `false` |
| `Pressed` | `false` |
| `Split` | `false` |
| `Items` | `[]` |
| `Disabled` | `false` |

## Events

`click`, `select`

## Example

```example
<div class="docs-frame" style="height: 150px;">
	<Ribbon Collapsible="false" (command)="Command">
		<RibbonTab ID="home" Title="Home">
			<RibbonGroup Title="Sizes">
				<RibbonButton ID="paste" Label="Large" Icon="paste" Size="large" />
				<RibbonButton ID="cut" Label="Small" Icon="cut" />
				<RibbonButton ID="copy" Label="Icon" Icon="copy" Size="icon" />
			</RibbonGroup>
			<RibbonGroup Title="Menus">
				<RibbonButton ID="new" Label="Split" Icon="add" Size="large" Split="true" [items]="[{ID: 'document', Label: 'Document'}, {ID: 'sheet', Label: 'Sheet'}]" />
				<RibbonButton ID="export" Label="Menu" Icon="download" Size="large" [items]="[{ID: 'pdf', Label: 'PDF'}, {ID: 'html', Label: 'HTML'}]" />
			</RibbonGroup>
			<RibbonGroup Title="Toggle">
				<RibbonButton ID="bold" Label="Bold" Icon="bold" Size="large" Toggle="true" [pressed]="Bold" (click)="Toggled" />
			</RibbonGroup>
		</RibbonTab>
	</Ribbon>
</div>
<p class="elemenx-text small">Last command: {{Last}} · Bold: {{Bold ? 'on' : 'off'}}</p>
<script>
({
	Last: '—',
	Bold: false,

	Command: function (event) {
		this.Last = event.ID + (event.Item && event.Item.ID ? ' / ' + event.Item.ID : '');
	},

	Toggled: function (event) {
		this.Bold = event.Pressed;
	}
})
</script>
```
