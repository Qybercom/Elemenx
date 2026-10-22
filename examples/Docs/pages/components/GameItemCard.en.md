<!-- generated -->
# GameItemCard

The card of an item of a game: its Name in the color of its Rarity, its Rarity and Type, its Stats [{Label, Value}] and its Description, on the panel of the theme. Item is the item; Place is where it shows: a style that fixes it to the viewport (GameItems.Place(element) gives the one beside an element). GameInventory and GameSlot show it for the item under the pointer or the focus; any place of the items of a game may show it the same way. Its markup is phrasing content, so it fits inside a button.

## Properties

| Property | Default |
| --- | --- |
| `Item` | `null` |
| `Place` | `''` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<GameItemCard *for="item of Items" *key="item.Name" [item]="item" Place="position: static;" />
</div>
<p class="elemenx-text small muted">In a game the card floats beside a slot: GameItems.Place(element) gives its Place. Here Place="position: static;" keeps it in the flow of the page.</p>
<script>
({
	Items: [
		{Name: 'Moonblade', Rarity: 'legendary', Type: 'Sword', Description: 'Forged under a blue moon.', Stats: [{Label: 'Damage', Value: '42–58'}, {Label: 'Speed', Value: '1.2'}]},
		{Name: 'Wolf pelt', Rarity: 'uncommon', Type: 'Material', Description: 'Warm, and worth a few coins.'},
		{Name: 'Rusty key', Rarity: 'common', Type: 'Quest item', Stats: [{Label: 'Weight', Value: '0.1'}]}
	]
})
</script>
```
