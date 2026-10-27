<!-- generated -->
# ExpressionPicker

Эмодзи и стикеры в одном окне, каждое на своей вкладке: EmojiPicker и, пока у сервиса Stickers есть наборы и включено Stickers, — StickerPicker. Kind — показанная вкладка: emoji или stickers. События: pick ({Type: 'emoji', Emoji, Name} или {Type: 'sticker', Sticker}), dismiss.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Kind` | `'emoji'` |
| `Stickers` | `true` |
| `Columns` | `9` |

## События

- `kind`: Показана другая вкладка: {Kind}, emoji или stickers.
- `pick`: Выбрано эмодзи или стикер: {Type: 'emoji', Emoji, Name} или {Type: 'sticker', Sticker}.
- `dismiss`: Нажат Escape: закрыть.

## Пример

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
