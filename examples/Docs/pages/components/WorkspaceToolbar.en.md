<!-- generated -->
# WorkspaceToolbar

A row of actions for the header of a Workspace or any bar: buttons, menus, fields, separators (<span class="elemenx-divider vertical"></span>) and spacers (<span class="elemenx-spacer"></span>) that push what follows to the end. Vertical stands it upright. Label names it for screen readers (role toolbar).

## Properties

| Property | Default |
| --- | --- |
| `Label` | `''` |
| `Vertical` | `false` |

## Slots

default

## Example

```example
<WorkspaceToolbar Label="Editor toolbar">
	<Button Icon="save" Title="Save" Variant="ghost" Size="small" />
	<Button Icon="undo" Title="Undo" Variant="ghost" Size="small" />
	<span class="elemenx-divider vertical"></span>
	<Menu Label="View" Size="small" Variant="ghost" [items]="[{ID: 'zoom-in', Label: 'Zoom in'}, {ID: 'zoom-out', Label: 'Zoom out'}]" />
	<span class="elemenx-spacer"></span>
	<Button Label="Run" Icon="play" Variant="primary" Size="small" />
</WorkspaceToolbar>
```
