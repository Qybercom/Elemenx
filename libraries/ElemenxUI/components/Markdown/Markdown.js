/*
 * A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike
 * and the fenced code of GitHub) and kept to its schema, so nothing in it runs. The code of a fence that names its
 * language (```js) is highlighted by the Syntax Service (Highlight, on by default). It looks as the text of a
 * RichEditor (the classes of elemenx-document).
 */
Elemenx.Component('Markdown', {
	$TemplateURL: 'Markdown.html',
	$StyleURL: 'Markdown.css',
	Value: '',
	Highlight: true,
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

		this.Rendered = function (value, highlight) {
			var html = self.$Service('RichText').FromMarkdown(String(value == null ? '' : value));
			var names = languages(value);
			var syntax = self.$Service('Syntax');

			return {
				Render: function (container) {
					container.innerHTML = html;

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
