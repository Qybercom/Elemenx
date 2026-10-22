<!-- generated -->
# GameInventory

Инвентарь: сетка из Slots ячеек (по умолчанию Items.length) в Columns колонок. Items — по ячейкам (null — пустая ячейка): {ID, Name, Icon или Image, Count, Stack (сколько помещается в стопку), Rarity (common, uncommon, rare, epic, legendary: рамка ячейки), Color, Badge (метка в углу: '+5'), Class (дополнительные классы ячейки и карточки для своего вида), Active (используемый предмет, например надетый: активный вид темы), Type, Description, Stats: [{Label, Value}]}. Выбранная ячейка обведена меткой темы. Name называет инвентарь в местах перетаскивания. Указатель или фокус на предмете показывают его карточку.

- Стрелки двигают между ячейками (геймпад тоже); Enter или двойное нажатие используют предмет (use); пробел поднимает предмет, повторный пробел кладёт его в ячейку под фокусом (Escape возвращает на место); Delete выбрасывает его (discard).
- Указатель перетаскивает предмет (*draggable с Type 'game-item' и Data {Item, From}; From — откуда он, {Kind: 'inventory', ID, Name, Index}). В ячейку того же инвентаря предмет перемещается: стопки одного предмета объединяются до Stack (сервис GameItems), разные предметы меняются местами. Предмет откуда-то ещё (другой инвентарь, GameSlot, любой игровой *draggable) отправляет receive ({Item, From, To, Current}: Current — содержимое ячейки), а владелец перемещает его: GameItems.Move(Item, Current) говорит, что после этого лежит в ячейке и в месте, откуда пришёл предмет. Предмет этого инвентаря, брошенный в другое место, отправляет и give ({Index, Item, From, Target}).
- move несёт {From, To, Items}: Items — список с двумя переставленными ячейками, чтобы владелец его сохранил. select несёт {Index, Item} при движении фокуса. Label называет сетку для экранных читалок. Ячейка с предметом окрашивается в его Color (или цвет его Rarity) под глянцем темы.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Slots` | `0` |
| `Columns` | `6` |
| `Label` | `''` |
| `Name` | `''` |

## События

`select`, `use`, `move`, `discard`, `receive`, `give`

## Методы

- `Move(from, to)`

## Пример

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
