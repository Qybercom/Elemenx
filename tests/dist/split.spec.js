import { test, expect } from '../coverage/playwright.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

import Builder from '../../tools/builder.js';
import Server from '../../tools/server.js';

var project = path.resolve(process.cwd(), 'tests', 'dist', 'split-project');

function errors (page) {
	var list = [];

	page.on('pageerror', function (error) {
		list.push(error.message);
	});

	page.on('console', function (message) {
		if (message.type() === 'error')
			list.push(message.text());
	});

	return list;
}

/* Builds the fixture with options into a folder of its own, and serves it while run goes. */
async function served (options, run) {
	var folder = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-split-'));
	var output = path.join(folder, 'dist');
	var server;
	var original = process.stdout.write;

	process.stdout.write = function () {
		return true;
	};

	try {
		Builder.Build(project, Object.assign({out: output}, options));
	}
	finally {
		process.stdout.write = original;
	}

	server = Server.Create({Root: output});

	await new Promise(function (resolve) {
		server.Listen(0, '127.0.0.1', resolve);
	});

	try {
		await run('http://127.0.0.1:' + server.Server.address().port, output);
	}
	finally {
		await new Promise(function (resolve) {
			server.Close(resolve);
		});

		fs.rmSync(folder, {recursive: true, force: true});
	}
}

/* The parts the page asked the server for. */
function parts (page) {
	var list = [];

	page.on('request', function (request) {
		if (/\/parts\//.test(request.url()))
			list.push(new URL(request.url()).pathname);
	});

	return list;
}

test.describe('elemenx build: split by its routes', function () {
	test('a site: the page of a route and what it alone uses come in a part, fetched once when the route is shown', async function ({ page }) {
		var problems = errors(page);
		var asked = parts(page);

		await served({}, async function (origin, output) {
			var bundle = fs.readFileSync(path.join(output, 'app.js'), 'utf8');
			var part = fs.readFileSync(path.join(output, 'parts', 'SplitAbout.js'), 'utf8');

			/* The bundle names the part and keeps the first screen; the part has the page, its Component and the Rating. */
			expect(bundle).toContain('Elemenx.Bundle.Part("parts/SplitAbout.js",{"Component":["Rating","SplitAbout","SplitBadge"]})');
			expect(bundle).toContain("Elemenx.Component('SplitHome'");
			expect(bundle).not.toContain('Since 2024');
			expect(part).toContain('Since 2024');
			expect(part).toContain('elemenx-rating');

			await page.goto(origin + '/');

			await expect(page.locator('.split-home')).toHaveText('Home');

			expect(asked).toEqual([]);

			await page.locator('.to-about').click();

			await expect(page.locator('.split-about h1')).toHaveText('About');
			await expect(page.locator('.split-about .elemenx-rating')).toBeVisible();
			await expect(page.locator('.split-badge')).toHaveCSS('font-weight', '700');

			/* Back and there again: the part is not fetched twice. */
			await page.locator('.to-home').click();
			await expect(page.locator('.split-home')).toBeVisible();
			await page.locator('.to-about').click();
			await expect(page.locator('.split-badge')).toBeVisible();

			expect(asked).toEqual(['/parts/SplitAbout.js']);

			/* Opened on the route of the part: it comes before the page is shown. */
			await page.goto(origin + '/about');

			await expect(page.locator('.split-badge')).toHaveText('Since 2024');
		});

		expect(problems).toEqual([]);
	});

	test('a widget: its parts reach its own Elemenx, which the window has not', async function ({ page }) {
		var problems = errors(page);
		var asked = parts(page);

		await served({widget: true}, async function (origin, output) {
			expect(fs.readFileSync(path.join(output, 'parts', 'SplitAbout.js'), 'utf8')).toMatch(/^\(window\["elemenx-widget:split-project:part"\] \|\| function \(\) \{\}\)\(function \(Elemenx\) \{\n/);

			await page.goto(origin + '/');

			await expect(page.locator('.split-home')).toHaveText('Home');

			await page.locator('.to-about').click();

			await expect(page.locator('.split-badge')).toHaveText('Since 2024');
			await expect(page.locator('.split-about .elemenx-rating')).toBeVisible();

			expect(asked).toEqual(['/parts/SplitAbout.js']);
			expect(await page.evaluate(function () {
				return typeof window.Elemenx;
			})).toBe('undefined');
		});

		expect(problems).toEqual([]);
	});

	test('--no-split keeps one bundle', async function () {
		await served({split: false}, async function (origin, output) {
			expect(fs.existsSync(path.join(output, 'parts'))).toBe(false);
			expect(fs.readFileSync(path.join(output, 'app.js'), 'utf8')).toContain('Since 2024');
		});
	});
});
