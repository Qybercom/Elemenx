import { expect, test } from '@playwright/test';

var origin = 'http://127.0.0.1:4277';

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

test.describe('Elemenx documentation', function () {
	test.beforeEach(async function ({ page }) {
		await page.addInitScript(function () {
			if (!sessionStorage.getItem('docs-test'))
				localStorage.clear();

			sessionStorage.setItem('docs-test', '1');
		});
	});

	test('shows a page of the guide and a page of the reference with its live example', async function ({ page }) {
		var errors = captureErrors(page);
		var article = page.locator('.docs-article');

		await page.goto(origin + '/');

		await expect(article.locator('h1')).toHaveText('Getting started');

		await page.goto(origin + '/components/Button');

		await expect(article.locator('h1')).toHaveText('Button');
		await expect(article).toContainText('Variant: primary');
		await expect(article.locator('.docs-example-result .elemenx-button').first()).toBeVisible();
		await expect(article.locator('.docs-example .elemenx-code-view').first()).toBeVisible();

		await page.goto(origin + '/directives/badge');

		await expect(article.locator('h1')).toHaveText('*badge');

		expect(errors).toEqual([]);
	});

	test('switches to Russian, keeps the language and finds a page by the search of the contents', async function ({ page }) {
		var errors = captureErrors(page);
		var article = page.locator('.docs-article');
		var nav = page.locator('.docs-nav');

		await page.goto(origin + '/components/Button');

		await expect(article.locator('h1')).toHaveText('Button');

		await page.locator('.docs-header').getByText('RU', {exact: true}).click();

		await expect(article).toContainText('Кнопка.');
		await expect(article.locator('h2').filter({hasText: /^Пример$/})).toHaveCount(1);
		await expect(page.locator('.docs-fallback')).toHaveCount(0);

		await page.reload();

		await expect(article).toContainText('Кнопка.');

		await nav.locator('input').first().fill('Toggle');
		await nav.getByText('Toggle', {exact: true}).click();

		await expect(page).toHaveURL(/\/components\/Toggle$/);
		await expect(article.locator('h1')).toHaveText('Toggle');
		await expect(article).toContainText('Переключатель');

		await page.goto(origin + '/guide/start');

		await expect(article.locator('h1')).toHaveText('Начало работы');

		expect(errors).toEqual([]);
	});

	test('tells a page that does not exist', async function ({ page }) {
		await page.goto(origin + '/components/Nothing');

		await expect(page.locator('.docs-missing')).toHaveText('There is no such page.');
	});
});

test.describe('Elemenx documentation in a browser of another language', function () {
	test.use({locale: 'ru-RU'});

	test('dates and numbers of the components follow the language of the page, not the one of the browser', async function ({ page }) {
		var errors = captureErrors(page);

		await page.addInitScript(function () {
			localStorage.setItem('elemenx-docs:language', 'en');
		});

		await page.goto(origin + '/components/Calendar');

		await expect(page.locator('.docs-example-result .elemenx-cal-title').first()).toHaveText(/^[A-Z][a-z]+ \d{4}$/);
		await expect(page.locator('.docs-example-result .elemenx-cal-weekday').first()).toHaveText('Mon');

		await page.goto(origin + '/components/DateRangeInput');
		await page.locator('.docs-example-result .elemenx-range-toggle').first().click();

		await expect(page.locator('.elemenx-range-panel .elemenx-calendar-title').first()).toHaveText(/^[A-Z][a-z]+ \d{4}$/);

		expect(errors).toEqual([]);
	});
});
