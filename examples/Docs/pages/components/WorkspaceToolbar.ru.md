<!-- generated -->
# WorkspaceToolbar

Ряд действий для шапки Workspace или любой панели: кнопки, меню, поля, разделители (<span class="elemenx-divider vertical"></span>) и распорки (<span class="elemenx-spacer"></span>), сдвигающие следующее к концу. Vertical ставит его вертикально. Label называет его для экранных читалок (role toolbar).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Vertical` | `false` |

## Слоты

по умолчанию

## Пример

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
