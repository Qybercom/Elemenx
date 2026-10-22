/*
 * The bar of find and replace of an editor (CodeEditor, RichEditor) or a terminal: a field for the text, the options
 * Case, Word and RegExp, the place of the match ('3 of 12', from Index and Count) with the previous and the next one,
 * and with Replacing a field for the replacement with Replace and Replace all (CanReplace: false leaves them out). It
 * finds nothing itself: it emits find ({Query, Case, Word, RegExp}) as the text or an option changes, next and previous
 * (Enter and Shift+Enter in the field), replace and replaceall ({Text}; Enter and Ctrl+Enter in its field), and close
 * (Escape, or its button). Focus() puts the focus in its field and selects the text; Autofocus does it once the bar
 * is ready.
 */
Elemenx.Component('FindBar', {
	$TemplateURL: 'FindBar.html',
	$StyleURL: 'FindBar.css',
	Query: '',
	Replacement: '',
	Case: false,
	Word: false,
	RegExp: false,
	Replacing: false,
	CanReplace: true,
	Count: 0,
	Index: -1,
	Label: '',
	Autofocus: false,

	$OnReady: function () {
		var self = this;

		if (this.Autofocus && this.Autofocus !== 'false') {
			window.setTimeout(function () {
				self.Focus();
			}, 0);
		}
	},

	Focus: function () {
		var field = this.$Element().querySelector('.elemenx-find-query');

		if (field) {
			field.focus();
			field.select();
		}
	},

	Emitted: function () {
		this.$Emit('find', {Query: this.Query, Case: this.Case, Word: this.Word, RegExp: this.RegExp});
	},

	Typed: function (event, node) {
		this.Query = node.value;

		this.Emitted();
	},

	Toggled: function (event, node) {
		var name = node.getAttribute('data-option');

		this[name] = !this[name];

		this.Emitted();
	},

	Key: function (event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();

			this.$Emit('close', null);

			return;
		}

		if (event.key !== 'Enter') return;

		if (event.target.classList.contains('elemenx-find-query')) {
			event.preventDefault();

			this.$Emit(event.shiftKey ? 'previous' : 'next', null);
		}
		else if (event.target.classList.contains('elemenx-find-replacement')) {
			event.preventDefault();

			this.$Emit(event.ctrlKey || event.metaKey ? 'replaceall' : 'replace', {Text: this.Replacement});
		}
	},

	Written: function (event, node) {
		this.Replacement = node.value;
	},

	Next: function () {
		this.$Emit('next', null);
	},

	Previous: function () {
		this.$Emit('previous', null);
	},

	Replace: function () {
		this.$Emit('replace', {Text: this.Replacement});
	},

	ReplaceAll: function () {
		this.$Emit('replaceall', {Text: this.Replacement});
	},

	Switch: function () {
		this.Replacing = !this.Replacing;
	},

	Close: function () {
		this.$Emit('close', null);
	}
});
