<!-- generated -->
# MediaCard

Карточка тайтла коллекции: фильма, сериала, альбома, игры, книги. Image — постер (или обложка), Ratio — его форма ('2:3' — постер, '1:1' — обложка, '16:9' — кадр игры или эпизода), Title и Subtitle (год, исполнитель, платформа) под ним, Kind — слово на нём (Фильм, Альбом, Игра), Badge — ещё одно (Новинка, 4K; BadgeVariant — его тон), Rating — оценка от 0 до Max (по умолчанию 10; при 5 — звёзды), Progress — просмотренная или пройденная часть (от 0 до 1, полоса на постере), Tags — жанры. Playable показывает кнопку воспроизведения поверх постера, Favorable — сердечко (Favorite). Нажатие открывает карточку, как и Href.

Item — то, что возвращают её события (элемент списка, который она показывает; без него — {Title}). События: open, play (Item), favorite ({Favorite}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Item` | `null` |
| `Title` | `''` |
| `Subtitle` | `''` |
| `Image` | `''` |
| `Ratio` | `'2:3'` |
| `Kind` | `''` |
| `Badge` | `''` |
| `BadgeVariant` | `'accent'` |
| `Rating` | `null` |
| `Max` | `10` |
| `Progress` | `null` |
| `Tags` | `[]` |
| `Playable` | `false` |
| `Favorable` | `false` |
| `Favorite` | `false` |
| `Href` | `''` |
| `Size` | `'medium'` |

## События

- `open`: Карточку нажали: Item.
- `play`: Кнопка воспроизведения: Item.
- `favorite`: Сердечко: {Favorite}.

## Слоты

по умолчанию

## Пример

```example
<div class="docs-row">
	<MediaCard Title="The Long Light" Subtitle="2024 · 2 h 10 min" Kind="Film" [image]="Poster('The Long Light', 210, 2, 3)" Rating="8.4" Progress="0.35" [tags]="['Drama', 'Mystery']" Playable="true" Favorable="true" (open)="Opened" (play)="Played" (favorite)="Kept" />
	<MediaCard Title="Tides" Subtitle="Elemenx Quartet" Kind="Album" Ratio="1:1" [image]="Poster('Tides', 20, 1, 1)" Rating="4.5" Max="5" (open)="Opened" />
	<MediaCard Title="Skyforge" Subtitle="PC · PS5" Kind="Game" Ratio="16:9" Size="large" Badge="New" [image]="Poster('Skyforge', 280, 16, 9)" Rating="62" Max="100" Progress="0.8" (open)="Opened" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Press a card, its play button or its heart.',

	/* A poster of its own: a gradient of a hue with the title, as an SVG. */
	Poster: function (title, hue, width, height) {
		var w = width * 60;
		var h = height * 60;

		return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',60%,45%)"/><stop offset="1" stop-color="hsl(' + (hue + 50) + ',70%,18%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="' + w * 0.7 + '" cy="' + h * 0.3 + '" r="' + Math.min(w, h) * 0.22 + '" fill="hsla(' + (hue + 180) + ',80%,75%,0.35)"/><text x="50%" y="' + h * 0.82 + '" fill="#fff" font-family="sans-serif" font-weight="700" font-size="' + Math.min(w, h) * 0.12 + '" text-anchor="middle">' + title + '</text></svg>');
	},

	Opened: function (item) {
		this.Note = 'Opened: ' + item.Title;
	},

	Played: function (item) {
		this.Note = 'Playing: ' + item.Title;
	},

	Kept: function (value) {
		this.Note = value.Favorite ? 'In the favorites' : 'Out of the favorites';
	}
})
</script>
```

## Тесты

- [MediaCard shows its poster, score, progress and kind, and opens, plays and keeps it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L44) — `tests/regression/library-media.test.js`
