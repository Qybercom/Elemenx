<!-- generated -->
# GameLeaderboard

Таблица лидеров игры. Items [{ID, Name, Score, Rank, Avatar, Icon, Note, Change, Me}]: по Score, сначала высший (или по Rank, если он задан). Первые три носят медали темы (золото, серебро, бронза); Change показывает, на сколько мест игрок поднялся (положительное число) или опустился; Me помечает игрока этой страницы. Limit (10) оставляет верх списка: игрок ниже показывается отдельно после разрыва. ScoreLabel называет очки. Selectable делает строки выбираемыми: они отправляют select со своим элементом.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Limit` | `10` |
| `ScoreLabel` | `''` |
| `Selectable` | `false` |
| `Label` | `''` |

## События

`select`

## Пример

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
