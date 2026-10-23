/*
 * A terminal: a scrolling output above a command line. Lines: [{ID, Kind, Text}] where Kind is input, output, error,
 * info or success. Enter emits command with the text; Arrow Up and Down walk the history of this terminal; Ctrl+L
 * emits clear. Busy makes the command line read-only: it keeps the focus, so the next command can follow at once.
 * Slots: actions (in the title bar, shown with Title or actions).
 * The output follows new lines while the reader is at its end. Mod+F (or Ctrl+Shift+F) finds in the output: a FindBar
 * under the title marks the matches (the Find Service) and goes from one to the next; Escape closes it.
 */
Elemenx.Component('Terminal', {
	$TemplateURL: 'Terminal.html',
	$StyleURL: 'Terminal.css',
	$Meta: {
		Group: 'data',
		Icon: 'terminal',
		Description: 'A terminal: a scrolling output above a command line.',
		Container: true,
		Slots: ['actions'],
		Events: ['command', 'clear'],
		Props: {
			Lines: 'The output: [{ID, Kind, Text}], Kind input, output, error, info or success.',
			Title: 'The title of its bar.',
			Prompt: 'The prompt of the command line.',
			Placeholder: 'The text shown while it is empty.',
			Busy: 'The command line is read only while a command runs.'
		},
		Sample: {Title: 'Shell'}
	},
	Lines: [],
	Title: '',
	Prompt: '$',
	Placeholder: '',
	Busy: false,
	History: [],
	Cursor: -1,
	AtEnd: true,
	Finding: false,
	FindQuery: '',
	FindCount: 0,
	FindIndex: -1,
	FindRanges: null,

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

	/* The find bar under the title (its field takes the focus). */
	OpenFind: function () {
		this.Finding = true;
	},

	/* The matches in the output, the last one (the newest) shown first. */
	BarFind: function (query) {
		var ranges = this.$Service('Find').Ranges(this.$Element().querySelector('.elemenx-terminal-output'), query.Query, {Case: query.Case, Word: query.Word, RegExp: query.RegExp});

		this.FindQuery = query.Query;
		this.FindRanges = ranges;
		this.FindCount = ranges.length;
		this.FindIndex = ranges.length - 1;

		this.$Service('Find').Show(this, ranges, this.FindIndex);
	},

	BarStep: function (step) {
		var ranges = this.FindRanges || [];
		if (!ranges.length) return;

		this.FindIndex = (this.FindIndex + step + ranges.length) % ranges.length;

		this.$Service('Find').Show(this, ranges, this.FindIndex);
	},

	BarNext: function () {
		this.BarStep(1);
	},

	BarPrevious: function () {
		this.BarStep(-1);
	},

	CloseFind: function () {
		var input = this.$Element().querySelector('.elemenx-terminal-input');

		this.Finding = false;
		this.FindRanges = null;
		this.FindCount = 0;
		this.FindIndex = -1;

		this.$Service('Find').Clear(this);

		if (input)
			input.focus();
	},

	$OnDestroy: function () {
		this.$Service('Find').Clear(this);

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

		if ((event.ctrlKey || event.metaKey) && !event.altKey && event.code === 'KeyF') {
			event.preventDefault();

			this.OpenFind();

			return;
		}

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