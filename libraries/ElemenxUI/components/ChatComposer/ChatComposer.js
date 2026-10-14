/*
 * The message field of a Chat. Enter sends (the send event carries the text), Shift+Enter starts a new line.
 * The field grows with its text up to MaxRows. Attach shows a button that emits the attach event. Emoji shows the
 * button of an ExpressionPicker: an emoji goes into the text where the caret is, a sticker is sent at once (the
 * sticker event carries {Sticker}); Stickers turns the tab of the stickers off.
 */
Elemenx.Component('ChatComposer', {
	$TemplateURL: 'ChatComposer.html',
	$StyleURL: 'ChatComposer.css',
	Value: '',
	Placeholder: 'Write a message…',
	MaxRows: 8,
	Attach: true,
	Emoji: true,
	Stickers: true,
	Disabled: false,
	Picking: false,

	Fit: function (node) {
		var style = getComputedStyle(node);
		var line = parseFloat(style.lineHeight) || 20;

		node.style.height = 'auto';
		node.style.height = Math.min(node.scrollHeight, line * Number(this.MaxRows)) + 'px';
	},

	Typed: function (event, node) {
		this.Value = node.value;

		this.Fit(node);

		this.$Emit('input', this.Value);
	},

	Key: function (event, node) {
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;

		event.preventDefault();

		this.Send(event, node);
	},

	Send: function () {
		var field = this.$Element().querySelector('textarea');
		var text = String(this.Value || '').replace(/\s+$/, '');
		if (!text.trim() || this.Disabled) return;

		this.$Emit('send', text);

		this.Value = '';
		field.value = '';

		this.Fit(field);

		field.focus();
	},

	Attached: function () {
		this.$Emit('attach');
	},

	Pick: function () {
		this.Picking = !this.Picking;
	},

	Dismissed: function () {
		this.Picking = false;

		this.$Element().querySelector('textarea').focus();
	},

	/* An emoji goes in at the caret (in place of the selection); a sticker is sent. */
	Picked: function (detail) {
		var field = this.$Element().querySelector('textarea');
		var value = String(this.Value || '');
		var start = typeof field.selectionStart === 'number' ? field.selectionStart : value.length;
		var end = typeof field.selectionEnd === 'number' ? field.selectionEnd : value.length;

		this.Picking = false;

		if (detail.Type === 'sticker') {
			this.$Emit('sticker', {Sticker: detail.Sticker});

			field.focus();

			return;
		}

		this.Value = value.substring(0, start) + detail.Emoji + value.substring(end);
		field.value = this.Value;

		field.focus();
		field.setSelectionRange(start + detail.Emoji.length, start + detail.Emoji.length);

		this.Fit(field);

		this.$Emit('input', this.Value);
	}
});
