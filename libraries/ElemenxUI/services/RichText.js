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
 * - Plugins: what the schema has no element for, drawn by a Component or a function of its own. Extend(plugin) adds
 *   one (see Extend below); in Markdown it is a fence of its language (```mermaid), a block of a directive
 *   (::: warning title="Careful" ... :::) or an inline (:name[text]{key=value}), in the HTML a node of its data
 *   (data-elemenx-plugin, data-elemenx-data) that Sanitize keeps and ToMarkdown writes back as it was. Mount(container,
 *   options) draws the plugins of a document (Markdown and RichEditor do), {Destroy()} takes them away. Built in:
 *   diagram (```mermaid or ```diagram, the Diagram Component), chart (```chart, a JSON of the props of Chart), qrcode
 *   (```qr), barcode (```barcode format=ean13) and callout (::: info, note, tip, success, warning, danger; title=...).
 *   Plugins() lists their names.
 * The HTML is read in an inert template: nothing of it runs or loads while it is read.
 */
Elemenx.Service('RichText', {
	$Meta: {
		Description: 'The document of rich text: the HTML RichEditor keeps and the Markdown it reads and writes.',
		Methods: ['Sanitize(html)', 'Text(html)', 'ToMarkdown(html)', 'FromMarkdown(text)', 'Extend(plugin)', 'Plugins()', 'Mount(container, options)']
	},
	Blocks: {P: 1, H1: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, PRE: 1, UL: 1, OL: 1, LI: 1, HR: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1},
	Inline: {STRONG: 1, EM: 1, U: 1, S: 1, CODE: 1, A: 1, BR: 1, IMG: 1},
	Aliases: {B: 'STRONG', I: 'EM', STRIKE: 'S', DEL: 'S', INS: 'U', H5: 'H4', H6: 'H4', TT: 'CODE', KBD: 'CODE'},
	Dropped: {SCRIPT: 1, STYLE: 1, IFRAME: 1, FRAME: 1, OBJECT: 1, EMBED: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, MATH: 1, HEAD: 1, TITLE: 1, META: 1, LINK: 1, INPUT: 1, BUTTON: 1, SELECT: 1, TEXTAREA: 1, OPTION: 1, CANVAS: 1, VIDEO: 1, AUDIO: 1},

	/* The built-in plugins: diagrams, charts, QR codes, barcodes and the callouts of Markdown. */
	$OnCreate: function () {
		var self = this;

		this.Registry = {};

		this.Extend({Name: 'diagram', Label: 'Diagram', Fences: ['mermaid', 'diagram'], Component: 'Diagram', Insert: {Text: 'flowchart LR\n  A[Start] --> B{Ready?}\n  B -->|yes| C[Go]\n  B -->|no| A', Language: 'mermaid'}});
		this.Extend({Name: 'chart', Label: 'Chart', Fences: ['chart'], Component: 'Chart', Props: function (data) {
			var props = self.PluginProps(data, {});

			try {
				return Object.assign(JSON.parse(data.Text || '{}'), props);
			}
			catch (error) {
				throw new Error('Elemenx RichText: a chart is a JSON of the props of Chart: ' + error.message);
			}
		}, Insert: {Text: '{"Type": "bar", "Labels": ["A", "B", "C"], "Series": [{"Name": "Sales", "Values": [3, 5, 2]}]}', Language: 'chart'}});
		this.Extend({Name: 'qrcode', Label: 'QR code', Fences: ['qr', 'qrcode'], Component: 'QRCode', Props: function (data) {
			return self.PluginProps(data, {Value: String(data.Text || '').trim()});
		}, Insert: {Text: 'https://example.com', Language: 'qr'}});
		this.Extend({Name: 'barcode', Label: 'Barcode', Fences: ['barcode'], Component: 'Barcode', Props: function (data) {
			return self.PluginProps(data, {Value: String(data.Text || '').trim()});
		}, Insert: {Text: '400638133393', Language: 'barcode', Attributes: {format: 'ean13'}}});
		this.Extend({Name: 'callout', Label: 'Callout', Directives: ['info', 'note', 'tip', 'success', 'warning', 'danger', 'callout'], Render: function (node, data) {
			var tone = {note: 'info', tip: 'success', callout: 'neutral'}[data.Language] || data.Language;
			var title = data.Attributes && data.Attributes.title;

			node.classList.add('elemenx-callout', tone);

			node.innerHTML = (title ? '<p class="elemenx-callout-title">' + self.Escape(title) + '</p>' : '') + self.FromMarkdown(data.Text || '');
		}, Insert: {Text: 'A note for the reader.', Language: 'info'}});
	},

	Escape: function (value) {
		return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	},

	/*
	 * A plugin: {Name, Label, Fences (the languages of the fences it takes: ```mermaid), Directives (the names of the
	 * blocks ::: name ... :::), Inline (the names of :name[text]{attributes}), Component (the name of the Component
	 * that draws it, its props by Props(data), or {Value: Text} and the Attributes with their first letter in capital),
	 * or Render(node, data) (draws into its node; may return a function that takes it away), Edit(node, data, done) (an
	 * editor of its own in a RichEditor, done(data) after), Insert (the data a RichEditor puts in)}. Its data is
	 * {Name, Kind (fence, directive or inline), Language (the name it was written by), Attributes, Text}.
	 */
	Extend: function (plugin) {
		if (!plugin || !/^[a-z][\w-]*$/i.test(String(plugin.Name || '')) || (!plugin.Component && typeof plugin.Render !== 'function'))
			throw new Error('Elemenx RichText.Extend expects {Name, Component or Render(node, data)}');

		this.Registry[String(plugin.Name).toLowerCase()] = plugin;

		return plugin;
	},

	Plugins: function () {
		return Object.keys(this.Registry);
	},

	/* The plugin of a name of a fence, a directive or an inline (kind), or null. */
	PluginFor: function (kind, name) {
		var registry = this.Registry || {};
		var key = String(name || '').toLowerCase();
		var field = {fence: 'Fences', directive: 'Directives', inline: 'Inline'}[kind];
		var found = null;

		Object.keys(registry).forEach(function (each) {
			if (!found && (registry[each][field] || []).map(function (value) {
				return String(value).toLowerCase();
			}).indexOf(key) !== -1)
				found = registry[each];
		});

		return found;
	},

	/* The attributes of a line: key=value key="a value" → {key: value}. */
	Attributes: function (text) {
		var attributes = {};

		String(text || '').replace(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g, function (all, key, double, single, bare) {
			attributes[key] = double !== undefined ? double : single !== undefined ? single : bare;

			return all;
		});

		return attributes;
	},

	AttributeText: function (attributes) {
		return Object.keys(attributes || {}).map(function (key) {
			var value = String(attributes[key]);

			return key + '=' + (/[\s"'}]/.test(value) || !value ? '"' + value.replace(/"/g, '\'') + '"' : value);
		}).join(' ');
	},

	/* The props of a Component of a plugin: its attributes with their first letter in capital, over the ones given. */
	PluginProps: function (data, given) {
		var props = Object.assign({}, given);

		Object.keys(data.Attributes || {}).forEach(function (key) {
			var value = data.Attributes[key];

			props[key.charAt(0).toUpperCase() + key.substring(1)] = value === 'true' ? true : value === 'false' ? false : /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
		});

		return props;
	},

	/* The node of a plugin in a document: a block (div) or an inline (span) of its data. */
	PluginHTML: function (data) {
		var tag = data.Kind === 'inline' ? 'span' : 'div';

		return '<' + tag + ' data-elemenx-plugin="' + this.Escape(data.Name) + '" data-elemenx-data="' + this.Escape(JSON.stringify(data)) + '"></' + tag + '>';
	},

	/* The data of the node of a plugin, or null. */
	PluginData: function (node) {
		try {
			return JSON.parse(node.getAttribute('data-elemenx-data') || 'null');
		}
		catch (error) {
			return null;
		}
	},

	/* The Markdown of the data of a plugin, as it was written. */
	PluginMarkdown: function (data) {
		var attributes = this.AttributeText(data.Attributes);

		if (data.Kind === 'inline')
			return ':' + data.Language + '[' + String(data.Text || '').replace(/[\]\\]/g, '\\$&') + ']' + (attributes ? '{' + attributes + '}' : '');

		if (data.Kind === 'directive')
			return '::: ' + data.Language + (attributes ? ' ' + attributes : '') + '\n' + String(data.Text || '') + '\n:::';

		return '```' + data.Language + (attributes ? ' ' + attributes : '') + '\n' + String(data.Text || '') + '\n```';
	},

	/*
	 * Draws the plugins of a container (the document of a Markdown or a RichEditor): each node of a plugin gets its
	 * Component, or its Render; a plugin not known, or one that fails, shows its text. Editable makes each node one block
	 * the caret does not enter; Application is the one the Components belong to (a Component of the Library not loaded
	 * yet loads through it). Returns {Destroy()}: the Components and the drawings go.
	 */
	Mount: function (container, options) {
		var self = this;
		var settings = options || {};
		var made = [];
		var nodes = container.matches && container.matches('[data-elemenx-plugin]') ? [container] : Array.prototype.slice.call(container.querySelectorAll('[data-elemenx-plugin]'));

		nodes.forEach(function (node) {
			var data = self.PluginData(node);
			var plugin = data && self.Registry[String(data.Name || '').toLowerCase()];
			var entry = {Node: node, Instance: null, Cleanup: null};

			/* A node drawn already (a RichEditor that puts a plugin in draws the new ones only). */
			if (node.__ElemenxPlugin) return;

			node.__ElemenxPlugin = entry;

			if (settings.Editable)
				node.setAttribute('contenteditable', 'false');

			node.classList.add('elemenx-rich-plugin');

			made.push(entry);

			if (!plugin) {
				node.textContent = data ? String(data.Text || '') : '';

				return;
			}

			try {
				if (plugin.Render) {
					entry.Cleanup = plugin.Render(node, data);

					return;
				}

				entry.Instance = Elemenx.Component(plugin.Component)(plugin.Props ? plugin.Props(data) : self.PluginProps(data, {Value: data.Text}), null, settings.Application ? {Application: settings.Application} : undefined);

				node.appendChild(entry.Instance.$Element());
			}
			catch (error) {
				node.classList.add('error');

				node.textContent = error.message;
			}
		});

		return {
			Destroy: function () {
				made.forEach(function (entry) {
					if (entry.Instance)
						entry.Instance.$Destroy();

					if (typeof entry.Cleanup === 'function')
						entry.Cleanup();

					entry.Node.__ElemenxPlugin = null;
				});

				made = [];
			}
		};
	},

	/* The nodes of a text of HTML, read in an inert template. */
	Parse: function (html) {
		var template = document.createElement('template');

		template.innerHTML = String(html == null ? '' : html);

		return template.content;
	},

	SafeURL: function (url, image) {
		/* A browser reading a URL drops its tabs and line breaks and the controls around it: java&#10;script: is javascript:. */
		var value = String(url || '').replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
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
			var data;

			if (node.nodeType === 3) {
				target.appendChild(document.createTextNode(node.data));

				return;
			}

			if (node.nodeType !== 1) return;

			/* The node of a known plugin: its data alone (what it drew goes), as a block or an inline. */
			if (node.hasAttribute('data-elemenx-plugin')) {
				data = self.PluginData(node);

				if (data && self.Registry && self.Registry[String(data.Name || '').toLowerCase()])
					target.appendChild(self.Parse(self.PluginHTML(data)).firstChild);

				return;
			}

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

			/* The block of a plugin is a block of its own. */
			if ((self.Blocks[tag] && tag !== 'LI' && tag !== 'TR' && tag !== 'TH' && tag !== 'TD' && tag !== 'THEAD' && tag !== 'TBODY') || (tag === 'DIV' && node.hasAttribute('data-elemenx-plugin'))) {
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
		var self = this;

		function escape (text) {
			return text.replace(/([\\`*_[\]<>|~])/g, '\\$1').replace(/^(#{1,6} |[-+] |\d+\. |>)/gm, '\\$1');
		}

		/* The Markdown of one inline node. */
		function piece (child) {
			var text;

			if (child.nodeType === 3)
				return escape(child.data.replace(/\s+/g, ' '));

			if (child.nodeType !== 1) return '';

			if (child.hasAttribute('data-elemenx-plugin'))
				return self.PluginData(child) ? self.PluginMarkdown(self.PluginData(child)) : '';

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

			/* A plugin: the fence, the directive or the inline it was written as. */
			if (node.hasAttribute('data-elemenx-plugin'))
				return self.PluginData(node) ? lines(self.PluginMarkdown(self.PluginData(node)), prefix) : null;

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

			/* An inline of a plugin, :name[text]{attributes}: its node, kept out of the rules below. */
			html = html.replace(/:([A-Za-z][\w-]*)\[((?:\\.|[^\]\\])*)\](?:\{([^}]*)\})?/g, function (all, name, text, attributes) {
				var plugin = self.PluginFor('inline', name);
				if (!plugin) return all;

				codes.push(self.PluginHTML({Name: plugin.Name, Kind: 'inline', Language: name, Attributes: self.Attributes(attributes), Text: text.replace(/\\(.)/g, '$1')}));

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
			var plugin;

			while (i < lines.length) {
				line = lines[i];

				if (!line.trim()) {
					i++;

					continue;
				}

				match = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)(.*)$/.exec(line);

				if (match) {
					fence = match[1];
					buffer = [];
					i++;

					while (i < lines.length && lines[i].trim().indexOf(fence) !== 0) {
						buffer.push(lines[i]);

						i++;
					}

					i++;

					/* A fence a plugin takes (```mermaid): the node of the plugin, its text its data. */
					plugin = match[2] ? self.PluginFor('fence', match[2]) : null;

					if (plugin) html.push(self.PluginHTML({Name: plugin.Name, Kind: 'fence', Language: match[2], Attributes: self.Attributes(match[3]), Text: buffer.join('\n')}));
					else html.push('<pre>' + escape(buffer.join('\n')) + '</pre>');

					continue;
				}

				/* A block of a directive, ::: name attributes ... ::: (they nest): its plugin, or its blocks without it. */
				match = /^ {0,3}:{3,}\s*([A-Za-z][\w-]*)(.*)$/.exec(line);

				if (match) {
					var depth = 1;

					buffer = [];
					i++;

					while (i < lines.length) {
						if (/^ {0,3}:{3,}\s*[A-Za-z]/.test(lines[i])) depth++;
						else if (/^ {0,3}:{3,}\s*$/.test(lines[i]) && !--depth) break;

						buffer.push(lines[i]);

						i++;
					}

					i++;

					plugin = self.PluginFor('directive', match[1]);

					if (plugin) html.push(self.PluginHTML({Name: plugin.Name, Kind: 'directive', Language: match[1], Attributes: self.Attributes(match[2]), Text: buffer.join('\n')}));
					else html.push(parse(buffer));

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
