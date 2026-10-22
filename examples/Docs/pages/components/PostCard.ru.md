<!-- generated -->
# PostCard

Карточка записи блога: Image, Category, Title, Excerpt, Tags, автор Author (Avatar или инициалы), Date и ReadTime (минуты), счётчики Likes и Comments (null скрывает). Layout: vertical, horizontal (картинка рядом с текстом) или overlay (текст поверх картинки). DateBadge показывает день и месяц на картинке, как плитка в стиле Metro. Variant и Href — как в Card. Слот по умолчанию добавляет содержимое под анонсом. События: like ({Liked, Likes}), comment, share.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Excerpt` | `''` |
| `Image` | `''` |
| `Category` | `''` |
| `Tags` | `[]` |
| `Author` | `''` |
| `Avatar` | `''` |
| `Date` | `''` |
| `ReadTime` | `0` |
| `Likes` | `null` |
| `Comments` | `null` |
| `Liked` | `false` |
| `Layout` | `'vertical'` |
| `Variant` | `'outlined'` |
| `DateBadge` | `false` |
| `Href` | `''` |
| `ReadLabel` | `''` |
| `LikeLabel` | `''` |
| `CommentLabel` | `''` |
| `ShareLabel` | `''` |

## События

`like`, `comment`, `share`

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<PostCard Title="Ten passes through the Caucasus" Excerpt="A week on foot from one valley to the next: the routes, the huts and what to pack." Image="/data/cards/mountains.svg" Category="Travel" Author="Ada Lovelace" Date="2026-10-02" ReadTime="6" Likes="1240" Comments="38" DateBadge="true" (like)="Liked" />
	<PostCard Title="Lights of the night city" Excerpt="How to photograph a city after dark with a phone." Image="/data/cards/city.svg" Category="Photo" Author="Grace Hopper" Date="2026-09-18" ReadTime="4" Likes="86" Comments="5" Layout="overlay" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',

	Liked: function (event) {
		this.Note = (event.Liked ? 'Liked: ' : 'Unliked: ') + event.Likes;
	}
})
</script>
```
