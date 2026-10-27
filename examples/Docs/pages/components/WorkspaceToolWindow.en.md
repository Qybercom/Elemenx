<!-- generated -->
# WorkspaceToolWindow

A tool window for a Workspace area: a title bar with actions (slot "actions") above a scrolling body (default slot). With an ID, in the slot tools of a Workspace, the frame places it: Area (left, right or bottom) is where it starts, Open opens it at first, Icon and Badge make its button on the stripe (Badge: a count, 'dot', 'busy'...). Its close button then closes its area.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Closable` | `false` |
| `Padded` | `false` |
| `ID` | `''` |
| `Area` | `'left'` |
| `Open` | `false` |
| `Badge` | `''` |

## Events

- `close`: Its close button was pressed.

## Slots

`actions`, default

## Example

```example
<div class="docs-frame">
	<Workspace Persist="docs-tools">
		<div slot="main" class="elemenx-column fill" style="padding: 12px;"><p class="elemenx-text small muted">Press a button of a stripe to open its tool window.</p></div>
		<WorkspaceToolWindow slot="tools" ID="project" Title="Project" Icon="folder" Area="left" Open="true" Closable="true" Padded="true">
			<p class="elemenx-text small">application, libraries, README.md</p>
		</WorkspaceToolWindow>
		<WorkspaceToolWindow slot="tools" ID="commits" Title="Commits" Icon="commit" Area="left" Badge="3" Closable="true" Padded="true">
			<p class="elemenx-text small">Three changes wait.</p>
		</WorkspaceToolWindow>
		<WorkspaceToolWindow slot="tools" ID="problems" Title="Problems" Icon="warning" Area="bottom" Badge="dot" Closable="true" Padded="true">
			<Button slot="actions" Icon="refresh" Title="Check again" Variant="ghost" Size="small" />
			<p class="elemenx-text small">Something new happened.</p>
		</WorkspaceToolWindow>
	</Workspace>
</div>
```
