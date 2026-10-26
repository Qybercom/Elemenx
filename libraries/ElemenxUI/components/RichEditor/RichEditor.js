/*
 * An editor of rich text (WYSIWYG). Value is the HTML of the document, kept to the schema of the RichText Service
 * (paragraphs, headings, quotes, code, lists, tables, images, links and the inline styles); paste and drop go
 * through it too. It has no toolbar: the controls of an Application call Command, and a small menu over a selection
 * gives the quick styles (Menu false hides it).
 * - Value, Placeholder, ReadOnly, Disabled, Label, Rows (the least height in lines) and MaxRows (the most, then it
 *   scrolls; 0 grows with the text), Menu.
 * - Command(name, value): bold, italic, underline, strike, code; paragraph, heading (value 1-4), quote, codeblock;
 *   bullets, numbers, indent, outdent; link (value: the URL; empty removes it), unlink; image (value: {Src, Alt} or
 *   the URL), table (value: {Rows, Columns}), row, column, row-delete, column-delete, table-delete; rule; clear;
 *   undo, redo. It returns false for a name it does not know or while it cannot edit.
 * - Typing Markdown at the start of a paragraph makes blocks: '# ' to '#### ' headings, '- ' a list, '1. ' a
 *   numbered list, '> ' a quote, '``` ' code. Keys: Mod+B, Mod+I, Mod+U, Mod+E (code), Mod+K (the link event),
 *   Tab and Shift+Tab in a list nest its items.
 * - Methods: Focus(), Formats() (what the selection has: {Bold, Italic, Underline, Strike, Code, Block, Level,
 *   List, Link, Table}), Insert(html), Markdown(), SetMarkdown(text), Text(), Print(options, callback),
 *   Find(query, {Case, Word, RegExp}) (returns the count of matches, marks them by the Find Service and shows the
 *   one at the caret or after it), FindNext(), FindPrevious(), ReplaceCurrent(text), ReplaceAll(text), ClearFind().
 * - Mod+F opens its find bar (a FindBar over its corner), Mod+R (or Mod+H) with the replace row; FindBar: false leaves it out.
 * - Events: input and change (Value), formats (Formats() as the selection moves), link ({Href, Text}: Mod+K, for a
 *   dialog of the Application), files (the files pasted or dropped: the Application uploads them and inserts images
 *   by Command), ready (the editor).
 */
