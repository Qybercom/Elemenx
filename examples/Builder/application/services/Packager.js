/*
 * The page of the builder as an Application of its own, to download:
 * - Html(template, options, callback): one HTML file that runs alone, opened from the disk or put on any server: the
 *   framework and ElemenxUI (their bundles, from Bundles: bundles/elemenx.min.js and bundles/elemenx-ui.min.js, made by
 *   npm run dist) and the page as the root Component of the Application, all inline. callback(error, text).
 * - Project(template, options): a project of Elemenx in a zip: index.html, app.js, elemenx.config.js and the page as
 *   the Component Page (Page.html, Page.js) under application/, ready for elemenx dev and elemenx build. It returns the
 *   bytes of the zip (a Uint8Array).
 * - Save(name, data, type): gives a file to the browser to save.
 * options: {Title, Language, Theme, Description, Icon, Splash, PWA}. Splash ({Image, Background, Color, Text, Spinner,
 * MinTime, HTML}, null for none) is the splash of the page: in the HTML file its markup at the top of the body, as
 * elemenx build writes it (tools/splash.js), in a project the Splash of elemenx.config.js and its splash.html. PWA
 * ({ShortName, Icon, Theme, Display, Offline}, null for none) is the PWA of elemenx.config.js of a project: elemenx build
 * makes it installable (a page in one file runs from a file, which a system does not install).
 *
 * In place of the template both take an application ({Name, Title, Description, Icon, Language, Theme, Router,
 * Component, NotFound, Routes, Guards, Pages, Components}, from the project of the Designer): its pages ([{ID, Name,
 * Title, Template}]) become Components (Home: HomePage) on its routes ([{Path, Page, Guards, Failed}], a page by its
 * ID), its guards ([{Name, Code}]) guards of the Router (Code the body of their function), its components ([{ID, Name,
 * Description, Props, Slots, Template}]) Components of their names whose $Meta declares their props and slots. The
 * Component (an ID) holds the pages, Layout (a column the page fills) without one; NotFound is the page of a path no
 * route has (the first page without one). Without pages the first component is the page.
 */
