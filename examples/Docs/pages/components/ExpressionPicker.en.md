<!-- generated -->
# ExpressionPicker

Emoji and stickers in one picker, a tab each: an EmojiPicker and, while the Stickers Service has packs and Stickers is on, a StickerPicker. Kind is the tab shown: emoji or stickers. Events: pick ({Type: 'emoji', Emoji, Name} or {Type: 'sticker', Sticker}), dismiss.

## Properties

| Property | Default |
| --- | --- |
| `Kind` | `'emoji'` |
| `Stickers` | `true` |
| `Columns` | `9` |

## Events

`kind`, `pick`, `dismiss`

## Example

```example
<div class="elemenx-card"><ExpressionPicker (pick)="Picked" /></div>
<p class="elemenx-text">{{Note}}</p>
<script>
({
	Note: 'Pick an emoji or a sticker.',

	$OnCreate: function () {
		this.$Service('Stickers').Register({
			ID: 'docs-pals',
			Title: 'Pals',
			Icon: '/data/stickers/hello.svg',
			Items: [
				{ID: 'hello', URL: '/data/stickers/hello.svg', Title: 'Hello', Keywords: 'hi wave', Emoji: '👋'},
				{ID: 'love', URL: '/data/stickers/love.svg', Title: 'Love', Keywords: 'heart', Emoji: '❤️'},
				{ID: 'rocket', URL: '/data/stickers/rocket.svg', Title: 'Rocket', Keywords: 'launch', Emoji: '🚀'}
			]
		});
	},

	Picked: function (event) {
		this.Note = event.Type === 'emoji' ? 'Emoji ' + event.Emoji : 'Sticker ' + event.Sticker.Title;
	}
})
</script>
```
