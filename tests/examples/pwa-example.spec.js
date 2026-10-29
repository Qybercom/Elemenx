import { test, expect } from '../coverage/playwright.js';
import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Server from '../../tools/server.js';

var source = path.resolve(process.cwd(), 'examples', 'PWA');
var cli = path.resolve(process.cwd(), 'elemenx-cli.js');

/* The example of an installable application, built by the CLI with its elemenx.config.js, as npm run build does. */
test.describe('Example: PWA, notes that install, run offline and update when asked', function () {
	test.describe.configure({mode: 'serial'});

	var folder;
	var server;
	var origin;

	function build () {
		childProcess.execFileSync(process.execPath, [cli, 'build', folder], {stdio: 'ignore'});
	}

	test.beforeAll(async function () {
		folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-pwa-example-'));

		fs.cpSync(source, folder, {recursive: true, filter: function (file) {
			return path.basename(file) !== 'dist' && path.basename(file) !== 'node_modules';
		}});

		build();

		server = Server.Create({Root: path.join(folder, 'dist'), CacheControl: 'public, max-age=0, must-revalidate'});

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

	test('shows its build, keeps its notes without the network, and finds the new build that waits', async function ({ page, context }) {
		var manifest;
		var first;

		await page.goto(origin + '/');

		await expect(page.locator('.pwa-online')).toHaveText('online');

		manifest = await (await page.request.get(origin + '/manifest.webmanifest')).json();

		expect(manifest).toMatchObject({name: 'Elemenx notes', short_name: 'Notes', theme_color: '#2f4fd8', display: 'standalone'});
		expect(manifest.icons.map(function (icon) {
			return icon.sizes;
		})).toEqual(expect.arrayContaining(['192x192', '512x512']));

		/* The build it runs, once its worker keeps it. */
		await expect(page.locator('.pwa-version')).not.toHaveText('not kept yet', {timeout: 30000});

		first = await page.locator('.pwa-version').innerText();

		/* A note, kept on the device: there after a start without the network too. */
		await page.locator('.pwa-form input').fill('Buy milk');
		await page.locator('.pwa-form').getByRole('button', {name: 'Add'}).click();

		await expect(page.locator('.pwa-list li')).toHaveText(['Buy milk']);

		await context.setOffline(true);

		try {
			await page.reload();

			await expect(page.locator('.pwa-online')).toHaveText('offline');
			await expect(page.locator('.pwa-list li')).toHaveText(['Buy milk']);
		}
		finally {
			await context.setOffline(false);
		}

		/* Nothing new on the server; then a new build, which waits until Update now (asked once the page knows its build). */
		await page.reload();

		await expect(page.locator('.pwa-version')).toHaveText(first, {timeout: 30000});

		await page.getByRole('button', {name: 'Check for updates'}).click();

		await expect(page.locator('.pwa-said')).toHaveText('This is the newest build.');

		/* Code, not a comment: a build is minified, and a comment changes nothing of it. */
		fs.appendFileSync(path.join(folder, 'PWA', 'App', 'App.js'), '\nwindow.BuildMark = \'A new build\';\n');

		build();

		await page.getByRole('button', {name: 'Check for updates'}).click();

		await expect(page.locator('.pwa-said')).toContainText('A new build is ready');
		await expect(page.locator('.pwa-waiting')).toHaveText('waiting');
		await expect(page.locator('.pwa-version')).toHaveText(first);

		await Promise.all([page.waitForEvent('load'), page.getByRole('button', {name: 'Update now'}).click()]);

		await expect(page.locator('.pwa-version')).not.toHaveText(first, {timeout: 30000});
		await expect(page.locator('.pwa-version')).not.toHaveText('not kept yet');
		await expect(page.locator('.pwa-waiting')).toHaveText('none');
		await expect(page.locator('.pwa-list li')).toHaveText(['Buy milk']);
	});
});
