<!-- generated -->
# GameLeaderboard

The leaderboard of a game. Items [{ID, Name, Score, Rank, Avatar, Icon, Note, Change, Me}]: by Score, the highest first (or by Rank where the items carry it). The first three wear the medals of the theme (gold, silver, bronze); Change shows how many places a player rose (a positive number) or fell; Me marks the player of the page. Limit (10) keeps the top of the list: the player below it shows apart after a gap. ScoreLabel names the score. Selectable rows emit select with their item.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Limit` | `10` |
| `ScoreLabel` | `''` |
| `Selectable` | `false` |
| `Label` | `''` |

## Events

`select`

## Example

```example
<div class="elemenx-game-panel">
	<GameLeaderboard [items]="Ranking" Limit="5" ScoreLabel="Glory" Selectable="true" (select)="Chose" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'The player (Aria) is below the first five: the board shows her row too.',
	Ranking: [
		{ID: 'kael', Name: 'Kael', Note: 'Level 42 · Paladin', Score: 98420, Change: 1, Icon: 'user'},
		{ID: 'lyra', Name: 'Lyra', Note: 'Level 41 · Ranger', Score: 97105, Change: -1, Icon: 'user'},
		{ID: 'dorn', Name: 'Dorn', Note: 'Level 39 · Warrior', Score: 90330, Icon: 'user'},
		{ID: 'sela', Name: 'Sela', Note: 'Level 37 · Mage', Score: 85012, Change: 2, Icon: 'user'},
		{ID: 'brin', Name: 'Brin', Note: 'Level 36 · Rogue', Score: 80400, Change: -1, Icon: 'user'},
		{ID: 'aria', Name: 'Aria', Note: 'Level 7 · Warden', Score: 12800, Change: 3, Icon: 'user', Me: true}
	],

	Chose: function (item) {
		this.Note = 'Chosen: ' + item.Name;
	}
})
</script>
```
