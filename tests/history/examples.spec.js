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

async function expectBootstrapVisible (locator, errors) {
	var deadline = Date.now() + 5000;

	while (Date.now() < deadline) {
		if (errors.length)
			throw new Error('Elemenx bootstrap failed:\n' + errors.join('\n'));

		if (await locator.isVisible()) return;

		await new Promise(function (resolve) {
			setTimeout(resolve, 50);
		});
	}

	if (errors.length)
		throw new Error('Elemenx bootstrap failed:\n' + errors.join('\n'));

	await expect(locator).toBeVisible({timeout: 0});
}

test('official Simple example runs state, events and persistent storage end to end', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4273/examples/Simple/');
	await expect(page.getByRole('heading', {name: 'Hello from Elemenx'})).toBeVisible();
	await expect(page.locator('.counter-value')).toHaveText('0');
	await page.getByRole('button', {name: 'Increment'}).click();
	await expect(page.locator('.counter-value')).toHaveText('1');

	await page.getByRole('button', {name: /theme$/}).click();
	await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
	await page.reload();
	await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
	await expect(page.getByRole('button', {name: 'Dark theme'})).toBeVisible();

	expect(errors).toEqual([]);
});

test('official Advanced example executes a real Network XHR lifecycle', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network XHR'}), errors);
	await page.getByRole('button', {name: 'Run XHR request'}).click();
	await expect(page.getByText('Elemenx Network is online', {exact: true})).toBeVisible();
	await expect(page.getByText('Success', {exact: true})).toBeVisible();
	await expect(page.locator('.network-xhr-events')).toContainText('BeforeRequest');
	await expect(page.locator('.network-xhr-events')).toContainText('BeforeResponse');
	await expect(page.locator('.network-xhr-events')).toContainText('Success');

	expect(errors).toEqual([]);
});

test('official Advanced example receives a real SSE stream through Protocol', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Network SSE · live server events'}), errors);
	await page.getByRole('button', {name: 'Open SSE stream'}).click();
	await expect(page.locator('.sse-status')).toHaveText('Completed');
	await expect(page.getByText('3 / 3', {exact: true})).toBeVisible();
	await expect(page.locator('.network-sse-events')).toContainText('BeforeConnect');
	await expect(page.locator('.network-sse-events')).toContainText('Open');
	await expect(page.locator('.network-sse-events')).toContainText('Data');
	await expect(page.locator('.network-sse-events')).toContainText('Close');
	await expect(page.getByText('Elemenx SSE event #3 · id 3', {exact: true})).toBeVisible();

	expect(errors).toEqual([]);
});