<!-- generated -->
# *itemCard

*itemcard="item" показывает карточку игрового предмета на любом элементе: под указателем или при фокусе, рядом с элементом (GameItems.Place), как это делают GameInventory и GameSlot. Предмет — {Name, Rarity, Type, Stats: [{Label, Value}], Description, Class}; предмет, у которого нет ничего, кроме названия (GameItems.Carded), карточку не показывает, как и null. Карточка открывается в верхнем слое (popover), так что никакая прокручиваемая область, transform или filter вокруг элемента её не обрезает и не сдвигает; она следует за элементом при прокрутке страницы (в том числе страницы, которая растёт по мере отрисовки) и остаётся в DOM рядом с элементом, поэтому берёт тему той части страницы, где находится. У неё классы GameItemCard (elemenx-game-inventory-card...).

## Пример

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
