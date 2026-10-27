<!-- generated -->
# WorkspaceToolWindow

Окно инструмента для области Workspace: строка заголовка с действиями (слот "actions") над прокручиваемым телом (слот по умолчанию). С ID, в слоте tools рамки Workspace, его размещает рамка: Area (left, right или bottom) — откуда оно начинает, Open открывает его сразу, Icon и Badge образуют его кнопку на полосе (Badge: счётчик, 'dot', 'busy'...). Тогда его кнопка закрытия закрывает его область.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Closable` | `false` |
| `Padded` | `false` |
| `ID` | `''` |
| `Area` | `'left'` |
| `Open` | `false` |
| `Badge` | `''` |

## События

- `close`: Нажата кнопка закрытия.

## Слоты

`actions`, по умолчанию

## Пример

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
