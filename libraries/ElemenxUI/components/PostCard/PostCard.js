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
