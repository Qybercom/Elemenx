/*
 * Emoji and stickers in one picker, a tab each: an EmojiPicker and, while the Stickers Service has packs and Stickers
 * is on, a StickerPicker. Kind is the tab shown: emoji or stickers.
 * Events: pick ({Type: 'emoji', Emoji, Name} or {Type: 'sticker', Sticker}), dismiss.
 */
Elemenx.Component('ExpressionPicker', {
	$TemplateURL: 'ExpressionPicker.html',
	$StyleURL: 'ExpressionPicker.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'Emoji and stickers in one picker, a tab each: an EmojiPicker and, while the Stickers Service has packs and Stickers is on, a StickerPicker.',
		Events: ['kind', 'pick', 'dismiss'],
		Props: {
			Kind: {Options: ['emoji', 'stickers'], Description: 'The tab shown: emoji or stickers.'},
			Stickers: 'Shows the tab of the stickers (while the Stickers Service has packs).',
			Columns: 'How many emoji in a row.'
		}
	},
	Kind: 'emoji',
	Stickers: true,
	Columns: 9,
	Version: 0,

	$OnCreate: function () {
		var self = this;
		var stickers = this.$Service('Stickers');

		this.HasStickers = function (on) {
			return !!on && on !== 'false' && stickers.Packs().length > 0;
		};

		this.Listener = stickers.OnChange(function () {
			self.Version++;
		});
	},

	$OnDestroy: function () {
		this.$Service('Stickers').OffChange(this.Listener);
	},

	Switch: function (event, node) {
		this.Kind = node.getAttribute('data-kind');

		this.$Emit('kind', {Kind: this.Kind});
	},

	EmojiPicked: function (detail) {
		this.$Emit('pick', {Type: 'emoji', Emoji: detail.Emoji, Name: detail.Name});
	},

	StickerPicked: function (detail) {
		this.$Emit('pick', {Type: 'sticker', Sticker: detail.Sticker});
	},

	Dismissed: function () {
		this.$Emit('dismiss');
	}
});
