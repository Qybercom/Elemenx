<!-- generated -->
# TabSplit

Groups of tabs side by side and one over another, as the editors of a code editor: a TabGroup in each part, the dividers between them dragged to share the room. The tabs are declared in it with their content (Tab); their layout is declared too, or comes from Layout: <TabSplit> <TabRow Sizes="25,75"> <TabGroup Group="side"><Tab ID="files" Label="Files" Pinned="true">...</Tab></TabGroup> <TabColumn><TabGroup><Tab ID="main.js" Label="main.js">...</Tab></TabGroup><TabGroup>...</TabGroup></TabColumn> </TabRow> </TabSplit> Tabs declared out of a TabGroup go to the first group. Layout is the same as a model, and change tells it each time it changes, so an Application keeps it and gives it back: {Split: 'row' or 'column', Sizes: [percents], Children} of {Group, Tabs: [IDs], Active, Pinned: [IDs]}. A tab declared later opens in the group of the focus, current. A tab is dragged to another group, or to an edge of one to split it there; the menu of a tab splits its group to a side with it (a group of one tab stays as it is). A group left with no tab goes, and its room goes to the others. Its parts keep their content as they move: their panels go from group to group, never made again. Events: change (the layout), select (the ID of the tab opened), close (the ID of a tab that asks to close: the owner takes its Tab away; until it does the tab stays out of the groups). Methods: Open(id), Close(id), Split(id, side), Model().

## Properties

| Property | Default |
| --- | --- |
| `Layout` | `null` |
| `Closable` | `false` |
| `Label` | `''` |

## Events

- `change`: The layout changed: {Split, Sizes, Children} of {Group, Tabs, Active, Pinned}.
- `select`: A tab was opened: its ID.
- `close`: A tab asks to close: its ID (the owner takes its Tab away).

## Slots

default

## Methods

- `Model()`
- `Open(id)`
- `Close(id)`
- `Split(id, side, beside)`

## Example

```example
<div style="height: 320px; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius); overflow: hidden;">
	<TabSplit Closable="true" (change)="Changed" (close)="Closed">
		<TabRow Sizes="30,70">
			<TabGroup Group="side">
				<Tab ID="files" Label="Files" Icon="folder" Pinned="true"><p class="elemenx-text small" style="margin: 0; padding: 12px;">Pinned: a close of the others leaves it.</p></Tab>
			</TabGroup>
			<TabColumn Sizes="60,40">
				<TabGroup Group="main">
					<Tab *for="file of Files" *key="file" [id]="file" [label]="file" Icon="file-code"><p class="elemenx-text small" style="margin: 0; padding: 12px;">The text of {{file}}. Drag its tab to an edge, or split it from its menu.</p></Tab>
				</TabGroup>
				<TabGroup Group="bottom">
					<Tab ID="console" Label="Console" Icon="terminal"><p class="elemenx-text small" style="margin: 0; padding: 12px;">Ready.</p></Tab>
				</TabGroup>
			</TabColumn>
		</TabRow>
	</TabSplit>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Files: ['app.js', 'index.html', 'styles.css'],
	Note: 'The layout: three groups.',

	Changed: function (layout) {
		this.Note = 'The layout: ' + JSON.stringify(layout);
	},

	Closed: function (id) {
		this.Files = this.Files.filter(function (file) {
			return file !== id;
		});
	}
})
</script>
```

## Tests

- [a TabGroup shows its declared tabs, the pinned ones first and without a cross, and its menu closes the others but the pinned](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L45) — `tests/regression/library-tab-split.test.js`
- [a TabSplit lays out the groups it declares side by side, each with its tabs, and splits a group to a side with a tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L94) — `tests/regression/library-tab-split.test.js`
- [a tab dropped in the middle of another group goes into it, and a group left without a tab goes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L134) — `tests/regression/library-tab-split.test.js`
- [takes the layout of Layout, closes a tab for its owner, and moves a divider by its keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L166) — `tests/regression/library-tab-split.test.js`