Elemenx.Component('RichEditor', {
	$TemplateURL: 'RichEditor.html',
	$StyleURL: 'RichEditor.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'bold',
		Description: 'An editor of rich text (WYSIWYG).',
		Events: ['ready', 'input', 'formats', 'link', 'files', 'change'],
		Methods: ['Find(query, options)', 'FindNext()', 'FindPrevious()', 'ReplaceCurrent(text)', 'ReplaceAll(text)', 'ClearFind()', 'Formats()', 'Command(name, value)', 'Focus()', 'Insert(html)', 'Markdown()', 'SetMarkdown(text)', 'Text()', 'Print(options, callback)'],
		Props: {
			Value: 'The HTML of the document.',
			Placeholder: 'The text shown while it is empty.',
			ReadOnly: 'Shows the value without letting it change.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Label: 'The name of the editor for screen readers.',
			Rows: 'The least height, in lines.',
			MaxRows: 'The greatest height, in lines, then it scrolls (0: it grows with the text).',
			Menu: 'Shows the small menu of quick styles over a selection.',
			FindBar: 'Its own find bar on Mod+F; false leaves it out.'
		},
		Sample: {Rows: 5}
	},
	Value: '',
	Placeholder: '',
	ReadOnly: false,
	Disabled: false,
	Label: '',
	Rows: 8,
	MaxRows: 24,
	Menu: true,
	Active: {},
	MenuOpen: false,
	MenuStyle: '',
	LinkMode: false,
	LinkText: '',
	FindBar: true,
	Finding: false,
	FindReplacing: false,
	FindQuery: '',
	FindCount: 0,
	FindIndex: -1,

	$OnCreate: function () {
		var self = this;
		var own = {Last: null, Range: null, Changed: false, ReadyTimer: null, Listener: null};
		var last;
		var sync;

		/* What the editor keeps for itself: not state, so it renders nothing. */
		this.Own = function () {
			return own;
		};

		/* The function *mount calls when Value changes from outside: the document is drawn again. */
		this.Sync = function (value) {
			if (value !== last) {
				last = value;
				sync = function () {
					self.Render(value);
				};
			}

			return sync;
		};
	},

	/* ready goes a task later: the owner listens to the events of a Component once the Component is made. */
	$OnReady: function () {
		var self = this;
		var own = this.Own();

		own.Listener = function () {
			self.Selected();
		};

		/* The editor may move into another document (a window the Application opened): its selection follows it there. */
		own.Focus = function () {
			self.Bind(true);
		};

		this.$Element().addEventListener('focusin', own.Focus);

		this.Bind(true);

		this.Render(this.Value);

		own.ReadyTimer = window.setTimeout(function () {
			self.$Emit('ready', self);
		}, 0);
	},

	$OnDestroy: function () {
		window.clearTimeout(this.Own().ReadyTimer);

		this.$Service('Find').Clear(this);

		this.$Element().removeEventListener('focusin', this.Own().Focus);

		this.Bind(false);
	},

	/* Asleep (Elemenx.Cache keeps it out of the page) the selection of the page is not its own. */
	$OnSleep: function () {
		this.Bind(false);
	},

	$OnWake: function () {
		this.Bind(true);
	},

	/* The document and the window of the editor, wherever it is now. */
	Doc: function () {
		var owner = this.$Element().ownerDocument;

		return owner && owner.defaultView ? owner : document;
	},

	View: function () {
		return this.Doc().defaultView || window;
	},

	/* Hears the changes of the selection of the document the editor is in (on), or of none (off). */
	Bind: function (on) {
		var own = this.Own();
		var target = on ? this.Doc() : null;
		if (own.Bound === target) return;

		if (own.Bound)
			own.Bound.removeEventListener('selectionchange', own.Listener);

		if (target)
			target.addEventListener('selectionchange', own.Listener);

		own.Bound = target;
	},

	/* The matches of the query of Find in the text; show: the one at the caret or after it is the current one. */
	Search: function (show) {
		var query = this.Own().Query;
		var content = this.Content();
		var ranges = this.$Service('Find').Ranges(content, query.Text, query.Options);
		var selection = this.View().getSelection();
		var caret = selection && selection.rangeCount && content.contains(selection.getRangeAt(0).startContainer) ? selection.getRangeAt(0) : null;
		var index = -1;

		ranges.forEach(function (range, at) {
			if (index === -1 && (!caret || range.compareBoundaryPoints(Range.START_TO_START, caret) >= 0))
				index = at;
		});

		if (ranges.length && index === -1)
			index = 0;

		if (!show && this.FindIndex !== -1 && ranges.length)
			index = Math.min(this.FindIndex, ranges.length - 1);

		this.Own().Ranges = ranges;
		this.FindCount = ranges.length;
		this.FindIndex = index;

		this.$Service('Find').Show(this, ranges, index);

		return ranges.length;
	},

	Find: function (query, options) {
		this.Own().Query = {Text: String(query == null ? '' : query), Options: options || {}};

		return this.Search(true);
	},

	FindNext: function () {
		return this.FindStep(1);
	},

	FindPrevious: function () {
		return this.FindStep(-1);
	},

	FindStep: function (step) {
		var ranges = this.Own().Ranges || [];
		if (!ranges.length) return -1;

		this.FindIndex = (this.FindIndex + step + ranges.length) % ranges.length;

		this.$Service('Find').Show(this, ranges, this.FindIndex);

		return this.FindIndex;
	},

	/* A replacement is typed over the match (insertText): the undo of the browser takes it back. */
	ReplaceWith: function (range, text) {
		var selection = this.View().getSelection();

		this.Content().focus();

		selection.removeAllRanges();
		selection.addRange(range);

		this.Run('insertText', String(text == null ? '' : text));
	},

	ReplaceCurrent: function (text) {
		var range = (this.Own().Ranges || [])[this.FindIndex];
		if (!range || !this.Editable()) return false;

		this.ReplaceWith(range, text);
		this.Read();
		this.Search(false);

		return true;
	},

	/* From the last match to the first, so the ranges before the one replaced stay where they are. */
	ReplaceAll: function (text) {
		var ranges = (this.Own().Ranges || []).slice();
		var self = this;

		if (!ranges.length || !this.Editable()) return 0;

		ranges.reverse().forEach(function (range) {
			self.ReplaceWith(range, text);
		});

		this.Read();
		this.Search(false);

		return ranges.length;
	},

	ClearFind: function () {
		this.Own().Query = null;
		this.Own().Ranges = [];
		this.FindCount = 0;
		this.FindIndex = -1;

		this.$Service('Find').Clear(this);

		return this;
	},

	/* The find bar: opened on the text selected (one line), its field focused. */
	OpenFind: function (replace) {
		var self = this;
		var selection = this.View().getSelection();
		var text = selection ? String(selection) : '';
		if (text && text.indexOf('\n') === -1 && this.Content().contains(selection.anchorNode))
			this.FindQuery = text;

		this.FindReplacing = !!replace && this.Editable();
		this.Finding = true;

		window.setTimeout(function () {
			if (self.FindQuery)
				self.BarFind({Query: self.FindQuery, Case: false, Word: false, RegExp: false});
		}, 0);
	},

	BarFind: function (query) {
		this.FindQuery = query.Query;

		this.Find(query.Query, {Case: query.Case, Word: query.Word, RegExp: query.RegExp});
	},

	BarNext: function () {
		this.FindNext();
	},

	BarPrevious: function () {
		this.FindPrevious();
	},

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

	Content: function () {
		var root = this.$Element();

		return root ? root.querySelector('.elemenx-rich-editor-content') : null;
	},

	Rich: function () {
		return this.$Service('RichText');
	},

	Editable: function () {
		return !this.ReadOnly && !this.Disabled;
	},

	/* Draws value unless it is the document the editor gave last. */
	Render: function (value) {
		var content = this.Content();
		var html;

		if (!content || value === this.Own().Last) return;

		html = this.Rich().Sanitize(value);

		this.Own().Last = value;

		content.innerHTML = html || '<p><br></p>';

		content.classList.toggle('empty', !html);
	},

	/* The document changed in the page: Value follows. */
	Read: function () {
		var content = this.Content();
		var html = this.Rich().Sanitize(content.innerHTML);

		content.classList.toggle('empty', !html);

		if (html === this.Value) return;

		this.Own().Last = html;
		this.Own().Changed = true;
		this.Value = html;

		this.$Emit('input', html);
	},

	Selection: function () {
		var content = this.Content();
		var scope = content && content.getRootNode();

		return scope && scope.getSelection ? scope.getSelection() : this.Doc().getSelection();
	},

	/* The range of the selection when it is in the document, or null. */
	Range: function () {
		var selection = this.Selection();
		var content = this.Content();
		var range;

		if (!selection || !selection.rangeCount || !content) return null;

		range = selection.getRangeAt(0);

		return content.contains(range.commonAncestorContainer) ? range : null;
	},

	/* The nearest element at the start of the selection with a tag of tags, inside the document. */
	Closest: function (tags, range) {
		var content = this.Content();
		var node = (range || this.Range() || {}).startContainer;

		while (node && node !== content) {
			if (node.nodeType === 1 && tags.indexOf(node.tagName) !== -1) return node;

			node = node.parentNode;
		}

		return null;
	},

	Formats: function () {
		var range = this.Range();
		var block = range ? this.Closest(['P', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'PRE', 'LI'], range) : null;
		var list = range ? this.Closest(['UL', 'OL'], range) : null;
		var link = range ? this.Closest(['A'], range) : null;
		var code = range ? this.Closest(['CODE'], range) : null;

		if (!range) return {};

		return {
			Bold: !!this.Closest(['STRONG', 'B'], range),
			Italic: !!this.Closest(['EM', 'I'], range),
			Underline: !!this.Closest(['U'], range),
			Strike: !!this.Closest(['S', 'STRIKE', 'DEL'], range),
			Code: !!code && !this.Closest(['PRE'], range),
			Block: block ? {P: 'paragraph', H1: 'heading', H2: 'heading', H3: 'heading', H4: 'heading', BLOCKQUOTE: 'quote', PRE: 'codeblock', LI: 'item'}[block.tagName] : 'paragraph',
			Level: block && /^H\d$/.test(block.tagName) ? Number(block.tagName.charAt(1)) : 0,
			Quote: !!this.Closest(['BLOCKQUOTE'], range),
			List: list ? list.tagName === 'OL' ? 'numbers' : 'bullets' : null,
			Link: link ? link.getAttribute('href') : null,
			Table: !!this.Closest(['TD', 'TH'], range)
		};
	},

	/* The selection moved: the formats, and the menu over a selection. */
	Selected: function () {
		var range = this.Range();
		var formats = this.Formats();
		var root = this.$Element();
		var rect;
		var box;
		var touch;

		if (!root) return;

		if (JSON.stringify(formats) !== JSON.stringify(this.Active)) {
			this.Active = formats;

			this.$Emit('formats', formats);
		}

		if (range)
			this.Own().Range = range.cloneRange();

		if (this.LinkMode) return;

		if (!range || range.collapsed || !this.Menu || !this.Editable() || !String(range).trim()) {
			this.MenuOpen = false;

			return;
		}

		rect = range.getBoundingClientRect();
		box = root.getBoundingClientRect();

		/* Above the selection; under it on a touch screen, where the menu of the system and the handles are above it. */
		touch = typeof this.View().matchMedia === 'function' && this.View().matchMedia('(pointer: coarse)').matches;

		this.MenuStyle = 'left: ' + Math.round(Math.max(4, Math.min(rect.left + rect.width / 2 - box.left - 150, box.width - 304))) + 'px; top: ' + Math.round(touch ? rect.bottom - box.top + 16 : Math.max(-40, rect.top - box.top - 44)) + 'px;';
		this.MenuOpen = true;
	},

	/* Puts the selection back where it was before a control of the menu took the focus. */
	Restore: function () {
		var range = this.Own().Range;
		var selection = this.Selection();
		var content = this.Content();
		if (content.getRootNode().activeElement !== content)
			content.focus();

		if (range && selection && content.contains(range.commonAncestorContainer)) {
			selection.removeAllRanges();
			selection.addRange(range);
		}
	},

	Run: function (command, value) {
		try {
			return this.Doc().execCommand(command, false, value);
		}
		catch (error) {
			return false;
		}
	},

	Escape: function (text) {
		return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	},

	Command: function (name, value) {
		var formats;
		var cell;
		var done = true;

		if (!this.Editable() || !this.Content()) return false;

		this.Restore();
		this.Run('defaultParagraphSeparator', 'p');

		formats = this.Formats();

		switch (name) {
			case 'bold': this.Run('bold');

				break;
			case 'italic': this.Run('italic');

				break;
			case 'underline': this.Run('underline');

				break;
			case 'strike': this.Run('strikeThrough');

				break;
			case 'code': this.InlineCode();

				break;
			case 'paragraph': this.Run('formatBlock', 'p');

				break;
			case 'heading': this.Run('formatBlock', formats.Level === (Number(value) || 2) ? 'p' : 'h' + Math.max(1, Math.min(4, Number(value) || 2)));

				break;
			case 'quote': this.Run('formatBlock', formats.Quote ? 'p' : 'blockquote');

				break;
			case 'codeblock': this.Run('formatBlock', formats.Block === 'codeblock' ? 'p' : 'pre');

				break;
			case 'bullets': this.Run('insertUnorderedList');

				break;
			case 'numbers': this.Run('insertOrderedList');

				break;
			case 'indent': this.Run('indent');

				break;
			case 'outdent': this.Run('outdent');

				break;
			case 'link': this.Link(value);

				break;
			case 'unlink': this.Link('');

				break;
			case 'image': this.Image(value);

				break;
			case 'table': this.Table(value);

				break;
			case 'rule': this.Run('insertHorizontalRule');

				break;
			case 'clear':
				this.Run('removeFormat');
				this.Run('unlink');

				if (formats.Block !== 'item')
					this.Run('formatBlock', 'p');

				break;
			case 'undo': this.Run('undo');

				break;
			case 'redo': this.Run('redo');

				break;
			default:
				cell = this.Closest(['TD', 'TH']);
				done = /^(row|column|row-delete|column-delete|table-delete)$/.test(name) && !!cell && this.Cells(name, cell);
		}

		if (!done)
			return false;

		this.Read();
		this.Selected();

		return true;
	},

	/* Code inside a line: the selection becomes code, or the code at the caret becomes text again. */
	InlineCode: function () {
		var code = this.Closest(['CODE']);
		var range = this.Range();
		var selection = this.Selection();
		var whole;

		if (code && !this.Closest(['PRE'])) {
			whole = this.Doc().createRange();

			whole.selectNode(code);

			selection.removeAllRanges();
			selection.addRange(whole);

			this.Run('insertText', code.textContent);

			return;
		}

		if (!range || range.collapsed) return;

		this.Run('insertHTML', '<code>' + this.Escape(String(range)) + '</code>');
	},

	Link: function (url) {
		var href = this.Rich().SafeURL(url);
		var link = this.Closest(['A']);
		var range = this.Range();
		var selection = this.Selection();
		var whole;

		if (link && (!range || range.collapsed)) {
			whole = this.Doc().createRange();

			whole.selectNodeContents(link);

			selection.removeAllRanges();
			selection.addRange(whole);
		}

		if (!href) {
			this.Run('unlink');

			return;
		}

		if (!link && (!range || range.collapsed)) this.Run('insertHTML', '<a href="' + this.Escape(href) + '">' + this.Escape(url) + '</a>');
		else this.Run('createLink', href);
	},

	Image: function (value) {
		var source = typeof value === 'string' ? {Src: value} : value || {};
		var src = this.Rich().SafeURL(source.Src, true);
		if (!src) return;

		this.Run('insertHTML', '<img src="' + this.Escape(src) + '" alt="' + this.Escape(source.Alt || '') + '">');
	},

	Table: function (value) {
		var options = value || {};
		var rows = Math.max(1, Math.min(50, Number(options.Rows) || 3));
		var columns = Math.max(1, Math.min(20, Number(options.Columns) || 3));
		var cells = new Array(columns + 1).join('<td><br></td>');
		var html = '<table><thead><tr>' + new Array(columns + 1).join('<th><br></th>') + '</tr></thead><tbody>' + new Array(rows).join('<tr>' + cells + '</tr>') + '</tbody></table><p><br></p>';

		this.Run('insertHTML', html);
	},

	/* The rows and the columns of a table, from the cell at the caret. */
	Cells: function (name, cell) {
		var row = cell.parentNode;
		var table = row.closest('table');
		var index = Array.prototype.indexOf.call(row.children, cell);
		var copy;

		if (name === 'table-delete') {
			table.parentNode.removeChild(table);

			return true;
		}

		if (name === 'row') {
			copy = document.createElement('tr');

			Array.prototype.forEach.call(row.children, function () {
				var td = document.createElement('td');

				td.appendChild(document.createElement('br'));
				copy.appendChild(td);
			});

			if (row.parentNode.tagName === 'THEAD') table.querySelector('tbody').insertBefore(copy, table.querySelector('tbody').firstChild);
			else row.parentNode.insertBefore(copy, row.nextSibling);

			return true;
		}

		if (name === 'row-delete') {
			if (row.parentNode.tagName === 'THEAD' || table.querySelectorAll('tbody tr').length < 2) return false;

			row.parentNode.removeChild(row);

			return true;
		}

		Array.prototype.forEach.call(table.querySelectorAll('tr'), function (line) {
			var at = line.children[index];
			var added;

			if (name === 'column') {
				added = document.createElement(line.parentNode.tagName === 'THEAD' ? 'th' : 'td');

				added.appendChild(document.createElement('br'));

				line.insertBefore(added, at ? at.nextSibling : null);
			}
			else if (at && line.children.length > 1) {
				line.removeChild(at);
			}
		});

		return true;
	},

	Typed: function (event) {
		this.Read();

		/* The matches of an open search follow the text as it changes. */
		if (this.Own().Query)
			this.Search(false);

		if (event && event.inputType === 'insertText' && event.data === ' ')
			this.Shortcut();
	},

	/* Markdown typed at the start of a paragraph: the block it names. */
	Shortcut: function () {
		var range = this.Range();
		var block = range && range.collapsed ? this.Closest(['P'], range) : null;
		var before;
		var marker;
		var command;
		var start;
		var selection = this.Selection();
		var head;
		var level;

		if (!block) return;

		head = this.Doc().createRange();

		head.setStart(block, 0);
		head.setEnd(range.startContainer, range.startOffset);

		before = String(head).replace(/ /g, ' ');
		marker = /^(#{1,4}|[-*+]|1[.)]|>|```) $/.exec(before);

		if (!marker) return;

		level = marker[1].charAt(0) === '#' ? marker[1].length : 0;
		command = level ? 'heading' : /^[-*+]$/.test(marker[1]) ? 'bullets' : /^1/.test(marker[1]) ? 'numbers' : marker[1] === '>' ? 'quote' : 'codeblock';

		selection.removeAllRanges();
		selection.addRange(head);

		this.Run('delete');

		start = this.Range();

		if (start)
			this.Own().Range = start.cloneRange();

		this.Command(command, level || undefined);
	},

	Key: function (event) {
		var mod = event.ctrlKey || event.metaKey;
		var key = String(event.key || '').toLowerCase();
		var formats;

		/*
		 * Mod+F: the find bar; Mod+R (or Mod+H): with its replace row (an editor that can change). Taken here, while the
		 * editor has the focus: the page does not reload, a hotkey of the page (Reload of a menu) does not run.
		 */
		if (mod && !event.altKey && !event.shiftKey && (event.code === 'KeyF' || event.code === 'KeyR' || event.code === 'KeyH') && this.FindBar && this.FindBar !== 'false') {
			event.preventDefault();
			event.stopPropagation();

			this.OpenFind(event.code !== 'KeyF');

			return;
		}

		if (event.isComposing || !this.Editable()) return;

		if (event.key === 'Escape' && this.MenuOpen) {
			this.MenuOpen = false;

			return;
		}

		if (mod && !event.altKey && !event.shiftKey && /^[biue]$/.test(key)) {
			event.preventDefault();

			this.Command({b: 'bold', i: 'italic', u: 'underline', e: 'code'}[key]);

			return;
		}

		if (mod && key === 'k') {
			event.preventDefault();

			formats = this.Formats();

			this.$Emit('link', {Href: formats.Link, Text: String(this.Range() || '')});

			return;
		}

		if (event.key === 'Tab' && !mod && !event.altKey && this.Closest(['LI'])) {
			event.preventDefault();

			this.Command(event.shiftKey ? 'outdent' : 'indent');

			return;
		}

		if (event.key === 'Enter' && !event.shiftKey && !mod && this.Closest(['PRE'])) {
			event.preventDefault();

			this.Run('insertText', '\n');
		}
	},

	/* Paste goes through the schema; files go to the Application. */
	Pasted: function (event) {
		var data = event.clipboardData;
		var html;
		var text;

		if (!data || !this.Editable()) return;

		event.preventDefault();

		if (data.files && data.files.length) {
			this.$Emit('files', Array.prototype.slice.call(data.files));

			return;
		}

		html = data.getData('text/html');
		text = data.getData('text/plain');

		if (this.Closest(['PRE'])) {
			this.Run('insertText', text);

			return;
		}

		if (html) {
			this.Run('insertHTML', this.Rich().Sanitize(html));

			return;
		}

		if (!text) return;

		if (text.indexOf('\n') === -1) this.Run('insertText', text);
		else this.Run('insertHTML', text.split(/\n{2,}/).map(function (part) {
			return '<p>' + this.Escape(part).replace(/\n/g, '<br>') + '</p>';
		}, this).join(''));
	},

	Dropped: function (event) {
		var files = event.dataTransfer && event.dataTransfer.files;
		if (!files || !files.length) return;

		event.preventDefault();

		if (this.Editable())
			this.$Emit('files', Array.prototype.slice.call(files));
	},

	Over: function (event) {
		if (event.dataTransfer && Array.prototype.indexOf.call(event.dataTransfer.types || [], 'Files') !== -1)
			event.preventDefault();
	},

	Blurred: function () {
		var self = this;

		window.setTimeout(function () {
			var root = self.$Element();
			var active = root && root.getRootNode().activeElement;
			if (root && root.contains(active)) return;

			self.MenuOpen = false;
			self.LinkMode = false;

			if (self.Own().Changed) {
				self.Own().Changed = false;

				self.$Emit('change', self.Value);
			}
		}, 0);
	},

	/* The buttons of the menu keep the selection. */
	Hold: function (event) {
		if (event.target.tagName !== 'INPUT')
			event.preventDefault();
	},

	/* A Button of the toolbar: its command on the element round it. */
	Act: function (event) {
		var name = event.target.closest('[data-command]').getAttribute('data-command');

		var root = this.$Element();

		if (name === 'link') {
			this.LinkText = this.Active.Link || '';
			this.LinkMode = true;

			window.setTimeout(function () {
				var input = root.querySelector('.elemenx-rich-editor-link');
				if (input)
					input.focus();
			}, 0);

			return;
		}

		this.Command(name, name === 'heading' ? 2 : undefined);
	},

	LinkKey: function (event, node) {
		if (event.key === 'Enter') {
			event.preventDefault();

			this.LinkMode = false;

			this.Command('link', node.value);
		}
		else if (event.key === 'Escape') {
			event.preventDefault();

			this.LinkMode = false;

			this.Restore();
		}
	},

	/* The field of the link lost the focus: the menu closes, unless the focus went back to the document. */
	LinkLeft: function () {
		this.LinkMode = false;
		this.MenuOpen = false;
	},

	Focus: function () {
		var content = this.Content();
		if (content)
			content.focus();

		return this;
	},

	Insert: function (html) {
		if (!this.Editable()) return false;

		this.Restore();

		this.Run('insertHTML', this.Rich().Sanitize(html));

		this.Read();

		return true;
	},

	Markdown: function () {
		return this.Rich().ToMarkdown(this.Value);
	},

	SetMarkdown: function (text) {
		var html = this.Rich().FromMarkdown(text);

		this.Render(html);
		this.Read();

		return this;
	},

	Text: function () {
		return this.Rich().Text(this.Value);
	},

	Print: function (options, callback) {
		var box = document.createElement('div');

		options = options || {};

		box.className = 'elemenx-rich-editor-content elemenx-rich-editor-print';
		box.innerHTML = this.Rich().Sanitize(this.Value);

		this.$Service('Print').Element(box, {Title: options.Title || this.Label || '', Theme: options.Theme, Class: options.Class, Style: options.Style, Margin: options.Margin, Language: options.Language}, callback);

		return this;
	}
});
