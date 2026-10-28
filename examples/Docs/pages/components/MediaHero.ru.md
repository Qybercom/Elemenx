<!-- generated -->
# MediaHero

Шапка страницы тайтла или коллекции: фон (Image), затемнённый так, чтобы текст читался поверх, постер Poster рядом, Title, Subtitle (оригинальное название, исполнитель, студия), Facts (список: год, длительность, возрастной рейтинг), Rating (из Max, 10), Tags (жанры) и Description. Действия: Play (PlayLabel; событие play), сердечко (Favorable, Favorite; событие favorite {Favorite}) и переданное содержимое (ещё кнопки). Progress (от 0 до 1) говорит, сколько уже просмотрено: тогда кнопка говорит «Продолжить» (ResumeLabel). Size compact — полоса на полке.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Subtitle` | `''` |
| `Image` | `''` |
| `Poster` | `''` |
| `Facts` | `[]` |
| `Rating` | `null` |
| `Max` | `10` |
| `Tags` | `[]` |
| `Description` | `''` |
| `PlayLabel` | `''` |
| `ResumeLabel` | `''` |
| `Progress` | `null` |
| `Favorable` | `false` |
| `Favorite` | `false` |
| `Size` | `'default'` |

## События

- `play`: Кнопка воспроизведения.
- `favorite`: Сердечко: {Favorite}.

## Слоты

по умолчанию

## Пример

```example
<MediaHero Title="The Long Light" Subtitle="An Elemenx film" [image]="Backdrop" [poster]="Poster" [facts]="['2024', '2 h 10 min', '12+']" Rating="8.4" [tags]="['Drama', 'Mystery']" Description="A keeper of a lighthouse finds that its light reaches further than the sea, and that someone out there answers it." Progress="0.35" Favorable="true" (play)="Played" (favorite)="Kept">
	<Button Variant="secondary" Icon="video" Label="Trailer" (click)="Trailer" />
</MediaHero>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Some of it was seen: the button says Resume.',
	Backdrop: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4a"/><stop offset="1" stop-color="#e08a4f"/></linearGradient></defs><rect width="1600" height="600" fill="url(#s)"/><rect y="440" width="1600" height="160" fill="#14233d"/><rect x="1180" y="230" width="44" height="210" fill="#f2efe8"/><path d="M1202 230l-300-90v180z" fill="#ffe8a3" opacity="0.5"/></svg>'),
	Poster: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#24395f"/><circle cx="140" cy="80" r="40" fill="#ffe8a3"/><text x="100" y="250" fill="#fff" font-family="sans-serif" font-weight="700" font-size="20" text-anchor="middle">The Long Light</text></svg>'),

	Played: function () {
		this.Note = 'Playing';
	},

	Kept: function (value) {
		this.Note = value.Favorite ? 'In the favorites' : 'Out of the favorites';
	},

	Trailer: function () {
		this.Note = 'The trailer';
	}
})
</script>
```

## Тесты

- [MediaHero: its facts, score and genres, Resume once some of it was seen, play and the heart](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L339) — `tests/regression/library-media.test.js`
