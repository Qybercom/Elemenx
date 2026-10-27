<!-- generated -->
# CommentCard

Комментарий, пост соцсети или твит: автор Author (Avatar, Verified, Handle), время Time (относительно текущего: «5 минут назад»), Text, до четырёх изображений Media и счётчики Replies, Reposts и Likes (null скрывает счётчик) с Reposted и Liked. В тексте @упоминания и #теги — кнопки, ссылки — ссылки; текст никогда не читается как разметка. Thread рисует линию к следующему комментарию ветки; слот по умолчанию держит ответы. Variant: flat (по умолчанию: комментарий в списке), outlined или elevated (карточка). События: reply, repost ({Reposted, Reposts}), like ({Liked, Likes}), share, mention ({Handle}), tag ({Tag}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Author` | `''` |
| `Handle` | `''` |
| `Avatar` | `''` |
| `Verified` | `false` |
| `Time` | `''` |
| `Text` | `''` |
| `Media` | `[]` |
| `Replies` | `null` |
| `Reposts` | `null` |
| `Likes` | `null` |
| `Reposted` | `false` |
| `Liked` | `false` |
| `Thread` | `false` |
| `Variant` | `'flat'` |
| `ReplyLabel` | `''` |
| `RepostLabel` | `''` |
| `LikeLabel` | `''` |
| `ShareLabel` | `''` |
| `VerifiedLabel` | `''` |

## События

- `reply`: Кнопка ответа: {Author, Handle}.
- `repost`: Кнопка репоста: {Reposted, Reposts}.
- `like`: Кнопка «нравится»: {Liked, Likes}.
- `share`: Кнопка «поделиться»: {Author, Text}.
- `mention`: Нажато @упоминание в тексте: {Handle}.
- `tag`: Нажат #тег в тексте: {Tag}.

## Слоты

по умолчанию

## Пример

```example
<CommentCard Author="Grace Hopper" Handle="grace" Verified="true" [time]="Ago(5)" Text="The #ElemenxUI cards are in! Thanks @ada for the review. Notes: https://example.com/cards" Replies="4" Reposts="12" Likes="240" (like)="Liked" (mention)="Mention" (tag)="Tag" />
<CommentCard Variant="outlined" Author="Alan Turing" Handle="turing" [time]="Ago(90)" Text="Sunset at the sea, and a city at night. #photo" [media]="['/data/cards/sea.svg', '/data/cards/city.svg']" Replies="2" Reposts="5" Likes="64" (like)="Liked" (tag)="Tag" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',

	$OnCreate: function () {
		this.Ago = function (minutes) {
			return new Date(Date.now() - minutes * 60000).toISOString();
		};
	},

	Liked: function (event) {
		this.Note = (event.Liked ? 'Liked' : 'Unliked') + ': ' + event.Likes;
	},

	Mention: function (event) {
		this.Note = 'Mention of @' + event.Handle;
	},

	Tag: function (event) {
		this.Note = 'Tag #' + event.Tag;
	}
})
</script>
```
