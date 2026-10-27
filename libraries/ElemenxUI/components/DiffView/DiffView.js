/*
 * The differences between two texts, to read (the Diff Service): Before and After, line by line, with the words that
 * changed marked in a line changed. Mode: unified (the lines removed then the ones added, one column) or split (the
 * text before on the left, the text after on the right). Context lines around each change (3); the unchanged runs
 * between them fold, and a press on a fold shows it. The header counts the lines added and removed, with Title (a name
 * of a file). LineNumbers shows the numbers of each side.
 */
Elemenx.Component('DiffView', {
	$TemplateURL: 'DiffView.html',
	$StyleURL: 'DiffView.css',
	$Meta: {
		Group: 'display',
		Icon: 'branch',
		Description: 'The differences between two texts, to read: Before and After, line by line, with the words that changed marked.',
		Props: {
			Before: 'The text before.',
			After: 'The text after.',
			Mode: {Options: ['unified', 'split'], Description: 'unified (one column) or split (before on the left, after on the right).'},
			Context: 'The unchanged lines shown around each change (3).',
			LineNumbers: 'Shows the numbers of the lines.',
			Wrap: 'Wraps long lines instead of scrolling sideways.',
			Title: 'A name over it (a file).'
		},
		Sample: {Before: 'var total = 0;\nfor (var i = 0; i < 3; i++)\n\ttotal += i;\nconsole.log(total);', After: 'var total = 0;\nfor (var i = 0; i < 5; i++)\n\ttotal += i * 2;\nconsole.log(total);', Title: 'sum.js'}
	},
	Before: '',
	After: '',
	Mode: 'unified',
	Context: 3,
	LineNumbers: true,
	Wrap: false,
	Title: '',
	Opened: [],

	$OnCreate: function () {
		var self = this;

		function escape (text) {
			return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}

		/* A line as markup, its changed ranges marked. */
		function marked (text, ranges) {
			var html = '';
			var at = 0;

			(ranges || []).forEach(function (range) {
				html += escape(text.substring(at, range.Start)) + '<mark class="elemenx-diff-word">' + escape(text.substring(range.Start, range.End)) + '</mark>';
				at = range.End;
			});

			return html + escape(text.substring(at));
		}

		/* The words that changed: a run of removed lines and the run of added lines after it, paired in order. */
		function words (lines) {
			var diff = self.$Service('Diff');
			var i = 0;
			var removed;
			var added;
			var j;
			var found;

			while (i < lines.length) {
				if (lines[i].Type !== 'remove') {
					i++;

					continue;
				}

				removed = [];
				added = [];

				while (i < lines.length && lines[i].Type === 'remove')
					removed.push(lines[i++]);

				while (i < lines.length && lines[i].Type === 'add')
					added.push(lines[i++]);

				for (j = 0; j < Math.min(removed.length, added.length); j++) {
					found = diff.Words(removed[j].Text, added[j].Text);
					removed[j].Ranges = found.Before;
					added[j].Ranges = found.After;
				}
			}

			return lines;
		}

		function cell (line, side) {
			var number = side === 'old' ? line.Old : line.New;

			return (self.LineNumbers && self.LineNumbers !== 'false' ? '<span class="elemenx-diff-number">' + (number === null ? '' : number) + '</span>' : '') +
				'<span class="elemenx-diff-sign">' + (line.Type === 'add' ? '+' : line.Type === 'remove' ? '−' : ' ') + '</span>' +
				'<span class="elemenx-diff-text">' + marked(line.Text, line.Ranges) + '</span>';
		}

		function fold (count, index) {
			return '<button type="button" class="elemenx-diff-fold" data-fold="' + index + '">' + escape(Elemenx.Locale.Text('ui.diffView.fold', {count: count})) + '</button>';
		}

		/* The rows of a hunk side by side: a removed line beside the added one of its place, the same lines on both sides. */
		function split (lines) {
			var html = '';
			var i = 0;
			var removed;
			var added;
			var j;

			while (i < lines.length) {
				if (lines[i].Type === 'same') {
					html += '<div class="elemenx-diff-row same"><div class="elemenx-diff-side">' + cell(lines[i], 'old') + '</div><div class="elemenx-diff-side">' + cell(lines[i], 'new') + '</div></div>';
					i++;

					continue;
				}

				removed = [];
				added = [];

				while (i < lines.length && lines[i].Type === 'remove')
					removed.push(lines[i++]);

				while (i < lines.length && lines[i].Type === 'add')
					added.push(lines[i++]);

				for (j = 0; j < Math.max(removed.length, added.length); j++) {
					html += '<div class="elemenx-diff-row"><div class="elemenx-diff-side' + (removed[j] ? ' remove' : ' empty') + '">' + (removed[j] ? cell(removed[j], 'old') : '') + '</div>' +
						'<div class="elemenx-diff-side' + (added[j] ? ' add' : ' empty') + '">' + (added[j] ? cell(added[j], 'new') : '') + '</div></div>';
				}
			}

			return html;
		}

		/* The markup of the whole view: the hunks, the folds that are not open folded. */
		this.Markup = function (before, after, mode, context, opened) {
			var lines = words(self.$Service('Diff').Lines(before, after));
			var hunks = self.$Service('Diff').Hunks(lines, context);

			return hunks.map(function (hunk, index) {
				if (hunk.Type === 'fold' && (opened || []).indexOf(index) === -1)
					return '<div class="elemenx-diff-row folded">' + fold(hunk.Lines.length, index) + '</div>';

				if (mode === 'split')
					return split(hunk.Lines);

				return hunk.Lines.map(function (line) {
					return '<div class="elemenx-diff-row ' + line.Type + '">' + cell(line, line.Type === 'add' ? 'new' : 'old') + '</div>';
				}).join('');
			}).join('');
		};

		this.Stats = function (before, after) {
			return self.$Service('Diff').Stats(self.$Service('Diff').Lines(before, after));
		};
	},

	/* A press on a fold shows its lines. */
	Clicked: function (event) {
		var fold = event.target && event.target.closest ? event.target.closest('[data-fold]') : null;
		if (!fold) return;

		this.Opened = this.Opened.concat([Number(fold.getAttribute('data-fold'))]);
	},

	/* New texts fold their unchanged runs again. */
	$OnProps: function (changed) {
		if (changed.Before !== undefined || changed.After !== undefined)
			this.Opened = [];
	}
});
