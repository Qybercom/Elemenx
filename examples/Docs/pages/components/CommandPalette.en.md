<!-- generated -->
# CommandPalette

A command palette: a search over the actions of the application, opened by Hotkey ('Mod+K' by default; '' for none) or by Open. Commands: [{ID, Label, Icon, Group, Keys, Hint, Keywords, Disabled, Run}]: Keys shows the shortcut of the command, Keywords are more words to find it by, Run(command) is called when it is chosen. IncludeHotkeys adds every shortcut of the Hotkeys Service that has a Description. The search is fuzzy: the letters of the query in their order, best at the starts of words; the matched letters are marked. With no query the recently used commands come first (Remember: a localStorage key that keeps them between visits). Keys: arrows, Page Up and Down, Home and End move; Enter runs; Escape closes. Events: run (the command), close.

## Properties

| Property | Default |
| --- | --- |
| `Commands` | `[]` |
| `Open` | `false` |
| `Hotkey` | `'Mod+K'` |
| `IncludeHotkeys` | `false` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `Remember` | `''` |
| `Limit` | `50` |

## Events

`close`, `run`

## Methods

- `Run(index)`

## Example

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
