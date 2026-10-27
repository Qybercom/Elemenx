<!-- generated -->
# GameSlot

A slot of an action bar (hotbar): a button with an Icon or an Image, a Label for the hint and screen readers, Count and Rarity (common, uncommon, rare, epic, legendary). Key binds a shortcut through the Hotkeys Service ('1', 'Q') and shows it (a control of the game, not a command: the lists of shortcuts leave it out). Pressing it (or its key) emits use while it is ready; with Cooldown (milliseconds) it then cools down: a sweep runs over it with the seconds left, and ready is emitted at the end. Cool(milliseconds) starts a cooldown from the code (a shared cooldown, for example); Active marks a toggled action; Disabled, Size (small, medium, large). Several slots in a row: <div class="elemenx-game-hotbar">. Color tints the glass under its icon (by default the color of its Rarity; Rarity frames it too); Badge is a mark in a corner ('+5'), Classes more classes for a look of their own. Data is what the slot holds (an item of the game: {ID, Name, Icon, Count, Stack...}, or a skill). The slot is a place of the drags of the game: it is dragged (Draggable, true by default; a *draggable of Type 'game-item' with Data {Item, From}, From {Kind: 'slot', Key, Name: Group}) and takes what is dropped on it (Accept: the Types it takes, ['game-item'] by default; [] takes nothing): drop carries {Item, From, To, Current} (Current is Data) and the owner moves the item, with GameItems.Move. The pointer or the focus on a slot whose Data has more than a name (Description, Type, Rarity, Stats) shows its card (GameItemCard), as in an inventory; it follows the slot when the page scrolls.

## Properties

| Property | Default |
| --- | --- |
| `Icon` | `''` |
| `Image` | `''` |
| `Label` | `''` |
| `Key` | `''` |
| `Count` | `0` |
| `Rarity` | `''` |
| `Cooldown` | `0` |
| `Active` | `false` |
| `Disabled` | `false` |
| `Size` | `'medium'` |
| `Color` | `''` |
| `Accept` | `['game-item']` |
| `Draggable` | `true` |
| `Data` | `null` |
| `Group` | `''` |
| `Badge` | `''` |
| `Classes` | `''` |

## Events

- `use`: Pressed (or its key) while ready: {Label, Key}.
- `ready`: Its cooldown ended: {Label, Key}.
- `drop`: An item was dropped on it: {Item, From, To, Current, Type}.

## Methods

- `Cool(milliseconds)`

## Example

```example
<div class="elemenx-game-hotbar">
	<GameSlot Key="1" Icon="fire" Label="Fireball" Cooldown="3000" Color="#b8402a" (use)="Used" />
	<GameSlot Key="2" Icon="leaf" Label="Heal" Cooldown="5000" Color="#3f9a44" (use)="Used" />
	<GameSlot Key="3" Icon="star" Label="Blink" Cooldown="1500" Active="true" (use)="Used" />
	<GameSlot Key="4" Icon="heart" Label="Health potion" Count="3" Rarity="epic" Badge="+3" (use)="Used" />
	<GameSlot Key="5" />
</div>
<p class="elemenx-text small muted">Press a slot or its key: {{Note}}</p>
<script>
({
	Note: '—',

	Used: function (event) {
		this.Note = event.Label + ' used at ' + new Date().toLocaleTimeString();
	}
})
</script>
```
