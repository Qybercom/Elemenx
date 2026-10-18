/*
 * The message field of a Chat. Enter sends (the send event carries the text), Shift+Enter starts a new line.
 * The field grows with its text up to MaxRows. Attach shows a button that emits the attach event. Emoji shows the
 * button of an ExpressionPicker: an emoji goes into the text where the caret is, a sticker is sent at once (the
 * sticker event carries {Sticker}); Stickers turns the tab of the stickers off.
 * Suggestions above the field: Suggest 'always' (the default) offers emoji for the word at the caret (2 letters or
 * more) and for :word, 'colon' only for :word, 'never' none; a pressed emoji takes the place of the word (for :word,
 * Arrow Up and Down choose and Enter or Tab takes one). SuggestStickers (true) offers the stickers of a message of one
 * emoji (the Emoji of the Stickers Service): a pressed sticker is sent in place of the message. Escape hides them.
 */
Elemenx.Component('ChatComposer', {
	$TemplateURL: 'ChatComposer.html',
	$StyleURL: 'ChatComposer.css',
	Value: '',
	Placeholder: '',
	MaxRows: 8,
	Attach: true,
	Emoji: true,
	Stickers: true,
	Disabled: false,
	Picking: false,
	Suggest: 'always',
	SuggestStickers: true,
	Hints: [],
	HintStickers: [],
	HintIndex: 0,
	HintKeyboard: false,

	$OnCreate: function () {
		var own = {Asked: 0, Range: null, Dismissed: null};

		this.HintsID = 'elemenx-chat-hints-' + Math.random().toString(36).slice(2, 10);

		/* What the composer keeps for itself: not state, so it renders nothing. */
		this.Own = function () {
			return own;
		};
	},

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

		this.Hint(node);
	},

	Field: function () {
		return this.$Element().querySelector('textarea');
	},

	Service: function (name) {
		try {
			return this.$Service(name);
		}
		catch (error) {
			return null;
		}
	},

	/* The suggestions for the text at the caret: emoji for a word, stickers for a message of one emoji. */
	Hint: function (node) {
		var self = this;
		var own = this.Own();
		var emoji = this.Service('Emoji');
		var value = node.value;
		var caret = node.selectionEnd;
		var before = value.substring(0, caret);
		var after = value.charAt(caret);
		var colon = /(^|\s):([^\s:]{2,})$/.exec(before);
		var word = !colon && this.Suggest === 'always' ? /(^|\s)([^\s.,!?;:()[\]{}"'«»„“”…<>\/\\|@#$%^&*=+~`0-9]{2,})$/.exec(before) : null;
		var key = value + '\n' + caret;
		var asked = ++own.Asked;

		if (!emoji || this.Disabled || own.Dismissed === key || this.Suggest === 'never' && !this.SuggestStickers || after && !/\s/.test(after)) {
			this.Clear();

			return;
		}

		own.Dismissed = null;

		emoji.Load(function (error) {
			var single;
			var stickers = self.Service('Stickers');
			var match = colon || word;
			var found;

			if (error || asked !== own.Asked) return;

			single = self.SuggestStickers && self.Stickers && stickers ? emoji.Single(value) : '';
			found = single ? stickers.ByEmoji(single, 12) : [];

			if (found.length) {
				self.Hints = [];
				self.HintStickers = found;
				self.HintKeyboard = false;

				return;
			}

			if (!match || self.Suggest === 'never') {
				self.Clear();

				return;
			}

			found = emoji.Search(match[2], 8).filter(function (item) {
				return emoji.Supported(item.Char);
			}).map(function (item) {
				return {Char: item.Tone ? emoji.Toned(item.Char, emoji.Tone()) : item.Char, Name: emoji.Name(item)};
			});

			own.Range = {Start: caret - match[2].length - (colon ? 1 : 0), End: caret};

			self.HintStickers = [];
			self.Hints = found;
			self.HintIndex = 0;
			self.HintKeyboard = !!colon && found.length > 0;
		});
	},

	Clear: function () {
		if (this.Hints.length)
			this.Hints = [];

		if (this.HintStickers.length)
			this.HintStickers = [];

		this.HintKeyboard = false;
	},

	/* An emoji of the suggestions takes the place of the word. */
	Suggested: function (index) {
		var item = this.Hints[index];
		var range = this.Own().Range;
		var field = this.Field();
		var value = String(this.Value || '');
		var emoji = this.Service('Emoji');

		if (!item || !range) return;

		this.Value = value.substring(0, range.Start) + item.Char + value.substring(range.End);
		field.value = this.Value;

		field.focus();
		field.setSelectionRange(range.Start + item.Char.length, range.Start + item.Char.length);

		if (emoji)
			emoji.Used(item.Char);

		this.Fit(field);

		this.$Emit('input', this.Value);

		this.Hint(field);
	},

	HintPicked: function (event, node) {
		this.Suggested(Number(node.getAttribute('data-index')));
	},

	/* A sticker of the suggestions is sent in place of the message of its emoji. */
	StickerHintPicked: function (event, node) {
		var sticker = this.HintStickers[Number(node.getAttribute('data-index'))];
		var field = this.Field();
		var stickers = this.Service('Stickers');

		if (!sticker) return;

		this.Clear();

		this.Value = '';
		field.value = '';

		this.Fit(field);

		if (stickers)
			stickers.Used(sticker);

		this.$Emit('input', '');
		this.$Emit('sticker', {Sticker: sticker});

		field.focus();
	},

	/* The strip of suggestions keeps the focus in the field. */
	HoldHint: function (event) {
		event.preventDefault();
	},

	Left: function () {
		var self = this;

		window.setTimeout(function () {
			var root = self.$Element();
			if (root && !root.contains(root.getRootNode().activeElement))
				self.Clear();
		}, 0);
	},

	Moved: function (event, node) {
		if (event.type === 'keyup' && /^(ArrowUp|ArrowDown|Enter|Tab|Escape|Shift|Control|Alt|Meta)$/.test(event.key)) return;

		this.Hint(node);
	},

	Key: function (event, node) {
		if (event.isComposing) return;

		if ((this.Hints.length || this.HintStickers.length) && event.key === 'Escape') {
			event.preventDefault();

			this.Own().Dismissed = node.value + '\n' + node.selectionEnd;

			this.Clear();

			return;
		}

		if (this.HintKeyboard && this.Hints.length) {
			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				event.preventDefault();

				this.HintIndex = (this.HintIndex + (event.key === 'ArrowDown' ? 1 : -1) + this.Hints.length) % this.Hints.length;

				this.Reveal('.elemenx-chat-hint.active');

				return;
			}

			if (event.key === 'Enter' || event.key === 'Tab') {
				event.preventDefault();

				this.Suggested(this.HintIndex);

				return;
			}
		}

		if (event.key !== 'Enter' || event.shiftKey) return;

		event.preventDefault();

		this.Send(event, node);
	},

	Send: function () {
		var field = this.$Element().querySelector('textarea');
		var text = String(this.Value || '').replace(/\s+$/, '');
		if (!text.trim() || this.Disabled) return;

		this.$Emit('send', text);

		this.Clear();

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

		this.Hint(field);
	},

	/* Scrolls the list of the active item so that the item shows: the list only, never the page. */
	Reveal: function (selector) {
		var root = this.$Element();

		window.setTimeout(function () {
			var item = root && root.querySelector(selector);
			var list = item && item.parentElement;
			var box;
			var rect;

			while (list && list !== root && list.scrollHeight <= list.clientHeight && list.scrollWidth <= list.clientWidth)
				list = list.parentElement;

			if (!item || !list) return;

			box = list.getBoundingClientRect();
			rect = item.getBoundingClientRect();

			if (rect.top < box.top) list.scrollTop -= box.top - rect.top;
			else if (rect.bottom > box.bottom) list.scrollTop += rect.bottom - box.bottom;

			if (rect.left < box.left) list.scrollLeft -= box.left - rect.left;
			else if (rect.right > box.right) list.scrollLeft += rect.right - box.right;
		}, 0);
	}
});
