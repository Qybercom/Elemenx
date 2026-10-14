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
	ReplyLabel: 'Reply',
	RepostLabel: 'Repost',
	LikeLabel: 'Like',
	ShareLabel: 'Share',
	VerifiedLabel: 'Verified',

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
