<!-- generated -->
# CommandPalette

Палитра команд: поиск по действиям приложения, открывается сочетанием Hotkey (по умолчанию 'Mod+K'; '' — без него) или через Open. Commands: [{ID, Label, Icon, Group, Keys, Hint, Keywords, Disabled, Run}]: Keys показывает сочетание клавиш команды, Keywords — дополнительные слова для поиска, Run(command) вызывается при выборе. IncludeHotkeys добавляет все сочетания сервиса Hotkeys, у которых есть Description. Поиск нечёткий: буквы запроса по порядку, лучше всего — в начале слов; совпавшие буквы выделены. Без запроса сначала идут недавние команды (Remember — ключ localStorage, хранящий их между визитами). Клавиши: стрелки, Page Up и Page Down, Home и End двигают, Enter запускает, Escape закрывает. События: run (команда), close.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Commands` | `[]` |
| `Open` | `false` |
| `Hotkey` | `'Mod+K'` |
| `IncludeHotkeys` | `false` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `Remember` | `''` |
| `Limit` | `50` |

## События

- `close`: Закрылась (Escape, снова горячая клавиша, нажатие снаружи или выполненная команда).
- `run`: Выбрана команда: сама команда (её Run тоже вызывается).

## Методы

- `Run(index)`

## Пример

```example
<Button Label="Open the palette" Icon="search" (click)="Show" />
<span class="elemenx-text small muted">or press Ctrl+K · last command: {{Last || '—'}}</span>
<CommandPalette [commands]="Commands" [open]="Open" Remember="docs-palette" (run)="Ran" (close)="Closed" />
<script>
({
	Open: false,
	Last: '',
	Commands: [
		{ID: 'new', Label: 'New document', Icon: 'add', Group: 'File', Keys: 'Mod+N'},
		{ID: 'open', Label: 'Open a file', Icon: 'folder-open', Group: 'File', Keys: 'Mod+O', Keywords: 'load browse'},
		{ID: 'save', Label: 'Save', Icon: 'save', Group: 'File', Keys: 'Mod+S'},
		{ID: 'theme', Label: 'Switch the theme', Icon: 'sun', Group: 'View', Keywords: 'dark light'},
		{ID: 'zoom', Label: 'Zoom in', Icon: 'zoom-in', Group: 'View', Disabled: true}
	],

	Show: function () {
		this.Open = true;
	},

	Ran: function (command) {
		this.Last = command.Label;
	},

	Closed: function () {
		this.Open = false;
	}
})
</script>
```
