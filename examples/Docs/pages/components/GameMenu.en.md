<!-- generated -->
# GameMenu

A menu of a game: the main menu, a pause menu, a list of saves. Title and Subtitle above the Items ([{ID, Label, Hint, Icon, Disabled}]). Arrow Up and Down (and a gamepad) move between the items and go round; Enter or a press emits select ({ID, Item}); Escape emits back. AutoFocus (true) puts the focus on the first item when it shows.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Subtitle` | `''` |
| `Items` | `[]` |
| `AutoFocus` | `true` |

## Events

- `select`: An item was chosen: {ID, Item}.
- `back`: Escape was pressed: go back.

## Slots

default

## Example

```example
<div class="elemenx-game-panel">
	<GameMenu Title="Paused" Subtitle="Chapter II · The northern road" [items]="Items" (select)="Chose" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	Items: [
		{ID: 'resume', Label: 'Resume', Hint: 'Esc'},
		{ID: 'save', Label: 'Save game'},
		{ID: 'settings', Label: 'Settings', Disabled: true},
		{ID: 'quit', Label: 'Quit to title'}
	],

	Chose: function (item) {
		this.Note = 'Chosen: ' + item.Item.Label;
	}
})
</script>
```
