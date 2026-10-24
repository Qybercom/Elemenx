/*
 * The page of the builder as an Application of its own, to download:
 * - Html(template, options, callback): one HTML file that runs alone, opened from the disk or put on any server:
 *   the framework and ElemenxUI (their bundles, from Bundles: bundles/elemenx.min.js and bundles/elemenx-ui.min.js, made
 *   by npm run dist) and the page as the root Component of the Application, all inline. callback(error, text).
 * - Project(template, options): a project of Elemenx in a zip: index.html, app.js, elemenx.config.js and the page as the
 *   Component Page (Page.html, Page.js) under application/, ready for elemenx dev and elemenx build. It returns the
 *   bytes of the zip (a Uint8Array).
 * - Save(name, data, type): gives a file to the browser to save.
 * options: {Title, Language}.
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
		return 'Elemenx.Component(\'Page\', {$Template: ' + JSON.stringify(template) + '});\n\nElemenx.Application(\'App\', {\n\t$Component: \'Page\',\n\t$Mount: \'body\',\n\t$Use: [\'ElemenxUI\']\n});';
	},

	/* The body is the page, as on the canvas: as high as the window, a column (the root of Page too) a screen with Sizing fill fills. */
	Head: function (options) {
		return '\t<meta charset="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\n\t<title>' + String(options.Title || 'Page').replace(/</g, '&lt;') + '</title>\n\n\t<style>\n\t\thtml,\n\t\tbody {\n\t\t\theight: 100%;\n\t\t\tmargin: 0;\n\t\t}\n\n\t\tbody {\n\t\t\tdisplay: flex;\n\t\t\tflex-direction: column;\n\t\t}\n\n\t\tbody > div {\n\t\t\tdisplay: flex;\n\t\t\tflex: 1 0 auto;\n\t\t\tflex-direction: column;\n\t\t}\n\t</style>\n';
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

				callback(null, '<!DOCTYPE html>\n<html lang="' + (options.Language || 'en') + '">\n<head>\n' + self.Head(options) + '\n' + texts.map(function (bundle) {
					return '\t<script>' + self.Script(bundle) + '</script>\n';
				}).join('') + '\t<script>\n' + self.Script(self.Main(template)).replace(/^/gm, '\t\t').replace(/^\t\t$/gm, '') + '\n\t</script>\n</head>\n<body>\n</body>\n</html>\n');
			});
		});
	},

	Project: function (template, options) {
		var files = {
			'index.html': '<!DOCTYPE html>\n<html lang="' + (options.Language || 'en') + '">\n<head>\n' + this.Head(options) + '\n\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>\n</head>\n<body>\n</body>\n</html>\n',
			'app.js': 'Elemenx.Application(\'App\', {\n\t$Component: \'Page\',\n\t$Root: \'application\',\n\t$Mount: \'body\',\n\t$Use: [\'ElemenxUI\']\n});\n',
			'elemenx.config.js': 'module.exports = {\n\tApplication: \'application\',\n\tEntry: \'app.js\',\n\tIndex: \'index.html\',\n\tOutput: \'dist\'\n};\n',
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
