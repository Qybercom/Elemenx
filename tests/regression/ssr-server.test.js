import { afterAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var SSR = require('../../tools/ssr.js');
var Dom = require('../../tools/dom.js');
var folders = [];

/* A project in a folder of its own: its files by their paths. */
function project (files) {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-ssr-'));

	folders.push(folder);

	Object.keys(files).forEach(function (name) {
		fs.mkdirSync(path.dirname(path.join(folder, name)), {recursive: true});
		fs.writeFileSync(path.join(folder, name), files[name]);
	});

	return folder;
}

function page (scripts) {
	return '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="utf-8" />\n\t<title>Shop</title>\n' + scripts + '\n</head>\n<body>\n\t<div id="app"></div>\n</body>\n</html>\n';
}

function render (options) {
	return new Promise(function (resolve) {
		SSR.Render(options, function (error, html, state) {
			resolve({Error: error, HTML: html, State: state});
		});
	});
}

/* The document of the HTML a render gave, to read it as a browser would. */
function read (html) {
	return Dom.Window({URL: 'http://localhost/', HTML: html}).document;
}

var shop = [
	'Elemenx.Component(\'Shell\', {$Template: \'<div class="shell"><nav><a href="/">Home</a></nav><main *outlet="Content"></main></div>\'});',
	'Elemenx.Component(\'Home\', {$Template: \'<h1>Home</h1>\'});',
	'Elemenx.Component(\'Item\', {$Template: \'<li class="item">{{Name}}: {{Price}}</li>\', Name: \'\', Price: 0});',
	'Elemenx.Component(\'Items\', {',
	'\t$Template: \'<section><h1>{{Title}}</h1><ul><Item *for="item of Items" *key="item.ID" [name]="item.Name" [price]="item.Price"></Item></ul><p class="where">{{Where}}</p></section>\',',
	'\tTitle: \'Items\', Items: [], Where: \'\', Note: \'\',',
	'\t$OnSSR: function (done, context) {',
	'\t\tvar self = this;',
	'',
	'\t\tsetTimeout(function () {',
	'\t\t\tself.Items = [{ID: 1, Name: \'Apple\', Price: 3}, {ID: 2, Name: \'Pear\', Price: 4}];',
	'\t\t\tself.Where = context.Server ? \'server \' + context.URL : \'browser\';',
	'\t\t\tself.Note = \'</script><b>\';',
	'',
	'\t\t\tdone();',
	'\t\t}, 20);',
	'\t}',
	'});',
	'Elemenx.Application(\'Shop\', {$Component: \'Shell\', $Mount: \'#app\', $Router: {Routes: [{Path: \'/\', Component: \'Home\'}, {Path: \'/items\', Component: \'Items\'}]}});'
].join('\n');

describe('Contract: SSR in Node: a page rendered as a server sends it, its markup and the state of its Components', function () {
	afterAll(function () {
		folders.forEach(function (folder) {
			fs.rmSync(folder, {recursive: true, force: true});
		});
	});

	it('renders the page of a URL with what its $OnSSR loaded, its mount marked and its state beside it, its own scripts kept', async function () {
		var folder = project({'index.html': page('\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>'), 'app.js': shop});
		var result = await render({Root: folder, URL: '/items?sort=price'});
		var document = read(result.HTML);
		var mount = document.getElementById('app');
		var state = JSON.parse(document.querySelector('script[data-elemenx-state]').textContent);

		expect(result.Error).toBe(null);
		expect(result.HTML.indexOf('<!DOCTYPE html>')).toBe(0);
		expect(mount.getAttribute('data-elemenx-ssr')).toMatch(/^\d+\.\d+\.\d+$/);
		expect(Array.prototype.map.call(mount.querySelectorAll('.item'), function (item) {
			return item.textContent;
		})).toEqual(['Apple: 3', 'Pear: 4']);
		expect(mount.querySelector('.where').textContent).toBe('server http://localhost/items?sort=price');
		expect(state).toEqual(result.State);
		expect(state.URL).toBe('http://localhost/items?sort=price');
		expect(state.Components).toEqual({'Items#0': {Title: 'Items', Items: [{ID: 1, Name: 'Apple', Price: 3}, {ID: 2, Name: 'Pear', Price: 4}], Where: 'server http://localhost/items?sort=price', Note: '</script><b>'}});

		/* Its data cannot end the script it is in; the scripts of the page stay, none the framework loaded itself. */
		expect(result.HTML).not.toContain('"Note":"</script>');
		expect(Array.prototype.map.call(document.querySelectorAll('script[src]'), function (script) {
			return script.getAttribute('src');
		})).toEqual(['/elemenx.js', '/app.js']);
		expect(document.title).toBe('Shop');
	});

	it('renders a project of Components the framework finds in its source tree, the files it loads not left in the page', async function () {
		var folder = project({
			'index.html': page('\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>'),
			'app.js': 'Elemenx.Application(\'Tree\', {$Component: \'Card\', $Root: \'application\', $Mount: \'#app\'});',
			'application/index.js': '[\n\t\'components\'\n];\n',
			'application/components/index.js': '[\n\t\'Card/Card.js\',\n\t\'Badge/Badge.js\'\n];\n',
			'application/components/Card/Card.js': 'Elemenx.Component(\'Card\', {$TemplateURL: \'Card.html\', Label: \'\', $OnSSR: function (done) { var self = this; setTimeout(function () { self.Label = \'loaded\'; done(); }, 5); }});',
			'application/components/Card/Card.html': '<article class="card"><Badge [text]="Label"></Badge></article>',
			'application/components/Badge/Badge.js': 'Elemenx.Component(\'Badge\', {$TemplateURL: \'Badge.html\', Text: \'\'});',
			'application/components/Badge/Badge.html': '<span class="badge">{{Text}}</span>'
		});
		var result = await render({Root: folder, URL: '/'});
		var document = read(result.HTML);

		expect(result.Error).toBe(null);
		expect(document.querySelector('#app .card .badge').textContent).toBe('loaded');
		expect(result.State.Components).toEqual({'Card#0': {Label: 'loaded'}});
		expect(document.querySelectorAll('script[data-elemenx-loaded]').length).toBe(0);
		expect(result.HTML).not.toContain('Card.js');
	});

	it('fails a page whose Application fails, and one whose $OnSSR is never done by its Timeout; each render alone', async function () {
		var broken = project({
			'index.html': page('\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>'),
			'app.js': 'Elemenx.Application(\'Broken\', {$Component: \'Nowhere\', $Mount: \'#app\'});'
		});
		var waiting = project({
			'index.html': page('\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>'),
			'app.js': 'Elemenx.Component(\'Slow\', {$Template: \'<p>{{X}}</p>\', X: 1, $OnSSR: function () {}});\nElemenx.Application(\'Slow\', {$Component: \'Slow\', $Mount: \'#app\'});'
		});
		var failed = await render({Root: broken, URL: '/'});
		var slow = await render({Root: waiting, URL: '/', Timeout: 400});
		var none = await render({Root: broken, Page: 'missing.html'});

		expect(String(failed.Error && failed.Error.message)).toContain('Nowhere');
		expect(String(slow.Error && slow.Error.message)).toContain('400 ms');
		expect(String(none.Error && none.Error.message)).toContain('no page');

		/* A render of its own each time: the same page twice, the same state, nothing of the first in the second. */
		var folder = project({'index.html': page('\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>'), 'app.js': shop});
		var first = await render({Root: folder, URL: '/items'});
		var second = await render({Root: folder, URL: '/items'});

		expect(second.State).toEqual(first.State);
		expect(read(second.HTML).querySelectorAll('script[data-elemenx-state]').length).toBe(1);
	});

	it('prerenders the pages of a site from its root by their links, each a file of its own that the server sends for its path', async function () {
		var Prerender = require('../../tools/prerender.js');
		var Server = require('../../tools/server.js');
		var folder = project({
			'index.html': page('\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>'),
			'app.js': [
				'Elemenx.Component(\'Shell\', {$Template: \'<div><nav><a href="/">Home</a> <a href="/items?x=1#top">Items</a> <a href="/team/">Team</a> <a href="/logo.png">Logo</a> <a href="//cdn.example/x">CDN</a> <a href="https://example.com/">Out</a> <a href="/broken">Broken</a></nav><main *outlet="Content"></main></div>\'});',
				'Elemenx.Component(\'Home\', {$Template: \'<h1>Home</h1>\'});',
				'Elemenx.Component(\'Team\', {$Template: \'<h1>Team</h1>\'});',
				'Elemenx.Component(\'Broken\', {$Template: \'<p>{{X}}</p>\', $OnSSR: function (done) { done(new Error(\'no data\')); }});',
				'Elemenx.Component(\'Items\', {$Template: \'<ul><li *for="item of Items" *key="item">{{item}}</li></ul>\', Items: [], $OnSSR: function (done) { this.Items = [\'a\', \'b\']; done(); }});',
				'Elemenx.Application(\'Site\', {$Component: \'Shell\', $Mount: \'#app\', $Router: {Routes: [{Path: \'/\', Component: \'Home\'}, {Path: \'/items\', Component: \'Items\'}, {Path: \'/team\', Component: \'Team\'}, {Path: \'/broken\', Component: \'Broken\'}]}});'
			].join('\n')
		});
		var built = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
		var pages = await new Promise(function (resolve, reject) {
			Prerender.Run({Output: folder}, function (error, list) {
				if (error) reject(error);
				else resolve(list);
			});
		});
		var server;
		var answer;

		expect(pages.map(function (one) {
			return one.URL + ' ' + (one.Error ? 'failed: ' + one.Error.message : path.relative(folder, one.File));
		})).toEqual(['/ index.html', '/items items.html', '/team team.html', '/broken failed: no data']);
		expect(read(fs.readFileSync(path.join(folder, 'items.html'), 'utf8')).querySelectorAll('#app li').length).toBe(2);

		/* Every page of the page as it was built, not of one rendered before it: one state script each. */
		expect(read(fs.readFileSync(path.join(folder, 'team.html'), 'utf8')).querySelectorAll('script[data-elemenx-state]').length).toBe(1);
		expect(read(fs.readFileSync(path.join(folder, 'index.html'), 'utf8')).querySelector('#app h1').textContent).toBe('Home');
		expect(built).not.toContain('data-elemenx-ssr');
		expect(Prerender.Links('<a href="/a">a</a><a href="/a/">a</a><a href="/b.css">b</a><a href="/c?d#e">c</a>', '/')).toEqual(['/a', '/c']);

		/* The server sends /items as items.html. */
		server = Server.Create({Root: folder});

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		answer = await fetch('http://127.0.0.1:' + server.Server.address().port + '/items');

		expect(await answer.text()).toContain('<li>a</li>');

		await new Promise(function (resolve) {
			server.Close(resolve);
		});
	});

	it('prerenders a build by elemenx build --prerender: the minified site, its parts by route, a file for each page', function () {
		var spawn = require('child_process').spawnSync;
		var folder = project({
			'index.html': page('\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<script src="/elemenx.js"></script>\n\t<script src="/app.js"></script>'),
			'app.js': 'Elemenx.Application(\'Site\', {$Component: \'Shell\', $Root: \'application\', $Mount: \'#app\', $Router: {Routes: [{Path: \'/\', Component: \'Home\'}, {Path: \'/items\', Component: \'Items\'}]}});\n',
			'application/index.js': '[\n\t\'components\'\n];\n',
			'application/components/index.js': '[\n\t\'Shell/Shell.js\',\n\t\'Home/Home.js\',\n\t\'Items/Items.js\'\n];\n',
			'application/components/Shell/Shell.js': 'Elemenx.Component(\'Shell\', {$Template: \'<div><a href="/items">Items</a><main *outlet="Content"></main></div>\'});\n',
			'application/components/Home/Home.js': 'Elemenx.Component(\'Home\', {$Template: \'<h1>Home</h1>\'});\n',
			'application/components/Items/Items.js': 'Elemenx.Component(\'Items\', {$Template: \'<ul><li *for="item of Items" *key="item">{{item}}</li></ul>\', Items: [], $OnSSR: function (done) { var self = this; setTimeout(function () { self.Items = [\'a\', \'b\']; done(); }, 5); }});\n'
		});
		var run = spawn(process.execPath, [path.resolve('elemenx-cli.js'), 'build', folder, '--prerender'], {encoding: 'utf8'});
		var items = fs.readFileSync(path.join(folder, 'dist', 'items.html'), 'utf8');

		expect(run.status).toBe(0);
		expect(run.stdout).toContain('Elemenx prerender: / index.html');
		expect(run.stdout).toContain('Elemenx prerender: /items items.html');
		expect(read(items).querySelectorAll('#app li').length).toBe(2);
		expect(read(fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8')).querySelector('#app h1').textContent).toBe('Home');

		/* Not with a build of one file. */
		expect(spawn(process.execPath, [path.resolve('elemenx-cli.js'), 'build', folder, '--single', '--prerender'], {encoding: 'utf8'}).stderr).toContain('--prerender renders the pages of a site');
	});

	it('reads and writes HTML as a browser does: the end tags it implies, raw text, entities, the content of a template, SVG', function () {
		var document = read('<!DOCTYPE html><html><head></head><body><ul><li>One<li>Two &amp; <b>more</b></ul><p>a<div>b</div><template id="t"><i>x</i></template><svg viewBox="0 0 2 2"><linearGradient id="g"></linearGradient><path d="M0 0"/></svg><script>if (a < b) {}</script><textarea>&lt;tag&gt;</textarea></body></html>');

		expect(document.querySelectorAll('ul > li').length).toBe(2);
		expect(document.querySelector('li + li').textContent).toBe('Two & more');
		expect(document.querySelector('p').textContent).toBe('a');
		expect(document.getElementById('t').content.firstChild.outerHTML).toBe('<i>x</i>');
		expect(document.querySelector('svg').getAttribute('viewBox')).toBe('0 0 2 2');
		expect(document.querySelector('svg').firstChild.tagName).toBe('linearGradient');
		expect(document.querySelector('script').textContent).toBe('if (a < b) {}');
		expect(document.querySelector('textarea').value).toBe('<tag>');
		expect(document.body.innerHTML).toBe('<ul><li>One</li><li>Two &amp; <b>more</b></li></ul><p>a</p><div>b</div><template id="t"><i>x</i></template><svg viewBox="0 0 2 2"><linearGradient id="g"></linearGradient><path d="M0 0"></path></svg><script>if (a < b) {}</script><textarea>&lt;tag&gt;</textarea>');
	});
});
