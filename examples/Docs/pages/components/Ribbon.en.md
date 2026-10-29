<!-- generated -->
# Ribbon

A ribbon of commands, as in Microsoft Office: tabs of RibbonTab, each with RibbonGroup groups of RibbonButton, RibbonGallery and any other controls, declared in the template:

<Ribbon [tab]="Tab" (tab)="TabChanged" (command)="Run"> <RibbonTab ID="home" Title="Home"><RibbonGroup Title="Clipboard">...</RibbonGroup></RibbonTab> </Ribbon>

Slots: quick (the quick access toolbar, before the tabs), end (after them: a search, a share button) and backstage (a RibbonBackstage: the File button opens it over the Workspace of the Ribbon, or over the window without one). Tab is the current tab (the first one that is not contextual by default). A narrow Ribbon shrinks its groups step by step (see RibbonGroup). Collapsed shows only the tabs: a tab then opens its panel over the page until a command runs; a double click on a tab, the pin button or Ctrl+F1 collapse and pin it. When even the narrow bar has no room for the tabs, a button with the title of the current tab takes their place and lists them. Key tips: Alt (or F10) shows a letter on every tab, the File button and the quick access commands; a letter opens its tab and shows the letters of its commands; a letter of a command runs it; Escape goes back a level. Events: tab ({ID}), command ({ID, Item}) for every RibbonButton, RibbonGallery and command page, collapse ({Collapsed}), backstage ({Open}).

## Properties

| Property | Default |
| --- | --- |
| `Tab` | `''` |
| `Collapsed` | `false` |
| `Collapsible` | `true` |
| `KeyTips` | `true` |
| `Label` | `''` |
| `FileLabel` | `''` |
| `FileKeyTip` | `'F'` |

## Events

- `tab`: Another tab was opened: {ID}.
- `collapse`: It was collapsed or pinned: {Collapsed}.
- `command`: A command of any of its controls ran: {ID, Item}.
- `backstage`: The backstage opened or closed: {Open}.

## Slots

`quick`, `end`, default, `backstage`

## Example

