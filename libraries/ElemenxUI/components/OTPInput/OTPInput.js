/*
 * A one-time code of Length characters. Value holds the characters only.
 * Variant: 'split' (one cell per character, Group puts a separator after every Group cells) or 'single' (one field).
 * Both are one real <input> (the cells of 'split' are drawn over it), so typing, paste, undo, selection and the
 * one-time codes that a phone offers from a message all work as in any field.
 * Pattern says which characters are taken: 'digits', 'letters', 'alphanumeric' or a character class ('[0-9A-F]');
 * Case 'upper' or 'lower' changes letters as they come. Anything else typed or pasted is dropped ('123-456' gives
 * '123456'), and the code never grows past Length (a character typed over a filled cell takes its place); a pasted code fills from the caret, or replaces all of it when long
 * enough. Masked hides the characters (an eye button shows them, Revealed) and keeps them from being copied.
 * Events: input (Value), change (on leaving the field), complete (Value, when the last character comes), validate
 * ({Value, Complete, Valid}). Invalid marks the field; a field left incomplete is marked too.
 */
Elemenx.Component('OTPInput', {
	$TemplateURL: 'OTPInput.html',
	$StyleURL: 'OTPInput.css',
	Value: '',
	Length: 6,
	Pattern: 'digits',
	Case: '',
	Variant: 'split',
	Group: 0,
	Masked: false,
	Revealed: false,
	MaskChar: '•',
	Placeholder: '',
	Label: 'One-time code',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	AutoFocus: false,
	Invalid: false,
	Touched: false,
	Focused: false,
	Start: 0,
	End: 0,

	$OnCreate: function () {
		var self = this;

		this.Cells = function (value, length, group) {
			var cells = [];
			var text = String(value || '');
			var size = Number(group) || 0;
			var i = 0;

			while (i < Number(length)) {
				if (size && i && i % size === 0)
					cells.push({Key: 'separator-' + i, Separator: true});

				cells.push({Key: 'cell-' + i, Index: i, Char: text.charAt(i), Filled: i < text.length});

				i++;
			}

			return cells;
		};

		/* The classes of a cell: filled, the one the caret is in, and the selected ones. */
		this.CellClass = function (cell, value, focused, start, end, length) {
			var text = String(value || '');
			var caret = Math.min(start, Number(length) - 1, text.length);
			var classes = ['elemenx-otp-cell'];

			if (cell.Filled) classes.push('filled');
			else classes.push('empty');

			if (focused && end > start && cell.Index >= start && cell.Index < end) classes.push('selected');
			else if (focused && cell.Index === caret) classes.push('active');

			return classes;
		};

		this.Shown = function (cell, masked, revealed) {
			if (!cell.Filled) return '';

			return masked && !revealed ? self.MaskChar : cell.Char;
		};

		this.Complete = function (value) {
			return String(value || '').length === Number(self.Length);
		};
	},

	$OnReady: function () {
		var input;

		if (!this.AutoFocus) return;

		input = this.$Element().querySelector('.elemenx-otp-control');

		if (input)
			input.focus();
	},

	/* The characters of text that Pattern takes, in Case. */
	Filter: function (text) {
		var pattern = {digits: '[0-9]', letters: '[A-Za-z]', alphanumeric: '[A-Za-z0-9]'}[this.Pattern] || this.Pattern || '[0-9]';
		var test = new RegExp('^' + pattern + '$');
		var result = '';
		var chars = String(text || '').split('');
		var i = 0;
		var char;

		while (i < chars.length) {
			char = chars[i];

			if (this.Case === 'upper') char = char.toUpperCase();
			else if (this.Case === 'lower') char = char.toLowerCase();

			if (test.test(char))
				result += char;

			i++;
		}

		return result;
	},

	/* Puts value (already filtered) into the field with the caret at caret, and reports it. */
	Apply: function (node, value, caret) {
		var complete = this.Complete(this.Value);

		value = value.slice(0, Number(this.Length));
		caret = Math.min(caret, value.length);

		node.value = value;

		if (document.activeElement === node)
			node.setSelectionRange(caret, caret);

		this.Start = caret;
		this.End = caret;

		if (value === this.Value) return;

		this.Value = value;

		this.$Emit('input', value);
		this.$Emit('validate', {Value: value, Complete: this.Complete(value), Valid: this.Complete(value)});

		if (!complete && this.Complete(value))
			this.$Emit('complete', value);
	},

	Typed: function (event, node) {
		var caret = node.selectionStart || 0;

		this.Apply(node, this.Filter(node.value), this.Filter(node.value.slice(0, caret)).length);
	},

	/* A pasted code: from the caret, or the whole code when it is long enough. */
	Pasted: function (event, node) {
		var data = event.clipboardData || window.clipboardData;
		var text = this.Filter(data ? data.getData('text') : '');
		var start = node.selectionStart || 0;
		var end = node.selectionEnd || 0;
		var value = String(this.Value || '');

		event.preventDefault();

		if (!text) return;

		if (text.length >= Number(this.Length)) this.Apply(node, text, Number(this.Length));
		else this.Apply(node, value.slice(0, start) + text + value.slice(end), start + text.length);
	},

	/* A typed character over a filled cell takes its place instead of pushing the others along. */
	Key: function (event, node) {
		var start = node.selectionStart || 0;
		var printable = event.key && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
		var value = String(this.Value || '');

		if (!printable || this.Variant === 'single' || start !== node.selectionEnd) return;

		if (!this.Filter(event.key)) {
			event.preventDefault();

			return;
		}

		/* At the end of a full code a further character is dropped. */
		if (start < value.length) node.setSelectionRange(start, start + 1);
		else if (value.length >= Number(this.Length)) event.preventDefault();
	},

	Track: function (event, node) {
		this.Start = node.selectionStart || 0;
		this.End = node.selectionEnd || 0;
	},

	/* A press on a cell puts the caret on that cell (over a filled cell, selects its character). */
	Point: function (event, node) {
		var cells = node.parentNode.querySelectorAll('.elemenx-otp-cell');
		var value = String(this.Value || '');
		var index = value.length;
		var rect;
		var i = 0;

		if (this.Variant === 'single' || this.Disabled) return;

		event.preventDefault();

		while (i < cells.length) {
			rect = cells[i].getBoundingClientRect();

			if (event.clientX < rect.right + 4) {
				index = i;

				break;
			}

			i++;
		}

		index = Math.min(index, value.length);

		node.focus();
		node.setSelectionRange(index, index < value.length ? index + 1 : index);

		this.Track(event, node);
	},

	Guard: function (event) {
		if (this.Masked && !this.Revealed)
			event.preventDefault();
	},

	Focus: function (event, node) {
		this.Focused = true;

		this.Track(event, node);
	},

	Blur: function () {
		this.Focused = false;
		this.Touched = true;
	},

	Committed: function () {
		this.$Emit('change', this.Value);
	},

	Reveal: function () {
		this.Revealed = !this.Revealed;
	}
});
