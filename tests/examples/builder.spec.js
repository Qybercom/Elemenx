import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

var origin = 'http://127.0.0.1:4278';

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

/* The builder in English with an empty page; what it keeps stays only for the reloads of the test. */
async function open (page) {
	await page.addInitScript(function () {
		if (!sessionStorage.getItem('builder-test')) {
			localStorage.clear();
			localStorage.setItem('elemenx-builder:language', 'en');
		}

		sessionStorage.setItem('builder-test', '1');
	});

	await page.goto(origin + '/');

	await expect(page.locator('.builder-palette [data-kind="button"]')).toBeVisible();
}

function document (page) {
	return page.evaluate(function () {
		return JSON.parse(localStorage.getItem('elemenx-builder:document'));
	});
}

/* Drags with the pointer from the middle of one box to a point, in steps, as a hand does (the box scrolled into view first). */
async function drag (page, from, x, y) {
	var box;

	await from.scrollIntoViewIfNeeded();

	box = await from.boundingBox();

	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 20, {steps: 4});
	await page.mouse.move(x, y, {steps: 10});
	await page.mouse.up();
}

test.describe('Elemenx builder', function () {
	test('adds components from the palette, edits their props and text, and undoes and redoes the changes', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.builder-palette');
		var canvas = page.locator('.builder-canvas');
		var inspector = page.locator('.builder-inspector');

		await open(page);

		await palette.locator('[data-kind="card"]').click();
		await palette.locator('[data-kind="heading"]').click();

		/* A container takes the next element; another element puts it after itself. */
		await expect(canvas.locator('.elemenx-card h2')).toHaveText('Heading');
		await expect(inspector.locator('.builder-inspector-title')).toHaveText('Heading');

		await inspector.locator('textarea').fill('Sign in');

		await expect(canvas.locator('.elemenx-card h2')).toHaveText('Sign in');

		await palette.locator('[data-kind="button"]').click();

		await expect(canvas.locator('.elemenx-card .elemenx-button')).toHaveText('Button');

		await inspector.locator('input[name="Label"]').fill('Go');
		await inspector.locator('.builder-inspector-field').filter({hasText: 'Variant'}).locator('.elemenx-select').click();
		await page.getByRole('option', {name: 'primary'}).click();

		await expect(canvas.locator('.elemenx-card .elemenx-button.primary')).toHaveText('Go');
		await expect(page.locator('.elemenx-workspace-status')).toContainText('3 elements');

		/* The canvas takes the pointer: a press selects the element under it, the page itself does nothing. */
		await canvas.locator('h2').click({force: true});

		await expect(inspector.locator('.builder-inspector-title')).toHaveText('Heading');

		await page.locator('.builder-stage').click({position: {x: 8, y: 8}});

		await page.keyboard.press('Control+z');

		await expect(canvas.locator('.elemenx-card .elemenx-button')).toHaveClass(/secondary/);

		await page.keyboard.press('Control+z');

		await expect(canvas.locator('.elemenx-card .elemenx-button')).toHaveText('Button');

		await page.keyboard.press('Control+Shift+z');
		await page.keyboard.press('Control+Shift+z');

		await expect(canvas.locator('.elemenx-card .elemenx-button.primary')).toHaveText('Go');

		/* The page stays for the next visit. */
		await page.reload();

		await expect(canvas.locator('.elemenx-card .elemenx-button.primary')).toHaveText('Go');

		expect(errors).toEqual([]);
	});

	test('drops components from the palette where the line shows and moves elements by the grip of the selection', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.builder-palette');
		var canvas = page.locator('.builder-canvas');
		var box;
		var doc;

		await open(page);

		await palette.locator('[data-kind="row"]').click();
		await palette.locator('[data-kind="paragraph"]').click();

		/* A button dropped on the left half of the paragraph goes before it, in the row. */
		box = await canvas.locator('p').boundingBox();

		await drag(page, palette.locator('[data-kind="button"]'), box.x + 4, box.y + box.height / 2);

		doc = await document(page);

		expect(doc.Children[0].Kind).toBe('row');
		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['button', 'paragraph']);

		/* A heading dropped under the row goes on the page, after it. */
		box = await canvas.locator('.elemenx-container').boundingBox();

		await drag(page, palette.locator('[data-kind="heading"]'), box.x + 40, box.y + box.height + 60);

		doc = await document(page);

		expect(doc.Children.map(function (node) {
			return node.Kind;
		})).toEqual(['row', 'heading']);

		/* The heading, selected, moves into the row by its grip. */
		await expect(page.locator('.builder-selection')).toBeVisible();

		box = await canvas.locator('p').boundingBox();

		await drag(page, page.locator('.builder-grip'), box.x + box.width - 4, box.y + box.height / 2);

		doc = await document(page);

		expect(doc.Children.length).toBe(1);
		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['button', 'paragraph', 'heading']);

		/* Delete removes the selected element. */
		await page.keyboard.press('Delete');

		doc = await document(page);

		expect(doc.Children[0].Children.length).toBe(2);

		expect(errors).toEqual([]);
	});

	test('exports the page as a template and imports a template back, keeping the elements it does not know', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.builder-canvas');
		var dialog = page.locator('dialog[open]');
		var template = '<div class="elemenx-column">\n\t<h1>Hello</h1>\n\t<Card Title="Account" Variant="elevated">\n\t\t<Toggle Label="Notify me" Checked="true" />\n\t\t<RadioGroup [options]="[{Value: \'Day\', Label: \'Day\'}, {Value: \'Week\', Label: \'Week\'}]" />\n\t\t<Image Ratio="1:1" />\n\t</Card>\n\t<section data-note="kept"><b>Raw</b> text</section>\n</div>';

		await open(page);

		await page.getByRole('button', {name: 'Import'}).click();

		await dialog.locator('textarea').fill(template);
		await dialog.getByRole('button', {name: 'Import'}).click();

		await expect(dialog).toHaveCount(0);
		await expect(canvas.locator('h1')).toHaveText('Hello');
		await expect(canvas.locator('.elemenx-card')).toContainText('Account');
		await expect(canvas.locator('.elemenx-toggle.checked')).toContainText('Notify me');
		await expect(canvas.locator('section[data-note="kept"]')).toHaveText('Raw text');

		await page.getByRole('button', {name: 'Export'}).click();

		await expect(dialog.locator('.elemenx-code-view')).toContainText('<Card Title="Account" Variant="elevated">');
		expect((await dialog.locator('.elemenx-code-view').innerText()).trim()).toBe(template);

		await page.keyboard.press('Escape');

		await expect(dialog).toHaveCount(0);

		/* A text without an element is refused; the page stays. */
		await page.getByRole('button', {name: 'Import'}).click();

		await dialog.locator('textarea').fill('just words');
		await dialog.getByRole('button', {name: 'Import'}).click();

		await expect(dialog.locator('.elemenx-callout.danger')).toHaveText('The text holds no element.');
		await expect(canvas.locator('h1')).toHaveText('Hello');

		expect(errors).toEqual([]);
	});

	test('has every component of ElemenxUI and the classes of its layouts in the palette, with a search', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.builder-palette');
		var library = path.resolve('libraries/ElemenxUI/components');
		var own = {Avatar: 'avatar', Button: 'button', ButtonGroup: 'buttongroup', Card: 'card', Checkbox: 'checkbox', DateInput: 'date', EmptyState: 'empty', Field: 'field', Icon: 'icon', Image: 'image', Input: 'input', Progress: 'progress', RadioGroup: 'radio', Rating: 'rating', Section: 'section', Select: 'select', Slider: 'slider', Spinner: 'spinner', Tabs: 'tabs', TextArea: 'textarea', Toggle: 'toggle'};
		var names = fs.readdirSync(library).filter(function (name) {
			return fs.existsSync(path.join(library, name, name + '.js'));
		});
		var kinds;

		await open(page);

		kinds = await palette.locator('.builder-palette-item').evaluateAll(function (items) {
			return items.map(function (item) {
				return item.getAttribute('data-kind');
			});
		});

		/* Every component, by a kind of its own name or by a kind of the builder; and the classes of the layouts. */
		expect(names.length).toBeGreaterThan(120);
		expect(names.filter(function (name) {
			return kinds.indexOf(own[name] || name) === -1;
		})).toEqual([]);
		expect(kinds).toEqual(expect.arrayContaining(['screen', 'row', 'column', 'grid', 'panel', 'gamepanel', 'paragraph', 'textstyle', 'link', 'badge', 'kbd', 'code', 'bullets', 'numbers', 'chips', 'table', 'stats', 'document']));

		/* The search keeps the kinds whose name holds its text, and says when none does. */
		await palette.locator('input').fill('game');

		await expect(palette.locator('.builder-palette-item')).toHaveCount(13);
		await expect(palette.locator('[data-kind="GameBar"]')).toBeVisible();

		await palette.locator('input').fill('nothing like it');

		await expect(palette.locator('.builder-palette-item')).toHaveCount(0);
		await expect(palette).toContainText('Nothing found.');

		await palette.locator('input').fill('');

		await expect(palette.locator('.builder-palette-item')).toHaveCount(kinds.length);
		expect(errors).toEqual([]);
	});

	test('builds with the classes of the layouts, the props of any component, its expressions and its named slots', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.builder-palette');
		var canvas = page.locator('.builder-canvas');
		var inspector = page.locator('.builder-inspector');
		var dialog = page.locator('dialog[open]');
		var exported;
		var template = '<div class="elemenx-screen">\n\t<div class="elemenx-container wrappable fill">\n\t\t<p class="elemenx-text small muted">Muted</p>\n\t\t<div class="elemenx-eyebrow">Eyebrow</div>\n\t\t<table class="elemenx-table striped">\n\t\t\t<thead>\n\t\t\t\t<tr><th>Name</th><th>Role</th></tr>\n\t\t\t</thead>\n\t\t\t<tbody>\n\t\t\t\t<tr><td>—</td><td>—</td></tr>\n\t\t\t</tbody>\n\t\t</table>\n\t\t<Splitter>\n\t\t\t<p slot="first">One</p>\n\t\t\t<p slot="second">Two</p>\n\t\t</Splitter>\n\t\t<Breadcrumbs [items]="[{ID: \'a\', Label: \'Alpha\'}, {ID: \'b\', Label: \'Beta\'}]" Separator="slash" />\n\t</div>\n</div>';

		await open(page);

		/* A screen with a component the builder knows by its source: its props, an expression among them. */
		await palette.locator('[data-kind="screen"]').click();
		await palette.locator('input').fill('Breadcrumbs');
		await palette.locator('[data-kind="Breadcrumbs"]').click();

		await expect(canvas.locator('.elemenx-screen .elemenx-breadcrumbs')).toContainText('Docs');
		await expect(inspector.locator('.builder-inspector-title')).toHaveText('Breadcrumbs');

		await inspector.locator('textarea[name="Items"]').fill('[{ID: \'x\', Label: \'Xenon\'}]');

		await expect(canvas.locator('.elemenx-breadcrumbs')).toContainText('Xenon');

		await page.getByRole('button', {name: 'Export'}).click();

		exported = (await dialog.locator('.elemenx-code-view').innerText()).trim();

		expect(exported).toContain('<div class="elemenx-screen">');
		expect(exported).toContain('<Breadcrumbs [items]="[{ID: \'x\', Label: \'Xenon\'}]" />');

		await page.keyboard.press('Escape');

		/* A template of the classes, the slots and the expressions comes back the same, element for element. */
		await page.getByRole('button', {name: 'Import'}).click();

		await dialog.locator('textarea').fill(template);
		await dialog.getByRole('button', {name: 'Import'}).click();

		await expect(canvas.locator('.elemenx-splitter')).toContainText('One');
		await expect(canvas.locator('.elemenx-table th')).toHaveText(['Name', 'Role']);

		await page.getByRole('button', {name: 'Export'}).click();

		expect((await dialog.locator('.elemenx-code-view').innerText()).trim()).toBe(template);

		await page.keyboard.press('Escape');

		/* The kinds of classes are kinds of the builder, with their modifiers as fields; a child of a component with slots picks its slot. */
		await page.locator('.elemenx-workspace-stripe').getByRole('button', {name: 'Structure'}).click();
		await page.locator('.elemenx-tree').getByText('Paragraph · Muted').click();

		await expect(inspector.locator('.builder-inspector-title')).toHaveText('Paragraph');

		await page.locator('.elemenx-tree').getByText('Paragraph · Two').click();

		await expect(inspector.locator('.elemenx-select').first()).toContainText('second');

		await inspector.locator('.elemenx-select').first().click();
		await page.getByRole('option', {name: 'first'}).click();

		await page.getByRole('button', {name: 'Export'}).click();

		await expect(dialog.locator('.elemenx-code-view')).toContainText('<p slot="first">Two</p>');

		expect(errors).toEqual([]);
	});

	test('selects from the structure, previews the page at the width of a phone and speaks Russian', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.builder-palette');
		var canvas = page.locator('.builder-canvas');

		await open(page);

		await palette.locator('[data-kind="section"]').click();
		await palette.locator('[data-kind="checkbox"]').click();

		await page.locator('.elemenx-workspace-stripe').getByRole('button', {name: 'Structure'}).click();
		await page.locator('.elemenx-tree').getByText('Section · Section').click();

		await expect(page.locator('.builder-inspector-title')).toHaveText('Section');

		await page.getByText('Phone', {exact: true}).click();

		await expect.poll(async function () {
			return Math.round((await page.locator('.builder-surface').boundingBox()).width);
		}).toBe(390);

		await page.getByText('Preview', {exact: true}).click();

		await expect(page.locator('.builder-layer')).toHaveCount(0);

		await canvas.locator('.elemenx-check').click();

		await expect(canvas.locator('.elemenx-check input')).toBeChecked();

		await page.getByText('RU', {exact: true}).click();

		await expect(page.locator('.builder-brand')).toHaveText('EКонструктор');
		await expect(page.locator('.builder-inspector-title')).toHaveText('Раздел');

		expect(errors).toEqual([]);
	});
});
