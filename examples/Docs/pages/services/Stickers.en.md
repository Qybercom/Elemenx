<!-- generated -->
# Stickers

The sticker packs of the Application. Register({ID, Title, Icon, Items: [{ID, URL, Title, Keywords, Emoji}]}) adds a pack (again with the same ID: replaces it); Icon is an icon name or the URL of an image. A sticker is any image a browser draws, animated ones too (GIF, WebP, APNG, SVG). Emoji are the emoji the sticker means (a text or a list): a message of one of them suggests it, ByEmoji(char) lists those stickers (the starred and the recent ones first; skin tones and variation selectors do not count). Search(text) finds stickers by title, keywords and emoji. Recent() lists the stickers sent last and Used(sticker) records one; Favorite(sticker) stars or unstars a sticker and Favorites() lists them; both are remembered. OnChange(callback) reports the changes of the packs.

## Methods

- `Register(pack)`
- `ByEmoji(char, limit)`
- `Search(text)`
- `Recent()`
- `Favorites()`
- `Used(sticker)`
- `Favorite(sticker)`
- `OnChange(callback)`

## Example

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