```example
<div class="docs-frame" style="height: 220px;">
	<Workspace Variant="ribbon">
		<div slot="header" class="elemenx-container fill" style="gap: 8px;"><Icon Name="files:docx" Size="16" /><span class="elemenx-spacer"></span><span class="elemenx-label">Report.docx — Writer</span><span class="elemenx-spacer"></span></div>
		<Ribbon slot="ribbon" [tab]="Tab" (tab)="TabChanged" (command)="Command">
			<RibbonButton slot="quick" ID="save" Label="Save" Icon="save" Size="icon" />
			<RibbonButton slot="quick" ID="undo" Label="Undo" Icon="undo" Size="icon" />
			<RibbonButton slot="end" ID="share" Label="Share" Icon="share" />
			<RibbonBackstage slot="backstage" Title="File">
				<RibbonPage ID="info" Title="Info" Icon="info">
					<p class="elemenx-text">Report.docx · 12 KB · edited 5 minutes ago.</p>
				</RibbonPage>
				<RibbonPage ID="open" Title="Open" Icon="folder-open">
					<p class="elemenx-text">Recent: Report.docx, Notes.docx.</p>
				</RibbonPage>
				<RibbonPage ID="print" Title="Print" Icon="print" Command="true" />
			</RibbonBackstage>

			<RibbonTab ID="home" Title="Home" KeyTip="H">
				<RibbonGroup Title="Clipboard" Icon="paste" Launcher="true" Priority="2" (launch)="Launched">
					<RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" Split="true" [items]="[{ID: 'paste-text', Label: 'Paste as text'}, {ID: 'paste-special', Label: 'Paste special...'}]" />
					<RibbonButton ID="cut" Label="Cut" Icon="cut" />
					<RibbonButton ID="copy" Label="Copy" Icon="copy" />
				</RibbonGroup>
				<RibbonGroup Title="Font" Icon="text-color" Priority="1">
					<div class="elemenx-ribbon-row">
						<RibbonButton ID="bold" Label="Bold" Icon="bold" Size="icon" Toggle="true" [pressed]="Bold" (click)="BoldToggled" />
						<RibbonButton ID="italic" Label="Italic" Icon="italic" Size="icon" Toggle="true" />
						<RibbonButton ID="underline" Label="Underline" Icon="underline" Size="icon" Toggle="true" />
					</div>
				</RibbonGroup>
				<RibbonGroup Title="Styles" Icon="color" Priority="3">
					<RibbonGallery ID="style" Label="Styles" Columns="3" [items]="Styles" [value]="Style" (select)="StyleChosen" />
				</RibbonGroup>
			</RibbonTab>
			<RibbonTab ID="insert" Title="Insert" KeyTip="N">
				<RibbonGroup Title="Illustrations" Icon="image">
					<RibbonButton ID="picture" Label="Pictures" Icon="image" Size="large" />
					<RibbonButton ID="chart" Label="Chart" Icon="chart" Size="large" />
				</RibbonGroup>
			</RibbonTab>
			<RibbonTab ID="table" Title="Table design" Contextual="true" Context="Table tools" Color="#3f6c9e" *if="TableSelected">
				<RibbonGroup Title="Rows" Icon="table">
					<RibbonButton ID="row-above" Label="Insert above" Icon="arrow-up" />
					<RibbonButton ID="row-below" Label="Insert below" Icon="arrow-down" />
				</RibbonGroup>
			</RibbonTab>
		</Ribbon>
		<div slot="main" class="elemenx-column fill" style="padding: 12px;"><p class="elemenx-text small">Last command: {{Last}} · Alt shows the key tips</p><Toggle Label="A table is selected (its contextual tab shows)" [checked]="TableSelected" (change)="TableToggled" /></div>
	</Workspace>
</div>
<script>
({
	Tab: 'home',
	Bold: false,
	Last: '—',
	Style: 'normal',
	TableSelected: false,
	Styles: [
		{ID: 'normal', Label: 'Normal', Preview: 'AaBbCc'},
		{ID: 'heading', Label: 'Heading', Preview: 'AaBb', Style: 'font-size: 16px; font-weight: 600; color: var(--elemenx-info)'},
		{ID: 'title', Label: 'Title', Preview: 'Aa', Style: 'font-size: 20px'},
		{ID: 'quote', Label: 'Quote', Preview: 'AaBbC', Style: 'font-style: italic'}
	],

	TabChanged: function (event) {
		this.Tab = event.ID;
	},

	Command: function (event) {
		this.Last = event.ID + (event.Item && event.Item.ID ? ' / ' + event.Item.ID : '');
	},

	BoldToggled: function (event) {
		this.Bold = event.Pressed;
	},

	StyleChosen: function (event) {
		this.Style = event.ID;
	},

	Launched: function () {
		this.Last = 'the dialog of the group Clipboard';
	},

	TableToggled: function (value) {
		this.TableSelected = value;
	}
})
</script>
```

## Tests

- [Ribbon: the first control of the panel a person can see, after ArrowDown on its tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L84) — `tests/regression/focus-on-open.test.js`
- [adds components from the Insert tab of its Ribbon, edits their props and text, and undoes and redoes the changes](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L142) — `tests/examples/builder.spec.js`
- [drops components from the Ribbon where the line shows, with words saying where, and moves elements by the grip of the selection](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L213) — `tests/examples/builder.spec.js`
- [moves elements in the structure by dragging them, and takes a kind dragged from the Ribbon into it](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L561) — `tests/examples/builder.spec.js`
- [opens a group of the Ribbon over the canvas, its rulers and the handles of the panels](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L1555) — `tests/examples/builder.spec.js`
- [embeds in ElemenxUI its styles, sprites, data and every entity with its template and style](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/dist.test.js#L47) — `tests/regression/dist.test.js`
- [ribbon switches tabs, runs commands, menus and galleries, and shows a contextual tab](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L579) — `tests/examples/ui-kit.spec.js`
- [ribbon shrinks its groups to fit, folds them into buttons and collapses to its tabs](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L649) — `tests/examples/ui-kit.spec.js`
- [ribbon key tips open tabs and run commands from the keyboard, and the backstage opens over the window](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L763) — `tests/examples/ui-kit.spec.js`
