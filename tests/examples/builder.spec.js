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

	await expect(page.locator('.elemenx-ribbon-gallery-item[data-id="Button"]').first()).toBeAttached();
	await expect(page.locator('.builder-find input')).toBeVisible();
}

function document (page) {
	return page.evaluate(function () {
		return JSON.parse(localStorage.getItem('elemenx-designer:document'));
	});
}

/* The sample of a kind on the Insert tab, found by its search. */
async function sample (page, kind) {
	await page.locator('.builder-find input').fill(kind);

	return page.locator('.builder-found .elemenx-ribbon-gallery-item[data-id="' + kind + '"]').first();
}

/* A kind pressed on the Insert tab: into the selected element, after it, or at the end of the page. */
async function add (page, kind) {
	await (await sample(page, kind)).click();

	await page.locator('.builder-find input').fill('');
}

/* Drags with the pointer from the middle of one box to a point, in steps, as a hand does (the box scrolled into view first). */
async function drag (page, from, x, y, before) {
	var box;

	await from.scrollIntoViewIfNeeded();

	box = await from.boundingBox();

	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 20, {steps: 4});
	await page.mouse.move(x, y, {steps: 10});

	if (before)
		await before();

	await page.mouse.up();
}

/* Opens a page of the backstage (the File button of the Ribbon). */
async function backstage (page, name) {
	await page.locator('.elemenx-ribbon-file').click();
	await page.locator('.elemenx-ribbon-backstage.open .elemenx-ribbon-backstage-item').filter({hasText: name}).click();
}

/* Imports a template in place of the page, from the backstage. */
async function load (page, template) {
	await backstage(page, 'Import');

	await page.locator('.elemenx-ribbon-backstage.open textarea').fill(template);
	await page.locator('.builder-import').click();

	await expect(page.locator('.elemenx-ribbon-backstage.open')).toHaveCount(0);
}

/* The template the builder exports, from the backstage, closed again. */
async function exported (page) {
	var text;

	await backstage(page, 'Export');

	text = (await page.locator('.elemenx-ribbon-backstage.open .elemenx-code-view').innerText()).trim();

	await page.keyboard.press('Escape');

	await expect(page.locator('.elemenx-ribbon-backstage.open')).toHaveCount(0);

	return text;
}

