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

test('official Advanced Application example supports a single Authorized guard', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/authorized');
	await expect(page).toHaveURL(/\/authorized$/);
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Login required'}), errors);

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
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Welcome to Elemenx'}), errors);

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
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Login required'}), errors);
	await expect(page.getByRole('heading', {name: 'Project 42'})).toHaveCount(0);

	expect(errors).toEqual([]);
});

test('official Advanced Application example supports guard redirect', async ({ page }) => {
	var errors = captureErrors(page);

	await page.goto('http://127.0.0.1:4274/redirect-protected');
	await expect(page).toHaveURL('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.getByRole('heading', {name: 'Welcome to Elemenx'}), errors);

	await page.getByRole('button', {name: 'Enable session'}).click();
	await page.getByRole('link', {name: 'Redirect', exact: true}).click();

	await expect(page).toHaveURL(/\/redirect-protected$/);
	await expect(page.getByRole('heading', {name: 'Redirect-protected route'})).toBeVisible();

	expect(errors).toEqual([]);
});
test('official Advanced Application example demonstrates Storage and Messaging end to end', async ({ page }) => {
	var errors = captureErrors(page);
	var card;

	await page.goto('http://127.0.0.1:4274/');
	card = page.locator('.storage-messaging-showcase');
	await expectBootstrapVisible(card, errors);

	await card.getByRole('button', {name: 'Write storage values'}).click();
	await expect(card).toContainText('Local: local value');
	await expect(card).toContainText('Session: session value');
	await expect(card).toContainText('Cookie: cookie value');

	await card.getByRole('button', {name: 'Remove values'}).click();
	await expect(card).toContainText('Local: not set');
	await expect(card).toContainText('Session: not set');
	await expect(card).toContainText('Cookie: not set');

	await card.getByRole('button', {name: 'Send context message'}).click();
	await expect(card).toContainText('advanced:events: context message');
	await expect(card).toContainText('Message count: 1');
	await card.getByRole('button', {name: 'Send storage message'}).click();
	await expect(card).toContainText('advanced:storage: storage message');
	await expect(card).toContainText('Message count: 2');

	await card.getByRole('button', {name: 'Detach storage handler'}).click();
	await expect(card).toContainText('Storage handler: detached');
	await expect(card.getByRole('button', {name: 'Attach storage handler'})).toBeVisible();
	await card.getByRole('button', {name: 'Send storage message'}).click();
	await expect(card).toContainText('Message count: 2');
	await expect(card).toContainText('advanced:storage: storage message');

	await card.getByRole('button', {name: 'Send direct message'}).click();
	await expect(card).toContainText('advanced:receiver: direct message');
	await expect(card).toContainText('Message count: 3');

	await card.getByRole('button', {name: 'Attach storage handler'}).click();
	await expect(card).toContainText('Storage handler: attached');
	await expect(card.getByRole('button', {name: 'Detach storage handler'})).toBeVisible();
	await card.getByRole('button', {name: 'Send storage message'}).click();
	await expect(card).toContainText('advanced:storage: storage message');
	await expect(card).toContainText('Message count: 4');

	await card.getByRole('button', {name: 'Run IndexedDB roundtrip'}).click();
	await expect(card).toContainText('Index matches: 1');
	await expect(card).toContainText('Transaction result: Transaction committed');

	expect(errors).toEqual([]);
});

test('official Advanced Application example demonstrates nested loops, components and conditions', async ({ page }) => {
	var errors = captureErrors(page);
	var telemetry;

	await page.goto('http://127.0.0.1:4274/');
	await expectBootstrapVisible(page.locator('.project-card').first(), errors);
	await expect(page.locator('.project-card')).toHaveCount(2);
	await expect(page.locator('.environment-card')).toHaveCount(3);
	await expect(page.locator('.service-badge')).toHaveCount(4);
	await expect(page.getByText('No services in this environment.')).toBeVisible();
	await expect(page.locator('.counter-iteration')).toHaveCount(5);
	await expect(page.locator('.counter-iteration').nth(0)).toHaveText('Iteration 0');
	await expect(page.locator('.counter-iteration').nth(4)).toHaveText('Iteration 4');
	await expect(page.locator('.counter-iteration').filter({hasText: "It's 3"})).toHaveCount(1);
	await expect(page.locator('.counter-iteration').nth(3)).toContainText("It's 3");
	await expect(page.locator('.iterator-badge')).toHaveCount(3);
	await expect(page.locator('.iterator-badge').nth(0)).toContainText('Build image');
	await expect(page.locator('.iterator-badge').nth(0)).toContainText('Protected');
	await expect(page.locator('.iterator-badge').nth(2)).toContainText('Waiting');

	telemetry = page.locator('.service-badge').filter({hasText: 'Telemetry'});
	await expect(telemetry).toContainText('Offline');
	await expect(telemetry.getByText('Protected')).toHaveCount(0);
	await telemetry.getByRole('button', {name: 'Toggle state'}).click();
	await expect(telemetry).toContainText('Online');
	await expect(telemetry.getByText('Protected')).toBeVisible();

	expect(errors).toEqual([]);
});