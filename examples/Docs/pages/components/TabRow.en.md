<!-- generated -->
# TabRow

A part of the layout of a TabSplit declared in its template: the groups and the splits in it side by side, Sizes their shares in percents ('25,75'; equal without it). It shows nothing of its own: the TabSplit reads it.

## Properties

| Property | Default |
| --- | --- |
| `Sizes` | `''` |

## Slots

default

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

- [a TabSplit lays out the groups it declares side by side, each with its tabs, and splits a group to a side with a tab](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L94) — `tests/regression/library-tab-split.test.js`
- [a tab dropped in the middle of another group goes into it, and a group left without a tab goes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tab-split.test.js#L134) — `tests/regression/library-tab-split.test.js`
