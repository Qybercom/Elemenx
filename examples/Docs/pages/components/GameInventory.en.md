<!-- generated -->
# GameInventory

An inventory: a grid of Slots cells (Items.length by default) in Columns columns. Items are by cell (null for an empty cell): {ID, Name, Icon or Image, Count, Stack (the most a pile holds), Rarity (common, uncommon, rare, epic, legendary: the frame of its cell), Color, Badge (a mark in a corner: '+5'), Class (more classes of its cell and its card, for a look of their own), Active (an item in use, as one worn: the active look of the theme), Type, Description, Stats: [{Label, Value}]}. The selected cell wears the mark of the theme around it. Name names the inventory in the places of a drag. The pointer or the focus on an item shows its card.

- Arrows move between the cells (a gamepad too); Enter or a double press uses an item (use); Space picks an item up and Space again puts it into the cell at the focus (Escape puts it back); Delete discards it (discard).
- The pointer drags an item (a *draggable of Type 'game-item' with Data {Item, From}; From is the place it comes from, {Kind: 'inventory', ID, Name, Index}). Onto a cell of the same inventory it moves there: piles of the same item join up to its Stack (the GameItems Service), other items swap. An item that comes from anywhere else (another inventory, a GameSlot, any *draggable of the game) emits receive ({Item, From, To, Current}: Current is what the cell holds), and the owner moves it: GameItems.Move(Item, Current) tells what the cell and the place it came from hold then. An item of this inventory dropped elsewhere also emits give ({Index, Item, From, Target}).
- move carries {From, To, Items}: Items is the list with the two cells swapped, for the owner to keep. select carries {Index, Item} as the focus moves. Label names the grid for screen readers. A cell with an item takes its Color (or the color of its Rarity) under the gloss of the theme.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Slots` | `0` |
| `Columns` | `6` |
| `Label` | `''` |
| `Name` | `''` |

## Events

`select`, `use`, `move`, `discard`, `receive`, `give`

## Methods

- `Move(from, to)`

## Example

```example
<div class="elemenx-game-panel">
	<GameInventory Columns="4" Slots="12" Label="Bag" Name="bag" [items]="Items" (move)="Moved" (use)="Used" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Drag the items between the cells; double click one to use it.',
	Items: [
		{ID: 'sword', Name: 'Moonblade', Icon: 'star', Rarity: 'legendary', Badge: '+5', Type: 'Sword', Description: 'Forged under a blue moon.', Stats: [{Label: 'Damage', Value: '42–58'}, {Label: 'Speed', Value: '1.2'}]},
		{ID: 'potion', Name: 'Health potion', Icon: 'heart', Count: 5, Stack: 20, Rarity: 'common', Color: '#a8282c', Type: 'Potion', Description: 'Restores 30 health.'},
		null,
		{ID: 'map', Name: 'Old map', Icon: 'map-pin', Rarity: 'rare', Type: 'Quest item', Description: 'The way across the pass.'},
		{ID: 'rune', Name: 'Ember rune', Icon: 'fire', Count: 2, Stack: 10, Rarity: 'epic', Badge: '+3', Color: '#b8402a', Type: 'Rune', Stats: [{Label: 'Fire damage', Value: '+12%'}]},
		null,
		{ID: 'herb', Name: 'Silverleaf', Icon: 'leaf', Count: 7, Stack: 99, Rarity: 'uncommon', Type: 'Herb'},
		{ID: 'gift', Name: 'Sealed box', Icon: 'gift', Rarity: 'uncommon', Type: 'Container', Description: 'Something rattles inside.'}
	],

	Moved: function (detail) {
		this.Items = detail.Items;
	},

	Used: function (detail) {
		this.Note = 'Used: ' + detail.Item.Name;
	}
})
</script>
```
