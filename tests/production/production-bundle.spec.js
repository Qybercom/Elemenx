import { test, expect } from '@playwright/test';

test('runs multi-Application dist without source graphs', async function ({ page }) {
	await page.goto('http://127.0.0.1:4275/');

	await expect(page.locator('#foo-root')).toHaveText(/Foo production/);
	await expect(page.locator('#bar-root')).toHaveText('Bar production');

	var config = await page.request.get('http://127.0.0.1:4275/elemenx.config.js');

	expect(config.status()).toBe(404);
});