/*
 * One message of a Chat. Text, or the default slot for rich content. Own puts the message on the reader's side.
 * Avatar is an image URL; without it the initials of Author are shown. Position places the message in a run of
 * messages from one author: single, first, middle or last. The author name shows on the first message of a run and
 * the avatar on the last (the newest) one. Status: sending, sent, read or error. Sticker is the URL of a sticker sent
 * as the message. Reactions: [{Emoji, Count, Mine}] under the bubble; a press on one emits react. React adds the
 * button that picks an emoji to react with (EmojiPicker).
 * Events: react ({ID, Emoji, Mine}): Mine tells whether the reader reacts (true) or takes the reaction back (false);
 * ID is the ID of the message.
 */
Elemenx.Component('ChatMessage', {
	$TemplateURL: 'ChatMessage.html',
	$StyleURL: 'ChatMessage.css',
	ID: null,
	Author: '',
	Avatar: '',
	Text: '',
	Time: '',
	Own: false,
	Position: 'single',
	Status: '',
	Sticker: '',
	Reactions: [],
	React: false,
	Picking: false,

	$OnCreate: function () {
		this.Initials = function (name) {
			return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
				return part.charAt(0).toUpperCase();
			}).join('');
		};

		this.StatusIcon = function (status) {
			return {sending: 'clock', sent: 'check', read: 'check', error: 'error'}[status] || '';
		};
	},

	Toggled: function (event, node) {
		var emoji = node.getAttribute('data-emoji');
		var reaction = (this.Reactions || []).filter(function (entry) {
			return entry.Emoji === emoji;
		})[0];

		this.$Emit('react', {ID: this.ID, Emoji: emoji, Mine: !(reaction && reaction.Mine)});
	},

	Pick: function () {
		this.Picking = !this.Picking;
	},

	Reacted: function (detail) {
		var mine = (this.Reactions || []).some(function (entry) {
			return entry.Emoji === detail.Emoji && entry.Mine;
		});

		this.Picking = false;

		if (!mine)
			this.$Emit('react', {ID: this.ID, Emoji: detail.Emoji, Mine: true});
	},

	Dismissed: function () {
		this.Picking = false;
	}
});
