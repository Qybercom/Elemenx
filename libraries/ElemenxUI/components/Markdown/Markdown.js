/*
 * A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike
 * and the fenced code of GitHub) and kept to its schema, so nothing in it runs. The code of a fence that names its
 * language (```js) is highlighted by the Syntax Service (Highlight, on by default). Look: 'document' (the default)
 * looks as the text of a RichEditor (the classes of elemenx-document); 'interface' takes the classes of the interface
 * of the Library instead, as a page of an Application: a table is an elemenx-table, a list an elemenx-ul or an
 * elemenx-ol, a quote an elemenx-callout, a link an elemenx-link, code (a block or in a line) an elemenx-code, a rule
 * an elemenx-divider. Without Value the text is the body of the element (<Markdown>## A title</Markdown>), without the
 * indentation its lines share: the body follows its changes. The plugins of the RichText Service draw what Markdown
 * has no element for: ```mermaid a Diagram, ```chart a Chart, ::: warning a callout... (RichText.Extend adds more).
 */
Elemenx.Component('Markdown', {
	$TemplateURL: 'Markdown.html',
	$StyleURL: 'Markdown.css',
	$Meta: {
		Group: 'text',
		Icon: 'file-text',
		Description: 'A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike and the fenced code of GitHub) and kept to its schema, so nothing in it runs.',
		Props: {
			Value: {Body: true, Description: 'The text in Markdown; without it, the body of the element.'},
			Highlight: 'Highlights the code of the fences that name their language.',
			Look: {Options: ['document', 'interface'], Description: 'document (as a RichEditor) or interface (the classes of the Library).'},
			Label: 'The name of the document for screen readers.'
		},
		Sample: {Value: '## A title\n\nSome **bold** and *italic* text, and a [link](https://example.com).\n\n- One\n- Two'}
	},
	Value: '',
	Highlight: true,
	Look: 'document',
	Label: '',
	Body: '',

	$OnCreate: function () {
		var self = this;
		var source = null;
		var helpers = this.$Service('ElemenxHelpers');

		/*
		 * The text of the body: its lines without the indentation they all share, and without the blank lines around them,
		 * so a text indented as the template around it reads as it was written.
		 */
		function bodyText (node) {
			return helpers.BodyText(node);
		}

		/* What renders nothing: the place of the body, kept out of state. */
		this.Own = function () {
			return {Source: source, Text: bodyText};
		};

		var mounted = null;

		/* The languages of the fences of a text that stay code, in their order: a fence of a plugin is no <pre>. */
		function languages (text) {
			var list = [];
			var open = null;
			var rich = self.$Service('RichText');

			String(text || '').split('\n').forEach(function (line) {
				var match = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/.exec(line);
				if (!match) return;

				if (open && match[1].charAt(0) === open.charAt(0) && match[1].length >= open.length && !match[2]) {
					open = null;

					return;
				}

				if (!open) {
					open = match[1];

					if (!match[2] || !rich.PluginFor('fence', match[2]))
						list.push(match[2].toLowerCase());
				}
			});

			return list;
		}

		/* The plugins drawn last, taken away before the next drawing and with the component. */
		this.Unmount = function () {
			if (mounted)
				mounted.Destroy();

			mounted = null;
		};

		/* The classes of the interface of the Library on the elements of a document (Look 'interface'). */
		var looks = {table: 'elemenx-table', ul: 'elemenx-ul', ol: 'elemenx-ol', blockquote: 'elemenx-callout neutral', a: 'elemenx-link', pre: 'elemenx-code', 'code:not(pre code)': 'elemenx-code', hr: 'elemenx-divider'};

		this.Rendered = function (value, highlight, look) {
			var html = self.$Service('RichText').FromMarkdown(String(value == null ? '' : value));
			var names = languages(value);
			var syntax = self.$Service('Syntax');
			/* The body, taken before the document takes its place, and kept after it, hidden. */
			var root = self.$Element ? self.$Element() : null;
			if (!source && root)
				source = root.querySelector('.elemenx-markdown-source');

			return {
				Render: function (container) {
					self.Unmount();

					container.innerHTML = html;

					if (source)
						container.appendChild(source);

					if (look === 'interface')
						Object.keys(looks).forEach(function (tag) {
							Array.prototype.forEach.call(container.querySelectorAll(tag), function (node) {
								node.className = looks[tag];
							});
						});

					if (highlight !== false && highlight !== 'false') {
						Array.prototype.forEach.call(container.querySelectorAll('pre'), function (pre, index) {
							var language = names[index];
							if (!language || !syntax.Find(language)) return;

							pre.setAttribute('data-language', language);

							pre.innerHTML = syntax.HTML(pre.textContent, language);
						});
					}

					/* The plugins of the document (a diagram, a chart, a callout), last: the looks above are not theirs. */
					mounted = self.$Service('RichText').Mount(container, {Application: self.$Application()});
				}
			};
		};
	},

	/* The body read once it is there, and again as it changes. */
	$OnReady: function () {
		var self = this;
		var own = this.Own();
		if (!own.Source) return;

		this.Body = own.Text(own.Source);

		this.Watcher = new MutationObserver(function () {
			var text = own.Text(own.Source);
			if (text !== self.Body)
				self.Body = text;
		});

		this.Watcher.observe(own.Source, {childList: true, characterData: true, subtree: true});
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();

		this.Unmount();
	}
});
