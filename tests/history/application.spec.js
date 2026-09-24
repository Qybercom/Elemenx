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

test('official Advanced Application example enforces Guard and navigates after authorization', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4174/');
	await expect(page.locator('h1')).toHaveText('Home');
	await expect(page.locator('main')).toContainText('This example uses Router, Service and Guard.');

	await page.getByRole('link', {name: 'Project'}).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('h1')).toHaveText('Home');

	await page.getByRole('button', {name: 'Enable protected project'}).click();
	await page.getByRole('link', {name: 'Project'}).click();

	await expect(page).toHaveURL(/\/project\/42\?tab=activity#latest$/);
	await expect(page.locator('h1')).toHaveText('Project 42');
	await expect(page.locator('main')).toContainText('activity');
	await expect(page.locator('main')).toContainText('latest');

	expect(errors).toEqual([]);
});

test('official Advanced Application example enforces Guard on initial protected URL', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4174/project/42?tab=activity#latest');
	await expect(page.locator('h1')).toHaveCount(0);
	await expect(page.getByText('Project 42', { exact: true })).toHaveCount(0);

	expect(errors).toEqual([]);
});