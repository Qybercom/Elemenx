/*
 * Source code shown, not edited: Value highlighted by the Syntax Service in Language, as a CodeEditor draws it.
 * LineNumbers (and Start, the number of the first line), Wrap, Highlight ([3, '7-9']: lines marked), Copy (a button
 * that copies the code, on by default), Label. The text is selectable; Rows limits its height in lines (it scrolls).
 * Fold: a bracket ({, [ or () that closes on a later line, or an element of HTML or XML whose closing tag is on a
 * later line (<ul> ... </ul>; not one that closes itself, nor a void element), makes a block that folds: a button
 * beside its first line hides the lines up to the one that closes it, and the first line ends with … and the rest of
 * that last one ("items": [ … ], or <ul> … </ul>). A press on … unfolds it too. Folded lists the numbers of the lines
 * whose blocks start folded; the event fold reports {Line, Folded} at each press.
 */
Elemenx.Component('CodeView', {
	$TemplateURL: 'CodeView.html',
	$StyleURL: 'CodeView.css',
	$Meta: {
		Group: 'text',
		Icon: 'code',
		Description: 'Source code shown, not edited: Value highlighted by the Syntax Service in Language, as a CodeEditor draws it.',
		Events: ['fold'],
		Props: {
			Value: 'The code.',
			Language: 'The language that highlights it.',
			LineNumbers: 'Shows the numbers of the lines.',
			Start: 'The number of the first line.',
			Wrap: 'Wraps long lines.',
			Highlight: 'The lines marked: [3, \'7-9\'].',
			Copy: 'Shows the button that copies the code.',
			Rows: 'Limits the height to so many lines (0: all).',
			Label: 'The name of the code for screen readers.',
			Fold: 'Lets the blocks of brackets and of HTML elements fold.',
			Folded: 'The numbers of the lines whose blocks start folded.'
		},
		Sample: {Value: 'function greet (name) {\n\tvar text = \'Hello, \' + name;\n\n\treturn text.toUpperCase();\n}', Language: 'javascript', LineNumbers: true, Highlight: [4], Label: 'A function'}
	},
	Value: '',
	Language: 'text',
	LineNumbers: false,
	Start: 1,
	Wrap: false,
	Highlight: [],
	Copy: true,
	Rows: 0,
	Label: '',
	Fold: false,
	Folded: [],

	$OnCreate: function () {
		var self = this;

		function escape (text) {
			return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}

		/* The numbers of the marked lines: 3, or '7-9'. */
		function marked (list) {
			var lines = {};

			(Array.isArray(list) ? list : String(list || '').split(',')).forEach(function (entry) {
				var range = String(entry).split('-');
				var from = Number(range[0]);
				var to = range.length > 1 ? Number(range[1]) : from;

				while (from <= to) {
					lines[from] = true;

					from++;
				}
			});

			return lines;
		}

		/*
		 * The blocks that fold: {index of the first line: index of the last one}, for each bracket that closes on a
		 * later line. The brackets of strings, comments and regular expressions do not count; the outer block of a
		 * line wins when several open on it.
		 */
		function blocks (lines) {
			var pairs = {'}': '{', ']': '[', ')': '('};
			var stack = [];
			var result = {};
			var elements = [];
			var opening = null;

			function block (from, to) {
				if (to > from && (result[from] === undefined || result[from] < to))
					result[from] = to;
			}

			/* A closing tag ends the nearest open element of its name, and the ones left open inside it. */
			function closed (tag, line) {
				var at = elements.length;

				while (at > 0 && elements[at - 1].Name !== tag)
					at--;

				if (!at) return;

				block(elements[at - 1].Line, line);

				elements.length = at - 1;
			}

			lines.forEach(function (tokens, index) {
				tokens.forEach(function (token) {
					var i = 0;
					var open;
					var name;

					/*
					 * The elements of HTML and XML: a tag (<ul ... >) opens a block that its closing tag (</ul>) ends; a tag
					 * that closes itself (/>) and a void element of HTML (<br>, <img>...) open none.
					 */
					if (token.Type === 'tag') {
						/* Tokens of one type come joined (<ul and > are <ul>): the parts of the tags are read inside. */
						name = /<(\/?)([A-Za-z][\w:.-]*)|(\/?>)/g;
						open = name.exec(token.Text);

						while (open) {
							if (open[2] && !open[1]) opening = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(open[2]) ? null : {Name: open[2], Line: index};
							else if (open[2]) closed(open[2], index);
							else if (open[3] === '>' && opening) elements.push(opening);

							if (open[3])
								opening = null;

							open = name.exec(token.Text);
						}

						return;
					}

					if (token.Type === 'string' || token.Type === 'comment' || token.Type === 'regex') return;

					while (i < token.Text.length) {
						if ('{[('.indexOf(token.Text.charAt(i)) !== -1) {
							stack.push({Bracket: token.Text.charAt(i), Line: index});
						}
						else if (pairs[token.Text.charAt(i)] && stack.length && stack[stack.length - 1].Bracket === pairs[token.Text.charAt(i)]) {
							open = stack.pop();

							block(open.Line, index);
						}

						i++;
					}
				});
			});

			return result;
		}

		function markup (tokens) {
			return tokens.map(function (token) {
				return token.Type ? '<span class="elemenx-syntax-' + token.Type + '">' + escape(token.Text) + '</span>' : escape(token.Text);
			}).join('');
		}

		/* The rest of the last line of a block, without its indent, shown after … while the block is folded. */
		function tail (tokens) {
			var rest = tokens.slice();

			while (rest.length && !rest[0].Type && /^\s*$/.test(rest[0].Text))
				rest.shift();

			if (rest.length && !rest[0].Type)
				rest[0] = {Type: rest[0].Type, Text: rest[0].Text.replace(/^\s+/, '')};

			return markup(rest);
		}

		/* labels: the names of the buttons of a block, {Fold, Unfold}, in the language of the page. */
		this.Rendered = function (value, language, start, highlight, fold, folded, labels) {
			var lines = self.$Service('Syntax').Lines(String(value == null ? '' : value).replace(/\n$/, ''), language || 'text');
			var first = Number(start) || 1;
			var marks = marked(highlight);
			var regions = fold ? blocks(lines) : {};
			var closed = (Array.isArray(folded) ? folded : String(folded || '').split(',')).map(Number);
			var html = lines.map(function (tokens, index) {
				var end = regions[index];
				var foldable = end !== undefined;
				var shut = foldable && closed.indexOf(first + index) !== -1;
				var text = '<span class="elemenx-code-view-line' + (marks[first + index] ? ' marked' : '') + (foldable ? ' foldable' : '') + (shut ? ' folded' : '') + '" data-line="' + (first + index) + '"' + (foldable ? ' data-end="' + (first + end) + '"' : '') + '>';

				if (foldable)
					text += '<button class="elemenx-code-view-fold" type="button" tabindex="-1" aria-expanded="' + !shut + '" aria-label="' + escape(labels.Fold) + '"></button>';

				text += markup(tokens);

				if (foldable)
					text += '<span class="elemenx-code-view-tail"><button class="elemenx-code-view-more" type="button" tabindex="-1" aria-label="' + escape(labels.Unfold) + '">…</button>' + tail(lines[end]) + '</span>';

				return text + '</span>';
			}).join('');

			return {
				Render: function (container) {
					container.innerHTML = html;

					self.Hide(container);
				}
			};
		};
	},

	/* Hides the lines of the folded blocks: a line is hidden when a folded block above it reaches it. */
	Hide: function (container) {
		var lines = container.querySelectorAll('.elemenx-code-view-line');
		var until = -1;
		var i = 0;
		var line;
		var number;

		while (i < lines.length) {
			line = lines[i];
			number = Number(line.getAttribute('data-line'));

			line.hidden = number <= until;

			if (!line.hidden && line.classList.contains('folded'))
				until = Number(line.getAttribute('data-end'));

			i++;
		}
	},

	/* A press on the button of a block or on its … folds or unfolds it. */
	Toggled: function (event, node) {
		var button = event.target.closest && event.target.closest('.elemenx-code-view-fold, .elemenx-code-view-more');
		var line = button && button.closest('.elemenx-code-view-line');
		var folded;

		if (!line || !node.contains(line)) return;

		folded = line.classList.toggle('folded');

		line.querySelector('.elemenx-code-view-fold').setAttribute('aria-expanded', String(!folded));

		this.Hide(node);

		this.$Emit('fold', {Line: Number(line.getAttribute('data-line')), Folded: folded});
	}
});
