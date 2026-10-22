/*
 * An editor of source code: a real <textarea> (typing, IME, the undo of the browser, screen readers and mobile
 * keyboards work as in any field) over a layer that draws the text highlighted by the Syntax Service. It has no
 * toolbar: the controls of an Application call its methods (the ready event gives the editor).
 * - Value, Language (a language of the Syntax Service), LineNumbers, Wrap, TabSize, Spaces (indents with spaces,
 *   not tabs), Pairs (closes brackets and quotes), ActiveLine, ReadOnly, Disabled, Invalid, Placeholder, Name, Label;
 *   Rows (the lines it shows) or AutoSize (grows with the text).
 * - Markers: [{Line, Column, EndLine, EndColumn, Severity, Message}] underline the text (lines and columns from 1;
 *   without Column the whole line; without an end the word). Severity: error, warning or info. The pointer over a
 *   marker shows its message.
 * - Complete(context, callback) offers completions as the user types a word (and on Ctrl+Space): context is
 *   {Text, Offset, Line, Column, Word, Before, Language, Explicit}; callback(error, items), items [{Label, Insert,
 *   Detail, Kind}] or texts. The items that start with the word show; Enter or Tab inserts one.
 * - Hint(context, callback) shows a hint for the text under the pointer: callback(error, text).
 * - Keys: Tab and Shift+Tab indent and outdent (Escape, then Tab, leaves the editor), Enter keeps the indent,
 *   Mod+/ comments the lines, Mod+] and Mod+[ indent and outdent, Ctrl+Space completes, Mod+F finds and Mod+H
 *   replaces in its own find bar (a FindBar over its corner; FindBar: false leaves it to the page).
 * - Methods: Focus(), Selection() ({Start, End, Text}), Select(start, end), Insert(text), Replace(start, end, text),
 *   Position(offset) ({Line, Column}), Offset(line, column), GoTo(line, column), Undo(), Redo(), Indent(),
 *   Outdent(), Comment(), Find(query, {Case, Word, RegExp}) (returns the count of matches and selects the next one),
 *   FindNext(), FindPrevious(), ReplaceCurrent(text), ReplaceAll(text), ClearFind(), Print(options, callback)
 *   (the Print Service; options as there).
 * - Diff view: with Original (the text before) and Diff 'unified' (one column; true too) or 'split' (the two texts
 *   side by side), the editor shows how Value differs from Original, read only: the lines removed and added on their
 *   colors, the words changed inside a changed line marked, the numbers of the lines in both texts, highlighted as in
 *   the editing view; the unchanged runs fold down to Context lines (3) around the changes, and a press on a fold
 *   opens it. DiffStats() returns {Added, Removed}; NextChange() and PreviousChange() scroll to a change.
 * - Events: input and change (Value), cursor ({Line, Column, Start, End}), ready (the editor).
 */
