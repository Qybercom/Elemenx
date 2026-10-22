<!-- generated -->
# CommentCard

A comment, a post of a social network or a tweet: the Author (Avatar, Verified, Handle), the Time it was written (shown from now: '5 minutes ago'), Text, up to four images of Media, and the counts of Replies, Reposts and Likes (null hides one) with Reposted and Liked. In the text, @mentions and #tags are buttons and links are links; nothing of the text is read as markup. Thread draws the line to the next comment of a thread; the default slot holds the replies. Variant: flat (default: a comment of a list), outlined or elevated (a card). Events: reply, repost ({Reposted, Reposts}), like ({Liked, Likes}), share, mention ({Handle}), tag ({Tag}).

## Properties

| Property | Default |
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

## Events

`reply`, `repost`, `like`, `share`, `mention`, `tag`

## Slots

default

## Example

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
