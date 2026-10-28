<!-- generated -->
# TrackList

The tracks of an album or of a playlist: Items [{ID, Number, Title, Artist, Album, Duration (seconds), Explicit, Disabled}], each a row with its number (or, for the Current one, its bars while Playing), its title and artist, its album (Columns album) and its length; the total of them under the list. A press or Enter plays a track (the play event), the arrow keys go from row to row; a press on the current one while it plays pauses it (the pause event). Columns lists the optional columns: album, artist (on their own line without). Events: play (the track), pause (the track).

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Current` | `null` |
| `Playing` | `false` |
| `Columns` | `[]` |
| `Label` | `''` |

## Events

- `pause`: The track playing was pressed: the track.
- `play`: A track was chosen: the track.

## Example

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

## Tests

- [TrackList: numbers, lengths and the total; a press plays a track, and the one playing pauses; the keys go from row to row](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L372) — `tests/regression/library-media.test.js`
