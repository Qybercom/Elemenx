<!-- generated -->
# RibbonGroup

A group of commands of a RibbonTab: <RibbonGroup Title="Clipboard" Icon="paste">. Its commands fill columns of three rows: a large RibbonButton takes a whole column, small buttons and other controls stack three to a column. When the Ribbon is too narrow it shrinks its groups step by step, the lowest Priority first and the rightmost of equal ones: large buttons become small, then the labels go, then the group becomes one button (Icon and Title) that opens its commands in a panel. Keep never shrinks the group (a search field, what the tab is for): the panel scrolls instead once the others are one button each. Launcher adds the small button at the corner of the title that opens the full options of the group: event launch.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Priority` | `0` |
| `Keep` | `false` |
| `Launcher` | `false` |

## Events

`launch`

## Slots

default

## Example

```example
<p class="elemenx-text small">Make the frame narrower (drag its corner): the group of the lowest Priority shrinks first, into one button that opens it. The arrow at the corner of Clipboard is its Launcher.</p>
<div class="docs-frame" style="height: 150px; resize: horizontal; min-width: 160px;">
	<Ribbon Collapsible="false" (command)="Command">
		<RibbonTab ID="home" Title="Home">
			<RibbonGroup Title="Clipboard" Icon="paste" Priority="3" Launcher="true" (launch)="Launched">
				<RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" />
				<RibbonButton ID="cut" Label="Cut" Icon="cut" />
				<RibbonButton ID="copy" Label="Copy" Icon="copy" />
			</RibbonGroup>
			<RibbonGroup Title="Insert" Icon="add" Priority="2">
				<RibbonButton ID="picture" Label="Picture" Icon="image" Size="large" />
				<RibbonButton ID="table" Label="Table" Icon="table" Size="large" />
			</RibbonGroup>
			<RibbonGroup Title="Share" Icon="share" Priority="1">
				<RibbonButton ID="mail" Label="Mail" Icon="mail" Size="large" />
				<RibbonButton ID="link" Label="Link" Icon="link" Size="large" />
			</RibbonGroup>
		</RibbonTab>
	</Ribbon>
</div>
<p class="elemenx-text small">Last: {{Last}}</p>
<script>
({
	Last: '—',

	Command: function (event) {
		this.Last = event.ID;
	},

	Launched: function () {
		this.Last = 'the launcher of Clipboard';
	}
})
</script>
```
