/*
 * A field of tags. Value: the tags (strings). Typing and Enter (or a Separator: ',' and ';' by default) adds a tag;
 * a pasted list ('a, b; c' or one per line) adds each one; Backspace in an empty field removes the last tag; the
 * cross of a tag removes it. Suggestions (strings) open under the field while typing (arrows and Enter pick one);
 * AllowNew: false takes suggestions only. Pattern (a regular expression a tag must match, as '^[^@]+@[^@]+$'),
 * Unique (true) and Max limit what is taken; a refused text stays in the field, marked, and emits invalid with
 * {Text, Reason: 'pattern', 'duplicate', 'max' or 'unknown'}. Case 'lower' or 'upper' changes the tags.
 * Events: change (the tags), add (a tag), remove (a tag), invalid.
 */
Elemenx.Component('TagInput', {
	$TemplateURL: 'TagInput.html',
	$StyleURL: 'TagInput.css',
	Value: [],
	Suggestions: [],
	Placeholder: '',
	Separators: [',', ';'],
	AllowNew: true,
	Unique: true,
	Max: 0,
	Pattern: '',
	Case: '',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Text: '',
	Refused: false,
	Open: false,
	Active: 0,

	$OnCreate: function () {
		var self = this;

		this.Matching = function (suggestions, value, text) {
			var query = String(text || '').trim().toLowerCase();
			var taken = (value || []).map(function (tag) {
				return String(tag).toLowerCase();
			});

			return (suggestions || []).filter(function (entry) {
				var label = String(entry).toLowerCase();

				return taken.indexOf(label) === -1 && (!query || label.indexOf(query) !== -1);
			}).slice(0, 8);
		};

		this.Full = function (value) {
			return Number(self.Max) > 0 && (value || []).length >= Number(self.Max);
		};
	},

	/* The text as a tag: trimmed, in Case. */
	Clean: function (text) {
		var tag = String(text || '').trim();

		if (this.Case === 'lower') tag = tag.toLowerCase();
		else if (this.Case === 'upper') tag = tag.toUpperCase();

		return tag;
	},

	/* Why tag cannot be added, or '' when it can. */
	Reason: function (tag, value) {
		var lower = tag.toLowerCase();

		if (this.Full(value)) return 'max';
		if (this.Pattern && !new RegExp(this.Pattern).test(tag)) return 'pattern';

		if (this.Unique && value.some(function (entry) {
			return String(entry).toLowerCase() === lower;
		})) return 'duplicate';

		if (!this.AllowNew && !this.Suggestions.some(function (entry) {
			return String(entry).toLowerCase() === lower;
		})) return 'unknown';

		return '';
	},

	/* Adds the tags of texts; the texts refused stay in the field. Returns the texts left. */
	Add: function (texts) {
		var self = this;
		var value = (this.Value || []).slice();
		var added = [];
		var left = [];

		texts.forEach(function (text) {
			var tag = self.Clean(text);
			var reason;

			if (!tag) return;

			reason = self.Reason(tag, value);

			if (reason) {
				left.push(String(text).trim());

				self.$Emit('invalid', {Text: tag, Reason: reason});

				return;
			}

			value.push(tag);
			added.push(tag);
		});

		if (added.length) {
			this.Value = value;

			added.forEach(function (tag) {
				self.$Emit('add', tag);
			});

			this.$Emit('change', value.slice());
		}

		this.Refused = left.length > 0;

		return left;
	},

	RemoveAt: function (index) {
		var value = (this.Value || []).slice();
		var tag = value.splice(index, 1)[0];
		if (tag === undefined) return;

		this.Value = value;

		this.$Emit('remove', tag);
		this.$Emit('change', value.slice());
	},

	Split: function (text) {
		var separators = (this.Separators || []).concat(['\n', '\r', '\t']).map(function (separator) {
			return separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		});

		return String(text).split(new RegExp(separators.join('|')));
	},

	Typed: function (event, node) {
		var parts = this.Split(node.value);
		var left;

		this.Refused = false;

		/* A separator typed or pasted: the parts before the last one become tags. */
		if (parts.length > 1) {
			left = this.Add(parts.slice(0, -1));

			node.value = left.concat([parts[parts.length - 1]]).join(', ').replace(/^, /, '');
		}

		this.Text = node.value;
		this.Active = 0;
		this.Open = !!this.Matching(this.Suggestions, this.Value, this.Text).length && !!this.Text.trim();
	},

	Pasted: function (event, node) {
		var data = event.clipboardData || window.clipboardData;
		var text = data ? data.getData('text') : '';
		var parts = this.Split(text);
		var left;

		if (parts.length < 2) return;

		event.preventDefault();

		left = this.Add(parts);

		node.value = left.join(', ');

		this.Text = node.value;
	},

	Commit: function (node) {
		var matching = this.Matching(this.Suggestions, this.Value, this.Text);
		var text = this.Open && matching[this.Active] !== undefined ? matching[this.Active] : node.value;
		var left = this.Add([text]);

		node.value = left.join('');

		this.Text = node.value;
		this.Open = false;
	},

	Key: function (event, node) {
		var matching = this.Matching(this.Suggestions, this.Value, this.Text);

		if (event.key === 'Enter') {
			event.preventDefault();

			this.Commit(node);
		}
		else if (event.key === 'Backspace' && !node.value && this.Value.length) {
			event.preventDefault();

			this.RemoveAt(this.Value.length - 1);
		}
		else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && matching.length) {
			event.preventDefault();

			if (!this.Open) {
				this.Open = true;

				return;
			}

			this.Active = (this.Active + (event.key === 'ArrowDown' ? 1 : -1) + matching.length) % matching.length;

			this.Reveal('.elemenx-popup .elemenx-option.active');
		}
		else if (event.key === 'Escape' && this.Open) {
			event.preventDefault();
			event.stopPropagation();

			this.Open = false;
		}
	},

	Blur: function (event, node) {
		this.Open = false;

		/* A text left in the field becomes a tag when the field is left, if it can be one. */
		if (node.value.trim() && !this.Refused)
			this.Commit(node);
	},

	Remove: function (event, node) {
		event.stopPropagation();

		this.RemoveAt(Number(node.getAttribute('data-index')));
	},

	Focus: function (event, node) {
		var input = node.querySelector('.elemenx-tags-control');
		if (input && event.target === node)
			input.focus();
	},

	Prevent: function (event) {
		event.preventDefault();
	},

	Hover: function (event, node) {
		this.Active = Number(node.getAttribute('data-index'));
	},

	Pick: function (event, node) {
		var input = node.closest('.elemenx-tags').querySelector('.elemenx-tags-control');

		this.Active = Number(node.getAttribute('data-index'));
		this.Open = true;

		this.Commit(input);

		input.focus();
	},

	Dismissed: function () {
		this.Open = false;
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
