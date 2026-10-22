<!-- generated -->
# GameItemCard

Карточка игрового предмета: Name в цвете его Rarity, Rarity и Type, Stats [{Label, Value}] и Description на панели темы. Item — предмет; Place — где она показывается: стиль, закрепляющий её в окне (GameItems.Place(element) даёт место рядом с элементом). GameInventory и GameSlot показывают её для предмета под указателем или фокусом; любое место предметов игры может показывать её так же. Её разметка — фразовое содержимое, поэтому она помещается внутрь кнопки.

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
