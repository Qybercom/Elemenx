<!-- generated -->
# StickerPicker

A picker of the stickers of the Stickers Service: a tab for the stickers sent last, one for the starred ones and one per pack, and a search over titles and keywords. The star of a sticker (on hover or focus) adds it to the favorites. Keys: the arrows move between the stickers, Enter picks, Escape emits dismiss. Columns is the stickers in a row. Events: pick ({Sticker: {ID, Pack, URL, Title}}), dismiss.

## Properties

| Property | Default |
| --- | --- |
| `Label` | `''` |
| `Placeholder` | `''` |
| `Nothing` | `''` |
| `NoRecent` | `''` |
| `NoFavorites` | `''` |
| `NoPacks` | `''` |
| `Columns` | `4` |

## Events

- `pick`: A sticker was picked: {Sticker: {ID, Pack, URL, Title}}.
- `dismiss`: Escape was pressed: close it.

## Example

```example
<div class="elemenx-card"><StickerPicker (pick)="Picked" /></div>
<p class="elemenx-text">Picked: <img *if="Url" [attribute.src]="Url" width="48" height="48" alt="" /> {{Title}}</p>
<script>
({
	Url: '',
	Title: '',

	$OnCreate: function () {
		this.$Service('Stickers').Register({
			ID: 'docs-pals',
			Title: 'Pals',
			Icon: '/data/stickers/hello.svg',
			Items: [
				{ID: 'hello', URL: '/data/stickers/hello.svg', Title: 'Hello', Keywords: 'hi wave', Emoji: '👋'},
				{ID: 'love', URL: '/data/stickers/love.svg', Title: 'Love', Keywords: 'heart', Emoji: '❤️'},
				{ID: 'party', URL: '/data/stickers/party.svg', Title: 'Party', Keywords: 'celebrate', Emoji: '🎉'},
				{ID: 'coffee', URL: '/data/stickers/coffee.svg', Title: 'Coffee', Keywords: 'break', Emoji: '☕'},
				{ID: 'rocket', URL: '/data/stickers/rocket.svg', Title: 'Rocket', Keywords: 'launch', Emoji: '🚀'}
			]
		});
	},

	Picked: function (event) {
		this.Url = event.Sticker.URL;
		this.Title = event.Sticker.Title;
	}
})
</script>
```
