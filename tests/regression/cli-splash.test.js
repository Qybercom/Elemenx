import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Builder = require('../../tools/builder.js');
var Splash = require('../../tools/splash.js');
var Server = require('../../tools/server.js');
var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var temporary = [];

/* A copy of the project of the tests, to add a splash.html to. */
function project () {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-splash-'));

	temporary.push(folder);

	fs.cpSync(source, folder, {recursive: true});

	return folder;
}

/* Builds with the output of the builder kept quiet. */
function build (folder, options) {
	var original = process.stdout.write;

	process.stdout.write = function () {
		return true;
	};

	try {
		Builder.Build(folder, Object.assign({out: 'dist'}, options));
	}
	finally {
		process.stdout.write = original;
	}

	return fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8');
}

describe('Builder: the splash of an Application', function () {
	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('puts the splash of Splash at the top of the body, with no script, and none without one', function () {
		var folder = project();
		var page = build(folder, {splash: {Image: '/logo.svg', Background: '#102030', Text: 'Loading <app>', MinTime: 400, Timeout: 5000}});
		var body = page.substring(page.search(/<body\b[^>]*>/i));

		expect(body).toMatch(/^<body[^>]*>\n<style id="elemenx-splash-style">/);
		expect(page).toContain('<div id="elemenx-splash" role="status" aria-busy="true" data-min="400" data-timeout="5000"><img class="elemenx-splash-image" src="/logo.svg" alt=""><p class="elemenx-splash-text">Loading &lt;app&gt;</p><span class="elemenx-splash-spinner" aria-hidden="true"></span></div>');
		expect(page).toContain('background:#102030');
		expect(page).not.toContain('prefers-color-scheme:dark');
		expect(page.match(/<script/g).length).toBe(build(folder, {}).match(/<script/g).length);

		expect(build(folder, {})).not.toContain('elemenx-splash');
		expect(build(folder, {splash: true})).toContain('prefers-color-scheme:dark');
		expect(build(folder, {splash: true, single: true}).indexOf('id="elemenx-splash"')).not.toBe(-1);
	});

	it('takes splash.html of the project as its content, and refuses a color that is not one', function () {
		var folder = project();

		fs.writeFileSync(path.join(folder, 'splash.html'), '<h1 class="brand">My app</h1>\n');

		expect(build(folder, {})).toContain('<div id="elemenx-splash" role="status" aria-busy="true" data-min="0" data-timeout="10000"><h1 class="brand">My app</h1></div>');
		expect(build(folder, {splash: false})).not.toContain('elemenx-splash');

		expect(function () {
			Splash.Settings(folder, {Background: 'red;}body{display:none'});
		}).toThrow('Splash.Background must be a CSS color');

		expect(function () {
			Splash.Settings(folder, {MinTime: 'soon'});
		}).toThrow('Splash.MinTime must be a number of milliseconds');
	});

	it('makes in the builder the splash a build makes, for the HTML file it downloads and the Splash of its project', function () {
		var definition = null;
		var folder = project();
		var vm = require('vm');
		var settings = {Image: '/logo.svg', Background: '#102030', Color: 'white', Text: 'Loading', Spinner: false, MinTime: 300};

		vm.runInNewContext(fs.readFileSync(path.resolve(process.cwd(), 'examples', 'Designer', 'application', 'services', 'Packager.js'), 'utf8'), {Elemenx: {Service: function (name, value) {
			definition = value;
		}}});

		expect(definition.SplashMarkup(settings)).toBe(Splash.Markup(Splash.Settings(folder, Object.assign({Timeout: 10000}, settings))));
		/* Its own HTML, as splash.html of a project. */
		expect(definition.SplashMarkup({HTML: '<b>Own</b>'})).toBe(Splash.Markup(Object.assign(Splash.Settings(folder, true), {HTML: '<b>Own</b>'})));
		expect(definition.SplashConfig.call(definition, settings)).toBe('{Image: \'/logo.svg\', Background: \'#102030\', Color: \'white\', Text: \'Loading\', Spinner: false, MinTime: 300}');
		expect(definition.SplashConfig.call(definition, {Spinner: true})).toBe('true');
		expect(definition.PWAConfig.call(definition, {ShortName: 'Shop', Icon: '/icon.png', Theme: '', Display: 'fullscreen', Offline: false})).toBe('{ShortName: \'Shop\', Icon: \'/icon.png\', Display: \'fullscreen\', Offline: false}');
		expect(definition.PWAConfig.call(definition, {Display: 'standalone', Offline: true})).toBe('true');
		expect(definition.PWAConfig.call(definition, {Display: 'standalone', Offline: true, Update: 'prompt'})).toBe('{Update: \'prompt\'}');
		expect(definition.PWAConfig.call(definition, {Offline: false, Update: 'prompt'})).toBe('{Offline: false}');
	});

	it('serves the page of the development server with the splash, as a build writes it', async function () {
		var folder = project();
		var server;
		var text;

		fs.writeFileSync(path.join(folder, 'splash.html'), '<b>Dev</b>');

		server = Server.Create({Root: folder, Page: function (page) {
			return Splash.Inject(page, Splash.Settings(folder, undefined));
		}});

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		try {
			text = await new Promise(function (resolve, reject) {
				http.get('http://127.0.0.1:' + server.Server.address().port + '/', function (response) {
					var data = '';

					response.on('data', function (chunk) {
						data += chunk;
					});
					response.on('end', function () {
						resolve(data);
					});
				}).on('error', reject);
			});
		}
		finally {
			server.Close();
		}

		expect(text).toContain('<div id="elemenx-splash" role="status" aria-busy="true" data-min="0" data-timeout="10000"><b>Dev</b></div>');
	});
});

