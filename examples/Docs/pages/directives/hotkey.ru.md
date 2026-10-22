<!-- generated -->
# *hotkey

*hotkey="'Mod+S'" (или *hotkey="{Keys: 'Mod+S', Scope: 'local', Description: 'Save', Group: 'File'}") нажимает элемент при нажатии клавиш, если он не отключён и не скрыт, и задаёт его aria-keyshortcuts. Scope 'local' ограничивает сочетание фокусом внутри ближайших к элементу раздела, диалога или формы. Использует сервис Hotkeys.

## Пример

```example
<Button Label="Save" Icon="save" *hotkey="'Mod+Shift+S'" (click)="Saved" />
<Button Label="Refresh" Icon="refresh" *hotkey="{Keys: 'Mod+Shift+R', Description: 'Refresh the list', Group: 'Docs'}" (click)="Refreshed" />
<p class="elemenx-text">Press <kbd class="elemenx-kbd">Ctrl+Shift+S</kbd> or <kbd class="elemenx-kbd">Ctrl+Shift+R</kbd>: {{Note}}</p>
<script>
({
	Note: '—',

	Saved: function () {
		this.Note = 'Save, at ' + new Date().toLocaleTimeString();
	},

	Refreshed: function () {
		this.Note = 'Refresh, at ' + new Date().toLocaleTimeString();
	}
})
</script>
```
