<!-- generated -->
# GameQuests

Задания игры. Items [{ID, Title, Group, Level, Status ('active', 'done' или 'failed'), Tracked, Text, Objectives [{Label, Value, Max}], Rewards [{Icon, Image, Label, Count, Rarity, Color, Type, Stats, Description или Item — сам предмет}]}]. Награда, у которой есть не только название, показывает карточку под указателем или фокусом (*itemcard).

- Variant 'log' (по умолчанию): журнал — задания по Group слева (стрелки, Home и End двигают), открытое справа с текстом, целями и наградами и кнопкой отслеживания. Value — ID открытого задания; change отправляет ID другого, track — {ID, Tracked}.
- Variant 'tracker': цели отслеживаемых активных заданий для игрового экрана; нажатие на задание отправляет change с его ID.

Label называет список для экранных читалок, Empty — текст при отсутствии заданий.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Variant` | `'log'` |
| `Label` | `''` |
| `Empty` | `''` |

## События

`change`, `track`

## Пример

```example
<div class="elemenx-game-panel">
	<GameQuests [items]="Quests" [value]="Quest" Label="Quest log" (change)="Chose" (track)="Tracked" />
</div>
<script>
({
	Quest: 'wolves',
	Quests: [
		{ID: 'wolves', Title: 'Wolves at the gate', Group: 'Main story', Level: 7, Tracked: true, Text: 'The wolves of the northern woods grow bold. Thin the pack before they reach the village.', Objectives: [{Label: 'Grey wolves slain', Value: 3, Max: 5}, {Label: 'Report to the elder', Value: 0}], Rewards: [{Icon: 'star', Label: '450 experience'}]},
		{ID: 'herbs', Title: 'Herbs for the healer', Group: 'Side quests', Level: 5, Tracked: true, Text: 'Mira needs silverleaf for her remedies.', Objectives: [{Label: 'Silverleaf gathered', Value: 6, Max: 8}], Rewards: [{Icon: 'heart', Label: 'Healing potion', Count: 3, Rarity: 'uncommon'}]},
		{ID: 'ring', Title: 'A lost ring', Group: 'Side quests', Level: 4, Status: 'done', Text: 'The ring was in the well all along.', Objectives: [{Label: 'Find the ring', Value: 1}]}
	],

	Chose: function (id) {
		this.Quest = id;
	},

	Tracked: function (event) {
		this.Quests = this.Quests.map(function (quest) {
			if (quest.ID === event.ID)
				quest.Tracked = event.Tracked;

			return quest;
		});
	}
})
</script>
```