Elemenx.Service('Packager', {
	Bundles: ['bundles/elemenx.min.js', 'bundles/elemenx-ui.min.js'],

	/* The text of a file of the server of the builder. */
	Fetch: function (url, callback) {
		var request = new XMLHttpRequest();

		request.open('GET', url, true);

		request.onload = function () {
			if (request.status >= 200 && request.status < 300 && !/^\s*<!DOCTYPE/i.test(request.responseText)) callback(null, request.responseText);
			else callback(new Error('The bundle is not there: ' + url + ' (npm run dist makes it)'));
		};

		request.onerror = function () {
			callback(new Error('The bundle did not load: ' + url));
		};

		request.send();
	},

	/* A text in an inline <script>: its closing tags and comments of HTML cannot end it. */
	Script: function (text) {
		return String(text).replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
	},

	/* The page of the Application: the template of the builder as the Component Page, mounted on the body. */
	Main: function (template) {
		if (typeof template !== 'string')
			return this.Definitions(template, false).map(function (entry) {
				return entry.Code;
			}).join('\n\n');

		return 'Elemenx.Component(\'Page\', {$Template: ' + JSON.stringify(template) + '});\n\nElemenx.Application(\'App\', {\n\t$Component: \'Page\',\n\t$Mount: \'body\',\n\t$Use: [\'ElemenxUI\']\n});';
	},

	/* The body is the page, as on the canvas: as high as the window, a column (the root of Page too) a screen with Sizing fill fills. */
	Head: function (options) {
		return '\t<meta charset="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n' + (options.Description ? '\t<meta name="description" content="' + String(options.Description).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" />\n' : '') + (options.Icon ? '\t<link rel="icon" href="' + String(options.Icon).replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '" />\n' : '') + '\n\t<title>' + String(options.Title || 'Page').replace(/</g, '&lt;') + '</title>\n\n\t<style>\n\t\thtml,\n\t\tbody {\n\t\t\theight: 100%;\n\t\t\tmargin: 0;\n\t\t}\n\n\t\tbody {\n\t\t\tdisplay: flex;\n\t\t\tflex-direction: column;\n\t\t}\n\n\t\tbody > div {\n\t\t\tdisplay: flex;\n\t\t\tflex: 1 0 auto;\n\t\t\tflex-direction: column;\n\t\t}\n\t</style>\n';
	},

	/* The markup of a splash, as tools/splash.js makes it for a build: its style, then the element with its content. */
	SplashMarkup: function (splash) {
		var escape = function (value) {
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		};
		var background = /^[#A-Za-z0-9(),.%\s-]+$/.test(splash.Background || '') ? splash.Background : '';
		var color = /^[#A-Za-z0-9(),.%\s-]+$/.test(splash.Color || '') ? splash.Color : '';
		var content = splash.HTML ? String(splash.HTML).trim() : [
			splash.Image ? '<img class="elemenx-splash-image" src="' + escape(splash.Image) + '" alt="">' : '',
			splash.Text ? '<p class="elemenx-splash-text">' + escape(splash.Text) + '</p>' : '',
			splash.Spinner !== false ? '<span class="elemenx-splash-spinner" aria-hidden="true"></span>' : ''
		].join('');
		var style = [
			'#elemenx-splash{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;margin:0;',
			'background:' + (background || '#ffffff') + ';color:' + (color || '#1f2328') + ';font:16px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity .25s ease}',
			background || color ? '' : '@media (prefers-color-scheme:dark){#elemenx-splash{background:#1e1f22;color:#dfe1e5}}',
			'#elemenx-splash.elemenx-splash-out{opacity:0;pointer-events:none}',
			'.elemenx-splash-image{max-width:40vw;max-height:30vh}',
			'.elemenx-splash-text{margin:0}',
			'.elemenx-splash-spinner{width:28px;height:28px;box-sizing:border-box;border:3px solid currentColor;border-right-color:transparent;border-radius:50%;opacity:.6;animation:elemenx-splash .8s linear infinite}',
			'@keyframes elemenx-splash{to{transform:rotate(360deg)}}',
			'@media (prefers-reduced-motion:reduce){.elemenx-splash-spinner{animation-duration:2.4s}}'
		].join('');

		return '<style id="elemenx-splash-style">' + style + '</style>\n<div id="elemenx-splash" role="status" aria-busy="true" data-min="' + Math.round(Number(splash.MinTime) || 0) + '" data-timeout="10000">' + content + '</div>\n';
	},

	/* The PWA of elemenx.config.js of a project: its settings, true with none of them. */
	PWAConfig: function (pwa) {
		var self = this;
		var parts = [];

		['ShortName', 'Icon', 'Theme'].forEach(function (name) {
			if (pwa[name])
				parts.push(name + ': ' + self.Quote(pwa[name]));
		});

		if (pwa.Display && pwa.Display !== 'standalone')
			parts.push('Display: ' + self.Quote(pwa.Display));

		if (pwa.Offline === false)
			parts.push('Offline: false');

		return parts.length ? '{' + parts.join(', ') + '}' : 'true';
	},

	/* The Splash of elemenx.config.js of a project: its settings, but its HTML (splash.html). */
	SplashConfig: function (splash) {
		var self = this;
		var parts = [];

		['Image', 'Background', 'Color', 'Text'].forEach(function (name) {
			if (splash[name])
				parts.push(name + ': ' + self.Quote(splash[name]));
		});

		if (splash.Spinner === false)
			parts.push('Spinner: false');

		if (Number(splash.MinTime))
			parts.push('MinTime: ' + Math.round(Number(splash.MinTime)));

		return parts.length ? '{' + parts.join(', ') + '}' : 'true';
	},

	/* A text as a string of JavaScript in single quotes. */
	Quote: function (text) {
		return '\'' + String(text).replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '\'';
	},

	/* The names of the Components of the pages: their letters and digits with Page after them; Page2Page for a name of none. */
	PageNames: function (pages) {
		var names = [];

		pages.forEach(function (page, index) {
			var base = String(page.Name).replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ').filter(Boolean).map(function (word) {
				return word.charAt(0).toUpperCase() + word.substring(1);
			}).join('');
			var name = (/^[A-Z]/.test(base) ? base : 'Page' + (index + 1) + base) + 'Page';

			while (names.indexOf(name) !== -1) {
				name = name.replace(/Page$/, '') + (index + 1) + 'Page';
			}

			names.push(name);
		});

		return names;
	},

	/*
	 * The definitions of an application: [{Name, Template, Code}], its components, its pages, its Layout (the place of the
	 * route) and the Application last (Name null); files true writes their templates into files of their own
	 * ($TemplateURL), false inline.
	 */
	Definitions: function (app, files) {
		var self = this;
		var layout = '<div class="elemenx-column fill" *outlet="Content"></div>';
		var result = [];
		var router = [];
		var nameOf = {};
		var frame = '';
		var names;
		var pages;
		var routes;

		function template (name, text) {
			return files ? '$TemplateURL: ' + self.Quote(name + '.html') : '$Template: ' + self.Quote(text);
		}

		app.Components.forEach(function (component) {
			var lines = [template(component.Name, component.Template)];

			if (app.Component && component.ID === app.Component)
				frame = component.Name;

			var meta = ['Group: \'project\''];

			if (component.Description)
				meta.push('Description: ' + self.Quote(component.Description));

			if (component.Props.length)
				meta.push('Props: {\n' + component.Props.map(function (prop) {
					return '\t\t\t' + prop.Name + ': {Type: ' + self.Quote(prop.Type) + (prop.Type === 'select' ? ', Options: [' + prop.Options.map(self.Quote).join(', ') + ']' : '') + ', Description: ' + self.Quote(prop.Description || '') + '}';
				}).join(',\n') + '\n\t\t}');

			if (component.Slots.filter(Boolean).length)
				meta.push('Slots: [' + component.Slots.filter(Boolean).map(self.Quote).join(', ') + ']');

			lines.push('$Meta: {\n\t\t' + meta.join(',\n\t\t') + '\n\t}');

			component.Props.forEach(function (prop) {
				var value = String(prop.Default);

				if (prop.Type === 'json') value = String(prop.Default || 'null');
				else if (prop.Type === 'text' || prop.Type === 'select') value = self.Quote(prop.Default);

				lines.push(prop.Name + ': ' + value);
			});

			result.push({Name: component.Name, Template: component.Template, Code: 'Elemenx.Component(' + self.Quote(component.Name) + ', {\n\t' + lines.join(',\n\t') + '\n});'});
		});

		/* Without pages, the first component is the page, at /. */
		pages = app.Pages.length ? app.Pages : [{ID: 'home', Name: 'Home', Title: '', Template: '<' + app.Components[0].Name + ' />'}];
		routes = app.Pages.length ? app.Routes || [] : [{Path: '/', Page: 'home', Guards: [], Failed: ''}];
		names = this.PageNames(pages);

		pages.forEach(function (page, index) {
			nameOf[page.ID] = names[index];

			result.push({Name: names[index], Template: page.Template, Code: 'Elemenx.Component(' + self.Quote(names[index]) + ', {\n\t' + template(names[index], page.Template) + (page.Title ? ',\n\t$Title: ' + self.Quote(page.Title) : '') + '\n});'});
		});

		(app.Components || []).forEach(function (component) {
			nameOf[component.ID] = component.Name;
		});

		/* A route: its path, the Component of its page, its guards (Guard for one) and the page of a refusal. */
		routes.forEach(function (route) {
			var parts = ['Path: ' + self.Quote(route.Path), 'Component: ' + self.Quote(nameOf[route.Page])];

			if (!nameOf[route.Page]) return;

			if (route.Guards && route.Guards.length === 1) parts.push('Guard: ' + self.Quote(route.Guards[0]));
			else if (route.Guards && route.Guards.length) parts.push('Guards: [' + route.Guards.map(self.Quote).join(', ') + ']');

			if (route.Failed && nameOf[route.Failed])
				parts.push('GuardFailed: ' + self.Quote(nameOf[route.Failed]));

			router.push('\t\t\t{' + parts.join(', ') + '}');
		});

		/* The guards: the body of each in a function of the Router. */
		(app.Guards || []).forEach(function (guard) {
			result.push({Name: guard.Name, Kind: 'guard', Template: '', Code: 'Elemenx.Guard(' + self.Quote(guard.Name) + ', function () {\n' + String(guard.Code || 'return true;').split('\n').map(function (line) {
				return line ? '\t' + line : '';
			}).join('\n') + '\n});'});
		});

		if (!frame)
			result.push({Name: 'Layout', Template: layout, Code: 'Elemenx.Component(\'Layout\', {\n\t' + template('Layout', layout) + '\n});'});

		result.push({Name: null, Template: '', Code: 'Elemenx.Application(' + self.Quote(app.Name || 'App') + ', {\n\t$Title: ' + self.Quote(app.Title || app.Name || 'App') + ',\n\t$Component: ' + self.Quote(frame || 'Layout') + ',\n' + (files ? '\t$Root: \'application\',\n' : '') + '\t$Mount: \'body\',\n\t$Use: [\'ElemenxUI\'],\n\t$Router: {\n' + (app.Router && app.Router !== 'history' ? '\t\tMode: ' + self.Quote(app.Router) + ',\n' : '') + '\t\tNotFound: ' + self.Quote(nameOf[app.NotFound] || names[0]) + ',\n\t\tRoutes: [\n' + router.join(',\n') + '\n\t\t]\n\t}\n});'});

		return result;
	},

	/* The attributes of <html>: the language, and the scheme of the theme when the application sets one. */
	Root: function (options) {
		return 'lang="' + (options.Language || 'en') + '"' + (options.Theme === 'light' || options.Theme === 'dark' ? ' data-scheme="' + options.Theme + '"' : '');
	},

	Html: function (template, options, callback) {
		var self = this;
		var texts = [];
		var remaining = this.Bundles.length;
		var failed = null;

		this.Bundles.forEach(function (url, index) {
			self.Fetch(url, function (error, text) {
				failed = failed || error;
				texts[index] = text;
				remaining--;

				if (remaining) return;

				if (failed) {
					callback(failed);

					return;
				}

				callback(null, '<!DOCTYPE html>\n<html ' + self.Root(options) + '>\n<head>\n' + self.Head(options) + '\n' + texts.map(function (bundle) {
					return '\t<script>' + self.Script(bundle) + '</script>\n';
				}).join('') + '\t<script>\n' + self.Script(self.Main(template)).replace(/^/gm, '\t\t').replace(/^\t\t$/gm, '') + '\n\t</script>\n</head>\n<body>\n' + (options.Splash ? self.SplashMarkup(options.Splash) : '') + '</body>\n</html>\n');
			});
		});
	},

	Project: function (template, options) {
		var index = '<!DOCTYPE html>\n<html ' + this.Root(options) + '>\n<head>\n' + this.Head(options) + '\n\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>\n</head>\n<body>\n</body>\n</html>\n';
		var config = 'module.exports = {\n\tApplication: \'application\',\n\tEntry: \'app.js\',\n\tIndex: \'index.html\',\n\tOutput: \'dist\'' + (options.Splash ? ',\n\tSplash: ' + this.SplashConfig(options.Splash) : '') + (options.PWA ? ',\n\tPWA: ' + this.PWAConfig(options.PWA) : '') + '\n};\n';
		var list = [];
		var guards = [];
		var app = [];
		var files;

		/* An application: a folder of its own for each of its Components, the Application in app.js. */
		if (typeof template !== 'string') {
			files = {'index.html': index, 'elemenx.config.js': config, 'application/index.js': '[\n\t\'components\'' + ((template.Guards || []).length ? ',\n\t\'guards\'' : '') + '\n];\n'};

			if (options.Splash && String(options.Splash.HTML || '').trim())
				files['splash.html'] = String(options.Splash.HTML).trim() + '\n';

			this.Definitions(template, true).forEach(function (entry) {
				if (!entry.Name) {
					app.push(entry.Code);

					return;
				}

				if (entry.Kind === 'guard') {
					guards.push('\t\'' + entry.Name + '.js\'');

					files['application/guards/' + entry.Name + '.js'] = entry.Code + '\n';

					return;
				}

				list.push('\t\'' + entry.Name + '/' + entry.Name + '.js\'');

				files['application/components/' + entry.Name + '/' + entry.Name + '.js'] = entry.Code + '\n';
				files['application/components/' + entry.Name + '/' + entry.Name + '.html'] = entry.Template + '\n';
			});

			files['application/components/index.js'] = '[\n' + list.join(',\n') + '\n];\n';

			if (guards.length)
				files['application/guards/index.js'] = '[\n' + guards.join(',\n') + '\n];\n';

			files['app.js'] = app.join('\n') + '\n';

			return this.Zip(files);
		}

		files = {
			'index.html': index,
			'app.js': 'Elemenx.Application(\'App\', {\n\t$Component: \'Page\',\n\t$Root: \'application\',\n\t$Mount: \'body\',\n\t$Use: [\'ElemenxUI\']\n});\n',
			'elemenx.config.js': config,
			'application/index.js': '[\n\t\'components\'\n];\n',
			'application/components/index.js': '[\n\t\'Page/Page.js\'\n];\n',
			'application/components/Page/Page.js': '/* The page made in the builder of Elemenx. */\nElemenx.Component(\'Page\', {\n\t$TemplateURL: \'Page.html\'\n});\n',
			'application/components/Page/Page.html': template + '\n'
		};

		return this.Zip(files);
	},

	/* The CRC-32 of bytes, as a zip keeps it. */
	Crc: function (bytes) {
		var table = this.Table || (this.Table = (function () {
			var result = [];
			var n = 0;
			var c;
			var k;

			while (n < 256) {
				c = n;
				k = 0;

				while (k < 8) {
					c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;

					k++;
				}

				result[n] = c >>> 0;

				n++;
			}

			return result;
		})());
		var crc = 0xffffffff;
		var i = 0;

		while (i < bytes.length) {
			crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);

			i++;
		}

		return (crc ^ 0xffffffff) >>> 0;
	},

	/* A zip of texts by their paths, stored as they are (no compression): the bytes of the archive. */
	Zip: function (files) {
		var self = this;
		var encoder = new TextEncoder();
		var parts = [];
		var central = [];
		var offset = 0;
		var size = 0;
		var result;
		var end;
		var at = 0;

		function header (length) {
			var bytes = new Uint8Array(length);

			return {Bytes: bytes, View: new DataView(bytes.buffer)};
		}

		Object.keys(files).forEach(function (name) {
			var path = encoder.encode(name);
			var data = encoder.encode(files[name]);
			var crc = self.Crc(data);
			var local = header(30 + path.length);
			var entry = header(46 + path.length);

			local.View.setUint32(0, 0x04034b50, true);
			local.View.setUint16(4, 20, true);
			local.View.setUint16(6, 0x0800, true);
			local.View.setUint32(14, crc, true);
			local.View.setUint32(18, data.length, true);
			local.View.setUint32(22, data.length, true);
			local.View.setUint16(26, path.length, true);
			local.Bytes.set(path, 30);

			entry.View.setUint32(0, 0x02014b50, true);
			entry.View.setUint16(4, 20, true);
			entry.View.setUint16(6, 20, true);
			entry.View.setUint16(8, 0x0800, true);
			entry.View.setUint32(16, crc, true);
			entry.View.setUint32(20, data.length, true);
			entry.View.setUint32(24, data.length, true);
			entry.View.setUint16(28, path.length, true);
			entry.View.setUint32(42, offset, true);
			entry.Bytes.set(path, 46);

			parts.push(local.Bytes, data);
			central.push(entry.Bytes);

			offset += local.Bytes.length + data.length;
		});

		central.forEach(function (entry) {
			size += entry.length;
		});

		end = header(22);

		end.View.setUint32(0, 0x06054b50, true);
		end.View.setUint16(8, central.length, true);
		end.View.setUint16(10, central.length, true);
		end.View.setUint32(12, size, true);
		end.View.setUint32(16, offset, true);

		parts = parts.concat(central, [end.Bytes]);
		result = new Uint8Array(offset + size + 22);

		parts.forEach(function (part) {
			result.set(part, at);

			at += part.length;
		});

		return result;
	},

	Save: function (name, data, type) {
		var url = URL.createObjectURL(new Blob([data], {type: type}));
		var link = document.createElement('a');

		link.href = url;
		link.download = name;

		document.body.appendChild(link);

		link.click();
		link.remove();

		window.setTimeout(function () {
			URL.revokeObjectURL(url);
		}, 1000);
	}
});
