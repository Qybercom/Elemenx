import { test, expect } from '@playwright/test';

function captureErrors (page) {
	var errors = [];

	page.on('pageerror', function (error) {
		errors.push(error.message);
	});

	page.on('console', function (message) {
		if (message.type() === 'error')
			errors.push(message.text());
	});

	return errors;
}

test('official Advanced production bundle runs without its source application graph', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4276/');
	await expect(page.getByRole('heading', {name: 'Welcome to Elemenx'})).toBeVisible();
	await expect(page.locator('.project-card')).toHaveCount(2);

	var source = await page.request.get('http://127.0.0.1:4276/application/index.js');
	expect(source.status()).toBe(200);
	expect(await source.text()).toContain('<!DOCTYPE html>');

	await page.getByRole('button', {name: 'Run XHR request'}).click();
	await expect(page.getByText('Elemenx Network is online', {exact: true})).toBeVisible();
	await expect(page.getByText('Success', {exact: true})).toBeVisible();

	expect(errors).toEqual([]);
});