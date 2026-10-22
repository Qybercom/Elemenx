<!-- generated -->
# *hotkey

*hotkey="'Mod+S'" (or *hotkey="{Keys: 'Mod+S', Scope: 'local', Description: 'Save', Group: 'File'}") clicks the element when the keys are pressed, unless it is disabled or hidden, and sets its aria-keyshortcuts. Scope 'local' limits the shortcut to the focus inside the closest section, dialog or form of the element. Uses the Hotkeys Service.

## Example

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
