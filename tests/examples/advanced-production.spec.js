import { test, expect } from '../coverage/playwright.js';

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

test('official Advanced production bundle runs without its source application graph', async function ({ page }) {
	var errors = captureErrors(page);
	var sourceRequests = [];

	page.on('request', function (request) {
		if (request.url().indexOf('/application/') !== -1)
			sourceRequests.push(request.url());
	});

	await page.goto('http://127.0.0.1:4276/');

	await expect(page.getByRole('heading', {name: 'Welcome to Elemenx'})).toBeVisible();
	await expect(page.locator('.project-card')).toHaveCount(2);

	await page.getByRole('button', {name: 'Run XHR request'}).click();

	await expect(page.getByText('Elemenx Network is online', {exact: true})).toBeVisible();
	await expect(page.getByText('Success', {exact: true})).toBeVisible();

	expect(sourceRequests).toEqual([]);
	expect(errors).toEqual([]);
});
/* The production build precompiles the expressions of its templates: a page that forbids eval (an extension) runs it. */
test('official Advanced production bundle renders its catalogue under a Content-Security-Policy without eval', async function ({ page }) {
	var errors = captureErrors(page);
	var violations = [];

	await page.route('http://127.0.0.1:4276/**', async function (route) {
		var response;

		if (route.request().resourceType() !== 'document') {
			await route.continue();

			return;
		}

		response = await route.fetch();

		await route.fulfill({response: response, headers: Object.assign({}, response.headers(), {'content-security-policy': "script-src 'self'; object-src 'none'"})});
	});

	page.on('console', function (message) {
		if (/Content Security Policy|unsafe-eval/i.test(message.text()))
			violations.push(message.text());
	});

	await page.goto('http://127.0.0.1:4276/ui');

	await expect(page.locator('.ui-kit > .elemenx-section')).toHaveCount(45, {timeout: 60000});
	await expect(page.locator('.ui-kit-lazy')).toHaveCount(45, {timeout: 60000});
	await expect(page.locator('.ui-kit-game-hud .elemenx-game-bar').first()).toBeVisible();

	/* Templates that render later: a window with tabs, a table and dials, the pause menu. */
	await page.getByRole('button', {name: 'Systems'}).click();
	await page.getByRole('tab', {name: 'Files'}).click();

	await expect(page.locator('.elemenx-window').filter({hasText: 'Systems'}).locator('.elemenx-table tbody tr')).toHaveCount(15);

	await page.locator('.ui-kit-game-hud').getByRole('button', {name: 'Pause', exact: true}).click();

	await expect(page.locator('.elemenx-game-menu')).toBeVisible();

	expect(violations).toEqual([]);
	expect(errors).toEqual([]);

	/* The policy is in force on the page: an inline script is refused (the evaluation of the test itself is not). */
	expect(await page.evaluate(function () {
		return new Promise(function (resolve) {
			var script = document.createElement('script');

			document.addEventListener('securitypolicyviolation', function (event) {
				resolve(event.violatedDirective);
			}, {once: true});

			script.textContent = 'window.inline = true;';

			document.head.appendChild(script);

			setTimeout(function () {
				resolve('none');
			}, 1000);
		});
	})).toMatch(/^script-src/);
});
