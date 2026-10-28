<!-- generated -->
# Stickers

Наборы стикеров приложения. Register({ID, Title, Icon, Items: [{ID, URL, Title, Keywords, Emoji}]}) добавляет набор (повторно с тем же ID — заменяет его); Icon — имя иконки или URL изображения. Стикер — любое изображение, которое рисует браузер, в том числе анимированное (GIF, WebP, APNG, SVG). Emoji — эмодзи, которые означает стикер (текст или список): сообщение из одного из них предлагает его, ByEmoji(char) перечисляет такие стикеры (сначала избранные и недавние; оттенки кожи и селекторы вариантов не учитываются). Search(text) ищет стикеры по названию, ключевым словам и эмодзи. Recent() перечисляет недавно отправленные стикеры, Used(sticker) записывает один; Favorite(sticker) добавляет стикер в избранное или убирает из него, Favorites() перечисляет их; и то и другое запоминается. OnChange(callback) сообщает об изменениях наборов.

## Методы

- `Register(pack)`
- `ByEmoji(char, limit)`
- `Search(text)`
- `Recent()`
- `Favorites()`
- `Used(sticker)`
- `Favorite(sticker)`
- `OnChange(callback)`

## Пример

```example
<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Query" placeholder="Search stickers: word or emoji" /></span>
<div class="elemenx-container wrappable" style="gap: 8px;">
	<img *for="sticker of Found(Query)" *key="sticker.ID" [attribute.src]="sticker.URL" [attribute.title]="sticker.Title" width="56" height="56" alt="" />
</div>
<p class="elemenx-text small muted">Try "love", "🚀", "coffee".</p>
<script>
({
	Query: 'party',

	$OnCreate: function () {
		var stickers = this.$Service('Stickers');

		stickers.Register({
			ID: 'docs-pals',
			Title: 'Pals',
			Icon: '/data/stickers/hello.svg',
			Items: [
				{ID: 'hello', URL: '/data/stickers/hello.svg', Title: 'Hello', Keywords: 'hi wave', Emoji: '👋'},
				{ID: 'love', URL: '/data/stickers/love.svg', Title: 'Love', Keywords: 'heart like', Emoji: '❤️ 😍'},
				{ID: 'party', URL: '/data/stickers/party.svg', Title: 'Party', Keywords: 'celebrate congrats', Emoji: '🎉'},
				{ID: 'coffee', URL: '/data/stickers/coffee.svg', Title: 'Coffee', Keywords: 'break morning', Emoji: '☕'},
				{ID: 'rocket', URL: '/data/stickers/rocket.svg', Title: 'Rocket', Keywords: 'launch ship', Emoji: '🚀'}
			]
		});

		this.Found = function (query) {
			return query ? stickers.Search(query) : [];
		};
	}
})
</script>
```

## Тесты

- [chat composer puts emoji at the caret and sends stickers; messages take reactions](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L999) — `tests/examples/ui-kit.spec.js`
