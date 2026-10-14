import { test, expect } from '../coverage/playwright.js';
import path from 'path';
import { pathToFileURL } from 'url';

/* dist is built by npm run dist before the end-to-end tests (npm test). */
var page = pathToFileURL(path.resolve(process.cwd(), 'tests', 'dist', 'standalone.html')).href;

test('a page with no build and no server runs Elemenx and ElemenxUI from dist/elemenx.all.min.js and the scripts of the packs it uses', async function ({ page: browser }) {
	var errors = [];

	browser.on('pageerror', function (error) {
		errors.push(error.message);
	});

	browser.on('console', function (message) {
		if (message.type() === 'error')
			errors.push(message.text());
	});

	await browser.goto(page);

	await expect(browser.locator('#standalone .elemenx-button.primary')).toBeVisible();
	await expect(browser.locator('#standalone svg[data-icon="save"] path')).toHaveCount(1);
	await expect(browser.locator('#standalone svg[data-icon="weather:rain"] .cloud')).toHaveCount(1);
	await expect(browser.locator('#standalone svg[data-icon="files:pdf"] text')).toHaveText('PDF');

	await browser.locator('#standalone .elemenx-button.primary').click();

	await expect(browser.locator('#clicks')).toHaveText('1');

	await browser.locator('.elemenx-emoji-item[data-char="😀"]').click();

	await expect(browser.locator('#picked')).toHaveText('😀');
	expect(await browser.locator('#standalone .elemenx-button.primary').evaluate(function (node) {
		return getComputedStyle(node).backgroundColor;
	})).toBe('rgb(75, 68, 61)');
	expect(errors).toEqual([]);
});
