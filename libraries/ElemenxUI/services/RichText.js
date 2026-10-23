/*
 * The document of rich text: the HTML RichEditor keeps and the Markdown it reads and writes.
 * - Sanitize(html) keeps only the schema of the document: paragraphs, headings h1-h4, quotes, preformatted code,
 *   lists, rules, tables, images and links, with strong, em, u, s, code and line breaks inside. Other tags give
 *   their text (b becomes strong, i em, strike and del s, h5 and h6 h4); scripts, styles, frames, forms and their
 *   content go. Attributes go too, but href and title of a link (http, https, mailto, tel or a relative URL), src
 *   and alt of an image (also a data: URL of a picture), colspan and rowspan of a cell and start of a list. Text
 *   outside a block goes into a paragraph.
 * - ToMarkdown(html) and FromMarkdown(text): the document as Markdown (CommonMark with the tables, the strike and
 *   the fenced code of GitHub) and back. Underline has no Markdown: it stays <u>.
 * - Text(html) is the plain text of a document, a line for each block.
 * The HTML is read in an inert template: nothing of it runs or loads while it is read.
 */
Elemenx.Service('RichText', {
	$Meta: {
		Description: 'The document of rich text: the HTML RichEditor keeps and the Markdown it reads and writes.',
		Methods: ['Sanitize(html)', 'Text(html)', 'ToMarkdown(html)', 'FromMarkdown(text)']
	},
	Blocks: {P: 1, H1: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, PRE: 1, UL: 1, OL: 1, LI: 1, HR: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1},
	Inline: {STRONG: 1, EM: 1, U: 1, S: 1, CODE: 1, A: 1, BR: 1, IMG: 1},
	Aliases: {B: 'STRONG', I: 'EM', STRIKE: 'S', DEL: 'S', INS: 'U', H5: 'H4', H6: 'H4', TT: 'CODE', KBD: 'CODE'},
	Dropped: {SCRIPT: 1, STYLE: 1, IFRAME: 1, FRAME: 1, OBJECT: 1, EMBED: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, MATH: 1, HEAD: 1, TITLE: 1, META: 1, LINK: 1, INPUT: 1, BUTTON: 1, SELECT: 1, TEXTAREA: 1, OPTION: 1, CANVAS: 1, VIDEO: 1, AUDIO: 1},

	/* The nodes of a text of HTML, read in an inert template. */
	Parse: function (html) {
		var template = document.createElement('template');

		template.innerHTML = String(html == null ? '' : html);

		return template.content;
	},

	SafeURL: function (url, image) {
		var value = String(url || '').trim();
		if (!value) return '';
		if (/^(?:https?:|mailto:|tel:|#|\/|\.{1,2}\/|\?)/i.test(value)) return value;
		if (image && /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
		if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;

		return '';
	},

	Sanitize: function (html) {
		var self = this;
		var output = document.createElement('div');
		var paragraph = null;

		/* The clean copy of the children of a node, appended to target. */
		function copy (node, target) {
			var child = node.firstChild;

			while (child) {
				clean(child, target);

				child = child.nextSibling;
			}
		}

		function clean (node, target) {
			var tag;
			var element;
			var url;

			if (node.nodeType === 3) {
				target.appendChild(document.createTextNode(node.data));

				return;
			}

			if (node.nodeType !== 1) return;

			tag = node.tagName.toUpperCase();
			tag = self.Aliases[tag] || tag;

			/* A line break of preformatted code is a line break of its text. */
			if (tag === 'BR' && target.closest && target.closest('pre')) {
				target.appendChild(document.createTextNode('\n'));

				return;
			}

			if (self.Dropped[tag]) return;

			if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'HEADER' || tag === 'FOOTER' || tag === 'MAIN' || tag === 'ASIDE' || tag === 'NAV' || tag === 'FIGURE' || tag === 'FIGCAPTION' || tag === 'ADDRESS' || tag === 'DL' || tag === 'DT' || tag === 'DD') {
				/* A box of blocks gives its blocks; a box of text, a paragraph. */
				if (target === output || target.tagName === 'BLOCKQUOTE' || target.tagName === 'LI' || target.tagName === 'TD' || target.tagName === 'TH') {
					if (Array.prototype.some.call(node.childNodes, function (item) {
						return item.nodeType === 1 && (self.Blocks[(self.Aliases[item.tagName] || item.tagName)] || /^(DIV|SECTION|ARTICLE|FIGURE|DL)$/.test(item.tagName));
					})) {
						copy(node, target);
					}
					else {
						element = document.createElement('p');

						copy(node, element);

						target.appendChild(element);
					}

					return;
				}

				copy(node, target);

				return;
			}

			if (!self.Blocks[tag] && !self.Inline[tag]) {
				copy(node, target);

				return;
			}

			element = document.createElement(tag.toLowerCase());

			if (tag === 'A') {
				url = self.SafeURL(node.getAttribute('href'));

				if (!url) {
					copy(node, target);

					return;
				}

				element.setAttribute('href', url);

				if (node.getAttribute('title'))
					element.setAttribute('title', node.getAttribute('title'));
			}

			if (tag === 'IMG') {
				url = self.SafeURL(node.getAttribute('src'), true);

				if (!url) return;

				element.setAttribute('src', url);
				element.setAttribute('alt', node.getAttribute('alt') || '');
			}

			if ((tag === 'TD' || tag === 'TH') && /^[1-9]\d?$/.test(node.getAttribute('colspan') || ''))
				element.setAttribute('colspan', node.getAttribute('colspan'));

			if ((tag === 'TD' || tag === 'TH') && /^[1-9]\d?$/.test(node.getAttribute('rowspan') || ''))
				element.setAttribute('rowspan', node.getAttribute('rowspan'));

			if (tag === 'OL' && /^\d{1,6}$/.test(node.getAttribute('start') || '') && node.getAttribute('start') !== '1')
				element.setAttribute('start', node.getAttribute('start'));

			if (tag !== 'BR' && tag !== 'HR' && tag !== 'IMG')
				copy(node, element);

			target.appendChild(element);
		}

		copy(this.Parse(html), output);

		/* Text and inline elements at the top go into paragraphs. */
		Array.prototype.slice.call(output.childNodes).forEach(function (node) {
			var tag = node.nodeType === 1 ? node.tagName : '';

			if (self.Blocks[tag] && tag !== 'LI' && tag !== 'TR' && tag !== 'TH' && tag !== 'TD' && tag !== 'THEAD' && tag !== 'TBODY') {
				paragraph = null;

				return;
			}

			if (node.nodeType === 3 && !node.data.trim() && !paragraph) {
				output.removeChild(node);

				return;
			}

			if (!paragraph) {
				paragraph = document.createElement('p');

				output.insertBefore(paragraph, node);
			}

			paragraph.appendChild(node);
		});

		/* A document of one empty paragraph is no document. */
		if (output.childNodes.length === 1 && output.firstChild.tagName === 'P' && !output.firstChild.textContent.trim() && !output.firstChild.querySelector('img')) return '';

		return output.innerHTML;
	},

	Text: function (html) {
		var lines = [];

		function walk (node) {
			var child = node.firstChild;
			var block;

			while (child) {
				block = child.nodeType === 1 && /^(P|H[1-6]|BLOCKQUOTE|PRE|LI|TR|HR|DIV)$/.test(child.tagName);

				if (child.nodeType === 3) {
					lines[lines.length - 1] += child.data;
				}
				else if (child.nodeType === 1 && child.tagName === 'BR') {
					lines.push('');
				}
				else if (child.nodeType === 1) {
					if (block)
						lines.push('');

					walk(child);

					if (block)
						lines.push('');
				}

				child = child.nextSibling;
			}
		}

		lines.push('');

		walk(this.Parse(this.Sanitize(html)));

		return lines.join('\n').replace(/\n{2,}/g, '\n').trim();
	},

	ToMarkdown: function (html) {
		function escape (text) {
			return text.replace(/([\\`*_[\]<>|~])/g, '\\$1').replace(/^(#{1,6} |[-+] |\d+\. |>)/gm, '\\$1');
		}

		/* The Markdown of one inline node. */
		function piece (child) {
			var text;

			if (child.nodeType === 3)
				return escape(child.data.replace(/\s+/g, ' '));

			if (child.nodeType !== 1) return '';

			text = inline(child);

			switch (child.tagName) {
				case 'STRONG': return text ? '**' + text + '**' : '';
				case 'EM': return text ? '*' + text + '*' : '';
				case 'S': return text ? '~~' + text + '~~' : '';
				case 'U': return text ? '<u>' + text + '</u>' : '';
				case 'CODE': return child.textContent.indexOf('`') === -1 ? '`' + child.textContent + '`' : '`` ' + child.textContent + ' ``';
				case 'A': return '[' + text + '](' + child.getAttribute('href').replace(/[()\s]/g, encodeURIComponent) + (child.getAttribute('title') ? ' "' + child.getAttribute('title').replace(/"/g, '\'') + '"' : '') + ')';
				case 'IMG': return '![' + escape(child.getAttribute('alt') || '') + '](' + child.getAttribute('src').replace(/[()\s]/g, encodeURIComponent) + ')';
				case 'BR': return '\\\n';
				default: return text;
			}
		}

		/* The Markdown of the inline content of a node. */
		function inline (node) {
			return Array.prototype.map.call(node.childNodes, piece).join('');
		}

		/* The Markdown of the blocks of a node, each line after prefix. */
		function blocks (node, prefix) {
			var parts = [];
			var child = node.firstChild;

			while (child) {
				if (child.nodeType === 1) parts.push(block(child, prefix));
				else if (child.nodeType === 3 && child.data.trim()) parts.push(prefix + escape(child.data.trim()));

				child = child.nextSibling;
			}

			return parts.filter(function (part) {
				return part !== null;
			}).join('\n' + prefix.replace(/\s+$/, '') + '\n');
		}

		function lines (text, prefix) {
			return text.split('\n').map(function (line) {
				return prefix + line;
			}).join('\n');
		}

		function list (node, prefix) {
			var number = Number(node.getAttribute('start')) || 1;

			return Array.prototype.filter.call(node.children, function (item) {
				return item.tagName === 'LI';
			}).map(function (item) {
				var marker = node.tagName === 'OL' ? number++ + '. ' : '- ';
				var pad = new Array(marker.length + 1).join(' ');
				var text = [];
				var nested = [];

				Array.prototype.forEach.call(item.childNodes, function (child) {
					if (child.nodeType === 1 && (child.tagName === 'UL' || child.tagName === 'OL')) nested.push(list(child, prefix + pad));
					else if (child.nodeType === 1 && child.tagName === 'P') text.push(inline(child));
					else text.push(piece(child));
				});

				return prefix + marker + text.join('').trim() + (nested.length ? '\n' + nested.join('\n') : '');
			}).join('\n');
		}

		function table (node, prefix) {
			var rows = Array.prototype.slice.call(node.querySelectorAll('tr'));
			var width = 0;
			var cells;

			cells = rows.map(function (row) {
				var list = Array.prototype.map.call(row.children, function (cell) {
					return inline(cell).replace(/\|/g, '\\|').trim();
				});

				width = Math.max(width, list.length);

				return list;
			});

			if (!cells.length) return null;

			cells = cells.map(function (row) {
				while (row.length < width) {
					row.push('');
				}

				return prefix + '| ' + row.join(' | ') + ' |';
			});

			cells.splice(1, 0, prefix + '|' + new Array(width + 1).join(' --- |'));

			return cells.join('\n');
		}

		function block (node, prefix) {
			var text;

			switch (node.tagName) {
				case 'H1':
				case 'H2':
				case 'H3':
				case 'H4':
					return prefix + new Array(Number(node.tagName.charAt(1)) + 1).join('#') + ' ' + inline(node).trim();
				case 'BLOCKQUOTE':
					return blocks(node, prefix + '> ');
				case 'PRE':
					text = node.textContent.replace(/\n$/, '');

					return lines('```\n' + text + '\n```', prefix);
				case 'UL':
				case 'OL':
					return list(node, prefix);
				case 'HR':
					return prefix + '---';
				case 'TABLE':
					return table(node, prefix);
				default:
					text = inline(node).trim();

					return text ? lines(text, prefix) : null;
			}
		}

		return blocks(this.Parse(this.Sanitize(html)), '').replace(/\n{3,}/g, '\n\n').trim() + '\n';
	},

	FromMarkdown: function (text) {
		var self = this;
		var source = String(text == null ? '' : text).replace(/\r\n?/g, '\n').replace(/\t/g, '    ');

		function escape (value) {
			return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		/* The HTML of inline Markdown. */
		function inline (value) {
			var codes = [];
			var html;

			html = value.replace(/(`+)\s?([\s\S]*?[^`])\s?\1(?!`)/g, function (all, ticks, code) {
				codes.push('<code>' + escape(code) + '</code>');

				return '\u0000' + (codes.length - 1) + '\u0000';
			});

			/* The escapes of Markdown, kept out of the rules below. */
			html = html.replace(/\\([\\`*_[\]{}()#+\-.!|~<>])/g, function (all, character) {
				codes.push(escape(character));

				return '\u0000' + (codes.length - 1) + '\u0000';
			});

			html = escape(html).replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u>$1</u>');
			html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^"]*?&quot;)?\)/g, function (all, alt, src) {
				var url = self.SafeURL(src.replace(/&amp;/g, '&'), true);

				return url ? '<img src="' + escape(url) + '" alt="' + alt + '">' : alt;
			});
			html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^"]*?)&quot;)?\)/g, function (all, label, href, title) {
				var url = self.SafeURL(href.replace(/&amp;/g, '&'));

				return url ? '<a href="' + escape(url) + '"' + (title ? ' title="' + title + '"' : '') + '>' + label + '</a>' : label;
			});
			html = html.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1">$1</a>');
			html = html.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>');
			html = html.replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?!\*)/g, '$1<em>$2</em>');
			html = html.replace(/(^|[^_\w])_(?=\S)([^_]*?\S)_(?![_\w])/g, '$1<em>$2</em>');
			html = html.replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<s>$1</s>');
			html = html.replace(/(?: {2,}|\\)\n/g, '<br>');

			return html.replace(/\u0000(\d+)\u0000/g, function (all, index) {
				return codes[Number(index)];
			});
		}

		function cells (line) {
			return line.trim().replace(/\\\|/g, '\u0001').replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (cell) {
				return cell.trim().replace(/\u0001/g, '\\|');
			});
		}

		/* The HTML of the blocks of some lines. */
		function parse (lines) {
			var html = [];
			var i = 0;
			var line;
			var match;
			var buffer;
			var fence;
			var indent;

			while (i < lines.length) {
				line = lines[i];

				if (!line.trim()) {
					i++;

					continue;
				}

				match = /^ {0,3}(`{3,}|~{3,})/.exec(line);

				if (match) {
					fence = match[1];
					buffer = [];
					i++;

					while (i < lines.length && lines[i].trim().indexOf(fence) !== 0) {
						buffer.push(lines[i]);

						i++;
					}

					i++;

					html.push('<pre>' + escape(buffer.join('\n')) + '</pre>');

					continue;
				}

				match = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);

				if (match) {
					html.push('<h' + Math.min(4, match[1].length) + '>' + inline(match[2]) + '</h' + Math.min(4, match[1].length) + '>');

					i++;

					continue;
				}

				if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
					html.push('<hr>');

					i++;

					continue;
				}

				if (/^ {0,3}>/.test(line)) {
					buffer = [];

					while (i < lines.length && lines[i].trim() && /^ {0,3}>/.test(lines[i])) {
						buffer.push(lines[i].replace(/^ {0,3}> ?/, ''));

						i++;
					}

					html.push('<blockquote>' + parse(buffer) + '</blockquote>');

					continue;
				}

				match = /^( *)([-*+]|\d{1,9}[.)])\s+/.exec(line);

				if (match) {
					indent = match[1].length;
					buffer = list(lines, i, indent);
					i = buffer.Next;

					html.push(buffer.HTML);

					continue;
				}

				if (line.indexOf('|') !== -1 && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
					buffer = ['<table><thead><tr>' + cells(line).map(function (cell) {
						return '<th>' + inline(cell) + '</th>';
					}).join('') + '</tr></thead><tbody>'];
					i += 2;

					while (i < lines.length && lines[i].trim() && lines[i].indexOf('|') !== -1) {
						buffer.push('<tr>' + cells(lines[i]).map(function (cell) {
							return '<td>' + inline(cell) + '</td>';
						}).join('') + '</tr>');

						i++;
					}

					html.push(buffer.join('') + '</tbody></table>');

					continue;
				}

				buffer = [];

				while (i < lines.length && lines[i].trim() && !/^ {0,3}(#{1,6}\s|>|`{3,}|~{3,}|([-*+]|\d{1,9}[.)])\s)/.test(lines[i])) {
					buffer.push(lines[i].replace(/^\s+/, ''));

					i++;
				}

				if (!buffer.length) {
					buffer.push(lines[i]);

					i++;
				}

				html.push('<p>' + inline(buffer.join('\n')) + '</p>');
			}

			return html.join('');
		}

		/* A list from line start: its items, with the lines indented under them and the lists inside. */
		function list (lines, start, indent) {
			var first = /^( *)([-*+]|\d{1,9}[.)])\s+/.exec(lines[start]);
			var ordered = /\d/.test(first[2]);
			var items = [];
			var i = start;
			var match;
			var body;

			while (i < lines.length) {
				match = /^( *)([-*+]|\d{1,9}[.)])\s+(.*)$/.exec(lines[i]);

				if (!match || match[1].length !== indent || /\d/.test(match[2]) !== ordered) break;

				body = [match[3]];
				i++;

				while (i < lines.length && (lines[i].trim() === '' ? i + 1 < lines.length && /^\s/.test(lines[i + 1]) && lines[i + 1].search(/\S/) > indent : lines[i].search(/\S/) > indent)) {
					body.push(lines[i].replace(new RegExp('^ {0,' + (indent + 4) + '}'), ''));

					i++;
				}

				items.push('<li>' + (body.length === 1 ? inline(body[0]) : parse(body).replace(/^<p>([\s\S]*?)<\/p>/, '$1')) + '</li>');
			}

			return {Next: i, HTML: (ordered ? (Number(first[2].replace(/\D/g, '')) !== 1 ? '<ol start="' + Number(first[2].replace(/\D/g, '')) + '">' : '<ol>') : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>')};
		}

		return this.Sanitize(parse(source.split('\n')));
	}
});