describe('Builder: an installable application of the system (PWA)', function () {
	var PWA = require('../../tools/pwa.js');

	afterEach(function () {
		while (temporary.length) fs.rmSync(temporary.pop(), {recursive: true, force: true});
	});

	it('names it by the title of its page, takes the size of a PNG icon and the background of the splash, and checks its settings', function () {
		var folder = project();
		var png = Buffer.alloc(33);
		var page;
		var manifest;

		png.write('\x89PNG', 0, 'latin1');
		png.writeUInt32BE(192, 16);
		png.writeUInt32BE(192, 20);

		fs.writeFileSync(path.join(folder, 'icon.png'), png);

		page = build(folder, {pwa: {Icon: '/icon.png', Offline: false}, splash: {Background: '#102030'}});
		manifest = JSON.parse(fs.readFileSync(path.join(folder, 'dist', 'manifest.webmanifest'), 'utf8'));

		expect(manifest).toEqual({name: 'Elemenx single file', short_name: 'Elemenx single file', start_url: '/', scope: '/', display: 'standalone', background_color: '#102030', theme_color: '#102030', icons: [{src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any'}]});
		expect(page).toContain('<link rel="manifest" href="/manifest.webmanifest">');
		expect(page).toContain('<link rel="apple-touch-icon" href="/icon.png">');
		expect(page).not.toContain('elemenx-pwa-worker');
		expect(fs.existsSync(path.join(folder, 'dist', 'elemenx-pwa.js'))).toBe(false);

		expect(function () {
			PWA.Settings(folder, {Display: 'window'}, '', folder, null);
		}).toThrow('PWA.Display must be one of standalone, fullscreen, minimal-ui, browser: window');

		expect(function () {
			PWA.Settings(folder, {Theme: 'red;}'}, '', folder, null);
		}).toThrow('PWA.Theme must be a CSS color');

		/* Update: auto by default; prompt and manual make the worker wait until the page tells it, and the page knows which. */
		expect(PWA.Settings(folder, true, '', folder, null).Update).toBe('auto');
		expect(function () {
			PWA.Settings(folder, {Update: 'later'}, '', folder, null);
		}).toThrow('PWA.Update must be one of auto, prompt, manual: later');

		expect(PWA.Worker(['/a.js'], 'v1')).toContain('return self.skipWaiting();');
		expect(PWA.Worker(['/a.js'], 'v1', 'prompt')).not.toContain('return self.skipWaiting();');
		expect(PWA.Worker(['/a.js'], 'v1', 'prompt')).toContain('if (data.Type === \'elemenx-pwa-apply\')');
		expect(PWA.Head('<head></head>', {Theme: '#fff', Icons: [], Offline: true, Scope: '/', Update: 'manual'})).toContain('data-update="manual"');
	});

	it('keeps the files of the build in its worker, under the version of the build, and is not in a native program', function () {
		var folder = project();
		var worker;
		var first;

		build(folder, {pwa: true});

		worker = fs.readFileSync(path.join(folder, 'dist', 'elemenx-pwa.js'), 'utf8');
		first = /elemenx-pwa-([0-9a-f]{12})/.exec(worker)[1];

		expect(worker).toContain('"/index.html"');
		expect(worker).toContain('"/elemenx.js"');
		expect(worker).not.toContain('"/elemenx-pwa.js"');

		fs.writeFileSync(path.join(folder, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

		build(folder, {pwa: true});

		expect(/elemenx-pwa-([0-9a-f]{12})/.exec(fs.readFileSync(path.join(folder, 'dist', 'elemenx-pwa.js'), 'utf8'))[1]).not.toBe(first);

		build(folder, {pwa: true, native: 'mobile', out: 'dist'});

		expect(fs.existsSync(path.join(folder, 'dist', 'native', 'mobile', 'manifest.webmanifest'))).toBe(false);
	});
});
