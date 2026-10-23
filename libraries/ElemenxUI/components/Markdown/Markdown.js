/*
 * A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike
 * and the fenced code of GitHub) and kept to its schema, so nothing in it runs. The code of a fence that names its
 * language (```js) is highlighted by the Syntax Service (Highlight, on by default). Look: 'document' (the default) looks
 * as the text of a RichEditor (the classes of elemenx-document); 'interface' takes the classes of the interface of the
 * Library instead, as a page of an Application: a table is an elemenx-table, a list an elemenx-ul or an elemenx-ol, a
 * quote an elemenx-callout, a link an elemenx-link, code (a block or in a line) an elemenx-code, a rule an
 * elemenx-divider.
 */
Elemenx.Component('Markdown', {
	$TemplateURL: 'Markdown.html',
	$StyleURL: 'Markdown.css',
	$Meta: {
		Group: 'text',
		Icon: 'file-text',
		Description: 'A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike and the fenced code of GitHub) and kept to its schema, so nothing in it runs.',
		Props: {
			Value: 'The text in Markdown.',
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

	$OnCreate: function () {
		var self = this;

		/* The languages of the fences of a text, in their order. */
		function languages (text) {
			var list = [];
			var open = null;

			String(text || '').split('\n').forEach(function (line) {
				var match = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/.exec(line);
				if (!match) return;

				if (open && match[1].charAt(0) === open.charAt(0) && match[1].length >= open.length && !match[2]) {
					open = null;

					return;
				}

				if (!open) {
					open = match[1];

					list.push(match[2].toLowerCase());
				}
			});

			return list;
		}

		/* The classes of the interface of the Library on the elements of a document (Look 'interface'). */
		var looks = {table: 'elemenx-table', ul: 'elemenx-ul', ol: 'elemenx-ol', blockquote: 'elemenx-callout neutral', a: 'elemenx-link', pre: 'elemenx-code', 'code:not(pre code)': 'elemenx-code', hr: 'elemenx-divider'};

		this.Rendered = function (value, highlight, look) {
			var html = self.$Service('RichText').FromMarkdown(String(value == null ? '' : value));
			var names = languages(value);
			var syntax = self.$Service('Syntax');

			return {
				Render: function (container) {
					container.innerHTML = html;

					if (look === 'interface')
						Object.keys(looks).forEach(function (tag) {
							Array.prototype.forEach.call(container.querySelectorAll(tag), function (node) {
								node.className = looks[tag];
							});
						});

					if (highlight === false || highlight === 'false') return;

					Array.prototype.forEach.call(container.querySelectorAll('pre'), function (pre, index) {
						var language = names[index];
						if (!language || !syntax.Find(language)) return;

						pre.setAttribute('data-language', language);

						pre.innerHTML = syntax.HTML(pre.textContent, language);
					});
				}
			};
		};
	}
});
