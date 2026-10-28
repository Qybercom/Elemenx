<!-- generated -->
# TrackList

Треки альбома или плейлиста: Items [{ID, Number, Title, Artist, Album, Duration (секунды), Explicit, Disabled}], каждый — строка с номером (у текущего Current — с полосками, пока Playing), названием и исполнителем, альбомом (Columns album) и длительностью; под списком — итог. Нажатие или Enter включает трек (событие play), стрелки переходят от строки к строке; нажатие на играющий трек ставит его на паузу (событие pause). Columns перечисляет необязательные колонки: album, artist (без неё исполнитель — отдельной строкой). События: play (трек), pause (трек).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Current` | `null` |
| `Playing` | `false` |
| `Columns` | `[]` |
| `Label` | `''` |

## События

- `pause`: Нажат играющий трек: трек.
- `play`: Выбран трек: трек.

## Пример

```example
<TrackList [items]="Tracks" [current]="Current" [playing]="Playing" (play)="Played" (pause)="Paused" />
<p class="elemenx-text small muted">{{Playing ? 'Playing' : 'Paused'}}: {{Name()}}</p>
<script>
({
	Current: 2,
	Playing: true,
	Tracks: [
		{ID: 1, Title: 'Morning Tide', Artist: 'Elemenx Quartet', Duration: 214},
		{ID: 2, Title: 'Lantern', Artist: 'Elemenx Quartet', Duration: 187},
		{ID: 3, Title: 'Salt and Iron', Artist: 'Elemenx Quartet feat. Ada', Duration: 241, Explicit: true},
		{ID: 4, Title: 'Low Water', Artist: 'Elemenx Quartet', Duration: 305},
		{ID: 5, Title: 'Unreleased', Artist: 'Elemenx Quartet', Duration: 160, Disabled: true}
	],

	Name: function () {
		var self = this;

		return this.Tracks.filter(function (track) {
			return track.ID === self.Current;
		})[0].Title;
	},

	Played: function (track) {
		this.Current = track.ID;
		this.Playing = true;
	},

	Paused: function () {
		this.Playing = false;
	}
})
</script>
```

## Тесты

- [TrackList: numbers, lengths and the total; a press plays a track, and the one playing pauses; the keys go from row to row](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L372) — `tests/regression/library-media.test.js`
