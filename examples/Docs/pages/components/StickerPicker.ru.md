<!-- generated -->
# StickerPicker

Выбор стикеров сервиса Stickers: вкладка недавно отправленных, вкладка избранных и по вкладке на каждый набор, а также поиск по названиям и ключевым словам. Звёздочка стикера (при наведении или фокусе) добавляет его в избранное. Клавиши: стрелки двигают между стикерами, Enter выбирает, Escape отправляет dismiss. Columns — стикеров в ряду. События: pick ({Sticker: {ID, Pack, URL, Title}}), dismiss.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Label` | `''` |
| `Placeholder` | `''` |
| `Nothing` | `''` |
| `NoRecent` | `''` |
| `NoFavorites` | `''` |
| `NoPacks` | `''` |
| `Columns` | `4` |

## События

`pick`, `dismiss`

## Пример

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
