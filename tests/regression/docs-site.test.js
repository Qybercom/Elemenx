import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import child from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

var require = createRequire(import.meta.url);
var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
var DocsSite = require(path.join(root, 'tools', 'docs-site.js'));

/* A port no one listens on: the system gives one (a random one of a range met a server that was running, regression). */
function freePort () {
	return new Promise(function (resolve, reject) {
		var probe = require('net').createServer();

		probe.on('error', reject);
		probe.listen(0, '127.0.0.1', function () {
			var port = probe.address().port;

			probe.close(function () {
				resolve(port);
			});
		});
	});
}
var manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
var folder;
var output;

/* A GET of the server of the CLI: {Status, Type, Text}. */
function get (port, pathname) {
	return fetch('http://127.0.0.1:' + port + pathname).then(function (response) {
		return response.text().then(function (text) {
			return {Status: response.status, Type: response.headers.get('content-type'), Text: text};
		});
	});
}

/* A request after the server of the CLI says it listens; the process is stopped after. */
function serve (args, test) {
	return new Promise(function (resolve, reject) {
		var cli = child.spawn(process.execPath, [path.join(root, 'elemenx-cli.js')].concat(args), {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
		var said = '';
		var done = false;

		function finish (error, value) {
			if (done) return;

			done = true;

			cli.kill();

			if (error) reject(error);
			else resolve(value);
		}

		cli.stdout.on('data', function (chunk) {
			said += chunk;

			if (/http:\/\/127\.0\.0\.1:\d+\//.test(said))
				test(said).then(function (value) {
					finish(null, value);
				}, finish);
		});

		cli.stderr.on('data', function (chunk) {
			said += chunk;
		});

		cli.on('exit', function () {
			finish(new Error('the CLI ended: ' + said));
		});
	});
}

/* The Docs in the package of npm: built by prepack into docs-site/, served by npx elemenx docs. */
describe('Elemenx docs: the Docs in the package', function () {
	beforeAll(function () {
		folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-docs-'));
		output = DocsSite.Build({Output: path.join(folder, 'docs-site')});
	});

	afterAll(function () {
		fs.rmSync(folder, {recursive: true, force: true});
	});

	it('builds the Docs with all of the framework and every pack, without the tools that write its pages, and with its server', function () {
		var framework = fs.readFileSync(path.join(output, 'elemenx.js'), 'utf8');

		expect(fs.existsSync(path.join(output, 'index.html'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'app.js'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'pages', 'index.json'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'tools'))).toBe(false);
		expect(fs.existsSync(path.join(output, 'elemenx.config.js'))).toBe(true);

		/* Its live examples use any section of the framework (the network, the storage...) and any pack (the emoji...). */
		expect(framework).toContain('Elemenx Network owner is destroyed');
		expect(framework).toContain('Elemenx.Storage.Context expects');

		/*
		 * A bug: its live examples make their templates at run time, so the build took no Component they use, and an
		 * <EmojiPicker> stayed a tag. Every Component of ElemenxUI is in its bundle.
		 */
		var bundle = fs.readFileSync(path.join(output, 'app.js'), 'utf8');
		var meta = JSON.parse(fs.readFileSync(path.join(root, 'libraries', 'ElemenxUI', 'data', 'meta.json'), 'utf8'));

		expect(meta.Components.length).toBeGreaterThan(100);
		expect(meta.Components.filter(function (component) {
			return bundle.indexOf('"' + component.Name + '"') === -1;
		}).map(function (component) {
			return component.Name;
		})).toEqual([]);

		/* ElemenxUI is not copied: the package has it, and the server of the CLI answers /libraries/ from there. */
		expect(fs.existsSync(path.join(output, 'libraries', 'ElemenxUI'))).toBe(false);

		/* The projects of the tutorials, to download, and the demos of those with no server of their own, in one file each. */
		expect(fs.existsSync(path.join(output, 'tutorials', 'Auth.zip'))).toBe(true);
		expect(fs.existsSync(path.join(output, 'tutorials', 'Auth', 'index.html'))).toBe(false);
		expect(fs.readFileSync(path.join(output, 'tutorials', 'Todo', 'index.html'), 'utf8')).toContain('<script id="elemenx">');
		expect(fs.existsSync(path.join(output, 'tutorials', 'Languages', 'locales', 'ru.json'))).toBe(true);
	});

	/* The CLI builds docs-site/ first, its files compressed by brotli at its best: a minute and more under load. */
	it('is served by elemenx docs with the answers of its examples of the network', async function () {
		var port = await freePort();
		var site = path.join(root, 'docs-site');
		/* The CLI serves docs-site/ beside it, which in the repository it builds from the sources first: taken away after when it was not there. */
		var made = !fs.existsSync(site);

		try {
			await serve(['docs', '--port', String(port)], async function () {
				var page = await get(port, '/');
				var route = await get(port, '/components/Toggle');
				var hello = await get(port, '/api/hello');
				var emoji = await get(port, '/libraries/ElemenxUI/data/emoji.json');
				var picker = await get(port, '/libraries/ElemenxUI/components/EmojiPicker/EmojiPicker.js');

				expect(page.Status).toBe(200);
				expect(page.Text).toContain('<script');
				expect(route.Status).toBe(200);
				expect(hello.Status).toBe(200);
				expect(JSON.parse(hello.Text).Message).toBe('Hello from the server');
				expect(emoji.Status).toBe(200);
				expect(picker.Text).toContain("Elemenx.Component('EmojiPicker'");
			});
		}
		finally {
			if (made)
				fs.rmSync(site, {recursive: true, force: true});
		}
	}, 240000);

	it('elemenx dev has every file checked again before it is used (no-cache), so a change shows at the next reload', async function () {
		var port = await freePort();

		await serve(['dev', 'examples/Simple', '--port', String(port)], async function () {
			var sprite = await fetch('http://127.0.0.1:' + port + '/libraries/ElemenxUI/index.svg');
			var framework = await fetch('http://127.0.0.1:' + port + '/elemenx.js');

			/* Without it a browser keeps a file it got for a while by its age alone, and a changed icon or script stays old. */
			expect(sprite.status).toBe(200);
			expect(sprite.headers.get('cache-control')).toBe('no-cache');
			expect(sprite.headers.get('etag')).toBeTruthy();
			expect(framework.headers.get('cache-control')).toBe('no-cache');
		});
	});

	/*
	 * A bug: elemenx dev read the answers of its server once, so a server started before elemenx.config.js changed
	 * answered as before (the Docs gave its page for the archives of its tutorials).
	 */
	it('elemenx dev answers as elemenx.config.js says after a change of it, without a restart', async function () {
		var port = await freePort();
		var project = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-dev-config-'));
		var file = path.join(project, 'elemenx.config.js');
		var settings = function (word) {
			return "module.exports = {Server: {Request: function (request, response, pathname) {\n\tif (pathname !== '/api/word') return false;\n\n\tresponse.end('" + word + "');\n\n\treturn true;\n}}};\n";
		};

		fs.writeFileSync(path.join(project, 'index.html'), '<!DOCTYPE html><html><head></head><body></body></html>');
		fs.writeFileSync(file, settings('one'));

		try {
			await serve(['dev', project, '--port', String(port)], async function () {
				expect((await get(port, '/api/word')).Text).toBe('one');

				fs.writeFileSync(file, settings('two'));
				fs.utimesSync(file, new Date(), new Date(Date.now() + 5000));

				expect((await get(port, '/api/word')).Text).toBe('two');

				/* A file that does not load keeps the answers it had. */
				fs.writeFileSync(file, 'module.exports = {');
				fs.utimesSync(file, new Date(), new Date(Date.now() + 10000));

				expect((await get(port, '/api/word')).Text).toBe('two');
			});
		}
		finally {
			fs.rmSync(project, {recursive: true, force: true});
		}
	});

	it('goes into the package of npm, built by prepack, and the CLI tells of it', function () {
		var help = child.execFileSync(process.execPath, [path.join(root, 'elemenx-cli.js'), 'help', 'docs'], {encoding: 'utf8'});

		expect(manifest.files).toContain('docs-site');
		expect(manifest.scripts['docs:site']).toBe('node tools/docs-site.js');
		expect(manifest.scripts.prepack).toBe('npm run dist -- --no-editors && npm run docs:site && npm run designer:site');
		expect(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')).toContain('/docs-site\n');
		expect(help).toContain('elemenx docs [--port 4179] [--open]');
	});
});
