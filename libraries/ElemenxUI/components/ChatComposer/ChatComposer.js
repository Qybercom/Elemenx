/*
 * The message field of a Chat. Enter sends (the send event carries the text), Shift+Enter starts a new line.
 * The field grows with its text up to MaxRows. Attach shows a button that emits the attach event.
 */
Elemenx.Component('ChatComposer', {
	$TemplateURL: 'ChatComposer.html',
	$StyleURL: 'ChatComposer.css',
	Value: '',
	Placeholder: 'Write a message…',
	MaxRows: 8,
	Attach: true,
	Disabled: false,

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
	}
});