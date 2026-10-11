/*
 * A terminal: a scrolling output above a command line. Lines: [{ID, Kind, Text}] where Kind is input, output, error,
 * info or success. Enter emits command with the text; Arrow Up and Down walk the history of this terminal; Ctrl+L
 * emits clear. Busy disables the command line. Slots: actions (in the title bar, shown with Title or actions).
 * The output follows new lines while the reader is at its end.
 */
Elemenx.Component('Terminal', {
	$TemplateURL: 'Terminal.html',
	$StyleURL: 'Terminal.css',
	Lines: [],
	Title: '',
	Prompt: '$',
	Placeholder: '',
	Busy: false,
	History: [],
	Cursor: -1,
	AtEnd: true,

	$OnReady: function () {
		var self = this;
		var output = this.$Element().querySelector('.elemenx-terminal-output');

		this.Observer = new MutationObserver(function () {
			if (self.AtEnd)
				output.scrollTop = output.scrollHeight;
		});

		this.Observer.observe(output, {childList: true, subtree: true, characterData: true});

		output.scrollTop = output.scrollHeight;
	},

	$OnDestroy: function () {
		if (this.Observer)
			this.Observer.disconnect();
	},

	Scrolled: function (event, node) {
		this.AtEnd = node.scrollHeight - node.scrollTop - node.clientHeight < 24;
	},

	FocusLine: function (event) {
		var selection = window.getSelection ? String(window.getSelection()) : '';
		if (!selection && event.target.tagName !== 'BUTTON')
			this.$Element().querySelector('.elemenx-terminal-input').focus();
	},

	Key: function (event, node) {
		var history = this.History;
		var text = node.value;

		if (event.key === 'Enter') {
			event.preventDefault();

			if (this.Busy) return;

			if (text.trim())
				this.History = history.concat([text]).slice(-100);

			this.Cursor = -1;
			node.value = '';
			this.AtEnd = true;

			this.$Emit('command', text);
		}
		else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			if (!history.length) return;

			event.preventDefault();

			if (event.key === 'ArrowUp') this.Cursor = this.Cursor === -1 ? history.length - 1 : Math.max(0, this.Cursor - 1);
			else this.Cursor = this.Cursor === -1 || this.Cursor >= history.length - 1 ? -1 : this.Cursor + 1;

			node.value = this.Cursor === -1 ? '' : history[this.Cursor];

			node.setSelectionRange(node.value.length, node.value.length);
		}
		else if (event.key === 'l' && event.ctrlKey) {
			event.preventDefault();

			this.$Emit('clear');
		}
	}
});