test.describe('Elemenx builder', function () {
	test('adds components from the Insert tab of its Ribbon, edits their props and text, and undoes and redoes the changes', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');

		await open(page);

		await add(page, 'Card');
		await add(page, 'heading');

		/* A container takes the next element; another element puts it after itself. */
		await expect(canvas.locator('.elemenx-card h2')).toHaveText('Heading');
		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Heading');

		await inspector.locator('textarea').fill('Sign in');

		await expect(canvas.locator('.elemenx-card h2')).toHaveText('Sign in');

		/* A component starts from the sample of its $Meta, and its fields say what its props do. */
		await add(page, 'Button');

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

		/* The Home tab acts on the selected element: a copy of it, then its removal. */
		await canvas.locator('.elemenx-button').click({force: true});
		await page.locator('.elemenx-ribbon-tab').filter({hasText: 'Home'}).click();
		await page.locator('.elemenx-ribbon [data-command="duplicate"]').click();

		await expect(canvas.locator('.elemenx-card .elemenx-button')).toHaveCount(2);

		await page.locator('.elemenx-ribbon [data-command="delete"]').click();

		await expect(canvas.locator('.elemenx-card .elemenx-button')).toHaveCount(1);

		/* The page stays for the next visit. */
		await page.reload();

		await expect(canvas.locator('.elemenx-card .elemenx-button.ghost')).toHaveText('Go');

		expect(errors).toEqual([]);
	});

	test('drops components from the Ribbon where the line shows, with words saying where, and moves elements by the grip of the selection', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var box;
		var doc;

		await open(page);

		await add(page, 'row');
		await add(page, 'paragraph');

		/* A button dropped on the left half of the paragraph goes before it, in the row; the line says so. */
		box = await canvas.locator('p').boundingBox();

		await drag(page, await sample(page, 'Button'), box.x + 4, box.y + box.height / 2, async function () {
			await expect(page.locator('.elemenx-designer-marker-note')).toHaveText('In Row, before Paragraph');
		});

		doc = await document(page);

		expect(doc.Children[0].Kind).toBe('row');
		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['Button', 'paragraph']);

		/* A heading dropped under the row goes on the page, after it. */
		box = await canvas.locator('.elemenx-container').boundingBox();

		await drag(page, await sample(page, 'heading'), box.x + 40, box.y + box.height + 60);

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

	test('drops a row into a screen that a row fills: beside the row from the edge of it, one level up with Alt', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var box;
		var doc;

		await open(page);

		await load(page, '<div class="elemenx-screen">\n\t<div class="elemenx-container wrappable">\n\t\t<p>One</p>\n\t</div>\n</div>');

		/* The lower part of the row is its edge: the new row goes after it, in the screen. */
		box = await canvas.locator('.elemenx-container').boundingBox();

		await drag(page, await sample(page, 'row'), box.x + box.width / 2, box.y + box.height - 4, async function () {
			await expect(page.locator('.elemenx-designer-marker-note')).toHaveText('In Screen, after Row');
		});

		doc = await document(page);

		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['row', 'row']);

		/* In the middle of the first row a column goes into it; with Alt held, into the screen around it. */
		box = await canvas.locator('.elemenx-container').first().boundingBox();

		await drag(page, await sample(page, 'column'), box.x + box.width - 8, box.y + box.height / 2, async function () {
			await page.keyboard.down('Alt');
			await page.mouse.move(box.x + box.width - 9, box.y + box.height / 2);

			await expect(page.locator('.elemenx-designer-marker-note')).toContainText('In Screen');
		});

		await page.keyboard.up('Alt');

		doc = await document(page);

		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['row', 'column', 'row']);

		expect(errors).toEqual([]);
	});

	test('exports the page as a template and imports a template back from the backstage, keeping the elements it does not know', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var template = '<div class="elemenx-column">\n\t<h1>Hello</h1>\n\t<Card Title="Account" Variant="elevated">\n\t\t<Toggle Label="Notify me" Checked="true" />\n\t\t<RadioGroup [options]="[{Value: \'Day\', Label: \'Day\'}, {Value: \'Week\', Label: \'Week\'}]" />\n\t\t<Image Ratio="1:1" />\n\t</Card>\n\t<section data-note="kept"><b>Raw</b> text</section>\n</div>';

		await open(page);

		await load(page, template);

		await expect(canvas.locator('h1')).toHaveText('Hello');
		await expect(canvas.locator('.elemenx-card')).toContainText('Account');
		await expect(canvas.locator('.elemenx-toggle.checked')).toContainText('Notify me');
		await expect(canvas.locator('section[data-note="kept"]')).toHaveText('Raw text');

		expect(await exported(page)).toBe(template);

		/* A text without an element is refused; the page stays. */
		await backstage(page, 'Import');

		await page.locator('.elemenx-ribbon-backstage.open textarea').fill('just words');
		await page.locator('.builder-import').click();

		await expect(page.locator('.elemenx-ribbon-backstage.open .elemenx-callout.danger')).toHaveText('The text holds no element.');

		await page.keyboard.press('Escape');

		await expect(canvas.locator('h1')).toHaveText('Hello');

		/* Clear is a command of the backstage; Undo of the toast brings the page back. */
		await backstage(page, 'Clear');

		await expect(canvas.locator('h1')).toHaveCount(0);

		await page.locator('.elemenx-toast').getByRole('button', {name: 'Undo'}).click();

		await expect(canvas.locator('h1')).toHaveText('Hello');

		expect(errors).toEqual([]);
	});

	test('has every component of ElemenxUI from its $Meta and the classes of its layouts on the Insert tab, with a search', async function ({ page }) {
		var errors = captureErrors(page);
		var library = path.resolve('libraries/ElemenxUI/components');
		var found = page.locator('.builder-found .elemenx-ribbon-gallery-items .elemenx-ribbon-gallery-item');
		var names = fs.readdirSync(library).filter(function (name) {
			return fs.existsSync(path.join(library, name, name + '.js'));
		});
		var kinds;

		await open(page);

		kinds = await page.locator('.elemenx-ribbon .elemenx-ribbon-gallery-item[data-id]').evaluateAll(function (items) {
			return items.map(function (item) {
				return item.getAttribute('data-id');
			}).filter(function (id, index, list) {
				return list.indexOf(id) === index;
			});
		});

		/* Every component by its own name; and the classes of the layouts. */
		expect(names.length).toBeGreaterThan(120);
		expect(names.filter(function (name) {
			return kinds.indexOf(name) === -1;
		})).toEqual([]);
		expect(kinds).toEqual(expect.arrayContaining(['screen', 'row', 'column', 'grid', 'panel', 'gamepanel', 'paragraph', 'textstyle', 'link', 'badge', 'kbd', 'code', 'bullets', 'numbers', 'chips', 'table', 'stats', 'document']));

		/* A sample tells its name and what it is when the pointer rests on it, and says its name under it. */
		await expect(page.locator('.elemenx-ribbon-gallery-item[data-id="screen"]').first()).toHaveAttribute('title', 'Screen — The screen of an Application: a column as high as its place (Sizing fill takes all of it).');
		await expect(page.locator('.elemenx-ribbon-gallery-item[data-id="screen"]').first()).toContainText('Screen');

		/* The search keeps the kinds whose name holds its text, and says when none does. */
		await page.locator('.builder-find input').fill('game');

		await expect(found).toHaveCount(13);
		await expect(found.filter({hasText: 'GameBar'})).toHaveCount(1);

		await page.locator('.builder-find input').fill('nothing like it');

		await expect(found).toHaveCount(0);
		await expect(page.locator('.builder-find')).toContainText('Nothing found.');

		expect(errors).toEqual([]);
	});

	test('builds with the classes of the layouts, the props of any component, its expressions and its named slots', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');
		var tree = page.locator('.elemenx-designer-tree');
		var text;
		var template = '<div class="elemenx-screen">\n\t<div class="elemenx-container wrappable fill">\n\t\t<p class="elemenx-text small muted">Muted</p>\n\t\t<div class="elemenx-eyebrow">Eyebrow</div>\n\t\t<table class="elemenx-table striped">\n\t\t\t<thead>\n\t\t\t\t<tr><th>Name</th><th>Role</th></tr>\n\t\t\t</thead>\n\t\t\t<tbody>\n\t\t\t\t<tr><td>—</td><td>—</td></tr>\n\t\t\t</tbody>\n\t\t</table>\n\t\t<Splitter>\n\t\t\t<p slot="first">One</p>\n\t\t\t<p slot="second">Two</p>\n\t\t</Splitter>\n\t\t<Breadcrumbs [items]="[{ID: \'a\', Label: \'Alpha\'}, {ID: \'b\', Label: \'Beta\'}]" Separator="slash" />\n\t</div>\n</div>';

		await open(page);

		/* A screen with a component the builder knows by its $Meta: a list of items edited as its rows. */
		await add(page, 'screen');
		await add(page, 'Breadcrumbs');

		await expect(canvas.locator('.elemenx-screen .elemenx-breadcrumbs')).toContainText('Docs');
		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Breadcrumbs');

		await inspector.locator('.elemenx-designer-list-item').first().locator('input[data-key="Label"]').fill('Xenon');
		await inspector.locator('.elemenx-designer-list-item').first().locator('input[data-key="Label"]').press('Enter');

		await expect(canvas.locator('.elemenx-breadcrumbs')).toContainText('Xenon');

		await inspector.locator('.elemenx-designer-list-item').nth(1).locator('.elemenx-designer-list-button[title="Delete"]').click();
		await inspector.locator('.elemenx-designer-list-item').nth(1).locator('.elemenx-designer-list-button[title="Delete"]').click();

		await expect(inspector.locator('.elemenx-designer-list-item')).toHaveCount(1);

		/* The list as an expression again, and back. */
		await inspector.locator('.elemenx-designer-list-button[title="Edit as an expression"]').click();
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

		await expect(inspector.locator('.elemenx-designer-inspector-props .elemenx-select').first()).toContainText('second');

		await inspector.locator('.elemenx-designer-inspector-props .elemenx-select').first().click();
		await page.getByRole('option', {name: 'first'}).click();

		expect(await exported(page)).toContain('<p slot="first">Two</p>');

		expect(errors).toEqual([]);
	});

	test('declares the tabs of a Tabs as its children: adds them, shows the one selected on the canvas and exports them', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');
		var tree = page.locator('.elemenx-designer-tree');

		await open(page);

		await add(page, 'Tabs');

		await inspector.locator('.elemenx-designer-inspector-children button').filter({hasText: 'Tab'}).click();

		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Tab');

		await tree.getByText('Tabs', {exact: true}).click();
		await inspector.locator('.elemenx-designer-inspector-children button').filter({hasText: 'Tab'}).click();

		/* The second tab, selected, is the one the canvas shows; a component added goes into it. */
		await expect(canvas.locator('.elemenx-tab.active')).toHaveText('Tab 2');

		await add(page, 'Button');

		await expect(canvas.locator('.elemenx-tab-panel.active .elemenx-button')).toHaveCount(1);

		/* A press on the first tab of the canvas selects it and shows it. */
		await canvas.locator('.elemenx-tab').filter({hasText: 'Tab 1'}).click({force: true});

		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('Tab');
		await expect(inspector.locator('input[name="Label"]')).toHaveValue('Tab 1');
		await expect(canvas.locator('.elemenx-tab.active')).toHaveText('Tab 1');

		expect(await exported(page)).toBe('<Tabs>\n\t<Tab ID="tab-1" Label="Tab 1" />\n\t<Tab ID="tab-2" Label="Tab 2">\n\t\t<Button Label="Primary" Variant="primary" />\n\t</Tab>\n</Tabs>');

		expect(errors).toEqual([]);
	});

	test('sets the layout of an element above its props: its box, its sizes and the alignment of a flex container by icons', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');
		var tree = page.locator('.elemenx-designer-tree');
		var style = page.locator('.elemenx-designer-style');
		var template = '<div class="elemenx-column" style="padding: 24px; align-items: center; justify-content: space-between">\n\t<div style="max-width: 320px">\n\t\t<Button Label="Go" Variant="primary" />\n\t</div>\n\t<p style="margin: 0 0 12px">Text</p>\n</div>';

		await open(page);

		await load(page, '<div class="elemenx-column">\n\t<Button Label="Go" Variant="primary" />\n\t<p>Text</p>\n</div>');

		/* The layout comes first, the rules of CSS next, the props of the component after them: blocks of their own. */
		await tree.getByText('Column', {exact: true}).click();

		expect(await inspector.locator('.elemenx-section-title').allInnerTexts()).toEqual(['Layout', 'CSS', 'Properties']);

		/* The four sides of the padding are one shorthand; a number is in pixels. */
		for (var side of ['top', 'right', 'bottom', 'left']) {
			await style.locator('.elemenx-designer-box.padding input.' + side).fill('24');
			await style.locator('.elemenx-designer-box.padding input.' + side).press('Tab');
		}

		await style.locator('[data-property="align-items"][data-value="center"]').click();
		await style.locator('[data-property="justify-content"][data-value="space-between"]').click();

		await expect(canvas.locator('.elemenx-column')).toHaveCSS('padding-top', '24px');
		await expect(canvas.locator('.elemenx-column')).toHaveCSS('align-items', 'center');
		await expect(style.locator('[data-property="align-items"][data-value="center"]')).toHaveAttribute('aria-pressed', 'true');

		/* A Component is no flex container: no alignment; its layout goes on a div of its own. */
		await tree.getByText('Button · Go').click();

		await expect(style.locator('[data-property="align-items"]')).toHaveCount(0);

		await style.locator('input[name="max-width"]').fill('320');
		await style.locator('input[name="max-width"]').press('Enter');

		await tree.getByText('Paragraph · Text').click();

		await style.locator('.elemenx-designer-box:not(.padding) > input.bottom').fill('12px');
		await style.locator('.elemenx-designer-box:not(.padding) > input.bottom').press('Tab');

		expect(await exported(page)).toBe(template);

		/* The template comes back with its layout: the div of the Button is the layout of the Button. */
		await load(page, template);

		expect(await exported(page)).toBe(template);
		expect((await document(page)).Children[0].Children[0]).toMatchObject({Kind: 'Button', Style: {'max-width': '320px'}});

		expect(errors).toEqual([]);
	});

	test('moves elements in the structure by dragging them, and takes a kind dragged from the Ribbon into it', async function ({ page }) {
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

		/* A divider from the Ribbon after the column: the lower part of its row. */
		box = await tree.locator('.elemenx-tree-row').filter({hasText: 'Column'}).boundingBox();

		await drag(page, await sample(page, 'divider'), box.x + 40, box.y + box.height - 2);

		expect(await exported(page)).toBe('<div class="elemenx-column">\n\t<h3>Second</h3>\n</div>\n<div class="elemenx-divider"></div>\n<div class="elemenx-panel">\n\t<h2>First</h2>\n</div>');

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


	test('keeps the structure in view, runs the page at the width of a phone from its header and speaks Russian', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');

		await open(page);

		await add(page, 'Section');
		await add(page, 'Checkbox');

		await expect(page.locator('.elemenx-designer-tree')).toBeVisible();

		await page.locator('.elemenx-designer-tree').getByText('Section · Settings').click();

		await expect(page.locator('.elemenx-designer-inspector-title')).toHaveText('Section');

		await page.locator('.elemenx-ribbon-tab').filter({hasText: 'View'}).click();
		await page.locator('.elemenx-ribbon [data-command="phone"]').click();

		await expect.poll(async function () {
			return Math.round((await page.locator('.elemenx-designer-surface').boundingBox()).width);
		}).toBe(390);

		/* Run: the page works as it will; Stop: it is built again. */
		await page.getByRole('button', {name: 'Run'}).click();

		await expect(page.locator('.elemenx-designer-layer')).toHaveCount(0);

		await canvas.locator('.elemenx-check').click();

		await expect(canvas.locator('.elemenx-check input')).toBeChecked();

		await page.getByRole('button', {name: 'Stop'}).click();

		await expect(page.locator('.elemenx-designer-layer')).toHaveCount(1);

		/* The language is a list in the header. */
		await page.locator('.builder-language .elemenx-select').click();
		await page.getByRole('option', {name: 'Русский'}).click();

		await expect(page.locator('.builder-brand')).toHaveText('EКонструктор');
		await expect(page.locator('.elemenx-ribbon-tab').filter({hasText: 'Вставка'})).toHaveCount(1);
		await expect(page.locator('.elemenx-designer-inspector')).toContainText('Оформление');

		expect(errors).toEqual([]);
	});

	test('drops a row at the end of a screen a row fills by the bar of the containers, and the canvas is as high as its room', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var box;
		var link;
		var doc;

		await open(page);

		await load(page, '<div class="elemenx-screen fill">\n\t<div class="elemenx-container wrappable">\n\t\t<p>One</p>\n\t</div>\n</div>');

		/* A screen with Sizing fill fills the canvas as it would fill the body. */
		expect(Math.abs((await canvas.locator('.elemenx-screen').boundingBox()).height - (await page.locator('.elemenx-designer-surface').boundingBox()).height)).toBeLessThan(24);

		/* Over the row the bar names the containers from the page down; a drop on Screen puts the row at its end. */
		box = await canvas.locator('.elemenx-container').boundingBox();

		await drag(page, await sample(page, 'row'), box.x + box.width / 2, box.y + box.height / 2, async function () {
			await expect(page.locator('.elemenx-designer-chain-item')).toHaveText(['Page', 'Screen', 'Row']);

			link = await page.locator('.elemenx-designer-chain-item').filter({hasText: 'Screen'}).boundingBox();

			await page.mouse.move(link.x + link.width / 2, link.y + link.height / 2, {steps: 8});

			await expect(page.locator('.elemenx-designer-chain-item.active')).toHaveText('Screen');
		});

		doc = await document(page);

		expect(doc.Children[0].Children.map(function (node) {
			return node.Kind;
		})).toEqual(['row', 'row']);
		await expect(page.locator('.elemenx-designer-chain')).toHaveCount(0);

		expect(errors).toEqual([]);
	});

	test('runs the page without the places to drop and its outlines, and inspects its boxes as the tools of a browser do', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var box;

		await open(page);

		await load(page, '<div class="elemenx-column" style="padding: 24px; gap: 16px">\n\t<h2>Sign in</h2>\n\t<p style="margin: 0 0 12px">Text</p>\n\t<div class="elemenx-container"></div>\n</div>');

		/* While it is built: outlines on the containers, a place to drop in the empty one. */
		await expect(canvas.locator('.elemenx-designer-empty')).toHaveCount(1);
		await expect(canvas.locator('.elemenx-column')).not.toHaveCSS('outline-style', 'none');

		await page.getByRole('button', {name: 'Run'}).click();

		await expect(canvas.locator('.elemenx-designer-empty')).toHaveCount(0);
		await expect(canvas.locator('.elemenx-column')).toHaveCSS('outline-style', 'none');

		/* Inspect: the box of the element under the pointer, its size, its margin; Alt measures from the one pressed. */
		await page.getByRole('button', {name: 'Inspect'}).click();

		box = await canvas.locator('h2').boundingBox();

		await page.mouse.move(box.x + 10, box.y + 5);
		await page.mouse.click(box.x + 10, box.y + 5);

		await expect(page.locator('.elemenx-designer-tip')).toContainText('Heading');
		await expect(page.locator('.elemenx-designer-measure.pinned')).toHaveCount(1);

		box = await canvas.locator('p').boundingBox();

		await page.keyboard.down('Alt');
		await page.mouse.move(box.x + 10, box.y + 5);
		await page.mouse.move(box.x + 12, box.y + 6);

		await expect(page.locator('.elemenx-designer-tip')).toContainText('margin 0 0 12 0');
		await expect(page.locator('.elemenx-designer-distance')).toHaveText(['16']);

		await page.keyboard.up('Alt');

		/* Outlines come back in the run on their own toggle. */
		await page.getByRole('button', {name: 'Outlines'}).click();

		await expect(canvas.locator('.elemenx-column')).not.toHaveCSS('outline-style', 'none');

		expect(errors).toEqual([]);
	});

	test('overrides the CSS of an element, of every element of its kind and in a state, in a <style> of the template', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var rules = page.locator('.elemenx-designer-rules');
		var template;

		await open(page);

		await load(page, '<div class="elemenx-screen fill">\n\t<Card Title="Account">\n\t\t<Button Label="Continue" Variant="primary" />\n\t</Card>\n</div>');

		await page.locator('.elemenx-designer-tree').getByText('Button · Continue').click();

		/* This element: a rule of its own, on the canvas at once. */
		await rules.locator('.elemenx-designer-rules-property').fill('border-radius');
		await rules.locator('.elemenx-designer-rules-value').fill('0');
		await rules.locator('.elemenx-designer-rules-value').press('Enter');

		await expect(canvas.locator('.elemenx-button')).toHaveCSS('border-radius', '0px');

		/* Every Button, under the pointer, in the dark scheme. */
		await rules.locator('.elemenx-select').nth(0).click();
		await page.getByRole('option', {name: 'Every Button'}).click();
		await rules.locator('.elemenx-select').nth(1).click();
		await page.getByRole('option', {name: 'Under the pointer (:hover)'}).click();
		await rules.locator('.elemenx-select').nth(3).click();
		await page.getByRole('option', {name: 'Dark', exact: true}).click();

		await rules.locator('.elemenx-designer-rules-property').fill('color');
		await rules.locator('.elemenx-designer-rules-value').fill('var(--elemenx-accent)');
		await rules.locator('.elemenx-designer-rules-add').click();

		await expect(rules.locator('.elemenx-designer-rules-other')).toHaveText(['This element (1)', 'Every Button · :hover · Dark (1)']);

		template = await exported(page);

		expect(template).toBe('<style>\n\t.page-n3 > * {\n\t\tborder-radius: 0;\n\t}\n\t[data-scheme=\'dark\'] .elemenx-button:hover {\n\t\tcolor: var(--elemenx-accent);\n\t}\n</style>\n<div class="elemenx-screen fill">\n\t<Card Title="Account">\n\t\t<div class="page-n3">\n\t\t\t<Button Label="Continue" Variant="primary" />\n\t\t</div>\n\t</Card>\n</div>');

		/* The template comes back with its rules: the same, element for element and rule for rule. */
		await load(page, template);

		expect(await exported(page)).toBe(template);
		await expect(canvas.locator('.elemenx-button')).toHaveCSS('border-radius', '0px');

		expect(errors).toEqual([]);
	});

	test('downloads the page as an Application: one HTML file that runs alone, and a project in a zip', async function ({ page }) {
		var errors = captureErrors(page);
		var download;
		var file;
		var text;

		await open(page);

		await load(page, '<div class="elemenx-screen fill">\n\t<Button Label="Go" Variant="primary" />\n</div>');

		await backstage(page, 'Application');

		await page.locator('.elemenx-ribbon-backstage.open input').fill('My page');

		download = page.waitForEvent('download');

		await page.locator('.builder-download-html').click();

		download = await download;
		file = test.info().outputPath('my-page.html');

		await download.saveAs(file);

		text = fs.readFileSync(file, 'utf8');

		expect(download.suggestedFilename()).toBe('my-page.html');
		expect(text).toContain('<title>My page</title>');
		expect(text).toContain('Elemenx.Component(\'Page\', {$Template: "<div class=\\"elemenx-screen fill\\">');
		expect(text).toContain('Elemenx.Library(\'ElemenxUI\'');
		expect(text.length).toBeGreaterThan(1000000);

		/* It runs from the disk: the page fills the window. */
		await page.goto('file:///' + file.replace(/\\/g, '/'));

		await expect(page.locator('.elemenx-button')).toHaveText('Go');
		expect(Math.round((await page.locator('.elemenx-screen').boundingBox()).height)).toBe(page.viewportSize().height);

		expect(errors).toEqual([]);
	});
});
