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

/* No element selected: Escape, outside the fields that keep it. */
async function deselect (page) {
	await page.evaluate(function () {
		document.activeElement.blur();
	});

	await page.keyboard.press('Escape');
}

/* Opens a page of the backstage (the File button of the Ribbon). */
async function backstage (page, name) {
	await page.locator('.elemenx-ribbon-file').click();
	await page.locator('.elemenx-ribbon-backstage.open .elemenx-ribbon-backstage-item').filter({hasText: name}).click();
}

/* A new project of a kind, from the page Create of the backstage. */
async function create (page, mode, name) {
	await backstage(page, 'Create');

	await page.locator('.elemenx-ribbon-backstage.open input').filter({visible: true}).fill(name);
	await page.locator('.builder-kind[data-mode="' + mode + '"]').click();

	await expect(page.locator('.elemenx-ribbon-backstage.open')).toHaveCount(0);
}

/* A project kept, opened again from the page Open of the backstage. */
async function reopen (page, name) {
	await backstage(page, 'Open');

	await page.locator('.builder-project-open').filter({hasText: name}).first().click();

	await expect(page.locator('.elemenx-ribbon-backstage.open')).toHaveCount(0);
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

	/* The code shows a task after the page opens: waited for, then read. */
	await expect(page.locator('.elemenx-ribbon-backstage.open .elemenx-code-view')).not.toHaveText(/^\s*$/);

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

		await page.locator('.elemenx-designer-stage').click({position: {x: 8, y: 8}});

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

	test('drops a row into a screen that a row fills: beside the row from the edge of it, one level up with Shift', async function ({ page }) {
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

		/* In the middle of the first row a column goes into it; with Shift held, into the screen around it. */
		box = await canvas.locator('.elemenx-container').first().boundingBox();

		await drag(page, await sample(page, 'column'), box.x + box.width - 8, box.y + box.height / 2, async function () {
			await page.keyboard.down('Shift');
			await page.mouse.move(box.x + box.width - 9, box.y + box.height / 2);

			await expect(page.locator('.elemenx-designer-marker-note')).toContainText('In Screen');
		});

		await page.keyboard.up('Shift');

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

		/* A sample says its name under it, and its tip tells its name in bold and what it is under it. */
		await (await sample(page, 'screen')).hover();

		await expect(page.locator('#elemenx-tip .elemenx-tip-title')).toHaveText('Screen');
		await expect(page.locator('#elemenx-tip .elemenx-tip-text')).toHaveText('The screen of an Application: a column as high as its place (Sizing fill takes all of it).');
		await expect(await sample(page, 'screen')).toContainText('Screen');

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

		/* The inspector draws the element chosen a task later: its titles are waited for, not read once. */
		await expect(inspector.locator('.elemenx-section-title')).toHaveText(['Layout', 'CSS', 'Properties']);

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

		/* The run brings its own tab to the Ribbon and shows it: Inspect, Outlines, Stop. */
		await expect(page.locator('.elemenx-ribbon-tab.active')).toHaveText('Running');

		await page.locator('.elemenx-ribbon [data-command="inspect"]').click();
		await page.locator('.elemenx-ribbon [data-command="stop"]').click();

		await expect(page.locator('.elemenx-designer-layer')).toHaveCount(1);
		await expect(page.locator('.elemenx-ribbon-tab.active')).toHaveText('View');
		await expect(page.locator('.elemenx-ribbon-tab').filter({hasText: 'Running'})).toHaveCount(0);

		/* The options of the run are kept for the next one. */
		await page.getByRole('button', {name: 'Run'}).click();

		await expect(page.locator('.elemenx-ribbon [data-command="inspect"]')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('.elemenx-designer-layer.inspect')).toHaveCount(1);

		await page.locator('.elemenx-ribbon [data-command="stop"]').click();

		/* The language is a list in the header. */
		await page.locator('.builder-language .elemenx-select').click();
		await page.getByRole('option', {name: 'Русский'}).click();

		await expect(page.locator('.builder-brand')).toHaveText('EElemenxКонструктор');
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

		/* Inspect: the box of the element under the pointer, its size, its margin; Shift measures from the one pressed. */
		await page.locator('.elemenx-ribbon [data-command="inspect"]').click();

		box = await canvas.locator('h2').boundingBox();

		await page.mouse.move(box.x + 10, box.y + 5);
		await page.mouse.click(box.x + 10, box.y + 5);

		await expect(page.locator('.elemenx-designer-tip')).toContainText('Heading');
		await expect(page.locator('.elemenx-designer-measure.pinned')).toHaveCount(1);

		box = await canvas.locator('p').boundingBox();

		await page.keyboard.down('Shift');
		await page.mouse.move(box.x + 10, box.y + 5);
		await page.mouse.move(box.x + 12, box.y + 6);

		await expect(page.locator('.elemenx-designer-tip')).toContainText('margin 0 0 12 0');
		await expect(page.locator('.elemenx-designer-distance')).toHaveText(['16']);

		await page.keyboard.up('Shift');

		await expect(page.locator('.elemenx-designer-distance')).toHaveCount(0);

		/* Nothing pressed: Shift measures to the four edges of the canvas at once, the pointer still. */
		box = await canvas.locator('h2').boundingBox();

		await page.mouse.click(box.x + 10, box.y + 5);

		await expect(page.locator('.elemenx-designer-measure.pinned')).toHaveCount(0);

		box = await canvas.locator('p').boundingBox();

		await page.mouse.move(box.x + 10, box.y + 5);
		await page.mouse.move(box.x + 12, box.y + 6);

		await expect(page.locator('.elemenx-designer-tip')).toContainText('Paragraph');

		await page.keyboard.down('Shift');

		await expect(page.locator('.elemenx-designer-distance')).toHaveCount(4);

		await page.keyboard.up('Shift');

		/* Outlines come back in the run on their own toggle. */
		await page.locator('.elemenx-ribbon [data-command="lines"]').click();

		await expect(canvas.locator('.elemenx-column')).not.toHaveCSS('outline-style', 'none');

		expect(errors).toEqual([]);
	});

	test('shows the template in the tool window of the bottom as high as the window, however short it is', async function ({ page }) {
		var errors = captureErrors(page);
		var sizes;

		await open(page);

		await page.locator('.elemenx-workspace-tool-button[data-tool="template"]').click();

		await expect(page.locator('.elemenx-workspace-tool-window[data-tool="template"] .elemenx-code-view')).toBeVisible();

		sizes = await page.locator('.elemenx-workspace-tool-window[data-tool="template"] .elemenx-workspace-tool-window-body').evaluate(function (body) {
			return {Body: body.getBoundingClientRect().height, View: body.querySelector('.elemenx-code-view').getBoundingClientRect().height, Text: body.querySelector('.elemenx-code-view-text').getBoundingClientRect().height};
		});

		expect(sizes.View).toBeGreaterThan(100);
		expect(Math.abs(sizes.View - sizes.Body)).toBeLessThanOrEqual(1);
		expect(sizes.Text).toBeGreaterThan(sizes.View - 4);

		expect(errors).toEqual([]);
	});

	test('measures with Shift while the page is built: to the edges of the canvas, to another element, to the sides of its parent', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var lines = page.locator('.elemenx-designer-layer:not(.inspect) .elemenx-designer-distance');
		var surface;
		var box;
		var texts;

		await open(page);

		await load(page, '<div class="elemenx-column" style="padding: 24px; gap: 16px">\n\t<h2>Sign in</h2>\n\t<p style="margin: 0">Text</p>\n</div>');

		box = await canvas.locator('h2').boundingBox();

		await page.mouse.click(box.x + 10, box.y + 5);

		/* The selected element under the pointer: its four distances to the edges of the canvas. */
		await page.keyboard.down('Shift');

		await expect(lines).toHaveCount(4);

		surface = await page.locator('.elemenx-designer-surface').boundingBox();
		box = await page.locator('.elemenx-designer-selection').boundingBox();
		texts = await lines.allTextContents();

		/* As the frame of the selection stands from the edges, the pixels rounded. */
		expect(Math.abs(Number(texts[0]) - (box.x - surface.x))).toBeLessThanOrEqual(1);
		expect(Math.abs(Number(texts[2]) - (box.y - surface.y))).toBeLessThanOrEqual(1);

		/* Another element: the gap between them. */
		box = await canvas.locator('p').boundingBox();

		await page.mouse.move(box.x + 10, box.y + 5);

		await expect(lines).toHaveText(['16']);

		/* The column around it: the room to its sides, its padding, and below it the text, the gap and the padding. */
		box = await canvas.locator('.elemenx-column').boundingBox();
		texts = await canvas.locator('p').boundingBox();

		await page.mouse.move(box.x + 4, box.y + box.height - 4);

		await expect(lines).toHaveText(['24', '24', '24', String(Math.round(texts.height + 16 + 24))]);

		/* Without Shift, nothing; a drag would take Shift for itself. */
		await page.keyboard.up('Shift');

		await expect(lines).toHaveCount(0);

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
		await rules.locator('.elemenx-designer-rules-property input').fill('border-radius');
		await rules.locator('.elemenx-designer-rules-value input').fill('0');
		await rules.locator('.elemenx-designer-rules-value input').press('Enter');

		await expect(canvas.locator('.elemenx-button')).toHaveCSS('border-radius', '0px');

		/* Every Button, under the pointer, in the dark scheme. */
		await rules.locator('.elemenx-select').nth(0).click();
		await page.getByRole('option', {name: 'Every Button'}).click();
		await rules.locator('.elemenx-select').nth(1).click();
		await page.getByRole('option', {name: 'Under the pointer (:hover)'}).click();
		await rules.locator('.elemenx-select').nth(3).click();
		await page.getByRole('option', {name: 'Dark', exact: true}).click();

		await rules.locator('.elemenx-designer-rules-property input').fill('color');
		await rules.locator('.elemenx-designer-rules-value input').fill('var(--elemenx-accent)');
		await rules.locator('.elemenx-designer-rules-add').click();

		await expect(rules.locator('.elemenx-designer-rules-other')).toHaveText(['This element (1)', 'Every Button · :hover · Dark (1)']);

		/* A token shows what it comes to on the canvas, in the scheme of the rule: its value in the dark scheme. */
		await expect(rules.locator('.elemenx-designer-rules-computed')).toHaveText(await page.evaluate(function () {
			var probe = document.createElement('span');
			var value;

			probe.setAttribute('data-scheme', 'dark');

			document.querySelector('.elemenx-designer-page').appendChild(probe);

			value = getComputedStyle(probe).getPropertyValue('--elemenx-accent').trim();

			probe.remove();

			return value;
		}));

		await rules.locator('.elemenx-designer-rules-field').getByRole('button', {name: 'Show the options'}).click();

		await expect(page.locator('.elemenx-option-hint').first()).toHaveText(/^(#|rgb)/);

		await page.keyboard.press('Escape');

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

		await page.locator('.elemenx-ribbon-backstage.open input').filter({visible: true}).fill('My page');
		await page.locator('.elemenx-ribbon-backstage.open input').filter({visible: true}).press('Enter');

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
	test('gives an application a splash and an installation in its settings, and its HTML file shows the splash until it is ready', async function ({ page }) {
		var errors = captureErrors(page);
		var settings = page.locator('.elemenx-designer-settings');
		var download;
		var file;
		var text;

		await open(page);

		await create(page, 'application', 'Splashy');

		await page.locator('.builder-document').filter({hasText: 'Application'}).click();

		await expect(settings).toBeVisible();

		/* Off at first: its fields show once it is on. */
		await expect(settings.locator('input[name="SplashText"]')).toHaveCount(0);

		await settings.locator('.elemenx-designer-settings-splash .elemenx-toggle').first().click();
		await settings.locator('input[name="SplashText"]').fill('Loading the shop');
		await settings.locator('input[name="SplashText"]').press('Enter');
		await settings.locator('input[name="SplashMinTime"]').fill('-5');
		await settings.locator('input[name="SplashMinTime"]').press('Enter');

		await expect(settings.locator('.elemenx-field-error')).toHaveCount(1);

		await settings.locator('input[name="SplashMinTime"]').fill('200');
		await settings.locator('input[name="SplashMinTime"]').press('Enter');

		await expect(settings.locator('.elemenx-field-error')).toHaveCount(0);

		expect(await page.evaluate(function () {
			var store = JSON.parse(localStorage.getItem('elemenx-designer:projects'));

			return Object.keys(store.Projects).map(function (id) {
				return store.Projects[id];
			}).filter(function (item) {
				return item.Name === 'Splashy';
			})[0].Settings;
		})).toMatchObject({Splash: 'true', SplashText: 'Loading the shop', SplashMinTime: '200', SplashSpinner: 'true'});

		/* Installable as an application: its short name and its window. */
		await settings.locator('.elemenx-designer-settings-pwa .elemenx-toggle').first().click();
		await settings.locator('input[name="PWAShortName"]').fill('Shop');
		await settings.locator('input[name="PWAShortName"]').press('Enter');

		/* Its updates wait until the application applies them. */
		await settings.locator('.elemenx-field').filter({has: page.locator('.elemenx-field-label', {hasText: /^Updates$/})}).locator('.elemenx-select-trigger').click();
		await page.getByRole('option', {name: 'When the application says, checked every hour'}).click();

		expect(await page.evaluate(function () {
			var store = JSON.parse(localStorage.getItem('elemenx-designer:projects'));

			return Object.keys(store.Projects).map(function (id) {
				return store.Projects[id];
			}).filter(function (item) {
				return item.Name === 'Splashy';
			})[0].Settings;
		})).toMatchObject({PWA: 'true', PWAShortName: 'Shop', PWADisplay: 'standalone', PWAOffline: 'true', PWAUpdate: 'prompt'});

		/* The file it downloads has the splash at the top of its body; it goes once the application is ready. */
		await backstage(page, 'Application');

		download = page.waitForEvent('download');

		await page.locator('.builder-download-html').click();

		download = await download;
		file = test.info().outputPath('splashy.html');

		await download.saveAs(file);

		text = fs.readFileSync(file, 'utf8');

		expect(text).toContain('<body>\n<style id="elemenx-splash-style">');
		expect(text).toContain('data-min="200" data-timeout="10000"><p class="elemenx-splash-text">Loading the shop</p><span class="elemenx-splash-spinner" aria-hidden="true"></span></div>');

		await page.goto('file:///' + file.replace(/\\/g, '/'));

		await expect(page.locator('#elemenx-splash')).toHaveCount(0);

		expect(errors).toEqual([]);
	});

	test('has rulers along the canvas that mark the selected element, and makes nothing of a press on them', async function ({ page }) {
		var errors = captureErrors(page);
		var ruler;

		await open(page);

		await add(page, 'Card');

		/* The span of the selected element on both rulers; numbers every 100 pixels, 0 at the edge of the page. */
		await expect(page.locator('.elemenx-designer-ruler.horizontal .elemenx-ruler-range')).toHaveCount(1);
		await expect(page.locator('.elemenx-designer-ruler.vertical .elemenx-ruler-range')).toHaveCount(1);
		await expect(page.locator('.elemenx-designer-ruler.horizontal .elemenx-ruler-label').first()).toHaveText('0');

		/* A press and a drag on a ruler leave nothing over the page. */
		ruler = await page.locator('.elemenx-designer-ruler.horizontal').boundingBox();

		await page.mouse.move(ruler.x + 200, ruler.y + 10);
		await page.mouse.down();
		await page.mouse.move(ruler.x + 250, ruler.y + 200, {steps: 6});
		await page.mouse.up();

		await expect(page.locator('.elemenx-designer-ruler .elemenx-ruler-guide')).toHaveCount(0);

		/* The rulers go off on the View tab. */
		await page.locator('.elemenx-ribbon-tab').filter({hasText: 'View'}).click();
		await page.locator('.elemenx-ribbon [data-command="rulers"]').click();

		await expect(page.locator('.elemenx-designer-ruler')).toHaveCount(0);

		expect(errors).toEqual([]);
	});

	test('makes an application of pages and components: a component with its props and slot, used on a page, routes, guards, settings and a download', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-canvas');
		var inspector = page.locator('.elemenx-designer-inspector');
		var settings = page.locator('.elemenx-designer-settings');
		var route;
		var download;
		var file;
		var text;

		/* Wide enough for the Insert tab to keep its search beside the group of the project. */
		await page.setViewportSize({width: 1600, height: 900});

		await open(page);

		/* An application: its kind chosen when it is made; a tab for each document open over the canvas, and its settings. */
		await create(page, 'application', 'Shop');

		await expect(page.locator('.builder-document')).toHaveText(['Application', 'Home']);

		/* A component: a paragraph and the slot of what it is given. */
		await page.locator('.elemenx-ribbon-tab[data-id="project"]').click();
		await page.locator('.elemenx-ribbon [data-command="new-component"]').click();

		await expect(page.locator('.builder-document.active')).toHaveText('Component2');

		await page.locator('.elemenx-ribbon-tab[data-id="insert"]').click();

		await add(page, 'paragraph');

		await deselect(page);

		await add(page, 'slot');

		await expect(canvas.locator('.elemenx-designer-slot')).toHaveText('Default slot');

		/* With nothing selected the inspector is the one of the component: its name, a prop, its slot. */
		await deselect(page);

		await inspector.locator('.elemenx-designer-document input').first().fill('HeroBanner');
		await inspector.locator('.elemenx-designer-document input').first().press('Enter');

		await expect(page.locator('.builder-document.active')).toHaveText('HeroBanner');

		await inspector.locator('.elemenx-designer-document-add').click();
		await inspector.locator('.elemenx-designer-document-prop input[data-key="Name"]').fill('Title');
		await inspector.locator('.elemenx-designer-document-prop input[data-key="Name"]').press('Enter');
		await inspector.locator('.elemenx-designer-document-prop input[data-key="Default"]').fill('Hello');
		await inspector.locator('.elemenx-designer-document-prop input[data-key="Default"]').press('Enter');

		await expect(inspector.locator('.elemenx-designer-document-slots .elemenx-chip')).toHaveText(['Default slot']);

		/* The page takes the component from the palette: it shows on the canvas, its prop in the inspector. */
		await page.locator('.builder-document-open').filter({hasText: 'Home'}).click();

		await add(page, 'HeroBanner');

		await expect(canvas.locator('.elemenx-designer-part p')).toHaveText('A paragraph of text.');
		await expect(inspector.locator('.elemenx-designer-inspector-title')).toHaveText('HeroBanner');
		await expect(inspector.locator('input[name="Title"]')).toHaveValue('Hello');

		/* The component the page holds cannot go. */
		await page.locator('.builder-document-open').filter({hasText: 'HeroBanner'}).click();

		await deselect(page);

		await expect(inspector.locator('.elemenx-designer-document-head button')).toBeDisabled();
		await expect(inspector.locator('.elemenx-designer-document')).toContainText('Used in: Home');

		/* A tab closes by its cross; the document stays in the project, the explorer opens it again. */
		await page.locator('.builder-document').filter({hasText: 'HeroBanner'}).locator('.builder-document-close').click();

		await expect(page.locator('.builder-document')).toHaveText(['Application', 'Home']);

		/* The settings of the Application in the main area: a guard, and a route it guards. */
		await page.locator('.builder-document').filter({hasText: 'Application'}).click();

		await expect(settings).toBeVisible();
		await expect(canvas).toHaveCount(0);

		await settings.locator('.elemenx-designer-settings-add-guard').click();

		await expect(settings.locator('.elemenx-designer-settings-guard')).toHaveCount(1);

		await settings.locator('.elemenx-designer-settings-add-route').click();

		route = settings.locator('.elemenx-designer-settings-route').nth(1);

		await route.locator('input').first().fill('/hero/:id');
		await route.locator('input').first().press('Enter');
		await route.locator('.elemenx-select-trigger').nth(1).click();
		await page.getByRole('option', {name: 'Guard1'}).click();
		await page.keyboard.press('Escape');

		await expect(route.locator('.elemenx-chip')).toHaveText(['Guard1']);

		/* The whole application downloads as one file: the component, the pages on their routes, the guard; it runs from the disk. */
		await backstage(page, 'Application');

		download = page.waitForEvent('download');

		await page.locator('.builder-download-html').click();

		download = await download;
		file = test.info().outputPath('shop.html');

		await download.saveAs(file);

		text = fs.readFileSync(file, 'utf8');

		expect(download.suggestedFilename()).toBe('shop.html');
		expect(text).toContain('Elemenx.Component(\'HeroBanner\', {');
		expect(text).toContain('Title: {Type: \'text\', Description: \'\'}');
		expect(text).toContain('{Path: \'/\', Component: \'HomePage\'}');
		expect(text).toContain('{Path: \'/hero/:id\', Component: \'HomePage\', Guard: \'Guard1\'}');
		expect(text).toContain('Elemenx.Guard(\'Guard1\', function () {');

		await page.goto('file:///' + file.replace(/\\/g, '/'));

		await expect(page.locator('p')).toHaveText('A paragraph of text.');

		expect(errors).toEqual([]);
	});

	test('keeps several projects, each of its own kind, opens them again and carries one in a file', async function ({ page }) {
		var errors = captureErrors(page);
		var download;
		var file;
		var i = 0;

		await open(page);

		/* A tool window closed and then taken away by its *if, made again with the same ID: the frame keeps one of it. */
		await create(page, 'application', 'Shop');
		await create(page, 'component', 'Badge');

		while (i < 3) {
			await reopen(page, 'Shop');

			await page.locator('.elemenx-workspace-tool-button[data-tool="project"]').click();

			await reopen(page, 'Badge');

			await expect(page.locator('.elemenx-workspace-tool-button[data-tool="project"]')).toHaveCount(0);

			i++;
		}

		await reopen(page, 'Shop');

		await expect(page.locator('.elemenx-workspace-tool-button[data-tool="project"]')).toHaveCount(1);
		await expect(page.locator('.builder-document')).toHaveText(['Application', 'Home']);

		/* The kinds stay their own: the component has its slot, no tab of documents, no tab of the project. */
		await reopen(page, 'Badge');

		await expect(page.locator('.builder-documents')).toHaveCount(0);
		await expect(page.locator('.elemenx-ribbon-tab[data-id="project"]')).toHaveCount(0);

		/* Saved into a file and opened from it: a project of its own beside the others. */
		await backstage(page, 'Open');

		download = page.waitForEvent('download');

		await page.locator('.builder-save-file').click();

		download = await download;
		file = test.info().outputPath('badge.elemenx.json');

		await download.saveAs(file);

		expect(download.suggestedFilename()).toBe('badge.elemenx.json');
		expect(JSON.parse(fs.readFileSync(file, 'utf8')).Project.Mode).toBe('component');

		await page.locator('.builder-open-file input').setInputFiles(file);

		await expect(page.locator('.elemenx-ribbon-backstage.open')).toHaveCount(0);

		await backstage(page, 'Open');

		await expect(page.locator('.builder-project-open strong')).toHaveText(['Badge', 'Badge', 'Shop', 'App']);

		/* A project removed goes once the dialog agrees. */
		await page.locator('.builder-project-remove').nth(3).click();
		await page.locator('.elemenx-dialog').getByRole('button', {name: 'Remove the project'}).click();

		await expect(page.locator('.builder-project-open strong')).toHaveText(['Badge', 'Badge', 'Shop']);

		expect(errors).toEqual([]);
	});

	test('writes the text of a Markdown and the code of a CodeView as their body, edited in a field of many lines', async function ({ page }) {
		var errors = captureErrors(page);
		var canvas = page.locator('.elemenx-designer-page-host');
		var inspector = page.locator('.elemenx-designer-inspector');
		var template = '<div class="elemenx-screen fill">\n\t<Markdown>\n\t\t## Notes\n\n\t\tSome **bold** text.\n\t</Markdown>\n\t<CodeView Language="html">\n\t\t&lt;p&gt;Hi&lt;/p&gt;\n\t</CodeView>\n</div>';

		await open(page);

		await load(page, template);

		/* The body is what they show, on the canvas as in an Application. */
		await expect(canvas.locator('.elemenx-markdown h2')).toHaveText('Notes');
		await expect(canvas.locator('.elemenx-markdown strong')).toHaveText('bold');
		await expect(canvas.locator('.elemenx-code-view-text')).toContainText('<p>Hi</p>');

		/* The inspector edits it in a field of many lines, as the text it is, its indentation gone. */
		await page.locator('.elemenx-designer-tree').getByText('Markdown', {exact: true}).click();

		await expect(inspector.locator('textarea')).toHaveValue('## Notes\n\nSome **bold** text.');

		await inspector.locator('textarea').fill('## Changed\n\n<b>{{x}}</b>');

		await expect(canvas.locator('.elemenx-markdown h2')).toHaveText('Changed');

		/* It goes back into the body, its tag and its braces written so that the template keeps them as text. */
		/* The field of the import holds the template as it is now, its blank lines too, though the import was the last page. */
		await backstage(page, 'Import');

		template = await page.locator('.elemenx-ribbon-backstage.open textarea').inputValue();

		await page.keyboard.press('Escape');

		expect(template).toBe('<div class="elemenx-screen fill">\n\t<Markdown>\n\t\t## Changed\n\n\t\t&lt;b&gt;{{ \'{{\' }}x}}&lt;/b&gt;\n\t</Markdown>\n\t<CodeView Language="html">\n\t\t&lt;p&gt;Hi&lt;/p&gt;\n\t</CodeView>\n</div>');

		await load(page, template);

		await page.locator('.elemenx-designer-tree').getByText('Markdown', {exact: true}).click();

		await expect(inspector.locator('textarea')).toHaveValue('## Changed\n\n<b>{{x}}</b>');

		expect(errors).toEqual([]);
	});

	test('on a narrow screen scrolls across to the panels on both sides, then opens them over the canvas, and the backstage puts its pages over the page', async function ({ page }) {
		var errors = captureErrors(page);
		var body = page.locator('.elemenx-workspace-body');
		var left = page.locator('.elemenx-workspace-panel.left');
		var right = page.locator('.elemenx-workspace-panel.right');
		var sizes;
		var nav;
		var content;

		await open(page);

		await page.setViewportSize({width: 900, height: 900});

		/* The main area keeps its width; the frame scrolls across to the panel of the properties on the right. */
		sizes = await body.evaluate(function (node) {
			return {Scroll: node.scrollWidth, Client: node.clientWidth, Main: node.querySelector('.elemenx-workspace-center').getBoundingClientRect().width};
		});

		expect(sizes.Main).toBeGreaterThanOrEqual(320);
		expect(sizes.Scroll).toBeGreaterThan(sizes.Client);

		await body.evaluate(function (node) {
			node.scrollLeft = node.scrollWidth;
		});

		await expect(right).toBeInViewport();

		/* Narrower: the canvas takes the whole width between the stripes, the panels open over it, one side at a time. */
		await page.setViewportSize({width: 520, height: 900});

		sizes = await body.evaluate(function (node) {
			return {Scroll: node.scrollWidth, Client: node.clientWidth, Main: node.querySelector('.elemenx-workspace-center').getBoundingClientRect().width};
		});

		expect(sizes.Scroll).toBe(sizes.Client);
		expect(sizes.Main).toBe(sizes.Client - 80);

		await page.locator('.elemenx-workspace-stripe.right .elemenx-workspace-tool-button').first().click();

		await expect(right).toBeHidden();

		await page.locator('.elemenx-workspace-stripe.right .elemenx-workspace-tool-button').first().click();

		await expect(right).toBeVisible();
		await expect(left).toBeHidden();
		expect(await right.evaluate(function (node) {
			return getComputedStyle(node).position;
		})).toBe('absolute');

		await page.locator('.elemenx-workspace-stripe.left .elemenx-workspace-tool-button').first().click();

		await expect(left).toBeVisible();
		await expect(right).toBeHidden();

		/* A press on the canvas beside the panel closes it. */
		await page.mouse.click(470, 500);

		await expect(left).toBeHidden();

		/* The backstage: its pages a band over the page, the page as wide as the screen. */
		await backstage(page, 'Export');

		nav = await page.locator('.elemenx-ribbon-backstage.open .elemenx-ribbon-backstage-nav').boundingBox();
		content = await page.locator('.elemenx-ribbon-backstage.open .elemenx-ribbon-backstage-content').boundingBox();

		expect(nav.height).toBeLessThan(64);
		expect(content.y).toBeGreaterThanOrEqual(nav.y + nav.height - 1);
		expect(content.width).toBeGreaterThan(500);

		expect(errors).toEqual([]);
	});

	test('keeps the search of the Insert tab whatever the width and the language: the other groups shrink, then the panel scrolls', async function ({ page }) {
		var errors = captureErrors(page);
		var panel = page.locator('.elemenx-ribbon-panel').filter({visible: true});

		await open(page);

		/* Longer titles than the English ones, on a window narrower than the groups even shrunk. */
		await page.locator('.builder-language .elemenx-select').click();
		await page.getByRole('option', {name: 'Русский'}).click();

		await expect(page.locator('.elemenx-ribbon-tab').filter({hasText: 'Вставка'})).toHaveCount(1);

		for (var width of [1280, 900]) {
			await page.setViewportSize({width: width, height: 800});

			await expect(page.locator('.builder-find input')).toBeVisible();
			await expect(panel.locator('.elemenx-ribbon-group.collapsed').first()).toBeVisible();
			await expect(panel.locator('.elemenx-ribbon-group[data-keep="true"]')).not.toHaveClass(/\bcollapsed\b/);
		}

		await expect(panel).toHaveClass(/\boverflowing\b/);

		/* A title of several words on two lines, a long word whole. */
		expect(await panel.locator('.elemenx-ribbon-group.collapsed .elemenx-ribbon-group-toggle > .elemenx-ribbon-label').evaluateAll(function (labels) {
			return labels.every(function (label) {
				return label.scrollWidth <= label.clientWidth + 1;
			});
		})).toBe(true);

		expect(errors).toEqual([]);
	});

	test('opens a group of the Ribbon over the canvas, its rulers and the handles of the panels', async function ({ page }) {
		var errors = captureErrors(page);
		var covered;
		var index;

		await open(page);

		await page.setViewportSize({width: 1000, height: 900});

		/* A group over the start of the canvas, the popup of which goes down over its ruler and the panel beside it. */
		index = await page.evaluate(function () {
			var ruler = document.querySelector('.elemenx-designer-ruler').getBoundingClientRect();

			return Array.prototype.map.call(document.querySelectorAll('.elemenx-ribbon-group.collapsed .elemenx-ribbon-group-toggle'), function (toggle) {
				var box = toggle.getBoundingClientRect();

				return Math.abs(box.left - ruler.left - 120);
			}).reduce(function (best, distance, at, all) {
				return distance < all[best] ? at : best;
			}, 0);
		});

		await page.locator('.elemenx-ribbon-group.collapsed .elemenx-ribbon-group-toggle').nth(index).click();

		/* Whatever is under it on the page, every point of the popup is its own. */
		covered = await page.locator('.elemenx-ribbon-group.open .elemenx-ribbon-group-popup').evaluate(function (popup) {
			var box = popup.getBoundingClientRect();
			var found = [];
			var x;
			var y;

			for (x = box.left + 6; x < box.right - 6; x += 8) {
				for (y = box.top + 6; y < box.bottom - 6; y += 4) {
					if (!popup.contains(document.elementFromPoint(x, y)))
						found.push(document.elementFromPoint(x, y).className);
				}
			}

			return found;
		});

		expect(covered).toEqual([]);

		expect(errors).toEqual([]);
	});
});
