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

test('official Advanced Application example supports a single Authorized guard', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/authorized');
	await expect(page).toHaveURL(/\/authorized$/);
	await expect(page.getByRole('heading', {name: 'Login required'})).toBeVisible();

	await page.getByRole('link', {name: 'Return home'}).click();
	await page.getByRole('button', {name: 'Enable session'}).click();
	await page.getByRole('link', {name: 'Authorized'}).click();

	await expect(page).toHaveURL(/\/authorized$/);
	await expect(page.getByRole('heading', {name: 'Authorized route'})).toBeVisible();

	expect(errors).toEqual([]);
});

test('official Advanced Application example composes guards and selects each GuardFailed component', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/');
	await expect(page.getByRole('heading', {name: 'Welcome to Elemenx'})).toBeVisible();

	await page.getByRole('link', {name: 'Project'}).click();
	await expect(page).toHaveURL(/\/project\/42\?tab=activity#latest$/);
	await expect(page.getByRole('heading', {name: 'Login required'})).toBeVisible();
	await expect(page.getByText('Authorized', {exact: true}).last()).toBeVisible();
	await expect(page.getByRole('heading', {name: 'Project 42'})).toHaveCount(0);

	await page.getByRole('link', {name: 'Return home'}).click();
	await page.getByRole('button', {name: 'Enable session'}).click();
	await page.getByRole('link', {name: 'Project'}).click();
	await expect(page).toHaveURL(/\/project\/42\?tab=activity#latest$/);
	await expect(page.getByRole('heading', {name: 'Access denied'})).toBeVisible();
	await expect(page.getByText('ProjectAccess', {exact: true})).toBeVisible();
	await expect(page.getByRole('heading', {name: 'Project 42'})).toHaveCount(0);

	await page.getByRole('link', {name: 'Return home'}).click();
	await page.getByRole('button', {name: 'Grant project access'}).click();
	await page.getByRole('link', {name: 'Project'}).click();

	await expect(page).toHaveURL(/\/project\/42\?tab=activity#latest$/);
	await expect(page.getByRole('heading', {name: 'Project 42'})).toBeVisible();
	await expect(page.locator('main')).toContainText('activity');
	await expect(page.locator('main')).toContainText('latest');

	expect(errors).toEqual([]);
});

test('official Advanced Application example renders first GuardFailed component on initial protected URL', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/project/42?tab=activity#latest');
	await expect(page).toHaveURL(/\/project\/42\?tab=activity#latest$/);
	await expect(page.getByRole('heading', {name: 'Login required'})).toBeVisible();
	await expect(page.getByRole('heading', {name: 'Project 42'})).toHaveCount(0);

	expect(errors).toEqual([]);
});

test('official Advanced Application example supports guard redirect', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/redirect-protected');
	await expect(page).toHaveURL('http://127.0.0.1:4274/');
	await expect(page.getByRole('heading', {name: 'Welcome to Elemenx'})).toBeVisible();

	await page.getByRole('button', {name: 'Enable session'}).click();
	await page.getByRole('link', {name: 'Redirect', exact: true}).click();

	await expect(page).toHaveURL(/\/redirect-protected$/);
	await expect(page.getByRole('heading', {name: 'Redirect-protected route'})).toBeVisible();

	expect(errors).toEqual([]);
});
test('official Advanced Application example demonstrates nested loops, components and conditions', async ({ page }) => {
	var errors = captureErrors(page);
	var telemetry;

	await page.goto('http://127.0.0.1:4274/');
	await expect(page.locator('.project-card')).toHaveCount(2);
	await expect(page.locator('.environment-card')).toHaveCount(3);
	await expect(page.locator('.service-badge')).toHaveCount(4);
	await expect(page.getByText('No services in this environment.')).toBeVisible();

	telemetry = page.locator('.service-badge').filter({hasText: 'Telemetry'});
	await expect(telemetry).toContainText('Offline');
	await expect(telemetry.getByText('Protected')).toHaveCount(0);
	await telemetry.getByRole('button', {name: 'Toggle state'}).click();
	await expect(telemetry).toContainText('Online');
	await expect(telemetry.getByText('Protected')).toBeVisible();

	expect(errors).toEqual([]);
});