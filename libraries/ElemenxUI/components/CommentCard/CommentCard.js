/*
 * A comment, a post of a social network or a tweet: the Author (Avatar, Verified, Handle), the Time it was written
 * (shown from now: '5 minutes ago'), Text, up to four images of Media, and the counts of Replies, Reposts and Likes (null
 * hides one) with Reposted and Liked. In the text, @mentions and #tags are buttons and links are links; nothing of the
 * text is read as markup. Thread draws the line to the next comment of a thread; the default slot holds the replies.
 * Variant: flat (default: a comment of a list), outlined or elevated (a card).
 * Events: reply, repost ({Reposted, Reposts}), like ({Liked, Likes}), share, mention ({Handle}), tag ({Tag}).
 */
Elemenx.Component('CommentCard', {
	$TemplateURL: 'CommentCard.html',
	$StyleURL: 'CommentCard.css',
	$Meta: {
		Group: 'social',
		Icon: 'comment',
		Description: 'A comment, a post of a social network or a tweet: the Author (Avatar, Verified, Handle), the Time it was written (shown from now: \'5 minutes ago\'), Text, up to four images of Media, and the counts of Replies, Reposts and Likes (null hides one) with Reposted and Liked.',
		Container: true,
		Events: ['reply', 'repost', 'like', 'share', 'mention', 'tag'],
		Props: {
			Author: 'The name of the author.',
			Handle: 'The handle of the author (without @).',
			Avatar: 'The URL of the picture of the author.',
			Verified: 'Marks the author as verified.',
			Time: 'When it was written (shown from now: 5 minutes ago).',
			Text: 'The text: @mentions and #tags are buttons, links are links.',
			Media: 'Up to four images: URLs or [{Image, Alt}].',
			Replies: 'The count of replies (null hides it).',
			Reposts: 'The count of reposts (null hides it).',
			Likes: 'The count of likes (null hides it).',
			Reposted: 'The reader reposted it.',
			Liked: 'The reader liked it.',
			Thread: 'Draws the line to the next comment of a thread.',
			Variant: {Options: ['flat', 'outlined', 'elevated'], Description: 'flat (a comment of a list), outlined or elevated (a card).'},
			ReplyLabel: 'The name of the reply button.',
			RepostLabel: 'The name of the repost button.',
			LikeLabel: 'The name of the like button.',
			ShareLabel: 'The name of the share button.',
			VerifiedLabel: 'The name of the verified mark.'
		},
		Sample: {Author: 'Grace Hopper', Handle: 'grace', Verified: true, Text: 'The #ElemenxUI cards are in! Thanks @ada for the review. Notes: https://example.com/cards', Replies: 4, Reposts: 12, Likes: 240}
	},
	Author: '',
	Handle: '',
	Avatar: '',
	Verified: false,
	Time: '',
	Text: '',
	Media: [],
	Replies: null,
	Reposts: null,
	Likes: null,
	Reposted: false,
	Liked: false,
	Thread: false,
	Variant: 'flat',
	Now: null,
	ReplyLabel: '',
	RepostLabel: '',
	LikeLabel: '',
	ShareLabel: '',
	VerifiedLabel: '',

	$OnCreate: function () {
		var format = this.$Service('Format');

		this.Format = function () {
			return format;
		};

		this.MediaClass = function (media) {
			return 'count-' + Math.min(media.length, 4);
		};

		/* The text in parts: plain text, @mentions, #tags and links. */
		this.Parts = function (text) {
			var pattern = /(@[A-Za-z0-9_]+|#[A-Za-z0-9_Ѐ-ӿ]+|https?:\/\/[^\s]+[^\s.,!?;:)])/g;
			var parts = [];
			var last = 0;
			var match;

			text = String(text || '');

			while ((match = pattern.exec(text)) !== null) {
				if (match.index > last)
					parts.push({Key: 'text-' + last, Kind: 'text', Text: text.substring(last, match.index)});

				if (match[0].charAt(0) === '@') parts.push({Key: 'mention-' + match.index, Kind: 'mention', Text: match[0], Value: match[0].substring(1)});
				else if (match[0].charAt(0) === '#') parts.push({Key: 'tag-' + match.index, Kind: 'tag', Text: match[0], Value: match[0].substring(1)});
				else parts.push({Key: 'link-' + match.index, Kind: 'link', Text: match[0], Short: match[0].replace(/^https?:\/\/(www\.)?/, '').replace(/^(.{32}).+$/, '$1…')});

				last = match.index + match[0].length;
			}

			if (last < text.length)
				parts.push({Key: 'text-' + last, Kind: 'text', Text: text.substring(last)});

			return parts;
		};
	},

	Reply: function () {
		this.$Emit('reply', {Author: this.Author, Handle: this.Handle});
	},

	Repost: function () {
		this.Reposted = !this.Reposted;
		this.Reposts = Number(this.Reposts || 0) + (this.Reposted ? 1 : -1);

		this.$Emit('repost', {Reposted: this.Reposted, Reposts: this.Reposts});
	},

	Like: function () {
		this.Liked = !this.Liked;
		this.Likes = Number(this.Likes || 0) + (this.Liked ? 1 : -1);

		this.$Emit('like', {Liked: this.Liked, Likes: this.Likes});
	},

	Share: function () {
		this.$Emit('share', {Author: this.Author, Text: this.Text});
	},

	Token: function (event, node) {
		if (node.getAttribute('data-kind') === 'mention') this.$Emit('mention', {Handle: node.getAttribute('data-value')});
		else this.$Emit('tag', {Tag: node.getAttribute('data-value')});
	}
});
