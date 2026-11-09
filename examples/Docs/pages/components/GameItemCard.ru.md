<!-- generated -->
# GameItemCard

Карточка игрового предмета: Name в цвете его Rarity, Rarity и Type, Stats [{Label, Value}] и Description на панели темы. Item — предмет; Place — собственный стиль её места (fixed — она плавает над страницей в верхнем слое). GameInventory, GameSlot и награды GameQuests показывают её через *tip рядом с тем, что держит предмет (GameItems.Tip). GameInventory и GameSlot показывают её для предмета под указателем или фокусом; любое место предметов игры может показывать её так же. Её разметка — фразовое содержимое, поэтому она помещается внутрь кнопки.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Item` | `null` |
| `Place` | `''` |

## Пример

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

## Тесты

- [GameItemCard shows the name, the rarity and type, and the stats of an item, and nothing without one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L219) — `tests/regression/library-misc.test.js`
- [GameItems: piles join up to their Stack and the rest goes back, other items swap, and an item is used up](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L141) — `tests/regression/library-services.test.js`
