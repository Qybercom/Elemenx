<!-- generated -->
# GameQuests

The quests of a game. Items [{ID, Title, Group, Level, Status ('active', 'done' or 'failed'), Tracked, Text, Objectives [{Label, Value, Max}], Rewards [{Icon, Image, Label, Count, Rarity, Color, Type, Stats, Description, or Item: the item itself}]}]. A reward with more than a name shows its card under the pointer or the focus (*itemcard).

- Variant 'log' (the default): the journal, the quests by Group on the left (the arrows, Home and End move), the open one on the right with its text, objectives and rewards, and a button that tracks it. Value is the ID of the open quest; change emits the ID of another, track {ID, Tracked}.
- Variant 'tracker': the objectives of the tracked active quests, for the screen of the game; a press on a quest emits change with its ID.

Label names the list for screen readers, Empty is the text without quests.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Value` | `null` |
| `Variant` | `'log'` |
| `Label` | `''` |
| `Empty` | `''` |

## Events

`change`, `track`

## Example

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
