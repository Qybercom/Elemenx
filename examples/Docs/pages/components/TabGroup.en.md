<!-- generated -->
# TabGroup

A group of tabs: their strip and the content of the current one, as the tabs of the files of an editor. The tabs are declared in it with their content (<Tab ID="readme" Label="README.md">...</Tab>), or given by Items ([{ID, Label, Icon, Badge, Closable, Disabled, Pinned}]: the owner puts the content in its body, as a TabSplit does). Active is the ID of the current tab (the first one while it names none). A Pinned tab stays first in the strip, has no cross, and a close of all the tabs, of the others, or of the ones to a side leaves it. The menu of a tab (its right button, a long press, the key of the menu or Shift+F10) closes it, the others, the ones to its right or its left, or all of them, pins it or unpins it; in a TabSplit (Splittable) it also splits the group to a side with the tab. A tab is dragged to another place of its strip, and in a TabSplit to another group, or to an edge of a group to split it there: the edge it would take shows while it is over it. Keys in the strip: the arrows, Home and End move between the tabs, Delete closes one, the key of the menu opens its menu; Ctrl+Page Down and Ctrl+Page Up anywhere in the group go to the next tab and the one before. Events: select (the ID), close (the ID, once a tab: the owner takes its Tab away), pin ({ID, Pinned}), and with Items, for its owner: order ({ID, Index}), move ({ID, From, Index}: a tab of another group put in its strip), drop ({ID, From, Side: left, right, top, bottom or center}) and split ({ID, Side}). Each detail has Group, its name. In a TabSplit it is also a part of a layout declared in the template: <TabGroup Group="side">...</TabGroup>.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `null` |
| `Active` | `null` |
| `Closable` | `false` |
| `Splittable` | `false` |
| `Group` | `''` |
| `Label` | `''` |

## Events

- `select`: Another tab was opened: its ID.
- `close`: A tab asks to close: its ID (the owner takes its Tab away).
- `pin`: A tab was pinned or unpinned: {ID, Pinned}.
- `split`: With Items: its menu splits the group to a side with the tab: {ID, Side}.
- `move`: With Items: a tab of another group was put in the strip: {ID, From, Index}.
- `order`: With Items: a tab was put at another place of the strip: {ID, Index}.
- `drop`: With Items: a tab was put on the body: {ID, From, Side}.

## Slots

default

## Example

```example
<div style="display: flex; height: 180px; border: 1px solid var(--elemenx-border); border-radius: var(--elemenx-radius); overflow: hidden;">
	<TabGroup Closable="true" Label="Documents" style="flex: 1;" (close)="Closed" (select)="Opened">
		<Tab *for="tab of Tabs" *key="tab" [id]="tab" [label]="tab" [pinned]="tab === 'Notes'"><p class="elemenx-text small" style="margin: 0; padding: 12px;">{{tab}}: its menu closes the others, the ones to a side, or pins it.</p></Tab>
	</TabGroup>
</div>
<p class="elemenx-text small muted">Opened: {{Current}}</p>
<script>
({
	Tabs: ['Notes', 'Plan', 'Budget', 'Ideas'],
	Current: 'Notes',

	Opened: function (id) {
		this.Current = id;
	},

	Closed: function (id) {
		this.Tabs = this.Tabs.filter(function (tab) {
			return tab !== id;
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
