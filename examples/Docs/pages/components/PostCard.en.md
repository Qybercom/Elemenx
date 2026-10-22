<!-- generated -->
# PostCard

The card of a post of a blog: Image, Category, Title, Excerpt, Tags, the Author (Avatar, or initials), its Date and ReadTime (minutes), and the counts of Likes and Comments (null hides them). Layout: vertical, horizontal (the image beside the text) or overlay (the text over the image). DateBadge shows the day and the month on the image, as a tile of the Metro style. Variant and Href as in Card. The default slot adds content under the excerpt. Events: like ({Liked, Likes}), comment, share.

## Properties

| Property | Default |
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

## Events

`like`, `comment`, `share`

## Slots

default

## Example

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
