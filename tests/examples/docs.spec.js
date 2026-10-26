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

	test('switches to Russian, keeps the language and finds a page by the search of the whole reference in its header', async function ({ page }) {
		var errors = captureErrors(page);
		var article = page.locator('.docs-article');
		var nav = page.locator('.docs-nav');
		var search = page.locator('.docs-header .docs-search');

		await page.goto(origin + '/components/Button');

		/* The field of the search has a name of its own, not only its placeholder: there is no Field round it. */
		await expect(search.locator('input.elemenx-input-control')).toHaveAttribute('aria-label', 'Search the reference');

		/* The components by their groups, the group of the page open. */
		await expect(nav.getByText('Buttons', {exact: true})).toBeVisible();
		await expect(nav.getByText('Button', {exact: true})).toBeVisible();

		await expect(article.locator('h1')).toHaveText('Button');

		await page.locator('.docs-header').getByText('RU', {exact: true}).click();

		await expect(article).toContainText('Кнопка.');
		await expect(article.locator('h2').filter({hasText: /^Пример$/})).toHaveCount(1);
		await expect(page.locator('.docs-fallback')).toHaveCount(0);

		await page.reload();

		await expect(article).toContainText('Кнопка.');

		/* The search reads the text of every page in the language: a word of the description finds the page, its title first. */
		await search.locator('input').fill('Переключатель');

		await expect(search.locator('.docs-search-result').first().locator('.docs-search-title')).toHaveText('Toggle');
		await expect(search.locator('.docs-search-result').first().locator('.docs-search-hit').first()).toHaveText(/переключатель/i);

		await search.locator('.docs-search-result').first().click();

		await expect(page).toHaveURL(/\/components\/Toggle$/);
		await expect(article.locator('h1')).toHaveText('Toggle');
		await expect(article).toContainText('Переключатель');

		/* The keys: the arrows go through the pages found, Enter opens one, Escape closes the list. */
		await search.locator('input').fill('dialog');

		await expect(search.locator('.docs-search-result').first()).toHaveClass(/active/);

		await search.locator('input').press('ArrowDown');

		await expect(search.locator('.docs-search-result').nth(1)).toHaveClass(/active/);

		await search.locator('input').press('Escape');

		await expect(search.locator('.docs-search-results')).toHaveCount(0);

		await page.goto(origin + '/guide/start');

		await expect(article.locator('h1')).toHaveText('Начало работы');

		expect(errors).toEqual([]);
	});

	test('shows the example of the page it goes to through the contents, not the one of the page before', async function ({ page }) {
		var errors = captureErrors(page);
		var nav = page.locator('.docs-nav');
		var result = page.locator('.docs-example-result').first();

		await page.goto(origin + '/components/Button');

		await expect(result).toContainText('Primary');

		/* Through the group of the components it is in. */
		await nav.getByText('Inputs', {exact: true}).click();
		await nav.getByText('Checkbox', {exact: true}).click();

		await expect(page).toHaveURL(/\/components\/Checkbox$/);
		await expect(result).toContainText('Remember me');
		await expect(result).not.toContainText('Primary');

		await nav.getByText('Toggle', {exact: true}).click();

		await expect(result).toContainText('Notifications');
		await expect(result).not.toContainText('Remember me');

		expect(errors).toEqual([]);
	});

	test('shows the code of an example in listings of its own and the source files of the component of the page', async function ({ page }) {
		var errors = captureErrors(page);
		var example = page.locator('.docs-example').first();
		var source = page.locator('.docs-source');

		/* The example of the Designer: its template, its script and its style, a tab each. */
		await page.goto(origin + '/components/DesignerCanvas');

		await expect(example.locator('.docs-example-listings .elemenx-tab')).toHaveText(['Example.html', 'Example.js', 'Example.css']);
		await expect(example.locator('.elemenx-code-view')).toContainText('<DesignerCanvas Width="desktop" />');
		await expect(example.locator('.elemenx-code-view')).not.toContainText('<script>');

		await example.locator('.docs-example-listings .elemenx-tab').filter({hasText: 'Example.css'}).click();

		await expect(example.locator('.elemenx-code-view')).toContainText('.designer-demo {');

		await example.locator('.docs-example-listings .elemenx-tab').filter({hasText: 'Example.js'}).click();

		await expect(example.locator('.elemenx-code-view')).toContainText('Show: function () {');

		/* The script is shown as an Application writes it: the call that defines the component, not the bare object. */
		expect((await example.locator('.elemenx-code-view').innerText()).trim()).toMatch(/^Elemenx\.Component\('Example', \{\n[\s\S]*\n\}\);$/);

		/* The style of the example applies to its result. */
		await expect(page.locator('.docs-example-result .designer-demo')).toHaveCSS('display', 'grid');

		/* The source of the component: its template, its script and its stylesheet. */
		await expect(source.locator('.elemenx-tab')).toHaveText(['DesignerCanvas.html', 'DesignerCanvas.js', 'DesignerCanvas.css']);
		await expect(source.locator('.elemenx-code-view')).toContainText('<div class="elemenx-designer-canvas"');

		await source.locator('.elemenx-tab').filter({hasText: 'DesignerCanvas.css'}).click();

		await expect(source.locator('.elemenx-code-view')).toContainText('.elemenx-designer-surface {');

		/* A directive has its script alone; a page of the guide has no source. */
		await page.goto(origin + '/directives/swipe');

		await expect(source.locator('.elemenx-tab')).toHaveText(['Swipe.js']);
		await expect(source.locator('.elemenx-code-view')).toContainText('Elemenx.Directive(\'swipe\'');

		await page.goto(origin + '/guide/start');

		await expect(source).toHaveCount(0);

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
