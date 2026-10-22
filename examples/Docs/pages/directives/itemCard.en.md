<!-- generated -->
# *itemCard

*itemcard="item" shows the card of an item of a game on any element: under the pointer or the focus, beside the element (GameItems.Place), as GameInventory and GameSlot show it. The item is {Name, Rarity, Type, Stats: [{Label, Value}], Description, Class}; an item with nothing more than a name (GameItems.Carded) shows none, and neither does null. The card opens in the top layer (a popover), so no scrolling box, transform or filter around the element cuts or moves it; it follows the element when the page scrolls (a scroll of the page that grows as more of it renders too), and it stays in the DOM next to the element, so it takes the theme of the part of the page it is in. It has the classes of GameItemCard (elemenx-game-inventory-card...).

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<button type="button" class="elemenx-button" *for="item of Items" *key="item.Name" *itemcard="item"><Icon [name]="item.Icon" /> {{item.Name}}</button>
</div>
<p class="elemenx-text small muted">Point at an item, or focus it with Tab: its card shows beside it.</p>
<script>
({
	Items: [
		{Name: 'Moonblade', Icon: 'star', Rarity: 'legendary', Type: 'Sword', Description: 'Forged under a blue moon.', Stats: [{Label: 'Damage', Value: '42–58'}, {Label: 'Speed', Value: '1.2'}]},
		{Name: 'Ember rune', Icon: 'fire', Rarity: 'epic', Type: 'Rune', Stats: [{Label: 'Fire damage', Value: '+12%'}]},
		{Name: 'Silverleaf', Icon: 'leaf', Rarity: 'uncommon', Type: 'Herb', Description: 'A healer needs it.'}
	]
})
</script>
```
