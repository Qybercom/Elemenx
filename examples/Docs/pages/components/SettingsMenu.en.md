<!-- generated -->
# SettingsMenu

A menu of settings as on a phone: rows in groups, each with an Icon on a tile of its Color, a Label, a Description under it, a Value and a chevron to the submenu of its Items. A row with Toggle is a switch (Checked); a row with Checked and no Toggle shows a check, as the choices of a submenu do. Badge is a count on the row. The submenu of a row with Choice is a choice of one: a press checks the row pressed, and its Label becomes the Value of the row.

- Items: [{ID, Label, Description, Icon, Color, Value, Badge, Items, Choice, Toggle, Checked, Disabled, Danger}]; an item {Group, Note} starts a group of rows: its title above them (empty for none), its Note under them.
- Title is the large title of the top menu; a submenu takes the Label of its row, under a button back to the menu above. Path is the IDs of the open submenus.
- Variant: 'auto' (ios on an Apple device, material on the others), 'ios' (rows on rounded cards, as in the Settings of an iPhone) or 'material' (rows across, with round tiles, as in the Settings of Android).
- Searchable shows a field that finds rows on every level by their Label and Description; a found row shows where it is, and pressing it does what pressing it in its menu does.
- The arrows move between the rows, Enter and Space press one, the right arrow opens a submenu; the left arrow, Escape and Backspace go back.
- Events: select ({ID, Item, Path}) for a row without Items, toggle ({ID, Item, Checked}), navigate ({Path}).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Title` | `''` |
| `Variant` | `'auto'` |
| `Searchable` | `false` |
| `SearchLabel` | `''` |
| `Path` | `[]` |

## Events

`toggle`, `select`, `navigate`

## Example

```example
<div class="docs-frame">
	<SettingsMenu Variant="ios" Title="Settings" Searchable="true" [items]="Items" (select)="Picked" (toggle)="Toggled" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	Items: [
		{Group: 'Connections'},
		{ID: 'airplane', Label: 'Airplane mode', Icon: 'send', Color: '#ff9500', Toggle: true},
		{ID: 'wifi', Label: 'Wi-Fi', Icon: 'globe', Color: '#007aff', Value: 'Home', Choice: true, Items: [
			{Group: 'Networks', Note: 'Known networks join on their own.'},
			{ID: 'home', Label: 'Home', Checked: true},
			{ID: 'office', Label: 'Office'}
		]},
		{ID: 'notifications', Label: 'Notifications', Icon: 'bell', Color: '#ff3b30', Badge: 2, Items: [
			{ID: 'sounds', Label: 'Sounds', Toggle: true, Checked: true}
		]},
		{Group: 'Display', Note: 'Dark mode can follow the time of day.'},
		{ID: 'dark', Label: 'Dark mode', Icon: 'moon', Color: '#5856d6', Toggle: true},
		{ID: 'about', Label: 'About', Icon: 'info', Color: '#8e8e93'}
	],

	Picked: function (event) {
		this.Note = 'Selected: ' + event.ID;
	},

	Toggled: function (event) {
		this.Note = event.ID + ' is ' + (event.Checked ? 'on' : 'off');
	}
})
</script>
```
