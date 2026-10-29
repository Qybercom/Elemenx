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

	test('with Update prompt a new build waits until the Application applies it, every page then reloads; with none it starts over', async function ({ page, context }) {
		var other;
		var first;
		var second;
		var answer;

		/* The version of the build the page runs, once its worker answers. */
		function version (target) {
			return target.evaluate(function () {
				return new Promise(function (resolve) {
					function look () {
						if (Elemenx.Install.State().Version) resolve(Elemenx.Install.State().Version);
						else setTimeout(look, 50);
					}

					look();
				});
			});
		}

		function build (text) {
			var original = process.stdout.write;

			/* Code, not a comment: a build is minified, and a comment changes nothing of it. */
			fs.appendFileSync(path.join(folder, 'app.js'), '\nwindow.BuildMark = ' + JSON.stringify(text) + ';\n');

			process.stdout.write = function () {
				return true;
			};

			try {
				Builder.Build(folder, {out: 'dist', pwa: {Name: 'Single PWA', Icon: '/logo.svg', Update: 'prompt'}});
			}
			finally {
				process.stdout.write = original;
			}
		}

		build('the first build');

		expect(fs.readFileSync(path.join(folder, 'dist', 'index.html'), 'utf8')).toContain('data-update="prompt"');

		await page.goto(origin + '/');
		await page.evaluate(function () {
			return navigator.serviceWorker.ready;
		});

		/* A page of the worker already: it hears a new build. A second page of it reloads with it. */
		await page.reload();

		first = await version(page);

		other = await context.newPage();

		await other.goto(origin + '/');

		expect(await version(other)).toBe(first);

		build('the second build');

		answer = await page.evaluate(function () {
			return new Promise(function (resolve) {
				Elemenx.Install.Update(function (error, result) {
					resolve([error && error.message, result, Elemenx.Install.State().Waiting]);
				});
			});
		});

		expect(answer[0]).toBe(null);
		expect(answer[1]).toMatchObject({Available: true, Current: first});
		expect(answer[1].Version).not.toBe(first);
		expect(answer[2]).toBe(true);

		second = answer[1].Version;

		/* Still the first build until the Application applies the new one; then both pages reload into it. */
		expect(await version(page)).toBe(first);

		await Promise.all([page.waitForEvent('load'), other.waitForEvent('load'), page.evaluate(function () {
			Elemenx.Install.Apply();
		})]);

		expect(await version(page)).toBe(second);
		expect(await version(other)).toBe(second);

		/* Nothing new: Apply forgets the worker and its files, the page comes from the network and keeps them again. */
		await page.evaluate(function () {
			return caches.keys().then(function (keys) {
				return caches.open(keys[0]).then(function (cache) {
					return cache.put('/forgotten.txt', new Response('old'));
				});
			});
		});

		await Promise.all([page.waitForEvent('load'), page.evaluate(function () {
			Elemenx.Install.Apply();
		})]);

		expect(await version(page)).toBe(second);
		expect(await page.evaluate(function () {
			return caches.keys().then(function (keys) {
				return Promise.all(keys.map(function (key) {
					return caches.open(key).then(function (cache) {
						return cache.match('/forgotten.txt');
					});
				}));
			}).then(function (found) {
				return found.filter(Boolean).length;
			});
		})).toBe(0);

		await other.close();
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
