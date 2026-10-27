/*
 * A text to copy (a key, a link, a code): the text, and a button that puts it on the clipboard and says it did.
 * Emits copy with {Value} once it is copied.
 */
Elemenx.Component('CopyField', {
	$TemplateURL: 'CopyField.html',
	$StyleURL: 'CopyField.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'copy',
		Description: 'A text to copy, with a button that puts it on the clipboard.',
		Events: {
			copy: 'The text was copied: {Value}.'
		},
		Props: {
			Value: 'The text.',
			Label: 'What the text is, for screen readers.'
		},
		Sample: {Value: 'acme-demo-0000', Label: 'Demo key'}
	},
	Value: '',
	Label: '',
	Copied: false,

	Copy: function () {
		var self = this;

		if (!navigator.clipboard) return;

		navigator.clipboard.writeText(String(this.Value)).then(function () {
			self.Copied = true;

			self.$Emit('copy', {Value: self.Value});

			window.setTimeout(function () {
				self.Copied = false;
			}, 2000);
		}, function () {});
	}
});
