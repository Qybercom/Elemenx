/*
 * Printing of a part of the page: the browser prints a frame of its own with a copy of that part and the stylesheets
 * of the page (and of the shadow root the part is in), so the rest of the page stays out. A PDF comes from the print
 * dialog of the browser (Save as PDF). There is no button for it: components and Applications call it.
 * - Element(target, options, callback) prints target: a DOM node (copied, it stays where it is) or a text of HTML.
 *   Options: Title (of the document: the name a PDF gets), Theme ('light' by default; another name of the Theme
 *   Service, or false for the theme of the page), Class (classes of the body of the frame), Style (more CSS),
 *   Margin (of the page, '16mm' by default) and Language (the lang of the document; the page's by default).
 *   callback(error) once the dialog of the browser closes.
 * - Document(target, options) returns the HTML of the document Element prints.
 */
Elemenx.Service('Print', {
	$Meta: {
		Description: 'Printing of a part of the page: the browser prints a frame of its own with a copy of that part and the stylesheets of the page (and of the shadow root the part is in), so the rest of the page stays out.',
		Methods: ['Document(target, options)', 'Element(target, options, callback)']
	},
	Margin: '16mm',

	Document: function (target, options) {
		var root = target && target.getRootNode ? target.getRootNode() : document;
		var page = document.documentElement;
		var language;
		var theme;
		var styles = [];
		var body = typeof target === 'string' ? target : target ? target.outerHTML : '';

		options = options || {};
		language = options.Language || page.getAttribute('lang') || '';
		theme = options.Theme === false ? document.body.getAttribute('data-theme') || '' : options.Theme || 'light';

		function escape (text) {
			return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		/* The stylesheets of a document or of a shadow root: links by their URL, the others by their text. */
		function collect (scope) {
			var nodes = scope.querySelectorAll('link[rel~="stylesheet"], style');
			var i = 0;

			while (i < nodes.length) {
				if (nodes[i].tagName === 'LINK') styles.push('<link rel="stylesheet" href="' + escape(nodes[i].href) + '" />');
				else styles.push('<style>' + nodes[i].textContent + '</style>');

				i++;
			}

			(scope.adoptedStyleSheets || []).forEach(function (sheet) {
				try {
					styles.push('<style>' + Array.prototype.map.call(sheet.cssRules, function (rule) {
						return rule.cssText;
					}).join('\n') + '</style>');
				}
				catch (error) {
					/* A sheet of another origin keeps its rules. */
				}
			});
		}

		collect(document);

		if (root && root !== document && root.nodeType === 11)
			collect(root);

		styles.push('<style>@page { margin: ' + (options.Margin || this.Margin) + '; } html, body { background: #ffffff; height: auto; overflow: visible; } body { margin: 0; }' + (options.Style || '') + '</style>');

		return '<!DOCTYPE html>\n<html' + (language ? ' lang="' + escape(language) + '"' : '') + ' dir="' + escape(page.getAttribute('dir') || 'ltr') + '">\n<head>\n<meta charset="utf-8" />\n<title>' + escape(options.Title || document.title || '') + '</title>\n<base href="' + escape(document.baseURI) + '" />\n' + styles.join('\n') + '\n</head>\n<body class="elemenx-print' + (options.Class ? ' ' + escape(options.Class) : '') + '"' + (theme ? ' data-theme="' + escape(theme) + '"' : '') + (theme === 'light' ? ' data-scheme="light"' : '') + '>\n' + body + '\n</body>\n</html>\n';
	},

	Element: function (target, options, callback) {
		var frame = document.createElement('iframe');
		var finished = false;
		var timer = null;

		callback = callback || function () {};

		function finish (error) {
			if (finished) return;

			finished = true;

			window.clearTimeout(timer);

			if (frame.parentNode)
				frame.parentNode.removeChild(frame);

			callback(error || null);
		}

		frame.setAttribute('aria-hidden', 'true');
		frame.setAttribute('tabindex', '-1');
		frame.setAttribute('title', (options && options.Title) || 'Print');

		frame.style.cssText = 'position: fixed; inset-inline-end: 0; bottom: 0; width: 0; height: 0; border: 0; opacity: 0; pointer-events: none;';

		frame.onload = function () {
			var view = frame.contentWindow;

			try {
				view.addEventListener('afterprint', function () {
					/* Some browsers report it before print returns: the frame goes once the call is over. */
					window.setTimeout(finish, 0);
				});

				view.focus();
				view.print();

				/* print holds the page while its dialog is open; a browser that does not report the end (headless) is done once it returns. */
				timer = window.setTimeout(finish, 1000);
			}
			catch (error) {
				finish(error);
			}
		};

		frame.srcdoc = this.Document(target, options);

		document.body.appendChild(frame);
	}
});