Elemenx.Component('CodeEditor', {
	$TemplateURL: 'CodeEditor.html',
	$StyleURL: 'CodeEditor.css',
	Value: '',
	Language: 'text',
	LineNumbers: true,
	Wrap: false,
	TabSize: 4,
	Spaces: false,
	Pairs: true,
	ActiveLine: true,
	ReadOnly: false,
	Disabled: false,
	Invalid: false,
	Placeholder: '',
	Name: null,
	Label: '',
	Rows: 12,
	AutoSize: false,
	Markers: [],
	Complete: null,
	Hint: null,
	Found: [],
	Current: -1,
	Suggestions: [],
	Choice: 0,
	SuggestStyle: '',
	HintText: '',
	HintStyle: '',
	Original: null,
	Diff: false,
	Context: 3,
	Unfolded: [],
	FindBar: true,
	Finding: false,
	FindReplacing: false,
	FindQuery: '',

	$OnCreate: function () {
		var self = this;
		var last = null;
		var sync = null;
		var own = {Cache: {Key: null, Lines: [], Starts: [], Plain: []}, Painted: [], Line: -1, Brackets: null, Query: null, Asked: 0, Released: false, Word: '', HintTimer: null, ReadyTimer: null};

		this.ListID = 'elemenx-code-editor-' + Math.random().toString(36).slice(2, 10);

		/* What the editor keeps for itself (the tokens, the drawn rows, the query of Find): not state, so it renders nothing. */
		this.Own = function () {
			return own;
		};

		/* The function *mount calls when the text or what is drawn over it changes: it paints the layer again. */
		this.Sync = function () {
			var args = Array.prototype.slice.call(arguments);
			var same = last && last.length === args.length && args.every(function (value, index) {
				return value === last[index];
			});

			if (!same) {
				last = args;
				sync = function () {
					self.Paint();
				};
			}

			return sync;
		};

		/* The function *mount calls when the diff changes: it draws the diff again. */
		this.DiffSync = function () {
			var args = Array.prototype.slice.call(arguments);
			var same = own.DiffArgs && own.DiffArgs.length === args.length && args.every(function (value, index) {
				return value === own.DiffArgs[index];
			});

			if (!same) {
				own.DiffArgs = args;
				own.DiffPaint = function () {
					self.PaintDiff();
				};
			}

			return own.DiffPaint;
		};

		/* Whether the editor shows the diff view. */
		this.Diffing = function (diff, original) {
			return original !== null && original !== undefined && !!diff && diff !== 'false';
		};

		this.Escape = function (text) {
			return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		};
	},

	/* ready goes a task later: the owner listens to the events of a Component once the Component is made. */
	$OnReady: function () {
		var self = this;

		this.Paint();

		this.Own().ReadyTimer = window.setTimeout(function () {
			self.$Emit('ready', self);
		}, 0);
	},

	$OnDestroy: function () {
		window.clearTimeout(this.Own().HintTimer);
		window.clearTimeout(this.Own().ReadyTimer);
	},

	Input: function () {
		var root = this.$Element();

		return root ? root.querySelector('.elemenx-code-editor-input') : null;
	},

	Grammar: function () {
		try {
			return this.$Service('Syntax').Find(this.Language);
		}
		catch (error) {
			return null;
		}
	},

	Unit: function () {
		return this.Spaces ? new Array(Math.max(1, Number(this.TabSize) || 4) + 1).join(' ') : '\t';
	},

	/* The tokens of the lines and the offsets where they start, worked out again when the text or language change. */
	Tokens: function () {
		var value = String(this.Value == null ? '' : this.Value);
		var key = this.Language + '\n' + value;
		var starts = [0];
		var i = value.indexOf('\n');

		if (this.Own().Cache.Key === key) return this.Own().Cache;

		while (i !== -1) {
			starts.push(i + 1);

			i = value.indexOf('\n', i + 1);
		}

		this.Own().Cache = {Key: key, Lines: this.$Service('Syntax').Lines(value, this.Language), Starts: starts, Plain: []};

		return this.Own().Cache;
	},

	/* The line (from 0) of an offset. */
	LineOf: function (offset) {
		var starts = this.Tokens().Starts;
		var low = 0;
		var high = starts.length - 1;
		var middle;

		while (low < high) {
			middle = (low + high + 1) >> 1;

			if (starts[middle] <= offset) low = middle;
			else high = middle - 1;
		}

		return low;
	},

	/* What is drawn over the text: the markers, the matches of Find and the brackets at the caret, as offsets. */
	Decorations: function () {
		var self = this;
		var result = [];

		(this.Markers || []).forEach(function (marker) {
			var range = self.MarkerRange(marker);
			if (!range) return;

			if (range.Start == null) result.push({Line: range.Line, Class: 'marked ' + range.Severity});
			else result.push({Start: range.Start, End: range.End, Line: range.Line, Class: 'elemenx-code-editor-marker ' + range.Severity});
		});

		(this.Found || []).forEach(function (match, index) {
			result.push({Start: match.Start, End: match.End, Class: 'elemenx-code-editor-match' + (index === self.Current ? ' current' : '')});
		});

		if (this.Own().Brackets) {
			result.push({Start: this.Own().Brackets[0], End: this.Own().Brackets[0] + 1, Class: 'elemenx-code-editor-bracket'});
			result.push({Start: this.Own().Brackets[1], End: this.Own().Brackets[1] + 1, Class: 'elemenx-code-editor-bracket'});
		}

		return result;
	},

	/* The text a marker covers: {Line (from 0), Start, End, Severity}, without Start and End for a whole line. */
	MarkerRange: function (marker) {
		var cache = this.Tokens();
		var value = String(this.Value == null ? '' : this.Value);
		var line = Math.max(1, Number(marker && marker.Line) || 1) - 1;
		var severity = /^(error|warning|info)$/.test(marker && marker.Severity) ? marker.Severity : 'error';
		var start;
		var end;
		var word;

		if (!marker || line >= cache.Starts.length) return null;

		if (marker.Column == null)
			return {Line: line, Severity: severity};

		start = Math.min(cache.Starts[line] + Math.max(1, Number(marker.Column)) - 1, value.length);

		if (marker.EndColumn != null) {
			end = this.Offset(marker.EndLine || marker.Line, marker.EndColumn);
		}
		else {
			word = /^[\w$]+/.exec(value.substring(start));
			end = start + (word ? word[0].length : 1);
		}

		return {Line: line, Start: start, End: Math.max(end, start + 1), Severity: severity};
	},

	/* The markup of the text of a line: its tokens, cut where the decorations start and end. */
	LineHTML: function (tokens, start, decorations) {
		var self = this;
		var html = '';
		var position = start;

		if (!decorations.length) {
			return tokens.map(function (token) {
				return token.Type ? '<span class="elemenx-syntax-' + token.Type + '">' + self.Escape(token.Text) + '</span>' : self.Escape(token.Text);
			}).join('');
		}

		tokens.forEach(function (token) {
			var end = position + token.Text.length;
			var cuts = [position, end];

			decorations.forEach(function (item) {
				if (item.Start > position && item.Start < end)
					cuts.push(item.Start);

				if (item.End > position && item.End < end)
					cuts.push(item.End);
			});

			cuts.sort(function (a, b) {
				return a - b;
			});

			cuts.forEach(function (cut, index) {
				var next = cuts[index + 1];
				var classes = token.Type ? ['elemenx-syntax-' + token.Type] : [];
				var text;

				if (next === undefined || next === cut) return;

				text = token.Text.substring(cut - position, next - position);

				decorations.forEach(function (item) {
					if (item.Start <= cut && item.End >= next)
						classes.push(item.Class);
				});

				html += classes.length ? '<span class="' + classes.join(' ') + '">' + self.Escape(text) + '</span>' : self.Escape(text);
			});

			position = end;
		});

		return html;
	},

	/* Draws the lines that changed since the last time. */
	Paint: function () {
		var root = this.$Element();
		var layer = root && root.querySelector('.elemenx-code-editor-lines');
		var cache;
		var decorations;
		var byLine = {};
		var classes = {};
		var rows = [];
		var i = 0;

		if (!layer) return;

		cache = this.Tokens();
		decorations = this.Decorations();

		decorations.forEach(function (item) {
			var first = item.Start == null ? item.Line : null;

			if (first !== null) {
				classes[first] = (classes[first] || '') + ' ' + item.Class;

				return;
			}

			first = this.LineOf(item.Start);

			while (first < cache.Starts.length && cache.Starts[first] < Math.max(item.End, item.Start + 1)) {
				(byLine[first] = byLine[first] || []).push(item);

				if (item.Line === first && item.Class.indexOf('elemenx-code-editor-marker') === 0)
					classes[first] = (classes[first] || '') + ' ' + item.Class.replace('elemenx-code-editor-marker', 'marked');

				first++;
			}
		}, this);

		while (i < cache.Lines.length) {
			if (!byLine[i] && cache.Plain[i] === undefined)
				cache.Plain[i] = this.LineHTML(cache.Lines[i], cache.Starts[i], []);

			rows.push({
				Class: 'elemenx-code-editor-row' + (classes[i] || '') + (this.ActiveLine && i === this.Own().Line ? ' active' : ''),
				HTML: '<span class="elemenx-code-editor-number">' + (i + 1) + '</span><span class="elemenx-code-editor-text">' + (byLine[i] ? this.LineHTML(cache.Lines[i], cache.Starts[i], byLine[i]) : cache.Plain[i]) + '</span>'
			});

			i++;
		}

		while (layer.children.length > rows.length) {
			layer.removeChild(layer.lastChild);
		}

		i = 0;

		while (i < rows.length) {
			var node = layer.children[i];

			if (!node) {
				node = document.createElement('div');

				layer.appendChild(node);
			}

			if (!this.Own().Painted[i] || this.Own().Painted[i].Class !== rows[i].Class || node.className !== rows[i].Class)
				node.className = rows[i].Class;

			if (!this.Own().Painted[i] || this.Own().Painted[i].HTML !== rows[i].HTML || !node.firstChild)
				node.innerHTML = rows[i].HTML;

			i++;
		}

		this.Own().Painted = rows;

		root.style.setProperty('--elemenx-code-digits', String(Math.max(2, String(rows.length).length)));
	},

	/* The caret moved: the active line, the brackets around it and the cursor event. */
	Caret: function () {
		var node = this.Input();
		var line;
		var brackets;

		if (!node) return;

		line = this.LineOf(node.selectionEnd);
		brackets = node.selectionStart === node.selectionEnd ? this.Match(node.selectionStart) : null;

		if (line !== this.Own().Line || String(brackets) !== String(this.Own().Brackets)) {
			this.Own().Line = line;
			this.Own().Brackets = brackets;

			this.Paint();
		}

		this.$Emit('cursor', {Line: line + 1, Column: node.selectionEnd - this.Tokens().Starts[line] + 1, Start: node.selectionStart, End: node.selectionEnd});
	},

	/* The bracket next to an offset and the one that pairs with it, or null. */
	Match: function (offset) {
		var value = String(this.Value == null ? '' : this.Value);
		var pairs = {'(': ')', '[': ']', '{': '}'};
		var closers = {')': '(', ']': '[', '}': '{'};
		var at = pairs[value.charAt(offset)] || closers[value.charAt(offset)] ? offset : pairs[value.charAt(offset - 1)] || closers[value.charAt(offset - 1)] ? offset - 1 : -1;
		var character;
		var step;
		var depth = 0;
		var i;

		if (at === -1) return null;

		character = value.charAt(at);
		step = pairs[character] ? 1 : -1;
		i = at;

		while (i >= 0 && i < value.length && Math.abs(i - at) < 20000) {
			if (value.charAt(i) === character) depth++;
			else if (value.charAt(i) === (pairs[character] || closers[character])) depth--;

			if (depth === 0)
				return step > 0 ? [at, i] : [i, at];

			i += step;
		}

		return null;
	},

	Typed: function (event, node) {
		this.Value = node.value;

		if (this.Own().Query)
			this.Search(false);

		this.$Emit('input', this.Value);

		this.Caret();

		this.Reveal();

		if (this.Complete && event && event.inputType === 'insertText' && /^[\w$.]$/.test(event.data || '')) this.Suggest(false);
		else if (this.Suggestions.length) this.Suggest(false);
	},

	Committed: function () {
		this.$Emit('change', this.Value);
	},

	Blurred: function () {
		this.Suggestions = [];
		this.HintText = '';
	},

	Focused: function () {
		this.Own().Released = false;

		this.Caret();
	},

	Moved: function () {
		this.Caret();
	},

	/* Replaces start..end with text the way typing does (the undo of the browser keeps it) and selects from..to. */
	Edit: function (start, end, text, from, to) {
		var node = this.Input();
		var expected;
		var done = false;

		if (!node || this.ReadOnly || this.Disabled) return false;
		if (start === end && !text) return true;

		expected = node.value.substring(0, start) + text + node.value.substring(end);

		if (this.$Element().getRootNode().activeElement !== node)
			node.focus();

		node.setSelectionRange(start, end);

		try {
			done = document.execCommand(text ? 'insertText' : 'delete', false, text);
		}
		catch (error) {
			done = false;
		}

		if (!done || node.value !== expected) {
			node.value = expected;

			node.dispatchEvent(new Event('input', {bubbles: true}));
		}

		if (from != null)
			node.setSelectionRange(from, to == null ? from : to);

		this.Caret();

		this.Reveal();

		return true;
	},

	/* The start of the line of an offset and the end of the line of another. */
	Block: function (start, end) {
		var value = this.Input().value;
		var last = end > start && value.charAt(end - 1) === '\n' ? end - 1 : end;
		var finish = value.indexOf('\n', last);

		return {Start: value.lastIndexOf('\n', start - 1) + 1, End: finish === -1 ? value.length : finish};
	},

	Indent: function () {
		var node = this.Input();
		var block = this.Block(node.selectionStart, node.selectionEnd);
		var unit = this.Unit();
		var lines = node.value.substring(block.Start, block.End).split('\n');
		var added = 0;
		var first = lines[0] ? unit.length : 0;
		var start = node.selectionStart;
		var end = node.selectionEnd;

		lines = lines.map(function (line) {
			if (!line)
				return line;

			added += unit.length;

			return unit + line;
		});

		return this.Edit(block.Start, block.End, lines.join('\n'), start + first, end + added);
	},

	Outdent: function () {
		var node = this.Input();
		var block = this.Block(node.selectionStart, node.selectionEnd);
		var size = Math.max(1, Number(this.TabSize) || 4);
		var removed = 0;
		var first = 0;
		var start = node.selectionStart;
		var end = node.selectionEnd;
		var lines = node.value.substring(block.Start, block.End).split('\n').map(function (line, index) {
			var cut = line.charAt(0) === '\t' ? 1 : /^ */.exec(line)[0].length;

			cut = Math.min(cut, size);
			removed += cut;

			if (index === 0)
				first = cut;

			return line.substring(cut);
		});

		if (!removed)
			return false;

		return this.Edit(block.Start, block.End, lines.join('\n'), Math.max(block.Start, start - first), Math.max(block.Start, end - removed));
	},

	Comment: function () {
		var node = this.Input();
		var grammar = this.Grammar();
		var comment = grammar && grammar.Comment;
		var start = node.selectionStart;
		var end = node.selectionEnd;
		var block;
		var text;
		var lines;
		var marker;
		var indent;
		var commented;
		var pattern;
		var open;
		var close;
		var change = 0;

		if (!comment)
			return false;

		block = this.Block(start, end);
		text = node.value.substring(block.Start, block.End);

		if (comment.Line) {
			marker = comment.Line;
			lines = text.split('\n');
			indent = Math.min.apply(Math, lines.filter(function (line) {
				return line.trim();
			}).map(function (line) {
				return /^[ \t]*/.exec(line)[0].length;
			}).concat([Infinity]));
			pattern = new RegExp('^([ \\t]*)' + marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' ?');
			commented = lines.every(function (line) {
				return !line.trim() || pattern.test(line);
			});

			if (indent === Infinity) return false;

			lines = lines.map(function (line, index) {
				var before = line.length;

				if (!line.trim()) return line;

				line = commented ? line.replace(pattern, '$1') : line.substring(0, indent) + marker + ' ' + line.substring(indent);

				if (index === 0)
					change = line.length - before;

				return line;
			});

			text = lines.join('\n');

			return this.Edit(block.Start, block.End, text, Math.max(block.Start, start + change), end + text.length - (block.End - block.Start));
		}

		open = comment.Block[0];
		close = comment.Block[1];

		if (start === end) {
			start = block.Start;
			end = block.End;
		}

		text = node.value.substring(start, end);

		if (text.trim().indexOf(open) === 0 && text.trim().slice(-close.length) === close) {
			text = text.replace(open + ' ', open).replace(open, '');
			text = text.slice(0, text.lastIndexOf(close)).replace(/ $/, '') + text.slice(text.lastIndexOf(close) + close.length);

			return this.Edit(start, end, text, start, start + text.length);
		}

		return this.Edit(start, end, open + ' ' + text + ' ' + close, start, start + text.length + open.length + close.length + 2);
	},

	Key: function (event, node) {
		var mod = event.ctrlKey || event.metaKey;
		var value = node.value;
		var start = node.selectionStart;
		var end = node.selectionEnd;
		var pairs = {'(': ')', '[': ']', '{': '}', '"': '"', '\'': '\'', '`': '`'};
		var quotes = pairs[event.key] === event.key;
		var plain = !this.Grammar() || this.Grammar().Name === 'text' || this.Grammar().Name === 'markdown';
		var next = value.charAt(end);
		var previous = value.charAt(start - 1);
		var line;
		var indent;
		var unit;
		var grammar;

		if (event.isComposing || event.keyCode === 229) return;

		/* Mod+F: the find bar; Mod+H: with its replace row (an editor that can change). */
		if (mod && !event.altKey && !event.shiftKey && (event.code === 'KeyF' || event.code === 'KeyH') && this.FindBar && this.FindBar !== 'false') {
			event.preventDefault();

			this.OpenFind(event.code === 'KeyH');

			return;
		}

		if (this.Suggestions.length) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();

				this.Choice = (this.Choice + (event.key === 'ArrowDown' ? 1 : -1) + this.Suggestions.length) % this.Suggestions.length;

				this.RevealChoice('.elemenx-code-editor-suggestion.active');

				return;
			}

			if (event.key === 'Enter' || event.key === 'Tab') {
				event.preventDefault();

				this.Accept(this.Choice);

				return;
			}

			if (event.key === 'Escape') {
				event.preventDefault();

				this.Suggestions = [];

				return;
			}
		}

		if (event.key === 'Escape') {
			this.HintText = '';
			this.Own().Released = true;

			return;
		}

		if (event.key === 'Tab' && this.Own().Released) return;

		this.Own().Released = false;

		if (this.ReadOnly || this.Disabled) return;

		if (event.key === ' ' && event.ctrlKey) {
			event.preventDefault();

			this.Suggest(true);

			return;
		}

		if (mod && (event.key === '/' || event.code === 'Slash')) {
			event.preventDefault();

			this.Comment();

			return;
		}

		if (mod && (event.key === ']' || event.key === '[')) {
			event.preventDefault();

			if (event.key === ']') this.Indent();
			else this.Outdent();

			return;
		}

		if (event.key === 'Tab' && !mod && !event.altKey) {
			event.preventDefault();

			if (event.shiftKey) this.Outdent();
			else if (value.substring(start, end).indexOf('\n') !== -1) this.Indent();
			else this.Edit(start, end, this.Unit(), start + this.Unit().length);

			return;
		}

		if (event.key === 'Enter' && !mod && !event.altKey && !event.shiftKey) {
			event.preventDefault();

			grammar = this.Grammar();
			line = value.substring(value.lastIndexOf('\n', start - 1) + 1, start);
			indent = /^[ \t]*/.exec(line)[0];
			unit = grammar && grammar.Indent && grammar.Indent.test(line) ? this.Unit() : '';

			if (unit && (next === ')' || next === ']' || next === '}' || value.substring(end, end + 2) === '</')) this.Edit(start, end, '\n' + indent + unit + '\n' + indent, start + 1 + indent.length + unit.length);
			else this.Edit(start, end, '\n' + indent + unit, start + 1 + indent.length + unit.length);

			return;
		}

		if (event.key === 'Backspace' && !mod && start === end && start > 0 && this.Pairs && pairs[previous] && pairs[previous] === next) {
			event.preventDefault();

			this.Edit(start - 1, start + 1, '', start - 1);

			return;
		}

		if (!this.Pairs || mod || event.altKey || event.key.length !== 1) return;

		if ((event.key === ')' || event.key === ']' || event.key === '}' || quotes && !plain) && start === end && next === event.key) {
			event.preventDefault();

			node.setSelectionRange(start + 1, start + 1);

			this.Caret();

			return;
		}

		if (!pairs[event.key] || quotes && plain) return;

		if (start !== end) {
			event.preventDefault();

			this.Edit(start, end, event.key + value.substring(start, end) + pairs[event.key], start + 1, end + 1);

			return;
		}

		if (next && !/[\s)\]},;:]/.test(next)) return;
		if (quotes && /[\w$\\]/.test(previous)) return;

		event.preventDefault();

		this.Edit(start, end, event.key + pairs[event.key], start + 1);
	},

	/* Keeps the caret in the visible part of the editor. */
	Reveal: function () {
		var root = this.$Element();
		var node = this.Input();
		var scroll = root && root.querySelector('.elemenx-code-editor-scroll');
		var point;
		var box;
		var gutter;

		if (!scroll || !node) return;

		point = this.Point(node.selectionEnd);
		box = scroll.getBoundingClientRect();
		gutter = this.LineNumbers ? (root.querySelector('.elemenx-code-editor-number') || {offsetWidth: 0}).offsetWidth : 0;

		if (!point) return;

		if (point.Top < box.top + 4) scroll.scrollTop -= box.top + 4 - point.Top;
		else if (point.Bottom > box.top + scroll.clientHeight - 4) scroll.scrollTop += point.Bottom - (box.top + scroll.clientHeight - 4);

		if (point.Left < box.left + gutter + 8) scroll.scrollLeft -= box.left + gutter + 8 - point.Left;
		else if (point.Left > box.left + scroll.clientWidth - 16) scroll.scrollLeft += point.Left - (box.left + scroll.clientWidth - 16);
	},

	/* The place of an offset on the screen: {Left, Top, Bottom}, from the drawn layer. */
	Point: function (offset) {
		var root = this.$Element();
		var line = this.LineOf(offset);
		var row = root && root.querySelector('.elemenx-code-editor-lines').children[line];
		var text = row && row.querySelector('.elemenx-code-editor-text');
		var column = offset - this.Tokens().Starts[line];
		var walker;
		var current;
		var range;
		var rect;

		if (!text)
			return null;

		walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
		current = walker.nextNode();

		while (current && column > current.data.length) {
			column -= current.data.length;
			current = walker.nextNode();
		}

		if (!current) {
			rect = text.getBoundingClientRect();

			return {Left: rect.left + parseFloat(getComputedStyle(text).paddingLeft || 0), Top: rect.top, Bottom: rect.top + parseFloat(getComputedStyle(row).lineHeight || 20)};
		}

		range = document.createRange();

		range.setStart(current, column);
		range.setEnd(current, column);

		rect = range.getClientRects()[0] || range.getBoundingClientRect();

		return {Left: rect.left, Top: rect.top, Bottom: rect.bottom};
	},

	/* Asks Complete for the completions of the word before the caret. */
	Suggest: function (explicit) {
		var self = this;
		var node = this.Input();
		var value = node.value;
		var offset = node.selectionEnd;
		var lineStart = value.lastIndexOf('\n', offset - 1) + 1;
		var before = value.substring(lineStart, offset);
		var word = (/[\w$]*$/.exec(before) || [''])[0];
		var asked = ++this.Own().Asked;

		if (typeof this.Complete !== 'function' || node.selectionStart !== offset) {
			this.Suggestions = [];

			return;
		}

		if (!word && !explicit && before.slice(-1) !== '.') {
			this.Suggestions = [];

			return;
		}

		this.Complete({Text: value, Offset: offset, Line: this.LineOf(offset) + 1, Column: offset - lineStart + 1, Word: word, Before: before, Language: this.Language, Explicit: !!explicit}, function (error, items) {
			var root = self.$Element();
			var point;
			var box;
			var list;

			if (asked !== self.Own().Asked || !root) return;

			list = error ? [] : (items || []).map(function (item) {
				return typeof item === 'string' ? {Label: item} : item;
			}).filter(function (item) {
				return item && item.Label && String(item.Label).toLowerCase().indexOf(word.toLowerCase()) === 0 && String(item.Insert || item.Label) !== word;
			}).slice(0, 50);

			if (list.length) {
				point = self.Point(offset - word.length);
				box = root.getBoundingClientRect();

				self.SuggestStyle = 'left: ' + Math.round(Math.max(0, Math.min(point.Left - box.left, box.width - 240))) + 'px; top: ' + Math.round(point.Bottom - box.top + 2) + 'px;';
			}

			self.Choice = 0;
			self.Suggestions = list;
			self.Own().Word = word;
		});
	},

	Accept: function (index) {
		var item = this.Suggestions[index];
		var node = this.Input();
		var offset = node.selectionEnd;
		var text;

		if (!item) return;

		text = String(item.Insert == null ? item.Label : item.Insert);

		this.Suggestions = [];

		this.Edit(offset - (this.Own().Word || '').length, offset, text, offset - (this.Own().Word || '').length + text.length);

		this.$Emit('complete', item);
	},

	Picked: function (event, node) {
		this.Accept(Number(node.getAttribute('data-index')));
	},

	/* The list of completions keeps the focus in the editor. */
	Hold: function (event) {
		event.preventDefault();
	},

	/* The pointer over the text: the messages of the markers there and the hint of Hint, after a moment. */
	Hover: function (event) {
		var self = this;
		var x = event.clientX;
		var y = event.clientY;

		window.clearTimeout(this.Own().HintTimer);

		this.Own().HintTimer = window.setTimeout(function () {
			self.ShowHint(x, y);
		}, 350);
	},

	Left: function () {
		window.clearTimeout(this.Own().HintTimer);

		this.HintText = '';
	},

	ShowHint: function (x, y) {
		var self = this;
		var root = this.$Element();
		var offset = root ? this.OffsetAt(x, y) : null;
		var messages;
		var box;
		var place;
		var value;

		if (offset === null) {
			this.HintText = '';

			return;
		}

		box = root.getBoundingClientRect();
		place = 'left: ' + Math.round(Math.max(0, Math.min(x - box.left, box.width - 280))) + 'px; top: ' + Math.round(y - box.top + 18) + 'px;';
		value = String(this.Value == null ? '' : this.Value);
		messages = (this.Markers || []).filter(function (marker) {
			var range = marker && marker.Message ? self.MarkerRange(marker) : null;
			if (!range)
				return false;

			return range.Start == null ? self.LineOf(offset) === range.Line : offset >= range.Start && offset < range.End;
		}).map(function (marker) {
			return String(marker.Message);
		});

		this.HintStyle = place;
		this.HintText = messages.join('\n');

		if (typeof this.Hint !== 'function') return;

		this.Hint({Text: value, Offset: offset, Line: this.LineOf(offset) + 1, Column: offset - this.Tokens().Starts[this.LineOf(offset)] + 1, Word: this.WordAt(value, offset), Language: this.Language}, function (error, text) {
			if (error || !text) return;

			self.HintStyle = place;
			self.HintText = messages.concat([String(text)]).join('\n');
		});
	},

	WordAt: function (value, offset) {
		var before = /[\w$]*$/.exec(value.substring(0, offset))[0];
		var after = /^[\w$]*/.exec(value.substring(offset))[0];

		return before + after;
	},

	/* The offset of the character under a point of the screen, from the drawn layer, or null. */
	OffsetAt: function (x, y) {
		var root = this.$Element();
		var layer = root.querySelector('.elemenx-code-editor-lines');
		var rows = layer.children;
		var row = null;
		var i = 0;
		var walker;
		var current;
		var count = 0;
		var range = document.createRange();
		var index;
		var rect;

		while (i < rows.length) {
			rect = rows[i].getBoundingClientRect();

			if (y >= rect.top && y < rect.bottom) {
				row = rows[i];

				break;
			}

			i++;
		}

		if (!row)
			return null;

		walker = document.createTreeWalker(row.querySelector('.elemenx-code-editor-text'), NodeFilter.SHOW_TEXT);
		current = walker.nextNode();

		while (current) {
			index = 0;

			while (index < current.data.length) {
				range.setStart(current, index);
				range.setEnd(current, index + 1);

				rect = range.getBoundingClientRect();

				if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) return this.Tokens().Starts[i] + count + index;

				index++;
			}

			count += current.data.length;
			current = walker.nextNode();
		}

		return null;
	},

	Focus: function () {
		var node = this.Input();
		if (node)
			node.focus();

		return this;
	},

	Selection: function () {
		var node = this.Input();

		return {Start: node.selectionStart, End: node.selectionEnd, Text: node.value.substring(node.selectionStart, node.selectionEnd)};
	},

	Select: function (start, end) {
		var node = this.Input();
		var length = node.value.length;

		start = Math.max(0, Math.min(length, Number(start) || 0));
		end = end == null ? start : Math.max(start, Math.min(length, Number(end) || 0));

		/* The find bar selects the matches without taking the focus from its field. */
		if (!this.Own().Quiet)
			node.focus();

		node.setSelectionRange(start, end);

		this.Caret();

		this.Reveal();

		return this;
	},

	Insert: function (text) {
		var node = this.Input();
		var value = String(text == null ? '' : text);

		return this.Edit(node.selectionStart, node.selectionEnd, value, node.selectionStart + value.length);
	},

	Replace: function (start, end, text) {
		var value = String(text == null ? '' : text);

		return this.Edit(start, end, value, start + value.length);
	},

	Position: function (offset) {
		var line = this.LineOf(Math.max(0, Number(offset) || 0));

		return {Line: line + 1, Column: offset - this.Tokens().Starts[line] + 1};
	},

	Offset: function (line, column) {
		var starts = this.Tokens().Starts;
		var index = Math.max(0, Math.min(starts.length - 1, (Number(line) || 1) - 1));
		var end = index + 1 < starts.length ? starts[index + 1] - 1 : String(this.Value == null ? '' : this.Value).length;

		return Math.min(end, starts[index] + Math.max(0, (Number(column) || 1) - 1));
	},

	GoTo: function (line, column) {
		return this.Select(this.Offset(line, column || 1));
	},

	Undo: function () {
		this.Focus();

		document.execCommand('undo');

		return this;
	},

	Redo: function () {
		this.Focus();

		document.execCommand('redo');

		return this;
	},

	/* The matches of the query of Find in the text; select moves the selection to the one at the caret or after. */
	Search: function (select) {
		var value = String(this.Value == null ? '' : this.Value);
		var query = this.Own().Query;
		var options = query.Options;
		var source = options.RegExp ? query.Text : query.Text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		var pattern;
		var found = [];
		var match;
		var node = this.Input();
		var from = node ? node.selectionStart : 0;
		var current = -1;

		try {
			pattern = new RegExp(options.Word ? '\\b(?:' + source + ')\\b' : source, options.Case ? 'g' : 'gi');
		}
		catch (error) {
			pattern = null;
		}

		while (pattern && query.Text && (match = pattern.exec(value))) {
			if (!match[0]) {
				pattern.lastIndex++;

				continue;
			}

			found.push({Start: match.index, End: match.index + match[0].length});

			if (found.length > 10000) break;
		}

		found.forEach(function (item, index) {
			if (current === -1 && item.Start >= from)
				current = index;
		});

		this.Found = found;
		this.Current = found.length ? current === -1 ? 0 : current : -1;

		if (select && this.Current !== -1)
			this.Select(found[this.Current].Start, found[this.Current].End);

		return found.length;
	},

	Find: function (query, options) {
		this.Own().Query = {Text: String(query == null ? '' : query), Options: options || {}};

		return this.Search(true);
	},

	FindNext: function () {
		return this.Step(1);
	},

	FindPrevious: function () {
		return this.Step(-1);
	},

	Step: function (step) {
		var match;

		if (!this.Found.length) return -1;

		this.Current = (this.Current + step + this.Found.length) % this.Found.length;
		match = this.Found[this.Current];

		this.Select(match.Start, match.End);

		return this.Current;
	},

	ReplaceCurrent: function (text) {
		var match = this.Found[this.Current];
		var value = String(text == null ? '' : text);
		var current = this.Current;

		if (!match)
			return false;

		if (this.Own().Query.Options.RegExp)
			value = String(this.Value).substring(match.Start, match.End).replace(new RegExp(this.Own().Query.Text, this.Own().Query.Options.Case ? '' : 'i'), value);

		this.Edit(match.Start, match.End, value, match.Start + value.length);

		if (this.Found.length) {
			this.Current = current % this.Found.length;

			this.Select(this.Found[this.Current].Start, this.Found[this.Current].End);
		}

		return true;
	},

	ReplaceAll: function (text) {
		var value = String(this.Value == null ? '' : this.Value);
		var count = this.Found.length;
		var replacement = String(text == null ? '' : text);
		var result = '';
		var position = 0;
		var options = this.Own().Query ? this.Own().Query.Options : {};
		var pattern = options.RegExp ? new RegExp(this.Own().Query.Text, options.Case ? '' : 'i') : null;

		if (!count) return 0;

		this.Found.forEach(function (match) {
			var piece = value.substring(match.Start, match.End);

			result += value.substring(position, match.Start) + (pattern ? piece.replace(pattern, replacement) : replacement);
			position = match.End;
		});

		result += value.substring(position);

		this.Edit(0, value.length, result, 0);

		return count;
	},

	/* The find bar: opened on the text selected (one line), its field focused. */
	OpenFind: function (replace) {
		var self = this;
		var selection = this.Selection();
		if (selection.Text && selection.Text.indexOf('\n') === -1)
			this.FindQuery = selection.Text;

		this.FindReplacing = !!replace && !this.ReadOnly && !this.Disabled;
		this.Finding = true;

		window.setTimeout(function () {
			if (self.FindQuery)
				self.BarFind({Query: self.FindQuery, Case: false, Word: false, RegExp: false});
		}, 0);
	},

	/* A change of the find bar (its text or an option), without the focus leaving it. */
	BarFind: function (query) {
		this.FindQuery = query.Query;
		this.Own().Quiet = true;

		this.Find(query.Query, {Case: query.Case, Word: query.Word, RegExp: query.RegExp});

		this.Own().Quiet = false;
	},

	BarNext: function () {
		this.Own().Quiet = true;

		this.FindNext();

		this.Own().Quiet = false;
	},

	BarPrevious: function () {
		this.Own().Quiet = true;

		this.FindPrevious();

		this.Own().Quiet = false;
	},

	/* A replacement takes the focus into the text: it goes back to the field of the replacement. */
	BarReplace: function (data) {
		this.ReplaceCurrent(data.Text);
		this.BackToBar();
	},

	BarReplaceAll: function (data) {
		this.ReplaceAll(data.Text);
		this.BackToBar();
	},

	BackToBar: function () {
		var field = this.$Element().querySelector('.elemenx-find-replacement');
		if (field)
			field.focus();
	},

	CloseFind: function () {
		this.Finding = false;

		this.ClearFind();
		this.Focus();
	},

	ClearFind: function () {
		this.Own().Query = null;
		this.Found = [];
		this.Current = -1;

		return this;
	},

	Print: function (options, callback) {
		var cache = this.Tokens();
		var self = this;
		var box = document.createElement('div');

		options = options || {};

		box.className = 'elemenx-code-editor elemenx-code-editor-print' + (this.LineNumbers ? ' numbered' : '');

		box.setAttribute('dir', 'ltr');
		box.style.setProperty('--elemenx-code-digits', String(Math.max(2, String(cache.Lines.length).length)));
		box.style.setProperty('--elemenx-code-tab', String(this.TabSize));

		box.innerHTML = '<div class="elemenx-code-editor-lines">' + cache.Lines.map(function (tokens, index) {
			return '<div class="elemenx-code-editor-row"><span class="elemenx-code-editor-number">' + (index + 1) + '</span><span class="elemenx-code-editor-text">' + self.LineHTML(tokens, cache.Starts[index], []) + '</span></div>';
		}).join('') + '</div>';

		this.$Service('Print').Element(box, {Title: options.Title || this.Label || '', Theme: options.Theme, Class: options.Class, Style: options.Style, Margin: options.Margin, Language: options.Language}, callback);

		return this;
	},

	/* Scrolls the list of the active item so that the item shows: the list only, never the page. */
	RevealChoice: function (selector) {
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
	},

	/* The lines of the diff of Original and Value, with the tokens of each line in its own text. */
	DiffLines: function () {
		var before = String(this.Original == null ? '' : this.Original);
		var after = String(this.Value == null ? '' : this.Value);
		var syntax = this.$Service('Syntax');
		var old = syntax.Lines(before, this.Language);
		var current = syntax.Lines(after, this.Language);

		return this.$Service('Diff').Lines(before, after).map(function (line) {
			return {Type: line.Type, Text: line.Text, Old: line.Old, New: line.New, Tokens: line.Type === 'add' ? current[line.New - 1] || [] : old[line.Old - 1] || []};
		});
	},

	DiffStats: function () {
		return this.$Service('Diff').Stats(this.$Service('Diff').Lines(String(this.Original == null ? '' : this.Original), String(this.Value == null ? '' : this.Value)));
	},

	/* The marks of the words changed in a line removed and the line added for it (a run of removes, then adds). */
	DiffWords: function (lines) {
		var diff = this.$Service('Diff');
		var i = 0;
		var removed;
		var added;
		var words;
		var k;

		while (i < lines.length) {
			if (lines[i].Type !== 'remove') {
				i++;

				continue;
			}

			removed = [];
			added = [];

			while (i < lines.length && lines[i].Type === 'remove') removed.push(lines[i++]);

			while (i < lines.length && lines[i].Type === 'add') added.push(lines[i++]);

			for (k = 0; k < Math.min(removed.length, added.length); k++) {
				words = diff.Words(removed[k].Text, added[k].Text);

				removed[k].Marks = words.Before;
				added[k].Marks = words.After;
			}
		}

		return lines;
	},

	/* The markup of the code of a line of the diff: its tokens, with the words changed marked. */
	DiffCode: function (line) {
		return this.LineHTML(line.Tokens, 0, (line.Marks || []).map(function (mark) {
			return {Start: mark.Start, End: mark.End, Class: 'elemenx-code-diff-word'};
		})) || '&#8203;';
	},

	/* A row of the unified view: the numbers of the line in both texts, its sign and its code. */
	DiffRow: function (line) {
		var sign = {same: ' ', remove: '−', add: '+'}[line.Type];

		return '<div class="elemenx-code-diff-row ' + line.Type + '" role="row"><span class="elemenx-code-diff-number" role="cell">' + (line.Old || '') + '</span><span class="elemenx-code-diff-number" role="cell">' + (line.New || '') + '</span><span class="elemenx-code-diff-sign" aria-hidden="true">' + sign + '</span><span class="elemenx-code-diff-code" role="cell">' + this.DiffCode(line) + '</span></div>';
	},

	/* A row of the split view: the line of the text before on the left, of the text after on the right. */
	DiffSide: function (left, right) {
		var self = this;
		var cell = function (line, kind) {
			if (!line)
				return '<span class="elemenx-code-diff-number empty" role="cell"></span><span class="elemenx-code-diff-code empty" role="cell"></span>';

			return '<span class="elemenx-code-diff-number ' + line.Type + '" role="cell">' + (kind === 'old' ? line.Old : line.New) + '</span><span class="elemenx-code-diff-code ' + line.Type + '" role="cell">' + self.DiffCode(line) + '</span>';
		};

		return '<div class="elemenx-code-diff-row split" role="row">' + cell(left, 'old') + cell(right, 'new') + '</div>';
	},

	/* The rows of a run of lines in the split view: removes beside the adds that follow them. */
	DiffSplit: function (lines) {
		var html = '';
		var i = 0;
		var removed;
		var added;
		var k;

		while (i < lines.length) {
			if (lines[i].Type === 'same') {
				html += this.DiffSide(lines[i], lines[i]);

				i++;

				continue;
			}

			removed = [];
			added = [];

			while (i < lines.length && lines[i].Type === 'remove') removed.push(lines[i++]);

			while (i < lines.length && lines[i].Type === 'add') added.push(lines[i++]);

			for (k = 0; k < Math.max(removed.length, added.length); k++)
				html += this.DiffSide(removed[k] || null, added[k] || null);
		}

		return html;
	},

	/* Draws the diff view: the changes with their context, and the folds between them (open ones drawn whole). */
	PaintDiff: function () {
		var self = this;
		var root = this.$Element();
		var view = root && root.querySelector('.elemenx-code-diff');
		var lines;
		var stats;
		var html = '';

		if (!view || !this.Diffing(this.Diff, this.Original)) return;

		lines = this.DiffWords(this.DiffLines());
		stats = this.$Service('Diff').Stats(lines);

		this.$Service('Diff').Hunks(lines, this.Context).forEach(function (hunk, index) {
			if (hunk.Type === 'fold' && (self.Unfolded || []).indexOf(index) === -1) {
				html += '<button class="elemenx-code-diff-fold" type="button" data-fold="' + index + '">' + self.Escape(Elemenx.Locale.Text('ui.codeEditor.unchanged', {count: hunk.Lines.length})) + '</button>';

				return;
			}

			html += '<div class="elemenx-code-diff-hunk' + (hunk.Type === 'change' ? ' change' : '') + '" role="rowgroup">' + (self.Diff === 'split' ? self.DiffSplit(hunk.Lines) : hunk.Lines.map(function (line) {
				return self.DiffRow(line);
			}).join('')) + '</div>';
		});

		view.innerHTML = '<div class="elemenx-code-diff-stats"><span class="added">+' + stats.Added + '</span> <span class="removed">−' + stats.Removed + '</span></div>' + html;
	},

	/* A press on a fold opens it. */
	DiffPressed: function (event) {
		var fold = event.target.closest('.elemenx-code-diff-fold');
		if (!fold) return;

		this.Unfolded = (this.Unfolded || []).concat([Number(fold.getAttribute('data-fold'))]);
	},

	/* Scrolls the diff to the next (step 1) or the previous (-1) change from the top of what shows. */
	DiffStep: function (step) {
		var root = this.$Element();
		var view = root && root.querySelector('.elemenx-code-diff');
		var hunks = view ? Array.prototype.slice.call(view.querySelectorAll('.elemenx-code-diff-hunk.change')) : [];
		var top = view ? view.scrollTop : 0;
		var target = step > 0 ? hunks.filter(function (hunk) {
			return hunk.offsetTop > top + 1;
		})[0] : hunks.filter(function (hunk) {
			return hunk.offsetTop < top - 1;
		}).pop();
		if (target)
			view.scrollTop = target.offsetTop;

		return !!target;
	},

	NextChange: function () {
		return this.DiffStep(1);
	},

	PreviousChange: function () {
		return this.DiffStep(-1);
	}
});
