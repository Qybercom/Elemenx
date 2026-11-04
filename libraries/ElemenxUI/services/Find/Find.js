/*
 * Finds text in the DOM: what the find bar of a RichEditor or a Terminal looks through. Ranges(root, query, options)
 * returns the matches of the query in the text of root as DOM Ranges (a match may cross elements), options {Case,
 * Word, RegExp}; an expression that does not compile finds nothing. Show(owner, ranges, index) marks them with the
 * highlights of the browser (::highlight(elemenx-find), and ::highlight(elemenx-find-current) for the one at index), so
 * nothing is added to the text, and brings that one into view; Clear(owner) takes the marks of owner away. A browser
 * without highlights selects the current match instead.
 */
Elemenx.Service('Find', {
	$Meta: {
		Description: 'Finds text in the DOM: what the find bar of a RichEditor or a Terminal looks through.',
		Methods: ['Ranges(root, query, options)', 'Show(owner, ranges, index)', 'Clear(owner)']
	},
	$OnCreate: function () {
		this.Marks = [];
	},

	Ranges: function (root, query, options) {
		var walker;
		var node;
		var nodes = [];
		var text = '';
		var source;
		var pattern;
		var match;
		var ranges = [];
		var range;
		var start;
		var end;

		options = options || {};

		if (!root || !query) return ranges;

		walker = (root.ownerDocument || document).createTreeWalker(root, NodeFilter.SHOW_TEXT);

		while ((node = walker.nextNode())) {
			nodes.push({Node: node, Start: text.length});

			text += node.nodeValue;
		}

		source = options.RegExp ? String(query) : String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		try {
			pattern = new RegExp(options.Word ? '\\b(?:' + source + ')\\b' : source, options.Case ? 'g' : 'gi');
		}
		catch (error) {
			return ranges;
		}

		/* The text node and the offset in it of a place in the text of root. */
		function point (offset, last) {
			var i = nodes.length - 1;

			while (i > 0 && (last ? nodes[i].Start >= offset : nodes[i].Start > offset))
				i--;

			return {Node: nodes[i].Node, Offset: offset - nodes[i].Start};
		}

		while ((match = pattern.exec(text)) && ranges.length < 10000) {
			if (!match[0]) {
				pattern.lastIndex++;

				continue;
			}

			start = point(match.index, false);
			end = point(match.index + match[0].length, true);
			range = (root.ownerDocument || document).createRange();

			range.setStart(start.Node, start.Offset);
			range.setEnd(end.Node, end.Offset);

			ranges.push(range);
		}

		return ranges;
	},

	Show: function (owner, ranges, index) {
		var current = ranges[index] || null;
		var element;
		var view;

		this.Marks = this.Marks.filter(function (mark) {
			return mark.Owner !== owner;
		}).concat([{Owner: owner, Ranges: ranges, Current: current}]);

		this.Paint();

		if (!current) return;

		element = current.startContainer.nodeType === 1 ? current.startContainer : current.startContainer.parentElement;

		if (element && element.scrollIntoView)
			element.scrollIntoView({block: 'nearest', inline: 'nearest'});

		view = (current.startContainer.ownerDocument || document).defaultView || window;

		if (typeof view.Highlight !== 'function' || !view.CSS || !view.CSS.highlights) {
			view.getSelection().removeAllRanges();
			view.getSelection().addRange(current);
		}
	},

	Clear: function (owner) {
		this.Marks = this.Marks.filter(function (mark) {
			return mark.Owner !== owner;
		});

		this.Paint();
	},

	/*
	 * The highlights of every owner, in the two highlights of each window they are in (the page, or a window the
	 * Application opened: a window has highlights of its own); a window left without marks loses them.
	 */
	Paint: function () {
		var windows = [];
		var painted = this.Painted || [];

		function of (view) {
			var i;

			for (i = 0; i < windows.length; i++) {
				if (windows[i].View === view) return windows[i];
			}

			windows.push({View: view, All: [], Current: []});

			return windows[windows.length - 1];
		}

		function viewOf (range) {
			return (range.startContainer.ownerDocument || document).defaultView || window;
		}

		function able (view) {
			return !view.closed && typeof view.Highlight === 'function' && view.CSS && view.CSS.highlights;
		}

		of(window);

		this.Marks.forEach(function (mark) {
			mark.Ranges.forEach(function (range) {
				of(viewOf(range)).All.push(range);
			});

			if (mark.Current)
				of(viewOf(mark.Current)).Current.push(mark.Current);
		});

		painted.forEach(function (view) {
			of(view);
		});

		this.Painted = [];

		windows.forEach(function (entry) {
			var make = entry.View.Highlight;

			if (!able(entry.View)) return;

			entry.View.CSS.highlights.set('elemenx-find', new (Function.prototype.bind.apply(make, [null].concat(entry.All)))());
			entry.View.CSS.highlights.set('elemenx-find-current', new (Function.prototype.bind.apply(make, [null].concat(entry.Current)))());

			if (entry.All.length || entry.Current.length)
				this.Painted.push(entry.View);
		}, this);
	}
});
