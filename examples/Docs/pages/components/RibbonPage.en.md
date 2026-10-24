<!-- generated -->
# RibbonPage

A page of a RibbonBackstage: <RibbonPage ID="open" Title="Open" Icon="folder-open"> with its content. A page with Command is not a page but a command in the list of the backstage (Save, Print): it runs (command event of the Ribbon) and closes the backstage.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Title` | `''` |
| `Icon` | `''` |
| `Command` | `false` |

## Slots

default

## Example

```example
<p class="elemenx-text small">The File button opens the backstage over the Workspace of the Ribbon; the back button or Escape closes it. Print is a command, not a page.</p>
<div class="docs-frame" style="height: 240px;">
	<Workspace Variant="ribbon">
		<Ribbon slot="ribbon" Collapsible="false" (command)="Command" (backstage)="Toggled">
			<RibbonBackstage slot="backstage" Title="File" [page]="Page" (page)="Paged">
				<RibbonPage ID="info" Title="Info" Icon="info">
					<p class="elemenx-text">Report.docx · 12 KB · edited 5 minutes ago.</p>
				</RibbonPage>
				<RibbonPage ID="open" Title="Open" Icon="folder-open">
					<p class="elemenx-text">Recent: Report.docx, Notes.docx.</p>
				</RibbonPage>
				<RibbonPage ID="print" Title="Print" Icon="print" Command="true" />
			</RibbonBackstage>
			<RibbonTab ID="home" Title="Home">
				<RibbonGroup Title="Clipboard"><RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" /></RibbonGroup>
			</RibbonTab>
		</Ribbon>
		<div slot="main" class="elemenx-column fill" style="padding: 12px;"><p class="elemenx-text small">Backstage: {{Open ? 'open, page ' + Page : 'closed'}} · last command: {{Last}}</p></div>
	</Workspace>
</div>
<script>
({
	Page: 'info',
	Open: false,
	Last: '—',

	Paged: function (event) {
		this.Page = event.ID;
	},

	Toggled: function (event) {
		this.Open = event.Open;
	},

	Command: function (event) {
		this.Last = event.ID;
	}
})
</script>
```
