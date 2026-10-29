<!-- generated -->
# MediaShelf

A shelf of a collection: a row of titles that scrolls across, with its Title, a link to all of them (More, the more event) and arrows that turn it a screen at a time. Items are drawn as MediaCards ([{ID, Title, Subtitle, Image, Kind, Badge, Rating, Progress, Tags, Href}], with the Ratio, Max, Size, Playable and Favorable of the shelf), or the content given goes in its place. The arrow keys go from a card to the next one. Scroll(step) turns it by a screen (1 forward, -1 back). Events: open (an item), play (an item), more.

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Items` | `[]` |
| `Ratio` | `'2:3'` |
| `Max` | `10` |
| `Size` | `'medium'` |
| `Playable` | `false` |
| `Favorable` | `false` |
| `More` | `''` |

## Events

- `open`: A title was pressed: its item.
- `play`: The play button of a title: its item.
- `more`: The link to all of them.

## Slots

default

## Methods

- `Scroll(step)`

## Example

```example
<MediaShelf Title="Continue watching" More="See all" [items]="Items" Playable="true" (open)="Opened" (play)="Played" (more)="Wanted" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'The arrows turn the shelf; on a card the arrow keys go to the next one.',
	Items: ['North', 'Harbor', 'Ember', 'Tide', 'Lantern', 'Meridian', 'Quiet Hours', 'Atlas', 'Driftwood', 'Signal'].map(function (title, index) {
		var hue = index * 36;

		return {
			ID: 'film-' + index,
			Title: title,
			Subtitle: String(2015 + index),
			Rating: Math.round((5.5 + index * 7 % 40 / 10) * 10) / 10,
			Progress: index % 3 === 0 ? null : (index % 5 + 1) / 6,
			Image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><rect width="120" height="180" fill="hsl(' + hue + ',55%,40%)"/><rect y="110" width="120" height="70" fill="hsl(' + hue + ',60%,22%)"/><text x="60" y="150" fill="#fff" font-family="sans-serif" font-weight="700" font-size="15" text-anchor="middle">' + title + '</text></svg>')
		};
	}),

	Opened: function (item) {
		this.Note = 'Opened: ' + item.Title;
	},

	Played: function (item) {
		this.Note = 'Playing: ' + item.Title;
	},

	Wanted: function () {
		this.Note = 'All of them';
	}
})
</script>
```

## Tests

- [CastList, DiffView, MediaHero, MediaShelf and VideoTimeline are as wide as a column of flex-start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/inline-size-width.test.js#L39) — `tests/regression/inline-size-width.test.js`
- [MediaShelf draws its items as cards, gives back the item pressed, turns by its arrows and goes from card to card by the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L87) — `tests/regression/library-media.test.js`
