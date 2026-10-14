import { test, expect } from '../coverage/playwright.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import Builder from '../../tools/builder.js';

var project = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
var output = path.resolve(process.cwd(), 'tests', 'dist', 'single-output');

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

test.describe('elemenx build --single', function () {
	test.beforeAll(function () {
		Builder.Build(project, {single: true, out: '../single-output'});
	});

	test('puts the framework, the Application and ElemenxUI into one index.html that runs from a file', async function ({ page }) {
		var html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
		var list = errors(page);

		expect(fs.readdirSync(output).sort()).toEqual(['index.html', 'logo.svg', 'worker.js']);
		expect(html).not.toMatch(/<script[^>]*\bsrc=/);
		expect(html).toContain('<script id="elemenx">');
		expect(html).toContain('Elemenx.Resource("/libraries/ElemenxUI/index.svg"');
		expect(html).not.toContain('A comment the build removes');
		expect(html).toContain('single-title');

		await page.goto(pathToFileURL(path.join(output, 'index.html')).href);

		await expect(page.locator('.single-title')).toHaveText('Single file');
		expect(await page.locator('.single-title').evaluate(function (node) {
			return getComputedStyle(node).color;
		})).toBe('rgb(61, 122, 84)');
		await expect(page.locator('svg[data-icon="add"] path')).toHaveCount(1);
		await expect(page.locator('svg[data-icon="brands:github"] .brand')).toHaveCount(1);
		expect(await page.locator('.single-logo').evaluate(function (node) {
			return node.complete && node.naturalWidth;
		})).toBe(32);

		await page.getByRole('button', {name: 'Count'}).click();

		await expect(page.locator('.single-clicks')).toHaveText('1');
		expect(list).toEqual([]);
	});

	test('routes from a file in Mode memory: the page URL stays, Back returns to the previous route', async function ({ page }) {
		var url = pathToFileURL(path.join(output, 'index.html')).href;
		var list = errors(page);

		await page.goto(url);

		await expect(page.locator('.single-page')).toHaveText('/');

		await page.locator('.single-about').click();

		await expect(page.locator('.single-page')).toHaveText('/about');
		expect(page.url()).toBe(url);

		await page.goBack();

		await expect(page.locator('.single-page')).toHaveText('/');
		expect(list).toEqual([]);
	});

	test('starts a worker from the framework inline in the page', async function ({ page }) {
		var list = errors(page);

		await page.goto('/tests/dist/single-output/index.html');

		await page.getByRole('button', {name: 'Start the worker'}).click();

		await expect(page.locator('.single-worker')).toHaveText('Running');
		expect(list).toEqual([]);
	});
});
