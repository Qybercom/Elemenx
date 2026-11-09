<!-- generated -->
# GameItemCard

The card of an item of a game: its Name in the color of its Rarity, its Rarity and Type, its Stats [{Label, Value}] and its Description, on the panel of the theme. Item is the item; Place a style of its own place (fixed: it floats over the page in the top layer). GameInventory, GameSlot and GameQuests show it by *tip for the item under the pointer, the focus or a finger (GameItems.Tip); any place of the items of a game may show it the same way. Its markup is phrasing content, so it fits inside a button.

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
<p class="elemenx-text small muted">Here Place="position: static;" keeps the cards in the flow of the page. In a game the card shows beside what holds the item, by *tip: point at these, focus them or tap them.</p>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<button type="button" class="elemenx-button" *for="item of Items" *key="item.Name" *tip="ItemTip(item)">{{item.Name}}</button>
</div>
<script>
({
	Items: [
		{Name: 'Moonblade', Rarity: 'legendary', Type: 'Sword', Description: 'Forged under a blue moon.', Stats: [{Label: 'Damage', Value: '42–58'}, {Label: 'Speed', Value: '1.2'}]},
		{Name: 'Wolf pelt', Rarity: 'uncommon', Type: 'Material', Description: 'Warm, and worth a few coins.'},
		{Name: 'Rusty key', Rarity: 'common', Type: 'Quest item', Stats: [{Label: 'Weight', Value: '0.1'}]}
	],

	ItemTip: function (item) {
		return this.$Service('GameItems').Tip(item);
	}
})
</script>
```

## Tests

- [GameItemCard shows the name, the rarity and type, and the stats of an item, and nothing without one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L219) — `tests/regression/library-misc.test.js`
- [GameItems: piles join up to their Stack and the rest goes back, other items swap, and an item is used up](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L141) — `tests/regression/library-services.test.js`
