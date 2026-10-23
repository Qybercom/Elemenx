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

	await expect(page.locator('.elemenx-designer-palette [data-kind="Button"]')).toBeVisible();
}

function document (page) {
	return page.evaluate(function () {
		return JSON.parse(localStorage.getItem('elemenx-designer:document'));
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

/* Imports a template in place of the page. */
async function load (page, template) {
	var dialog = page.locator('dialog[open]');

	await page.getByRole('button', {name: 'Import'}).click();

	await dialog.locator('textarea').fill(template);
	await dialog.getByRole('button', {name: 'Import'}).click();

	await expect(dialog).toHaveCount(0);
}

/* The template the builder exports, the dialog closed again. */
async function exported (page) {
	var dialog = page.locator('dialog[open]');
	var text;

	await page.getByRole('button', {name: 'Export'}).click();

	text = (await dialog.locator('.elemenx-code-view').innerText()).trim();

	await page.keyboard.press('Escape');

	await expect(dialog).toHaveCount(0);

	return text;
}

test.describe('Elemenx builder', function () {
	test('adds components from the palette, edits their props and text, and undoes and redoes the changes', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.elemenx-designer-palette');
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');

		await open(page);

		await palette.locator('[data-kind="Card"]').click();
		await palette.locator('[data-kind="heading"]').click();

		/* A container takes the next element; another element puts it after itself. */
		await expect(canvas.locator('.elemenx-card h2')).toHaveText('Heading');
		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Heading');

		await inspector.locator('textarea').fill('Sign in');

		await expect(canvas.locator('.elemenx-card h2')).toHaveText('Sign in');

		/* A component starts from the sample of its $Meta, and its fields say what its props do. */
		await palette.locator('[data-kind="Button"]').click();

		await expect(canvas.locator('.elemenx-card .elemenx-button.primary')).toHaveText('Primary');
		await expect(inspector.locator('.elemenx-designer-inspector-description')).toHaveText('A button.');
		await expect(inspector).toContainText('Its look: primary, secondary, ghost, danger or link.');

		await inspector.locator('input[name="Label"]').fill('Go');
		await inspector.locator('.elemenx-designer-inspector-field').filter({hasText: 'Its look'}).locator('.elemenx-select').click();
		await page.getByRole('option', {name: 'ghost'}).click();

		await expect(canvas.locator('.elemenx-card .elemenx-button.ghost')).toHaveText('Go');
		await expect(page.locator('.elemenx-workspace-status')).toContainText('3 elements');

		/* The canvas takes the pointer: a press selects the element under it, the page itself does nothing. */
		await canvas.locator('h2').click({force: true});

		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Heading');

		await page.locator('.elemenx-designer-canvas').click({position: {x: 8, y: 8}});

		await page.keyboard.press('Control+z');

		await expect(canvas.locator('.elemenx-card .elemenx-button')).toHaveClass(/primary/);

		await page.keyboard.press('Control+z');

		await expect(canvas.locator('.elemenx-card .elemenx-button')).toHaveText('Primary');

		await page.keyboard.press('Control+Shift+z');
		await page.keyboard.press('Control+Shift+z');

		await expect(canvas.locator('.elemenx-card .elemenx-button.ghost')).toHaveText('Go');

		/* The page stays for the next visit. */
		await page.reload();

		await expect(canvas.locator('.elemenx-card .elemenx-button.ghost')).toHaveText('Go');

		expect(errors).toEqual([]);
	});

	test('drops components from the palette where the line shows and moves elements by the grip of the selection', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.elemenx-designer-palette');
		var canvas = page.locator('.elemenx-designer-page-host');
		var box;
		var doc;

		await open(page);

		await palette.locator('[data-kind="row"]').click();
		await palette.locator('[data-kind="paragraph"]').click();

		/* A button dropped on the left half of the paragraph goes before it, in the row. */
		box = await canvas.locator('p').boundingBox();

		await drag(page, palette.locator('[data-kind="Button"]'), box.x + 4, box.y + box.height / 2);

		doc = await document(page);

		expect(doc.Children[0].Kind).toBe('row');
		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['Button', 'paragraph']);

		/* A heading dropped under the row goes on the page, after it. */
		box = await canvas.locator('.elemenx-container').boundingBox();

		await drag(page, palette.locator('[data-kind="heading"]'), box.x + 40, box.y + box.height + 60);

		doc = await document(page);

		expect(doc.Children.map(function (node) {
			return node.Kind;
		})).toEqual(['row', 'heading']);

		/* The heading, selected, moves into the row by its grip. */
		await expect(page.locator('.elemenx-designer-selection')).toBeVisible();

		box = await canvas.locator('p').boundingBox();

		await drag(page, page.locator('.elemenx-designer-grip'), box.x + box.width - 4, box.y + box.height / 2);

		doc = await document(page);

		expect(doc.Children.length).toBe(1);
		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['Button', 'paragraph', 'heading']);

		/* Delete removes the selected element. */
		await page.keyboard.press('Delete');

		doc = await document(page);

		expect(doc.Children[0].Children.length).toBe(2);

		expect(errors).toEqual([]);
	});

	test('exports the page as a template and imports a template back, keeping the elements it does not know', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var dialog = page.locator('dialog[open]');
		var template = '<div class="elemenx-column">\n\t<h1>Hello</h1>\n\t<Card Title="Account" Variant="elevated">\n\t\t<Toggle Label="Notify me" Checked="true" />\n\t\t<RadioGroup [options]="[{Value: \'Day\', Label: \'Day\'}, {Value: \'Week\', Label: \'Week\'}]" />\n\t\t<Image Ratio="1:1" />\n\t</Card>\n\t<section data-note="kept"><b>Raw</b> text</section>\n</div>';

		await open(page);

		await load(page, template);

		await expect(canvas.locator('h1')).toHaveText('Hello');
		await expect(canvas.locator('.elemenx-card')).toContainText('Account');
		await expect(canvas.locator('.elemenx-toggle.checked')).toContainText('Notify me');
		await expect(canvas.locator('section[data-note="kept"]')).toHaveText('Raw text');

		expect(await exported(page)).toBe(template);

		/* A text without an element is refused; the page stays. */
		await page.getByRole('button', {name: 'Import'}).click();

		await dialog.locator('textarea').fill('just words');
		await dialog.getByRole('button', {name: 'Import'}).click();

		await expect(dialog.locator('.elemenx-callout.danger')).toHaveText('The text holds no element.');
		await expect(canvas.locator('h1')).toHaveText('Hello');

		expect(errors).toEqual([]);
	});

	test('has every component of ElemenxUI from its $Meta and the classes of its layouts in the palette, with a search', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.elemenx-designer-palette');
		var library = path.resolve('libraries/ElemenxUI/components');
		var names = fs.readdirSync(library).filter(function (name) {
			return fs.existsSync(path.join(library, name, name + '.js'));
		});
		var kinds;

		await open(page);

		kinds = await palette.locator('.elemenx-designer-palette-item').evaluateAll(function (items) {
			return items.map(function (item) {
				return item.getAttribute('data-kind');
			});
		});

		/* Every component by its own name; and the classes of the layouts. */
		expect(names.length).toBeGreaterThan(120);
		expect(names.filter(function (name) {
			return kinds.indexOf(name) === -1;
		})).toEqual([]);
		expect(kinds).toEqual(expect.arrayContaining(['screen', 'row', 'column', 'grid', 'panel', 'gamepanel', 'paragraph', 'textstyle', 'link', 'badge', 'kbd', 'code', 'bullets', 'numbers', 'chips', 'table', 'stats', 'document']));

		/* A kind tells what it is when the pointer rests on it: the description of its $Meta. */
		await expect(palette.locator('[data-kind="Splitter"]')).toHaveAttribute('title', 'Splitter: Two panes with a draggable divider.');

		/* The search keeps the kinds whose name holds its text, and says when none does. */
		await palette.locator('input').fill('game');

		await expect(palette.locator('.elemenx-designer-palette-item')).toHaveCount(13);
		await expect(palette.locator('[data-kind="GameBar"]')).toBeVisible();

		await palette.locator('input').fill('nothing like it');

		await expect(palette.locator('.elemenx-designer-palette-item')).toHaveCount(0);
		await expect(palette).toContainText('Nothing found.');

		await palette.locator('input').fill('');

		await expect(palette.locator('.elemenx-designer-palette-item')).toHaveCount(kinds.length);
		expect(errors).toEqual([]);
	});

	test('builds with the classes of the layouts, the props of any component, its expressions and its named slots', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.elemenx-designer-palette');
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');
		var tree = page.locator('.elemenx-designer-tree');
		var text;
		var template = '<div class="elemenx-screen">\n\t<div class="elemenx-container wrappable fill">\n\t\t<p class="elemenx-text small muted">Muted</p>\n\t\t<div class="elemenx-eyebrow">Eyebrow</div>\n\t\t<table class="elemenx-table striped">\n\t\t\t<thead>\n\t\t\t\t<tr><th>Name</th><th>Role</th></tr>\n\t\t\t</thead>\n\t\t\t<tbody>\n\t\t\t\t<tr><td>—</td><td>—</td></tr>\n\t\t\t</tbody>\n\t\t</table>\n\t\t<Splitter>\n\t\t\t<p slot="first">One</p>\n\t\t\t<p slot="second">Two</p>\n\t\t</Splitter>\n\t\t<Breadcrumbs [items]="[{ID: \'a\', Label: \'Alpha\'}, {ID: \'b\', Label: \'Beta\'}]" Separator="slash" />\n\t</div>\n</div>';

		await open(page);

		/* A screen with a component the builder knows by its $Meta: its props, an expression among them. */
		await palette.locator('[data-kind="screen"]').click();
		await palette.locator('input').fill('Breadcrumbs');
		await palette.locator('[data-kind="Breadcrumbs"]').click();

		await expect(canvas.locator('.elemenx-screen .elemenx-breadcrumbs')).toContainText('Docs');
		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Breadcrumbs');

		await inspector.locator('textarea[name="Items"]').fill('[{ID: \'x\', Label: \'Xenon\'}]');

		await expect(canvas.locator('.elemenx-breadcrumbs')).toContainText('Xenon');

		text = await exported(page);

		expect(text).toContain('<div class="elemenx-screen">');
		expect(text).toContain('<Breadcrumbs [items]="[{ID: \'x\', Label: \'Xenon\'}]" />');

		/* A template of the classes, the slots and the expressions comes back the same, element for element. */
		await load(page, template);

		await expect(canvas.locator('.elemenx-splitter')).toContainText('One');
		await expect(canvas.locator('.elemenx-table th')).toHaveText(['Name', 'Role']);

		expect(await exported(page)).toBe(template);

		/* The kinds of classes are kinds of the builder, with their modifiers as fields; a child of a component with slots picks its slot. */
		await tree.getByText('Paragraph · Muted').click();

		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Paragraph');

		await tree.getByText('Paragraph · Two').click();

		await expect(inspector.locator('.elemenx-select').first()).toContainText('second');

		await inspector.locator('.elemenx-select').first().click();
		await page.getByRole('option', {name: 'first'}).click();

		expect(await exported(page)).toContain('<p slot="first">Two</p>');

		expect(errors).toEqual([]);
	});

	test('gives a class the modifiers its stylesheet has: a screen fills, a container takes the ones no field names', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.elemenx-designer-palette');
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');
		var template = '<div class="elemenx-screen fill">\n\t<div class="elemenx-container wrappable non-fill">\n\t\t<p>One</p>\n\t</div>\n</div>';

		await open(page);

		await palette.locator('[data-kind="screen"]').click();

		await inspector.locator('.elemenx-designer-inspector-field').filter({hasText: 'Sizing'}).locator('.elemenx-select').click();
		await page.getByRole('option', {name: 'fill', exact: true}).click();

		await expect(canvas.locator('.elemenx-screen')).toHaveClass('elemenx-screen fill');
		expect(await exported(page)).toBe('<div class="elemenx-screen fill"></div>');

		await load(page, template);

		expect(await exported(page)).toBe(template);

		/* A row has a field for each of its modifiers; a badge takes the ones no field names (overlay, busy) from a list of its own. */
		await page.locator('.elemenx-designer-tree').getByText('Row', {exact: true}).click();

		await expect(inspector.locator('.elemenx-designer-inspector-field').filter({hasText: 'Modifiers'})).toHaveCount(0);

		await load(page, '<span class="elemenx-badge danger overlay">3</span>');

		expect(await exported(page)).toBe('<span class="elemenx-badge danger overlay">3</span>');

		await page.locator('.elemenx-designer-tree').getByText('Badge · 3').click();

		await expect(inspector.locator('.elemenx-designer-inspector-field').filter({hasText: 'Modifiers'}).locator('.elemenx-select')).toContainText('overlay');

		await inspector.locator('.elemenx-designer-inspector-field').filter({hasText: 'Modifiers'}).locator('.elemenx-select-trigger').click();
		await page.getByRole('option', {name: 'busy'}).click();
		await page.keyboard.press('Escape');

		await expect(canvas.locator('.elemenx-badge')).toHaveClass('elemenx-badge danger overlay busy');

		expect(errors).toEqual([]);
	});

	test('sets the layout of an element inline: padding, margins, sizes, and the alignment of a flex container', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');
		var tree = page.locator('.elemenx-designer-tree');
		var layout = inspector.locator('.elemenx-designer-inspector-layout');
		var template = '<div class="elemenx-column" style="padding: 24px; align-items: center">\n\t<div style="max-width: 320px">\n\t\t<Button Label="Go" Variant="primary" />\n\t</div>\n\t<p style="margin: 0 0 12px">Text</p>\n</div>';

		await open(page);

		await load(page, '<div class="elemenx-column">\n\t<Button Label="Go" Variant="primary" />\n\t<p>Text</p>\n</div>');

		/* A column is a flex container: its alignment is there; a Component takes a div of its own for its layout. */
		await tree.getByText('Column', {exact: true}).click();

		await layout.locator('input[name="padding"]').fill('24px');
		await layout.locator('.elemenx-field').filter({hasText: 'align-items'}).locator('.elemenx-select').click();
		await page.getByRole('option', {name: 'center', exact: true}).click();

		await expect(canvas.locator('.elemenx-column')).toHaveCSS('padding-top', '24px');
		await expect(canvas.locator('.elemenx-column')).toHaveCSS('align-items', 'center');

		await tree.getByText('Button · Go').click();

		await expect(layout.locator('.elemenx-field').filter({hasText: 'align-items'})).toHaveCount(0);

		await layout.locator('input[name="max-width"]').fill('320px');

		await tree.getByText('Paragraph · Text').click();

		await layout.locator('input[name="margin"]').fill('0 0 12px');

		expect(await exported(page)).toBe(template);

		/* The template comes back with its layout: the div of the Button is the layout of the Button. */
		await load(page, template);

		expect(await exported(page)).toBe(template);
		expect((await document(page)).Children[0].Children[0]).toMatchObject({Kind: 'Button', Style: {'max-width': '320px'}});

		expect(errors).toEqual([]);
	});

	test('moves elements in the structure by dragging them before, after or into another', async function ({ page }) {
		var errors = captureErrors(page);
		var tree = page.locator('.elemenx-designer-tree');
		var box;

		await open(page);

		await load(page, '<div class="elemenx-column">\n\t<h2>First</h2>\n\t<h3>Second</h3>\n</div>\n<div class="elemenx-panel"></div>');

		/* The second heading before the first: the upper part of its row. */
		box = await tree.locator('.elemenx-tree-row').filter({hasText: 'First'}).boundingBox();

		await drag(page, tree.locator('.elemenx-tree-row').filter({hasText: 'Second'}), box.x + 40, box.y + 2);

		expect(await exported(page)).toBe('<div class="elemenx-column">\n\t<h3>Second</h3>\n\t<h2>First</h2>\n</div>\n<div class="elemenx-panel"></div>');

		/* The first heading into the panel: the middle of its row. */
		box = await tree.locator('.elemenx-tree-row').filter({hasText: 'Panel'}).boundingBox();

		await drag(page, tree.locator('.elemenx-tree-row').filter({hasText: 'First'}), box.x + 40, box.y + box.height / 2);

		expect(await exported(page)).toBe('<div class="elemenx-column">\n\t<h3>Second</h3>\n</div>\n<div class="elemenx-panel">\n\t<h2>First</h2>\n</div>');
		await expect(page.locator('.elemenx-designer-inspector-title')).toHaveText('Heading');

		expect(errors).toEqual([]);
	});

	test('selects on the canvas an element that stands over the page by a z-index of its own, as a Window, and offers its choices', async function ({ page }) {
		var errors = captureErrors(page);
		var inspector = page.locator('.elemenx-designer-inspector');
		var box;

		await open(page);

		await load(page, '<div class="elemenx-screen">\n\t<Window Title="Notes" X="20" Y="20" Width="300" Height="200">\n\t\t<p>Inside</p>\n\t</Window>\n</div>');

		box = await page.locator('.elemenx-designer-page-host .elemenx-window').boundingBox();

		await page.mouse.click(box.x + box.width / 2, box.y + 12);

		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Window');

		/* Its folder, its look and its level are choices, with what they do. */
		await inspector.locator('.elemenx-designer-inspector-field').filter({hasText: 'HeaderShape'}).locator('.elemenx-select').click();
		await page.getByRole('option', {name: 'trapezoid'}).click();

		await expect(page.locator('.elemenx-designer-page-host .elemenx-window')).toHaveClass(/trapezoid/);
		await expect(inspector.locator('.elemenx-designer-inspector-field').filter({hasText: 'Level'})).toContainText('primary');

		/* Selected again from the canvas after a change, and its content too. */
		await page.mouse.click(box.x + box.width / 2, box.y + 12);

		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Window');

		box = await page.locator('.elemenx-designer-page-host .elemenx-window p').boundingBox();

		await page.mouse.click(box.x + 8, box.y + box.height / 2);

		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Paragraph');

		expect(errors).toEqual([]);
	});

	test('keeps the structure in view with the palette, previews the page at the width of a phone and speaks Russian', async function ({ page }) {
		var errors = captureErrors(page);
		var palette = page.locator('.elemenx-designer-palette');
		var canvas = page.locator('.elemenx-designer-page-host');

		await open(page);

		await palette.locator('[data-kind="Section"]').click();
		await palette.locator('[data-kind="Checkbox"]').click();

		await expect(page.locator('.elemenx-designer-tree')).toBeVisible();

		await page.locator('.elemenx-designer-tree').getByText('Section · Settings').click();

		await expect(page.locator('.elemenx-designer-inspector-title')).toHaveText('Section');

		await page.getByText('Phone', {exact: true}).click();

		await expect.poll(async function () {
			return Math.round((await page.locator('.elemenx-designer-surface').boundingBox()).width);
		}).toBe(390);

		await page.getByText('Preview', {exact: true}).click();

		await expect(page.locator('.elemenx-designer-layer')).toHaveCount(0);

		await canvas.locator('.elemenx-check').click();

		await expect(canvas.locator('.elemenx-check input')).toBeChecked();

		await page.getByText('RU', {exact: true}).click();

		await expect(page.locator('.builder-brand')).toHaveText('EКонструктор');
		await expect(palette.locator('.elemenx-designer-palette-title').first()).toHaveText('Раскладка');
		await expect(page.locator('.elemenx-designer-inspector')).toContainText('Размещение');

		expect(errors).toEqual([]);
	});
});
