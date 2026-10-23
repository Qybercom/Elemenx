/*
 * The card of a post of a blog: Image, Category, Title, Excerpt, Tags, the Author (Avatar, or initials), its Date and
 * ReadTime (minutes), and the counts of Likes and Comments (null hides them). Layout: vertical, horizontal (the image
 * beside the text) or overlay (the text over the image). DateBadge shows the day and the month on the image, as a tile
 * of the Metro style. Variant and Href as in Card. The default slot adds content under the excerpt.
 * Events: like ({Liked, Likes}), comment, share.
 */
Elemenx.Component('PostCard', {
	$TemplateURL: 'PostCard.html',
	$StyleURL: 'PostCard.css',
	$Meta: {
		Group: 'social',
		Icon: 'quote',
		Description: 'The card of a post of a blog: Image, Category, Title, Excerpt, Tags, the Author (Avatar, or initials), its Date and ReadTime (minutes), and the counts of Likes and Comments (null hides them).',
		Container: true,
		Events: ['like', 'comment', 'share'],
		Props: {
			Title: 'The title of the post.',
			Excerpt: 'The beginning of the post.',
			Image: 'The URL of the picture.',
			Category: 'The category above the title.',
			Tags: 'The tags.',
			Author: 'The name of the author.',
			Avatar: 'The URL of the picture of the author.',
			Date: 'The date of the post.',
			ReadTime: 'Minutes of reading.',
			Likes: 'The count of likes (null hides it).',
			Comments: 'The count of comments (null hides it).',
			Liked: 'The reader liked it.',
			Layout: {Options: ['vertical', 'horizontal', 'overlay'], Description: 'vertical, horizontal (the picture beside the text) or overlay (the text over it).'},
			Variant: 'Its look, as in Card.',
			DateBadge: 'Shows the day and the month on the picture.',
			Href: 'Makes the card a link.',
			ReadLabel: 'The text of the reading time ({count} min read).',
			LikeLabel: 'The name of the like button.',
			CommentLabel: 'The name of the comment button.',
			ShareLabel: 'The name of the share button.'
		},
		Sample: {Title: 'Ten passes through the Caucasus', Excerpt: 'A week on foot from one valley to the next: the routes, the huts and what to pack.', Category: 'Travel', Author: 'Ada Lovelace', Date: '2026-10-02', ReadTime: 6, Likes: 1240, Comments: 38, DateBadge: true}
	},
	Title: '',
	Excerpt: '',
	Image: '',
	Category: '',
	Tags: [],
	Author: '',
	Avatar: '',
	Date: '',
	ReadTime: 0,
	Likes: null,
	Comments: null,
	Liked: false,
	Layout: 'vertical',
	Variant: 'outlined',
	DateBadge: false,
	Href: '',
	ReadLabel: '',
	LikeLabel: '',
	CommentLabel: '',
	ShareLabel: '',

	$OnCreate: function () {
		var format = this.$Service('Format');

		this.Format = function () {
			return format;
		};

		this.Initials = function (name) {
			return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
				return part.charAt(0).toUpperCase();
			}).join('');
		};
	},

	Like: function () {
		this.Liked = !this.Liked;
		this.Likes = Number(this.Likes || 0) + (this.Liked ? 1 : -1);

		this.$Emit('like', {Liked: this.Liked, Likes: this.Likes});
	},

	Comment: function () {
		this.$Emit('comment', {Title: this.Title});
	},

	Share: function () {
		this.$Emit('share', {Title: this.Title, Href: this.Href});
	}
});
