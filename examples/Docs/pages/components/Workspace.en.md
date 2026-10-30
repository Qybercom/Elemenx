<!-- generated -->
# Workspace

An IDE-like application frame built on elemenx-screen, elemenx-container and elemenx-column. Slots: header, ribbon (a Ribbon under the header), top-stripe (a band under them), left-stripe, left, main, bottom, right, right-stripe, bottom-stripe (a band above the status bar) and status. Variant="ribbon" makes the frame of an Office-like Application: the header becomes a slim title bar that joins the Ribbon. The frame does not decide its content: an area shows only while its slot renders something (put *if on a tool window to open and close it), and the left, right and bottom areas are resized by their edge; the resize event reports {Panel, Size}. On a narrow screen the main area keeps 320 pixels (--elemenx-workspace-main-min) and the frame scrolls across to the panels; in a frame of 720 pixels or less the main area takes the whole width and the left and right panels open over it (a press on the main area closes the tool windows the frame placed there).

Tool windows the user arranges: a WorkspaceToolWindow with an ID in the slot tools is placed by the frame. Its Area (left, right or bottom) is where it starts; a button on the stripe of that side (its Icon, Title and Badge: a count, 'dot', 'busy'...) opens and closes it, one tool window open in an area at a time (Open opens it at first). While Customize is on, the buttons are dragged from stripe to stripe (the lower part of the left stripe is the bottom area) and in their order: the tool window goes with its button. Layout is the arrangement: {Areas: {id: area}, Order: [id], Open: {left, right, bottom: id or null}, Sizes: {left, right, bottom: pixels}}; every change of it (a move, an opening, a resize) emits layout with the new one, and Persist (a key) keeps it in the storage of the browser for the next visit. ResetLayout() goes back to the areas of the tool windows.

## Properties

| Property | Default |
| --- | --- |
| `Variant` | `''` |
| `Layout` | `null` |
| `Persist` | `''` |
| `Customize` | `false` |

## Events

- `layout`: The arrangement of the tool windows changed (moved, opened, closed, resized): Layout, {Areas, Order, Open, Sizes}.
- `resize`: A panel was resized by its edge: {Panel, Size}.

## Slots

`header`, `ribbon`, `top-stripe`, `left-stripe`, `left`, `main`, `bottom`, `right`, `right-stripe`, `bottom-stripe`, `status`, `tools`

## Methods

- `ResetLayout()`

## Example

```example
<div class="docs-frame tall">
	<Workspace (resize)="Resized">
		<WorkspaceToolbar slot="header" Label="Main toolbar">
			<strong>Elemenx IDE</strong>
			<span class="elemenx-divider vertical"></span>
			<Button Icon="play" Title="Run" Variant="ghost" Size="small" />
			<Button Icon="debug" Title="Debug" Variant="ghost" Size="small" />
			<span class="elemenx-spacer"></span>
			<Button Icon="panel-left" Title="Project" Variant="ghost" Size="small" (click)="ToggleLeft" />
			<Button Icon="panel-bottom" Title="Terminal" Variant="ghost" Size="small" (click)="ToggleBottom" />
		</WorkspaceToolbar>
		<WorkspaceToolWindow slot="left" *if="Left" Title="Project" Icon="folder" Closable="true" (close)="ToggleLeft">
			<Tree [items]="Files" [expanded]="['src']" />
		</WorkspaceToolWindow>
		<div slot="main" class="elemenx-column fill"><CodeView Language="javascript" Value="Elemenx.Component('Hello', {&#10;&#9;Name: 'world'&#10;});" /></div>
		<WorkspaceToolWindow slot="bottom" *if="Bottom" Title="Terminal" Icon="terminal" Closable="true" (close)="ToggleBottom">
			<Terminal [lines]="[{ID: 1, Kind: 'success', Text: 'Test Files  52 passed (52)'}]" />
		</WorkspaceToolWindow>
		<span slot="status">main · {{Note}}</span>
	</Workspace>
</div>
<script>
({
	Left: true,
	Bottom: true,
	Note: 'UTF-8',
	Files: [
		{ID: 'src', Label: 'src', Icon: 'folder-open', Items: [
			{ID: 'app', Label: 'app.js', Icon: 'file-code'},
			{ID: 'style', Label: 'style.css', Icon: 'file-code'}
		]},
		{ID: 'readme', Label: 'README.md', Icon: 'file-text'}
	],

	ToggleLeft: function () {
		this.Left = !this.Left;
	},

	ToggleBottom: function () {
		this.Bottom = !this.Bottom;
	},

	Resized: function (event) {
		this.Note = event.Panel + ' ' + event.Size + 'px';
	}
})
</script>
```

## Tests

- [a workspace places its tool windows by their buttons on the stripes; in Customize they are dragged to another side, and the layout is kept](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1667) — `tests/examples/ui-kit.spec.js`
- [radio groups and tab strips with their own state do not affect each other](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L4291) — `tests/examples/ui-kit.spec.js`
- [workspace shows the tool windows the page puts in it and resizes them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5460) — `tests/examples/ui-kit.spec.js`
