import { expect, test } from '@playwright/test';

/* The whole application in a browser: what a person does, and what they see. */
test.beforeEach(async function ({ page }) {
	await page.goto('/');
	await page.evaluate(function () {
		localStorage.clear();
	});
	await page.reload();
});

test('adds a task, ticks it, filters and clears it', async function ({ page }) {
	var field = page.getByLabel('New task');

	await field.fill('Buy milk');
	await field.press('Enter');
	await field.fill('Call Ada');

	await page.getByRole('button', {name: 'Add'}).click();

	await expect(page.locator('.todo-title')).toHaveText(['Buy milk', 'Call Ada']);
	await expect(page.locator('.todo-left')).toHaveText('2 left');

	await page.getByText('Buy milk').click();

	await expect(page.locator('.todo-left')).toHaveText('1 left');

	await page.getByRole('radio', {name: 'Done'}).check({force: true});

	await expect(page.locator('.todo-title')).toHaveText(['Buy milk']);

	await page.getByRole('button', {name: 'Clear done'}).click();

	await expect(page.locator('.todo-empty')).toBeVisible();
});

test('keeps the tasks after a reload', async function ({ page }) {
	await page.getByLabel('New task').fill('Water the plants');
	await page.getByLabel('New task').press('Enter');
	await page.reload();

	await expect(page.locator('.todo-title')).toHaveText(['Water the plants']);
});
