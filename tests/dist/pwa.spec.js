import { test, expect } from '../coverage/playwright.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Builder from '../../tools/builder.js';
import Server from '../../tools/server.js';

var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');

test.describe('elemenx build with PWA', function () {
	test.describe.configure({mode: 'serial'});

	var folder;
	var server;
	var origin;

	test.beforeAll(async function () {
		var original = process.stdout.write;

		folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-pwa-'));

		fs.cpSync(source, folder, {recursive: true});

		process.stdout.write = function () {
			return true;
		};

		try {
			Builder.Build(folder, {out: 'dist', pwa: {Name: 'Single PWA', ShortName: 'Single', Icon: '/logo.svg', Theme: '#123456'}});
		}
		finally {
			process.stdout.write = original;
		}

		server = Server.Create({Root: path.join(folder, 'dist')});

		await new Promise(function (resolve) {
			server.Listen(0, '127.0.0.1', resolve);
		});

		origin = 'http://127.0.0.1:' + server.Server.address().port;
	});

	test.afterAll(async function () {
		await new Promise(function (resolve) {
			server.Close(resolve);
		});

		fs.rmSync(folder, {recursive: true, force: true});
	});

	test('links its manifest from the page, and its worker keeps the files of the build', async function ({ page }) {
		var manifest;

		await page.goto(origin + '/');

		await expect(page.locator('.single-title')).toHaveText('Single file');
		await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
		await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#123456');

		manifest = await (await page.request.get(origin + '/manifest.webmanifest')).json();

		expect(manifest).toMatchObject({name: 'Single PWA', short_name: 'Single', start_url: '/', display: 'standalone', theme_color: '#123456', icons: [{src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any'}]});

		/* Registered once the page has loaded, the worker takes the page. */
		expect(await page.evaluate(function () {
			return navigator.serviceWorker.ready.then(function (registration) {
				return registration.active.scriptURL;
			});
		})).toBe(origin + '/elemenx-pwa.js');

		expect(await page.evaluate(function () {
			return caches.keys().then(function (keys) {
				return keys.length ? caches.open(keys[0]).then(function (cache) {
					return cache.keys();
				}).then(function (requests) {
					return requests.map(function (request) {
						return new URL(request.url).pathname;
					}).sort();
				}) : [];
			});
		})).toEqual(expect.arrayContaining(['/app.js', '/elemenx.js', '/index.html', '/libraries/ElemenxUI/index.css', '/logo.svg', '/manifest.webmanifest']));
	});

	test('runs without the network, a route of the Router too, from the files its worker keeps', async function ({ page, context }) {
		await page.goto(origin + '/');

		await page.evaluate(function () {
			return navigator.serviceWorker.ready;
		});

		await context.setOffline(true);

		try {
			await page.goto(origin + '/about');

			await expect(page.locator('.single-title')).toHaveText('Single file');
		}
		finally {
			await context.setOffline(false);
		}
	});
});
